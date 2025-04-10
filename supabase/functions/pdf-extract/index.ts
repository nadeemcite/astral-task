import { PDFDocument } from "https://esm.sh/pdf-lib";
import { corsHeaders, withMethodCheck } from "../_shared/cors.ts";

const extractPdfPages = async (
  supabase: any,
  pdfSourceId: string,
  pageNumbers: number[],
) => {
  const { data: pdfSource } = await supabase
    .from("pdf_source")
    .select("file_path")
    .eq("id", pdfSourceId)
    .maybeSingle();
  const { data } = await supabase.storage
    .from(Deno.env.get("BUCKET_NAME")!)
    .download(pdfSource.file_path);
  const srcDoc = await PDFDocument.load(await data.arrayBuffer());
  const newDoc = await PDFDocument.create();
  console.log(pdfSource.file_path, pageNumbers);
  const totalPages = srcDoc.getPageCount();
  const validPageIndices = pageNumbers
    .map((pageNum) => pageNum - 1)
    .filter((index) => index >= 0 && index < totalPages);
  const copiedPages = await newDoc.copyPages(srcDoc, validPageIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));
  const pdfBytes = await newDoc.save();
  return pdfBytes;
};

Deno.serve(
  withMethodCheck("POST", async (req: Request, supabase: any) => {
    const { pdfSourceId, pages } = await req.json();
    return new Response(await extractPdfPages(supabase, pdfSourceId, pages), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
      },
    });
  }),
);
