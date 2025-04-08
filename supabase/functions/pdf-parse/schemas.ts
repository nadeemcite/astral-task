interface PDFTextContentItem {
  str: string;
}

interface PDFTextContent {
  items: PDFTextContentItem[];
}

interface PDFPage {
  pageIndex: number;
  getTextContent: () => Promise<PDFTextContent>;
}

interface PDFPageData {
  pageNumber: number;
  pageLabel: string;
  text: string;
}

interface RequestBody {
  url: string;
}

interface PDFParseOptions {
  pagerender?: (page: PDFPage) => Promise<string> | string;
}

export type { PDFPageData, PDFParseOptions, RequestBody };
