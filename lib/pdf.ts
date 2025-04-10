"use client";

import supabaseClient from "@/lib/supabaseClient";

export const searchPDF = async (query: string, grade: string) => {
  const { data } = await supabaseClient.post("/pdf-search", { query, grade });
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
): { relavantStr: string; relavantPages: number[] } => {
  const sortedRelevant: MatchingPage[] = matchingPages
    .filter((page) => page.similarity >= threshold)
    .sort((a, b) => a.page_number - b.page_number);

  if (sortedRelevant.length === 0) {
    return {
      relavantStr: "No pages are relevant",
      relavantPages: [],
    };
  }
  if (sortedRelevant.length === matchingPages.length) {
    return {
      relavantStr: "All pages relevant",
      relavantPages: sortedRelevant.map((r) => r.page_number),
    };
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
  return {
    relavantStr: `${numRelevant} pages relevant ${rangeStrs.join(", ")}`,
    relavantPages: sortedRelevant.map((r) => r.page_number),
  };
};

export const printExtractedPdf = async (
  pdfSourceId: string,
  pages: number[],
) => {
  try {
    // Make the API call using axios (supabaseClient) with responseType 'arraybuffer'
    const response = await supabaseClient.post(
      "/pdf-extract",
      { pdfSourceId, pages },
      { responseType: "arraybuffer" },
    );

    // Create a Blob from the received ArrayBuffer, specifying a type for PDFs.
    const blob = new Blob([response.data], { type: "application/pdf" });
    // Create a URL for the Blob.
    const blobUrl = URL.createObjectURL(blob);

    // Open a new window or tab with the generated Blob URL.
    const newWindow = window.open(blobUrl, "_blank");

    if (newWindow) {
      // When the window has loaded the PDF, trigger the print dialog.
      newWindow.addEventListener("load", () => {
        newWindow.print();
      });
    } else {
      console.error("Popup was blocked. Please allow popups for this site.");
    }
  } catch (error) {
    console.error("Error fetching the extracted PDF:", error);
  }
};
