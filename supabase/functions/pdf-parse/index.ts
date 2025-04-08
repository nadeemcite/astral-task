// pdf-parse endpoint (e.g., process_pdf.ts)
import pdfParse from "npm:pdf-parse";
import fetch from "npm:node-fetch";
import { PDFPageData, PDFParseOptions, RequestBody } from "./schemas.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { OpenAI } from "npm:openai";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") ?? "",
});

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
  return norm ? vector.map((v) => v / norm) : vector;
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-ada-002",
  });
  const rawEmbedding = response.data[0].embedding;
  return normalize(rawEmbedding);
}

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      },
    );

    const { url }: RequestBody = await req.json();

    const { data: sourceData, error: sourceError } = await supabase
      .from("pdf_source")
      .select("id")
      .eq("url", url)
      .maybeSingle();

    if (sourceError) {
      throw new Error(sourceError.message);
    }

    let pdf_source_id = "";
    let pagesData = [];

    if (sourceData && sourceData.id) {
      pdf_source_id = sourceData.id;
      const { data: pagesResponse, error: pagesError } = await supabase
        .from("pdf_page")
        .select("id, content, page_number")
        .eq("pdf_source_id", pdf_source_id);

      if (pagesError) {
        throw new Error(pagesError.message);
      }
      pagesData = pagesResponse;
    } else {
      const response = await fetch(url);
      const buffer = new Uint8Array(await response.arrayBuffer());
      const pages: PDFPageData[] = [];
      const options: PDFParseOptions = {
        pagerender: async (pageData) => {
          const pageNumber = pageData.pageIndex + 1;
          const textContent = await pageData.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          const pageLabel = `Page ${pageNumber}`;
          pages.push({ pageNumber, pageLabel, text: pageText });
          return "";
        },
      };
      await pdfParse(buffer, options);
      const { data: insertSourceData, error: insertSourceError } =
        await supabase
          .from("pdf_source")
          .insert([{ url }])
          .select("id")
          .maybeSingle();

      if (insertSourceError) {
        throw new Error(insertSourceError.message);
      }
      pdf_source_id = insertSourceData?.id;

      const pagesWithEmbeddings = await Promise.all(
        pages.map(async (page) => {
          const embeddings = await getEmbedding(page.text);
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

      if (insertPagesError) {
        throw new Error(insertPagesError.message);
      }
      pagesData = insertPagesData;
    }

    return new Response(
      JSON.stringify({
        pdf_source_id,
        pages: pagesData,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});