import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources";
import { availableTools } from "./functions";
import { logger } from "../logger";
import { withLLMToolSpan } from "../helper/withSpan";

export async function getToolResponses(
  toolCalls: ChatCompletionMessageToolCall[]
): Promise<ChatCompletionMessageParam[]> {
  const promises = toolCalls.map(async (toolCall) => {
    const functionName = toolCall.function.name as keyof typeof availableTools;
    const functionToCall = availableTools[functionName];

    const functionArgs = JSON.parse(toolCall.function.arguments) as Parameters<
      typeof functionToCall
    >;
    logger.debug(`toolCall`, toolCall);
    logger.debug(`functionArgs`, functionArgs);

    const toolResponse = await withLLMToolSpan(
      {
        name: functionName.toString(),
        labels: {
          function_name: functionName,
          function_args: JSON.stringify(functionArgs),
        },
      },
      async (span) => {
        // @ts-expect-error
        const res = await functionToCall(functionArgs);

        span?.addLabels({
          tool_response: JSON.stringify(res),
        });

        return res;
      }
    );

    logger.debug(`toolResponse ${JSON.stringify(toolResponse, null, 2)}`);

    return {
      tool_call_id: toolCall.id,
      role: "tool",
      name: functionName,
      content: JSON.stringify(toolResponse, null, 2),
    } as ChatCompletionMessageParam;
  });

  return Promise.all(promises);
}
