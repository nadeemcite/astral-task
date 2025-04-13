import { withMethodCheck, buildResponse } from "../_shared/cors.ts";
import { RequestBody } from "./schemas.ts";
import { getEmbeddings } from "../_shared/openaiClient.ts";
import { CustomError, PDFMatchQueryError } from "../_shared/errors.ts";

Deno.serve(
  withMethodCheck("POST", async (req: Request, supabase: any) => {
    try {
      const { pdfSourceId, query }: RequestBody = await req.json();

      if (!pdfSourceId || !query) {
        return buildResponse(
          { error: "Missing pdfSource or query in request body" },
          400,
        );
      }

      const queryEmbedding = await getEmbeddings(query);

      const { data, error } = await supabase.rpc("match_pdf_pages", {
        query_embedding: queryEmbedding,
        pdf_source: pdfSourceId,
      });

      if (error) {
        throw new PDFMatchQueryError(error.message);
      }

      return buildResponse({
        pages: data,
      });
    } catch (err: any) {
      if (err instanceof CustomError) {
        console.error("Custom error in POST pdf process:", err);
        return err.getErrorResponse();
      }
      console.error("Unknown error in POST pdf process:", err);
      return buildResponse({ error: "An unexpected error occurred." }, 500);
    }
  }),
);
