import {
  buildResponse,
  corsHeaders,
  withMethodCheck,
} from "../_shared/cors.ts";
import { imageToPdf } from "./pdfToImage.ts";

Deno.serve(
  withMethodCheck("GET", async (req: Request, supabase: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const uuid = searchParams.get("id");

      if (!uuid) {
        return buildResponse(
          { error: "'id' query parameter is required." },
          400,
        );
      }

      const { data: response, error: pagesError } = await supabase
        .from("pdf_source")
        .select("url")
        .eq("id", uuid)
        .maybeSingle();

      const redirectUrl = await imageToPdf(response?.url, 0);
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: redirectUrl },
      });
    } catch (error: any) {
      return buildResponse(
        {
          error: "Internal Server Error",
          details: error.message,
        },
        500,
      );
    }
  }),
);
