import apm from "elastic-apm-node";
import { logger } from "../logger";
import { ChatCompletion } from "openai/resources";

async function withSpan<T>(
  {
    name,
    type,
    subType,
    labels = {},
  }: {
    name: string;
    type: string;
    subType: string | null;
    labels: Record<string, string | number>;
  },
  operation: (span: apm.Span | null) => Promise<T>
): Promise<T> {
  const span = apm.startSpan(name, type, subType);

  if (labels) {
    span?.addLabels(labels);
  }

  try {
    const res = await operation(span);
    span?.setOutcome("success");
    return res;
  } catch (e) {
    span?.setOutcome("failure");
    const error = e as Error;

    logger.error(
      `Error in span with name: "${name}". Error: "${error.message}"`
    );

    apm.captureError(error);
    throw error;
  } finally {
    span?.end();
  }
}

export async function withChatCompletionSpan(
  {
    name,
    prompt,
    systemPrompt,
  }: {
    name: string;
    prompt?: string;
    systemPrompt?: string;
  },
  operation: (span: apm.Span | null) => Promise<ChatCompletion>
): Promise<ChatCompletion> {
  return withSpan(
    {
      name,
      type: "llm",
      subType: "chat",
      labels: {
        ...(prompt ? { prompt } : {}),
        ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
      },
    },
    async (span) => {
      const res = await operation(span);

      const message = res?.choices?.[0]?.message?.content ?? "";
      const totalTokenCount = res?.usage?.total_tokens ?? 0;

      span?.addLabels({
        response: message,
        total_token_count: totalTokenCount,
      });

      return res;
    }
  );
}

export async function withFunctionCallingSpan<T>(
  {
    functionName,
    functionArgs,
  }: {
    functionName: string;
    functionArgs: unknown;
  },
  operation: (span: apm.Span | null) => Promise<T>
): Promise<T> {
  return withSpan(
    {
      name: functionName,
      type: "llm",
      subType: "tool",
      labels: {
        function_name: functionName,
        function_args: JSON.stringify(functionArgs),
      },
    },
    async (span) => {
      const res = await operation(span);
      span?.addLabels({ response: JSON.stringify(res) });
      return res;
    }
  );
}
