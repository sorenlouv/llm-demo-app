## Setup

- Rename `.env.sample` to `.env` and add OpenAI key
- Run `yarn` to install dependencies

## Start

```
yarn ts-node src/index.ts
```

Start with Otel instrumentation
```
OTEL_EXPORTER_OTLP_ENDPOINT=<APM_SERVER> OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer <SECRET_TOKEN>" OTEL_SERVICE_NAME=my-otel-service yarn ts-node --require @elastic/opentelemetry-node src/index.ts
```
