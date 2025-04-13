import { buildResponse, withMethodCheck } from "../_shared/cors.ts";
import { RequestBody } from "./schemas.ts";
import { searchApi } from "./search-api.ts";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import {
  CustomError,
  SearchResultsNotFoundError,
  NoValidEndpointsError,
  UserSearchActivityError,
} from "../_shared/errors.ts";

Deno.serve(
  withMethodCheck(
    "POST",
    async (req: Request, supabase: any, userId: string) => {
      try {
        const { query, grade }: RequestBody = await req.json();

        // Basic input validation.
        if (!query || !grade) {
          throw new CustomError(
            "Missing pdfSource or query in request body",
            400,
          );
        }

        // Execute search via the search API.
        const results = await searchApi(
          `${query} ${grade === "all" ? "" : grade} filetype:pdf`,
        );

        // Record user search activity.
        const { error: activityError } = await supabase
          .from("user_search_activity")
          .insert([
            {
              search_keyword: query,
              grade,
              user_id: userId,
            },
          ]);
        if (activityError) {
          throw new UserSearchActivityError(activityError.message);
        }

        // Filter only PDF files.
        const pdfResults = results.filter((result) =>
          result.url.endsWith(".pdf"),
        );
        if (pdfResults.length === 0) {
          throw new SearchResultsNotFoundError();
        }

        // Verify that endpoints for the found PDFs are working.
        const workingResults = (
          await Promise.all(
            pdfResults.map(async (result) => {
              const working = await isEndpointWorking(result.url);
              return working ? result : null;
            }),
          )
        ).filter((result) => result !== null);

        if (workingResults.length === 0) {
          throw new NoValidEndpointsError();
        }

        return buildResponse({ results: workingResults });
      } catch (err: any) {
        if (err instanceof CustomError) {
          console.error("Custom error in POST pdf search:", err);
          return err.getErrorResponse();
        }
        console.error("Unknown error in POST pdf search:", err);
        return buildResponse({ error: "An unexpected error occurred." }, 500);
      }
    },
  ),
);

const isEndpointWorking = async (url: string): Promise<boolean> => {
  try {
    // Use HEAD request to quickly check endpoint.
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
      console.error(`Error checking endpoint (${url}):`, error.message);
    }
    return false;
  }
};
