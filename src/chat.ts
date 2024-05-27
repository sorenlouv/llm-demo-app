import { OpenAI } from "openai";
import { availableTools, toolSchemas } from "./tools/functions";
import { ChatCompletionMessageParam } from "openai/resources";
import "dotenv/config";
import { logger } from "./logger";
import apm from "elastic-apm-node";
import { withSpan } from "./helper/withSpan";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const openAiModel = "gpt-3.5-turbo-16k-0613";

export async function chat(prompt: string) {
  const systemPrompt = "You are a helpful AI assistant.";
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  let totalTokens = 0;

  const initialResponse = await withSpan(
    {
      name: "initial user prompt",
      subType: "chat",
      labels: {
        prompt,
        system_prompt: systemPrompt,
      },
    },
    () =>
      openai.chat.completions.create({
        model: openAiModel,
        messages,
        tools: toolSchemas,
        tool_choice: "auto",
      })
  );

  totalTokens += initialResponse.usage?.total_tokens ?? 0;

  const initialResponseMessage = initialResponse.choices[0].message;
  messages.push(initialResponseMessage);

  const toolCalls = initialResponseMessage.tool_calls;
  if (toolCalls) {
    const toolResponses = await getToolResponses(toolCalls);
    logger.debug("toolResponses", toolResponses);

    messages.push(...toolResponses);

    const secondResponse = await withSpan(
      {
        name: "prompt with tool responses",
        subType: "chat",
        labels: {
          tool_calls: JSON.stringify(toolCalls),
          tool_responses: JSON.stringify(toolResponses),
        },
      },
      () =>
        openai.chat.completions.create({
          model: openAiModel,
          messages,
        })
    );

    totalTokens += secondResponse.usage?.total_tokens ?? 0;

    logger.debug("secondResponse.choices", secondResponse.choices);
    const secondResponseMessage = secondResponse.choices[0].message;
    messages.push(secondResponseMessage);
  }

  const tx = apm.currentTransaction;

  // @ts-expect-error
  tx?.setMessageContext({ body: JSON.stringify(messages) });
  tx?.setLabel("total_token_count", totalTokens, false);

  return messages;
}

async function getToolResponses(
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
): Promise<ChatCompletionMessageParam[]> {
  const promises = toolCalls.map(async (toolCall) => {
    const functionName = toolCall.function.name as keyof typeof availableTools;
    const functionToCall = availableTools[functionName];

    const functionArgs = JSON.parse(toolCall.function.arguments) as Parameters<
      typeof functionToCall
    >;
    logger.debug(`toolCall`, toolCall);
    logger.debug(`functionArgs`, functionArgs);

    const toolResponse = await withSpan(
      {
        name: functionName.toString(),
        subType: "tool",
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
