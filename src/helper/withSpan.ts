import { Request, Response } from "express";
import apm from "elastic-apm-node";
import { logger } from "../logger";

async function withLLMSpan<T>(
  {
    name,
    subType,
    labels = {},
  }: {
    name: string;
    subType: string | null;
    labels: Record<string, string | number>;
  },
  operation: (span: apm.Span | null) => Promise<T>
): Promise<T> {
  const span = apm.startSpan(name, "llm", subType);

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

export async function withLLMChatSpan<T>(
  {
    name,
    labels,
  }: {
    name: string;
    labels: Record<string, string | number>;
  },
  operation: (span: apm.Span | null) => Promise<T>
): Promise<T> {
  return withLLMSpan({ name, subType: "chat", labels }, operation);
}

export async function withLLMToolSpan<T>(
  {
    name,
    labels,
  }: {
    name: string;
    labels: Record<string, string | number>;
  },
  operation: (span: apm.Span | null) => Promise<T>
): Promise<T> {
  return withLLMSpan({ name, subType: "tool", labels }, operation);
}
