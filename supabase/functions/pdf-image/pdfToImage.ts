export const imageToPdf = async (url: string, pageNumber: number) => {
  const payload = {
    url,
    pages: pageNumber.toString(),
  };
  return await pdfCoApi(payload);
};

const pdfCoApi = async (payload: Record<string, string>) => {
  const pdfCoResponse = await fetch(
    "https://api.pdf.co/v1/pdf/convert/to/jpg",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("PDFCO_API_KEY")!,
      },
      body: JSON.stringify(payload),
    },
  );
  const result = await pdfCoResponse.json();
  return result.urls[0];
};
