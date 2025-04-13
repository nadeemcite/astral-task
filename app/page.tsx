"use client";

import { GradeDropdown } from "@/components/GradeDropdown";
import { SearchBar } from "@/components/SearchBar";
import { useState, useEffect } from "react";
import { SearchResults } from "@/components/SearchResults";
import { ISearchHistory, SearchResultType, Grade } from "@/types";
import { parsePdf, processPdf, searchPDF } from "@/lib/pdf";
import { getUserActivities } from "@/lib/user";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";

const filterUniqueHistory = (history: ISearchHistory[]): ISearchHistory[] => {
  const seen = new Set<string>();
  const uniqueHistory = history.filter((entry) => {
    const key = `${entry.search_keyword}-${entry.grade}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return uniqueHistory.slice(0, 5);
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [selectedGrade, setSelectedGrade] = useState<Grade>(Grade.ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResultType[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<ISearchHistory[]>([]);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserActivities = async () => {
      setIsModalLoading(true);
      const activities = await getUserActivities();
      setSearchHistory((prev) => [...activities]);
      setIsModalLoading(false);
    };
    fetchUserActivities();
  }, []);

  // Process a PDF by polling until the parse result is ready and then processing it for relevancy.
  const scanPdf = async (pdfUrl: string) => {
    let parsedPdf = await parsePdf(pdfUrl);
    setResults((prevResults) =>
      prevResults.map((item) =>
        item.url === pdfUrl
          ? {
              ...item,
              id: parsedPdf.pdf_source_id,
              image: `/api/pdf/image?id=${parsedPdf.pdf_source_id}`,
            }
          : item,
      ),
    );
    // Poll until the parsed data indicates readiness.
    while (!parsedPdf.ready) {
      console.log("PDF not ready, polling in 2 seconds...");
      await delay(2000);
      parsedPdf = await parsePdf(pdfUrl);
    }
    const relevancyData = await processPdf(
      parsedPdf.pdf_source_id,
      searchQuery,
    );
    setResults((prevResults) =>
      prevResults.map((item) =>
        item.url === pdfUrl
          ? {
              ...item,
              totalPages: parsedPdf.pages.length,
              id: parsedPdf.pdf_source_id,
              image: `/api/pdf/image?id=${parsedPdf.pdf_source_id}`,
              relevantPages: relevancyData,
            }
          : item,
      ),
    );
  };

  const performSearch = async () => {
    // Update search history with the current query and grade.
    setSearchHistory((prev) =>
      filterUniqueHistory([
        { search_keyword: searchQuery, grade: selectedGrade },
        ...prev,
      ]),
    );
    setResults([]); // Reset previous results.
    setIsSearching(true);
    try {
      const searchResponse = await searchPDF(searchQuery, selectedGrade);
      const initialResults: SearchResultType[] = searchResponse.results.map(
        (result: any, idx: number) => ({
          id: idx,
          url: result.url,
          description: result.content,
          title: result.title,
          totalPages: null,
          relevantPages: null,
        }),
      );

      setResults(initialResults);
      // Trigger PDF scanning asynchronously for each result.
      Promise.all(initialResults.map((result) => scanPdf(result.url)));
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full sm:w-3/4 max-w-full mx-auto pt-6">
      <div className="w-full px-4 relative">
        <h1 className="text-2xl font-semibold mb-4">PDF Search</h1>
        <div className="flex flex-col gap-2">
          <div className="flex items-stretch">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={(input) => {
                  setSearchQuery(input.search_keyword);
                  setSelectedGrade(input.grade);
                }}
                onSearch={performSearch}
                placeholder="Search..."
                history={searchHistory}
                isLoading={isSearching}
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
      <div className="w-full px-4 mt-6">
        {isSearching ? (
          <div className="flex flex-col justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <SearchResults results={results} />
        )}
      </div>
      <Modal
        isOpen={isModalLoading}
        onClose={() => setIsModalLoading(false)}
        title="Setting up application"
      >
        <p>
          <Spinner />
        </p>
      </Modal>
    </div>
  );
}
