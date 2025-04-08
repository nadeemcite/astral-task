import { tavily } from "npm:@tavily/core";
import { SearchResponse } from "./schemas.ts";

function extractFileName(url: string) {
    // Split the URL by '/' and get the last part which is the filename with extension.
    const parts = url.split("/");
    const fileWithExtension = parts.pop();

    // Remove any query parameters if they exist.
    const cleanFile = fileWithExtension!.split("?")[0];

    // Remove the file extension by finding the last occurrence of '.'.
    const dotIndex = cleanFile.lastIndexOf(".");
    const fileNameWithoutExt = dotIndex !== -1
        ? cleanFile.substring(0, dotIndex)
        : cleanFile;

    // Replace hyphens with spaces.
    const finalName = fileNameWithoutExt.replace(/-/g, " ");

    return finalName;
}

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
