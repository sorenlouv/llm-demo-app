import { getAddress, getAddressSchema } from "./getAddress";
import { getSecretAnswer, getSecretAnswerSchema } from "./getSecretAnswer";
import { getTemperature, getTemperatureSchema } from "./getTemperature";

export const availableTools = {
  [getAddressSchema.function.name]: getAddress,
  [getTemperatureSchema.function.name]: getTemperature,
  [getSecretAnswerSchema.function.name]: getSecretAnswer,
};

export const toolSchemas = [
  getAddressSchema,
  getTemperatureSchema,
  getSecretAnswerSchema,
];
