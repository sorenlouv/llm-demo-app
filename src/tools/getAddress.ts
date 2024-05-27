import { ChatCompletionTool } from "openai/resources";

export const getAddressSchema: ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_address",
    description: "Get the address of a person",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the person to get the address for",
        },
      },
      required: ["name"],
    },
  },
};

const addressMockData = [
  {
    name: "John",
    address: "123 Main St, Anytown, CA 12345",
  },
  {
    name: "Jane",
    address: "456 Elm Ave, Otherville, NY 54321",
  },
  {
    name: "Søren",
    address: "Copenhagen, Denmark",
  },
  {
    name: "Dario",
    address: "Amsterdam, Netherlands",
  },
];

export async function getAddress({ name }: { name: string }) {
  const address = addressMockData.find((person) =>
    person.name.includes(name)
  )?.address;

  if (address) {
    return address;
  }

  return "Address not found for this person.";
}
