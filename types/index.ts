export type SearchResultType = {
  id: number|string;
  url: string;
  title: string;
  description: string;
  image?: string;
  totalPages?: number;
  relevantPages?: {
    startPage: number;
    endPage: number;
  };
}; 