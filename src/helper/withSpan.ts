import { Request, Response } from "express";
import apm from "elastic-apm-node";
import { logger } from "../logger";

export async function withSpan<T>(
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
    return await operation(span);
  } catch (e) {
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
