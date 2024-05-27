import { isEmpty, omit } from "lodash";
import { format, createLogger, transports } from "winston";
const { timestamp, combine, printf, errors, json } = format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaWithoutServiceName = omit(meta, "service");
  return `${timestamp} ${level}: ${stack || message} ${isEmpty(metaWithoutServiceName) ? "" : JSON.stringify(metaWithoutServiceName, null, 2)}`;
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
