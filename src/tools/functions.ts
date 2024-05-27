import { getAddress, getAddressSchema } from "./getAddress";
import { getTemperature, getTemperatureSchema } from "./getTemperature";

export const availableTools = {
  [getAddressSchema.function.name]: getAddress,
  [getTemperatureSchema.function.name]: getTemperature,
};

export const toolSchemas = [getAddressSchema, getTemperatureSchema];
