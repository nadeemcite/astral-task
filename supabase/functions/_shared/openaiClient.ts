import { OpenAI } from "npm:openai";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")!,
});
const normalize = (vector: number[]): number[] => {
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
  return norm ? vector.map((v) => v / norm) : vector;
};

export const getEmbeddings = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-ada-002",
  });
  const rawEmbedding = response.data[0].embedding;
  return normalize(rawEmbedding);
};
