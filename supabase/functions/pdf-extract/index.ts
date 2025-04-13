import { PDFDocument } from "https://esm.sh/pdf-lib";
import {
  corsHeaders,
  withMethodCheck,
  buildResponse,
} from "../_shared/cors.ts";
import {
  CustomError,
  PDFSourceNotFoundError,
  DownloadFailedError,
  NoValidPagesError,
  EnvNotDefined,
} from "../_shared/errors.ts";

export const extractPdfPages = async (
  supabase: any,
  pdfSourceId: string,
  pageNumbers: number[],
): Promise<Uint8Array> => {
  try {
    const { data: pdfSource, error: sourceError } = await supabase
      .from("pdf_source")
      .select("file_path")
      .eq("id", pdfSourceId)
      .maybeSingle();

    if (sourceError) {
      throw new Error(`Error retrieving PDF source: ${sourceError.message}`);
    }

    if (!pdfSource || !pdfSource.file_path) {
      throw new PDFSourceNotFoundError(pdfSourceId);
    }

    const bucketName = Deno.env.get("BUCKET_NAME");
    if (!bucketName) {
      throw new EnvNotDefined("BUCKET_NAME");
    }
    const { data, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(pdfSource.file_path);

    if (downloadError) {
      throw new DownloadFailedError(downloadError.message);
    }
    if (!data) {
      throw new DownloadFailedError("No data received from storage.");
    }

    const arrayBuffer = await data.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);
    const newDoc = await PDFDocument.create();
    const totalPages = srcDoc.getPageCount();

    const validPageIndices = pageNumbers
      .map((pageNum) => pageNum - 1)
      .filter((index) => index >= 0 && index < totalPages);

    if (validPageIndices.length === 0) {
      throw new NoValidPagesError();
    }

    const copiedPages = await newDoc.copyPages(srcDoc, validPageIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    const pdfBytes = await newDoc.save();
    return pdfBytes;
  } catch (err) {
    console.error("Error in extractPdfPages:", err);
    throw err;
  }
};

Deno.serve(
  withMethodCheck("POST", async (req: Request, supabase: any) => {
    try {
      const { pdfSourceId, pages } = await req.json();
      const extractedPdf = await extractPdfPages(supabase, pdfSourceId, pages);
      return new Response(extractedPdf, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
        },
      });
    } catch (err) {
      if (err instanceof CustomError) {
        console.error("Custom error in POST pdf extract:", err);
        return err.getErrorResponse();
      }
      console.error("Unknown error in POST pdf extract:", err);
      return buildResponse({ error: "An unexpected error occurred." }, 500);
    }
  }),
);
