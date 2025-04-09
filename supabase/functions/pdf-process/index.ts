import { withMethodCheck, buildResponse } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabaseClient.ts";
import { RequestBody } from "./schemas.ts";
import { getEmbeddings } from "../_shared/openaiClient.ts";

Deno.serve(
  withMethodCheck("POST", async (req: Request) => {
    try {
      const { pdfSourceId, query }: RequestBody = await req.json();

      if (!pdfSourceId || !query) {
        return buildResponse(
          {
            error: "Missing pdfSource or query in request body",
          },
          400,
        );
      }

      const supabase = getSupabaseClient(req.headers.get("Authorization")!);

      const queryEmbedding = await getEmbeddings(query);

      const { data, error } = await supabase.rpc("match_pdf_pages", {
        query_embedding: queryEmbedding,
        pdf_source: pdfSourceId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return buildResponse({
        pages: data,
      });
    } catch (err: any) {
      return buildResponse({ error: err.message }, 500);
    }
  }),
);
