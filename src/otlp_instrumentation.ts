import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "my-otel-service",
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.ELASTIC_APM_SERVER_URL,
    headers: {
      Authorization: `Bearer ${process.env.ELASTIC_APM_SECRET_TOKEN}`,
    },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
