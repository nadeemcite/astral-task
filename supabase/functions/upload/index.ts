import { getSupabaseClient } from "../_shared/supabaseClient.ts";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

Deno.serve(async (req: Request) => {
  const { url } = await req.json();
  const response = await axiod.get(url, { responseType: "arraybuffer" });
  const buffer = new Uint8Array(response.data);
  const pdfBlob = new Blob([buffer], { type: "application/pdf" });
  const filePath = `pdfs/${Date.now()}.pdf`;
  const { data: d1, error: e2 } = await getSupabaseClient(
    req.headers.get("Authorization")!,
  )
    .storage.from("pdffiles")
    .upload(filePath, pdfBlob);

  return new Response(
    JSON.stringify({
      step: d1,
      errors: e2,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
});
