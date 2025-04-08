import { createClient } from "jsr:@supabase/supabase-js@2";
Deno.serve(async (req: Request) => {
    if (req.method !== "GET") {
        return new Response(
            JSON.stringify({ error: "Method Not Allowed. Use GET." }),
            { status: 405, headers: { "Content-Type": "application/json" } },
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const uuid = searchParams.get("id");

        if (!uuid) {
            return new Response(
                JSON.stringify({ error: "'id' query parameter is required." }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: {
                        Authorization: req.headers.get("Authorization")!,
                    },
                },
            },
        );
        const { data: response, error: pagesError } = await supabase
            .from("pdf_source")
            .select("url")
            .eq("id", uuid).maybeSingle();
        const payload = {
            url: response?.url,
            pages: "0",
        };
        const API_KEY =Deno.env.get("PDFCO_API_KEY")
        if (!API_KEY) {
            return new Response(
                JSON.stringify({
                    error: "Missing PDFCO_API_KEY environment variable.",
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const pdfCoResponse = await fetch(
            "https://api.pdf.co/v1/pdf/convert/to/jpg",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY,
                },
                body: JSON.stringify(payload),
            },
        );

        if (!pdfCoResponse.ok) {
            const errorText = await pdfCoResponse.text();
            return new Response(
                JSON.stringify({ error: `PDF.co API error: ${errorText}` }),
                {
                    status: pdfCoResponse.status,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const result = await pdfCoResponse.json();
        const redirectUrl = result.urls[0];
        return new Response(null, {
            status: 302,
            headers: { "Location": redirectUrl },
        });
    } catch (error:any) {
        return new Response(
            JSON.stringify({
                error: "Internal Server Error",
                details: error.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
});
