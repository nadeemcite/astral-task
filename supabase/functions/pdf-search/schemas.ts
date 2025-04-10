interface RequestBody {
  query: string;
  grade: string;
}

interface SearchResponse {
  url: string;
  content: string;
  title: string;
}

export type { RequestBody, SearchResponse };
