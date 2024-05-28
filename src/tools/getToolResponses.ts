import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources";
import { availableTools } from "./functions";
import { logger } from "../logger";
import { withFunctionCallingSpan } from "../helper/withSpan";

export async function getToolResponses(
  toolCalls: ChatCompletionMessageToolCall[]
): Promise<ChatCompletionMessageParam[]> {
  const promises = toolCalls.map(async (toolCall) => {
    const functionName = toolCall.function.name as keyof typeof availableTools;
    const functionToCall = availableTools[functionName];

    const functionArgs = JSON.parse(toolCall.function.arguments) as any;
    logger.debug(`toolCall`, toolCall);
    logger.debug(`functionArgs`, functionArgs);

    const toolResponse = await withFunctionCallingSpan(
      { functionName: functionName.toString(), functionArgs },
      async () => functionToCall(functionArgs)
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
