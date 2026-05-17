import OpenAI from "openai";

let client: OpenAI | null = null;

export const getOpenAIClient = () => {
  if (client) return client;
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  return client;
};

export const AI_MODEL = process.env.AI_MODEL ?? "llama-3.3-70b-versatile";
