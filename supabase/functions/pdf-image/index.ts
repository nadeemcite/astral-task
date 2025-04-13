import {
  buildResponse,
  corsHeaders,
  withMethodCheck,
} from "../_shared/cors.ts";
import { imageToPdf } from "./pdfToImage.ts";
import { PDFSourceNotFoundError, CustomError } from "../_shared/errors.ts";

export const handleGetRequest = async (
  req: Request,
  supabase: any,
): Promise<Response> => {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get("id");

    if (!uuid) {
      return buildResponse({ error: "'id' query parameter is required." }, 400);
    }

    const { data: response, error: pagesError } = await supabase
      .from("pdf_source")
      .select("url")
      .eq("id", uuid)
      .maybeSingle();

    if (pagesError || !response?.url) {
      throw new PDFSourceNotFoundError(uuid);
    }

    const redirectUrl = await imageToPdf(response.url, 0);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: redirectUrl },
    });
  } catch (err: any) {
    if (err instanceof CustomError) {
      console.error("Custom error in GET pdf image:", err);
      return err.getErrorResponse();
    }
    console.error("Unknown error in GET pdf image:", err);
    return buildResponse({ error: "An unexpected error occurred." }, 500);
  }
};

Deno.serve(withMethodCheck("GET", handleGetRequest));
