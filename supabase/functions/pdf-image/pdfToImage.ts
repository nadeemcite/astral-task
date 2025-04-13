import { ApiError, ApiKeyMissingError } from "../_shared/errors.ts";

export const imageToPdf = async (
  url: string,
  pageNumber: number,
): Promise<string> => {
  const payload = {
    url,
    pages: pageNumber.toString(),
  };
  return await pdfCoApi(payload);
};

const pdfCoApi = async (payload: Record<string, string>): Promise<string> => {
  const apiKey = Deno.env.get("PDFCO_API_KEY");
  if (!apiKey) {
    throw new ApiKeyMissingError();
  }

  const response = await fetch("https://api.pdf.co/v1/pdf/convert/to/jpg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText);
  }

  const result = await response.json();
  if (!result?.urls || !result.urls[0]) {
    throw new ApiError(
      response.status,
      "Invalid response structure from PDF.co API",
    );
  }
  return result.urls[0];
};
