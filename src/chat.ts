import { Request, Response } from "express";
import { OpenAI } from "openai";
import { availableTools, toolSchemas } from "./functions";
import { ChatCompletionMessageParam } from "openai/resources";
import "dotenv/config";
import { logger } from "./logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chat(req: Request, res: Response) {
  try {
    const { prompt } = req.body;
    const systemPrompt = "You are a helpful AI assistant.";
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    const initialResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k-0613",
      messages,
      tools: toolSchemas,
      tool_choice: "auto",
    });

    const responseMessage = initialResponse.choices[0].message;

    logger.debug("initialResponse", initialResponse);

    messages.push(responseMessage);

    const toolCalls = responseMessage.tool_calls;
    if (toolCalls) {
      const toolResponses = await getToolResponses(toolCalls);
      logger.debug("toolResponses", toolResponses);
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k-0613",
        messages: [...messages, ...toolResponses],
      });
      logger.debug("secondResponse.choices", secondResponse.choices);
      return res.json(secondResponse.choices);
    }

    return res.json(initialResponse.choices);
  } catch (error) {
    logger.error("chat error", error);

    res.status(500).json({ error: "Something went wrong" });
  }
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
    logger.debug("toolCall", toolCall);
    logger.debug(`functionToCall`, functionToCall.name);
    logger.debug("functionArgs", functionArgs);

    // @ts-expect-error
    const functionResponse = (await functionToCall(functionArgs)) as Awaited<
      ReturnType<typeof functionToCall>
    >;

    logger.debug("functionResponse", functionResponse);

    return {
      tool_call_id: toolCall.id,
      role: "tool",
      name: functionName,
      content: JSON.stringify(functionResponse),
    } as ChatCompletionMessageParam;
  });

  return Promise.all(promises);
}
