import { printExtractedPdf } from "@/lib/pdf";
import { SearchResultType } from "@/types";
import Image from "next/image";
import Modal from "./Modal";
import { useState } from "react";
import Spinner from "./Spinner";

const PagesPill = ({ totalPages }: { totalPages: number }) => (
  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
    {totalPages} pages
  </div>
);

interface RelevanceData {
  relevantStr: string;
  relevantPages: number[];
}

const RelevanceInfo = ({
  relevantData,
  handleCreateRelevantPDF,
}: {
  relevantData?: RelevanceData;
  handleCreateRelevantPDF: () => void;
}) => {
  if (!relevantData) {
    return (
      <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span>Checking relevance</span>
      </div>
    );
  }
  // const range = relevantPages.endPage - relevantPages.startPage + 1;
  // if (range === totalPages) {
  //   return (
  //     <div className="text-sm text-gray-500 mt-2">All pages are relevant</div>
  //   );
  // }
  return (
    <div className="text-sm text-gray-500 mt-2">
      {relevantData.relevantStr}{" "}
      <a
        href="#"
        onClick={handleCreateRelevantPDF}
        className="text-blue-600 hover:text-blue-800 font-bold ml-2"
      >
        🖨️
      </a>
    </div>
  );
};

const SearchResult = ({
  id,
  title,
  description,
  image,
  totalPages,
  relevantPages,
}: SearchResultType) => {
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);

  // Transform the incoming "relevantPages" property if present
  // from { relavantStr, relavantPages } to the expected { relevantStr, relevantPages } format.
  const relevanceData: RelevanceData | undefined = relevantPages
    ? {
        relevantStr: (relevantPages as any).relavantStr,
        relevantPages: (relevantPages as any).relavantPages,
      }
    : undefined;

  const handleCreateRelevantPDF = async () => {
    setIsModalLoading(true);
    if (relevanceData) {
      await printExtractedPdf(id.toString(), relevanceData.relevantPages);
    }
    setIsModalLoading(false);
  };

  return (
    <div className="flex flex-col sm:flex-row border rounded-lg overflow-hidden mb-4 bg-white">
      <div className="w-full sm:w-1/4 relative">
        <div className="w-full h-[160px]">
          {image ? (
            <Image
              src={image}
              alt={title}
              className="w-full h-full object-cover object-[top_left] cursor-pointer"
              fill
              onClick={handleCreateRelevantPDF}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500" />
            </div>
          )}
        </div>
        {totalPages && <PagesPill totalPages={totalPages} />}
      </div>
      <div className="p-4 flex-1">
        <h3 className="font-medium text-base mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description.slice(0, 500)}</p>
        <RelevanceInfo
          relevantData={relevanceData}
          handleCreateRelevantPDF={handleCreateRelevantPDF}
        />
        <Modal
          isOpen={isModalLoading}
          onClose={() => setIsModalLoading(false)}
          title="Downloading PDF"
        >
          <p>
            <Spinner />
          </p>
        </Modal>
      </div>
    </div>
  );
};

export const SearchResults = ({ results }: { results: SearchResultType[] }) => (
  <div>
    <h2 className="text-xl font-medium mb-4">Results</h2>
    <div>
      {results.map((result) => (
        <SearchResult key={result.id} {...result} />
      ))}
    </div>
  </div>
);
