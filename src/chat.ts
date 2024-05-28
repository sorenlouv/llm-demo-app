import { OpenAI } from "openai";
import { availableTools, toolSchemas } from "./tools/functions";
import { ChatCompletionMessageParam } from "openai/resources";
import "dotenv/config";
import { logger } from "./logger";
import apm from "elastic-apm-node";
import { withLLMChatSpan, withLLMToolSpan } from "./helper/withSpan";
import { getToolResponses } from "./tools/getToolResponses";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const openAiModel = "gpt-3.5-turbo-16k-0613";

export async function chat(prompt: string) {
  const systemPrompt = "You are a helpful AI assistant. Speak like a pirate.";
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  let totalTokens = 0;

  const initialResponse = await withLLMChatSpan(
    {
      name: "User prompt",
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

    const secondResponse = await withLLMChatSpan(
      {
        name: "Prompt with tool responses",
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
