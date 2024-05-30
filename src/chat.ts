import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import "dotenv/config";

export function chat(prompt: string) {
  const client = new OpenAIClient(
    process.env["AZURE_ENDPOINT"]!,
    new AzureKeyCredential(process.env["AZURE_API_KEY"]!)
  );
  const deploymentId = "gpt-35-turbo";
  return client.streamChatCompletions(deploymentId, [
    {
      role: "system",
      content: "You are a helpful assistant. You will talk like a pirate.",
    },
    { role: "user", content: prompt },
  ]);
}
