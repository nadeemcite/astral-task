import { tavily } from "npm:@tavily/core";
import { SearchResponse } from "./schemas.ts";
import { EnvNotDefined, SearchApiError } from "../_shared/errors.ts";

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

const tavilySearch = async (query: string): Promise<SearchResponse[]> => {
  const apiKey = Deno.env.get("TAVILY_API_KEY");
  if (!apiKey) {
    throw new EnvNotDefined("TAVILY_API_KEY");
  }

  const client = tavily({ apiKey });
  try {
    const resp = await client.search(query);
    return resp.results.map((result: SearchResponse & any) => ({
      title: extractFileName(result.url),
      url: result.url,
      content: result.content,
    }));
  } catch (error: any) {
    throw new SearchApiError(error.message);
  }
};

export const searchApi = async (query: string): Promise<SearchResponse[]> => {
  return await tavilySearch(query);
};
