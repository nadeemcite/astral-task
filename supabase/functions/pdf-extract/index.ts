import { getSupabaseClient } from "../_shared/supabaseClient.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib";

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
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  const extractPath = `pdfs/extract-${Date.now()}.pdf`;
  await supabase.storage
    .from(Deno.env.get("BUCKET_NAME")!)
    .upload(extractPath, pdfBlob);
  await supabase
    .from("pdf_source")
    .update({ file_extract_path: extractPath })
    .eq("id", pdfSourceId);
};

Deno.serve(async (req: Request) => {
  const { pdfSourceId, pages } = await req.json();
  const supabase = getSupabaseClient(req.headers.get("Authorization")!);
  EdgeRuntime.waitUntil(extractPdfPages(supabase, pdfSourceId, pages));
  return new Response(
    JSON.stringify({
      step: "success",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
});
