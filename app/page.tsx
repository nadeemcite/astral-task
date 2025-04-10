"use client";

import { GradeDropdown } from "@/components/GradeDropdown";
import { SearchBar } from "@/components/SearchBar";
import { useState, useEffect } from "react";
import { SearchResults } from "@/components/SearchResults";
import { ISearchHistory, SearchResultType, Grade } from "@/types";
import { parsePdf, processPdf, searchPDF } from "@/lib/pdf";
import { getUserActivities } from "@/lib/user";

export default function Home() {
  const [selectedGrade, setSelectedGrade] = useState<Grade>(Grade.ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<ISearchHistory[]>([]);

  useEffect(() => {
    const loadUserActivities = async () => {
      const resp = await getUserActivities();
      setSearchHistory((prev) => [...resp]);
    };
    loadUserActivities();
  }, []);

  const scanPdf = async (pdfUrl: string) => {
    // Call parsePdf and poll until the response is ready.
    let pdfParseResponse = await parsePdf(pdfUrl);
    setSearchResults((prevResults) =>
      prevResults.map((result) =>
        result.url === pdfUrl
          ? {
              ...result,
              id: pdfParseResponse.pdf_source_id,
              image: `/api/pdf/image?id=${pdfParseResponse.pdf_source_id}`,
            }
          : result,
      ),
    );
    // Poll every 2 seconds until ready becomes true
    while (!pdfParseResponse.ready) {
      console.log("PDF is not ready yet. Polling again in 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      pdfParseResponse = await parsePdf(pdfUrl);
    }

    // Only when ready, call processPdf to get the relevance response.
    const relevanceResponse = await processPdf(
      pdfParseResponse.pdf_source_id,
      searchQuery,
    );

    // Update the search results: assign pdf_source_id, image URL, and other relevant information.
    setSearchResults((prevResults) =>
      prevResults.map((result) =>
        result.url === pdfUrl
          ? {
              ...result,
              totalPages: pdfParseResponse.pages.length,
              id: pdfParseResponse.pdf_source_id,
              image: `/api/pdf/image?id=${pdfParseResponse.pdf_source_id}`,
              relevantPages: relevanceResponse,
            }
          : result,
      ),
    );
  };

  const searchPdf = async () => {
    setSearchResults(() => []);
    setIsLoading(true);
    try {
      const resp = await searchPDF(searchQuery, selectedGrade);
      const results: SearchResultType[] = resp.results.map(
        (row: any, i: number) => ({
          id: i,
          url: row.url,
          description: row.content,
          title: row.title,
          totalPages: null,
          relavantPages: null,
        }),
      );

      Promise.all(results.map((row: any) => scanPdf(row.url)));

      setSearchResults(results);
    } catch (error) {
      console.error("Error in searchPdf:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full sm:w-3/4 max-w-full mx-auto pt-6">
      <div className="w-full px-4 relative">
        <h1 className="text-2xl font-semibold mb-4">PDF Search</h1>
        {/* Search bar and grade dropdown container */}
        <div className="flex flex-col gap-2">
          <div className="flex items-stretch">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val.search_keyword);
                  setSelectedGrade(val.grade);
                }}
                onSearch={searchPdf}
                placeholder="Search..."
                history={searchHistory}
                isLoading={isLoading}
              />
            </div>
            <div className="ml-4 relative z-10 h-12">
              <GradeDropdown
                value={selectedGrade}
                onChange={setSelectedGrade}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search results section */}
      <div className="w-full px-4 mt-6">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <svg
              className="animate-spin h-8 w-8 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span className="mt-2 text-lg font-semibold text-gray-600">
              Loading...
            </span>
          </div>
        ) : (
          <SearchResults results={searchResults} />
        )}
      </div>
    </div>
  );
}
