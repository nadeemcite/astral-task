"use client";

import supabaseClient from "@/lib/supabaseClient";

export const searchPDF = async (query: string) => {
  const { data } = await supabaseClient.post("/pdf-search", { query });
  return data;
};

export const parsePdf = async (pdfUrl: string) => {
  const { data } = await supabaseClient.post("/pdf-parse", { url: pdfUrl });
  return data;
};