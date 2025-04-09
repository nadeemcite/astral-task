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

export const processPdf = async (pdfSourceId: string, query: string) => {
  const { data } = await supabaseClient.post("/pdf-process", {
    pdfSourceId,
    query,
  });
  return summarizeRelevantPages(data.pages);
};

interface MatchingPage {
  page_number: number;
  similarity: number;
}

export const summarizeRelevantPages = (
  matchingPages: MatchingPage[],
  threshold: number = 0.75,
): string => {
  const sortedRelevant: MatchingPage[] = matchingPages
    .filter((page) => page.similarity >= threshold)
    .sort((a, b) => a.page_number - b.page_number);

  if (sortedRelevant.length === 0) {
    return "No pages are relevant";
  }
  if (sortedRelevant.length === matchingPages.length) {
    return "All pages relevant";
  }

  const ranges: [number, number][] = [];
  let start = sortedRelevant[0].page_number;
  let prev = start;

  for (let i = 1; i < sortedRelevant.length; i++) {
    const current = sortedRelevant[i].page_number;
    if (current !== prev + 1) {
      ranges.push([start, prev]);
      start = current;
    }
    prev = current;
  }
  ranges.push([start, prev]);

  const rangeStrs: string[] = ranges.map(([startNum, endNum]) =>
    startNum === endNum ? `${startNum}` : `${startNum}-${endNum}`,
  );
  const numRelevant: number = sortedRelevant.length;
  return `${numRelevant} pages relevant ${rangeStrs.join(", ")}`;
};
