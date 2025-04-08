import { corsHeaders } from '../_shared/cors.ts'
import { RequestBody } from "./schemas.ts";
import { searchApi } from "./search-api.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";

async function isEndpointWorking(url: string): Promise<boolean> {
  try {
    const response = await axiod.head(url,undefined, { timeout: 3000 });
    const contentType = response.headers["content-type"];
    
    if (!contentType) {
      console.warn(`Content-Type header is not present for ${url}`);
    } else {
      console.log(`Content-Type for ${url}: ${contentType}`);
    }

    return true;
  } catch (error) {
    if (error.message?.includes("timeout")) {
      console.error(`Request timed out for ${url}`);
    } else {
      console.error(`Error checking endpoint (${url}):`, error.message || error);
    }
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  
  const { query }: RequestBody = await req.json();
  const results = await searchApi(`${query} filetype:pdf`);
  const pdfResults = results.filter((result) => result.url.endsWith(".pdf"));

  if (pdfResults.length === 0) {
    return new Response(
      JSON.stringify({ error: "No results found, please adjust your query." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const workingResults = (await Promise.all(
    pdfResults.map(async (result) => {
      const working = await isEndpointWorking(result.url);
      return working ? result : null;
    })
  )).filter((result) => result !== null);

  if (workingResults.length === 0) {
    return new Response(
      JSON.stringify({ error: "None of the PDF endpoints are working." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ results: workingResults }),
    { headers: { ...corsHeaders,"Content-Type": "application/json" } },
  );
});