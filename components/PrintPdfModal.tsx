import { useState } from "react";
import Modal from "./Modal";
import Spinner from "./Spinner";
import { printExtractedPdf } from "@/lib/pdf";

interface PrintPdfModalProps {
  pdfSourceId: string;
  defaultRelevantPages: number[];
  totalPages: number;
  onClose: () => void;
}

type PrintOption = "relevant" | "all" | "single" | "range";

const PrintPdfModal: React.FC<PrintPdfModalProps> = ({
  pdfSourceId,
  defaultRelevantPages,
  totalPages,
  onClose,
}) => {
  const [printOption, setPrintOption] = useState<PrintOption>("relevant");
  const [singlePage, setSinglePage] = useState<number | undefined>(undefined);
  const [rangeStart, setRangeStart] = useState<number | undefined>(undefined);
  const [rangeEnd, setRangeEnd] = useState<number | undefined>(undefined);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const handlePrint = async () => {
    let pages: number[] = [];
    if (printOption === "relevant") {
      pages = defaultRelevantPages;
    } else if (printOption === "all") {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (printOption === "single") {
      if (singlePage && singlePage >= 1 && singlePage <= totalPages) {
        pages = [singlePage];
      } else {
        alert("Please enter a valid single page number.");
        return;
      }
    } else if (printOption === "range") {
      if (
        rangeStart &&
        rangeEnd &&
        rangeStart >= 1 &&
        rangeEnd <= totalPages &&
        rangeStart <= rangeEnd
      ) {
        pages = [];
        for (let i = rangeStart; i <= rangeEnd; i++) {
          pages.push(i);
        }
      } else {
        alert("Please enter a valid page range.");
        return;
      }
    }
    setIsPrinting(true);
    await printExtractedPdf(pdfSourceId, pages);
    setIsPrinting(false);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Print PDF">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Select Print Option</h2>
        <div className="mb-4">
          <label className="block mb-2">
            <input
              type="radio"
              name="printOption"
              value="relevant"
              checked={printOption === "relevant"}
              onChange={() => setPrintOption("relevant")}
              className="mr-2 bg-transparent text-base text-gray-900 placeholder:text-gray-400"
            />
            Print Relevant Pages
          </label>
          <label className="block mb-2">
            <input
              type="radio"
              name="printOption"
              value="all"
              checked={printOption === "all"}
              onChange={() => setPrintOption("all")}
              className="mr-2 bg-transparent text-base text-gray-900 placeholder:text-gray-400"
            />
            Print All Pages
          </label>
          <label className="block mb-2">
            <input
              type="radio"
              name="printOption"
              value="single"
              checked={printOption === "single"}
              onChange={() => setPrintOption("single")}
              className="mr-2 bg-transparent text-base text-gray-900 placeholder:text-gray-400"
            />
            Print a Single Page
          </label>
          {printOption === "single" && (
            <input
              type="number"
              min={1}
              max={totalPages}
              value={singlePage ?? ""}
              onChange={(e) => setSinglePage(Number(e.target.value))}
              placeholder="Page No"
              className="border p-2 mt-2 bg-transparent text-base text-gray-900 placeholder:text-gray-400 w-40"
            />
          )}
          <label className="block mt-4 mb-2">
            <input
              type="radio"
              name="printOption"
              value="range"
              checked={printOption === "range"}
              onChange={() => setPrintOption("range")}
              className="mr-2 bg-transparent text-base text-gray-900 placeholder:text-gray-400"
            />
            Print a Range of Pages
          </label>
          {printOption === "range" && (
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={rangeStart ?? ""}
                onChange={(e) => setRangeStart(Number(e.target.value))}
                placeholder="Start page"
                className="border p-2 mt-2 flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400"
              />
              <input
                type="number"
                min={1}
                max={totalPages}
                value={rangeEnd ?? ""}
                onChange={(e) => setRangeEnd(Number(e.target.value))}
                placeholder="End page"
                className="border p-2 mt-2 flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-400"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end items-center gap-4">
          {isPrinting ? (
            <Spinner />
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className={`px-4 py-2 rounded bg-blue-600 text-white`}
              >
                Print PDF
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PrintPdfModal;
