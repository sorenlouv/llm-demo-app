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

export function chat(prompt: string) {
  const systemPrompt =
    "You are a helpful AI assistant. Speak like a pirate. Make it long and interesting. At least 2000 words";
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  return openai.chat.completions.create({
    model: openAiModel,
    messages,
    stream: true,
  });
}
