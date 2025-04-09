import { buildResponse, withMethodCheck } from "../_shared/cors.ts";
import { RequestBody } from "./schemas.ts";
import { searchApi } from "./search-api.ts";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

Deno.serve(
  withMethodCheck("POST", async (req: Request) => {
    const { query }: RequestBody = await req.json();
    const results = await searchApi(`${query} filetype:pdf`);
    const pdfResults = results.filter((result) => result.url.endsWith(".pdf"));

    if (pdfResults.length === 0) {
      return buildResponse(
        {
          error: "No results found, please adjust your query.",
        },
        404,
      );
    }

    const workingResults = (
      await Promise.all(
        pdfResults.map(async (result) => {
          const working = await isEndpointWorking(result.url);
          return working ? result : null;
        }),
      )
    ).filter((result) => result !== null);

    if (workingResults.length === 0) {
      return buildResponse(
        {
          error: "All results are invalid.",
        },
        404,
      );
    }

    return buildResponse({ results: workingResults });
  }),
);

const isEndpointWorking = async (url: string): Promise<boolean> => {
  try {
    const response = await axiod.head(url, undefined, { timeout: 3000 });
    const contentType = response.headers.get("content-type");
    if (!contentType) {
      console.warn(`Content-Type header is not present for ${url}`);
    }
    return true;
  } catch (error: any) {
    if (error.message?.includes("timeout")) {
      console.error(`Request timed out for ${url}`);
    } else {
      console.error(`Error checking endpoint (${url}):`);
    }
    return false;
  }
};
