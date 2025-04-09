import { tavily } from "npm:@tavily/core";
import { SearchResponse } from "./schemas.ts";

const extractFileName = (url: string) => {
  const parts = url.split("/");
  const fileWithExtension = parts.pop();
  const cleanFile = fileWithExtension!.split("?")[0];
  const dotIndex = cleanFile.lastIndexOf(".");
  const fileNameWithoutExt =
    dotIndex !== -1 ? cleanFile.substring(0, dotIndex) : cleanFile;
  const finalName = fileNameWithoutExt.replace(/[^a-zA-Z0-9]/g, " ");
  return finalName;
};

const tavilySearch = async (query: string) => {
  const client = tavily({ apiKey: Deno.env.get("TAVILY_API_KEY") });
  const resp = await client.search(query);
  return resp.results.map((result: SearchResponse & any) => ({
    title: extractFileName(result.url),
    url: result.url,
    content: result.content,
  }));
};

export const searchApi = async (query: string): Promise<SearchResponse[]> => {
  return await tavilySearch(query);
};
