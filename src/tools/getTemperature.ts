import { ChatCompletionTool } from "openai/resources";
import axios from "axios";

export const getTemperatureSchema: ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_temperature",
    description: "Get the current temperature for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to get the temperature for",
        },
      },
      required: ["location"],
    },
  },
};

export async function getTemperature({ location }: { location: string }) {
  const geoCoding = await getGeoCoding(location);

  if (!geoCoding) {
    return `Location "${location}" not found`;
  }

  const { longitude, latitude, country, name } = geoCoding;
  const res = await axios.get(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature`
  );

  const temperature = res.data.current.temperature;
  const unit = res.data.current_units.temperature;

  return { latitude, longitude, temperature, unit, country, name };
}

async function getGeoCoding(location: string) {
  const res = await axios.get(
    `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1`
  );

  const results = res.data.results;
  if (results.length === 0) {
    return;
  }

  return results[0] as {
    longitude: number;
    latitude: number;
    name: string;
    country: string;
  };
}
