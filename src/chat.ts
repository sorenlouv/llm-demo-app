import { OpenAI } from "openai";
import { toolSchemas } from "./tools/functions";
import { ChatCompletionMessageParam } from "openai/resources";
import "dotenv/config";
import { logger } from "./logger";
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

  const initialResponse = await openai.chat.completions.create({
    model: openAiModel,
    messages,
    tools: toolSchemas,
    tool_choice: "auto",
  });

  const initialResponseMessage = initialResponse.choices[0].message;
  messages.push(initialResponseMessage);

  const toolCalls = initialResponseMessage.tool_calls;
  if (toolCalls) {
    const toolResponses = await getToolResponses(toolCalls);
    logger.debug("toolResponses", toolResponses);

    messages.push(...toolResponses);

    const secondResponse = await openai.chat.completions.create({
      model: openAiModel,
      messages,
    });

    logger.debug("secondResponse.choices", secondResponse.choices);
    const secondResponseMessage = secondResponse.choices[0].message;
    messages.push(secondResponseMessage);
  }

  return messages;
}
