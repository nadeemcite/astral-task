import { buildResponse, withMethodCheck } from "../_shared/cors.ts";
import pdfParse from "npm:pdf-parse";
import { PDFPageData, PDFParseOptions, RequestBody } from "./schemas.ts";
import { getEmbeddings } from "../_shared/openaiClient.ts";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import {
  CustomError,
  EnvNotDefined,
  StorageUploadError,
  PDFSourceQueryError,
  PDFPageQueryError,
  BatchInsertError,
  DownloadFailedError,
  PDFCreationError,
} from "../_shared/errors.ts";

Deno.serve(
  withMethodCheck(
    "POST",
    async (req: Request, supabase: any, userId: string) => {
      try {
        const { url }: RequestBody = await req.json();

        let result = await getExistingPdfData(supabase, url);
        if (!result) {
          result = await createNewPdfData(supabase, url, userId);
          return buildResponse({
            pdf_source_id: result.pdf_source_id,
            pages: result.pagesData,
            ready: false,
          });
        } else {
          return buildResponse({
            pdf_source_id: result.pdf_source_id,
            pages: result.pagesData,
            ready: result.pagesData.length !== 0,
          });
        }
      } catch (err: any) {
        if (err instanceof CustomError) {
          console.error("Custom error in POST pdf parse:", err);
          return err.getErrorResponse();
        }
        console.error("Unknown error in POST pdf parse:", err);
        return buildResponse({ error: "An unexpected error occurred." }, 500);
      }
    },
  ),
);

const getExistingPdfData = async (supabase: any, url: string) => {
  const { data: sourceData, error: sourceError } = await supabase
    .from("pdf_source")
    .select("id")
    .eq("url", url)
    .maybeSingle();
  if (sourceError) throw new PDFSourceQueryError(sourceError.message);
  if (sourceData && sourceData.id) {
    const { data: pagesResponse, error: pagesError } = await supabase
      .from("pdf_page")
      .select("id, content, page_number")
      .eq("pdf_source_id", sourceData.id);
    if (pagesError) throw new PDFPageQueryError(pagesError.message);
    return { pdf_source_id: sourceData.id, pagesData: pagesResponse };
  }
  return null;
};

const saveFileOnBucket = async (
  supabase: any,
  buffer: Uint8Array,
  pdf_source_id: string,
) => {
  const bucketName = Deno.env.get("BUCKET_NAME");
  if (!bucketName) {
    throw new EnvNotDefined("BUCKET_NAME");
  }
  const pdfBlob = new Blob([buffer], { type: "application/pdf" });
  const filePath = `pdfs/${Date.now()}.pdf`;
  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (storageError) {
    throw new StorageUploadError(storageError.message);
  } else {
    await supabase
      .from("pdf_source")
      .update({ file_path: filePath })
      .eq("id", pdf_source_id);
  }
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
  const batchSize = 20;
  const batchInsertPages = async (
    pagesData: {
      content: string;
      page_number: number;
      pdf_source_id: any;
      embeddings: number[];
    }[],
  ) => {
    let insertedPages: any[] = [];
    for (let i = 0; i < pagesData.length; i += batchSize) {
      const batch = pagesData.slice(i, i + batchSize);
      const { data: batchData, error: batchError } = await supabase
        .from("pdf_page")
        .insert(batch)
        .select("id, content, page_number");
      if (batchError) {
        throw new BatchInsertError(batchError.message);
      }
      insertedPages = insertedPages.concat(batchData);
    }
    return insertedPages;
  };
  await batchInsertPages(pagesWithEmbeddings);
};

const createNewPdfData = async (supabase: any, url: string, userId: string) => {
  let response;
  try {
    response = await axiod.get(url, { responseType: "arraybuffer" });
  } catch (err: any) {
    throw new DownloadFailedError(err.message);
  }
  const buffer = new Uint8Array(response.data);
  const { data: insertSourceData, error: insertSourceError } = await supabase
    .from("pdf_source")
    .insert([{ url, file_path: null, created_by_user_id: userId }])
    .select("id")
    .maybeSingle();
  if (insertSourceError) throw new PDFCreationError(insertSourceError.message);
  const pdf_source_id = insertSourceData?.id;
  EdgeRuntime.waitUntil(saveFileOnBucket(supabase, buffer, pdf_source_id));
  return { pdf_source_id, pagesData: [] };
};
