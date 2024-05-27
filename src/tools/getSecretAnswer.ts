import { ChatCompletionTool } from "openai/resources";
import axios from "axios";
import { random } from "lodash";

export const getSecretAnswerSchema: ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_secret_answer",
    description: "Get the secret answer ",
  },
};

export async function getSecretAnswer() {
  const ms = random(500, 5000);
  await sleep(ms);
  return ms;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
