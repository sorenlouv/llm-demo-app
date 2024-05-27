import { format, createLogger, transports } from "winston";
const { timestamp, combine, printf, errors, json } = format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return `${timestamp} ${level}: ${stack || message} ${meta ? JSON.stringify(meta, null, 2) : ""}`;
});

const structuredLogFormat = true;
const fileLogFormat = structuredLogFormat
  ? combine(timestamp(), errors({ stack: true }), json())
  : combine(timestamp(), errors({ stack: true }), logFormat);

export const logger = createLogger({
  defaultMeta: { service: "my-llm-service" },
  transports: [
    new transports.File({
      level: "debug",
      filename: "combined.log",
      format: fileLogFormat,
    }),
    new transports.Console({
      level: "debug",
      format: combine(
        format.colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
      ),
    }),
  ],
});
