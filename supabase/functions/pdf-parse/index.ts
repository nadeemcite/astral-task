import { buildResponse, withMethodCheck } from "../_shared/cors.ts";
import pdfParse from "npm:pdf-parse";
import { PDFPageData, PDFParseOptions, RequestBody } from "./schemas.ts";
import { getEmbeddings } from "../_shared/openaiClient.ts";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import { getSupabaseClient } from "../_shared/supabaseClient.ts";

Deno.serve(
  withMethodCheck("POST", async (req: Request) => {
    try {
      const supabase = getSupabaseClient(req.headers.get("Authorization")!);
      const { url }: RequestBody = await req.json();
      let result = await getExistingPdfData(supabase, url);
      if (!result) result = await createNewPdfData(supabase, url);
      return buildResponse({
        pdf_source_id: result.pdf_source_id,
        pages: result.pagesData,
      });
    } catch (err: any) {
      return buildResponse({ error: err.message }, 500);
    }
  }),
);

const getExistingPdfData = async (supabase: any, url: string) => {
  const { data: sourceData, error: sourceError } = await supabase
    .from("pdf_source")
    .select("id")
    .eq("url", url)
    .maybeSingle();
  if (sourceError) throw new Error(sourceError.message);
  if (sourceData && sourceData.id) {
    const { data: pagesResponse, error: pagesError } = await supabase
      .from("pdf_page")
      .select("id, content, page_number")
      .eq("pdf_source_id", sourceData.id);
    if (pagesError) throw new Error(pagesError.message);
    return { pdf_source_id: sourceData.id, pagesData: pagesResponse };
  }
  return null;
};

const createNewPdfData = async (supabase: any, url: string) => {
  const response = await axiod.get(url, { responseType: "arraybuffer" });
  const buffer = new Uint8Array(response.data);
  const pages: PDFPageData[] = [];
  const options: PDFParseOptions = {
    pagerender: async (pageData: any) => {
      const pageNumber = pageData.pageIndex + 1;
      const textContent = await pageData.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      pages.push({
        pageNumber,
        pageLabel: `Page ${pageNumber}`,
        text: pageText,
      });
      return "";
    },
  };
  await pdfParse(buffer, options);
  const { data: insertSourceData, error: insertSourceError } = await supabase
    .from("pdf_source")
    .insert([{ url }])
    .select("id")
    .maybeSingle();
  if (insertSourceError) throw new Error(insertSourceError.message);
  const pdf_source_id = insertSourceData?.id;
  const pagesWithEmbeddings = await Promise.all(
    pages.map(async (page) => {
      const embeddings = await getEmbeddings(page.text);
      return {
        content: page.text,
        page_number: page.pageNumber,
        pdf_source_id,
        embeddings,
      };
    }),
  );
  const { data: insertPagesData, error: insertPagesError } = await supabase
    .from("pdf_page")
    .insert(pagesWithEmbeddings)
    .select("id, content, page_number");
  if (insertPagesError) throw new Error(insertPagesError.message);
  return { pdf_source_id, pagesData: insertPagesData };
};
