"use server";

export const searchPDF = async (query: string) => {
    const response = await fetch(
        `${process.env.SUPABASE_API_PREFIX}/functions/v1/pdf-search`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env
                    .NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            },
            body: JSON.stringify({ query }),
        },
    );
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
};


export const parsePdf = async (pdfUrl: string) =>{
    const response = await fetch(
        `${process.env.SUPABASE_API_PREFIX}/functions/v1/pdf-parse`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env
                    .NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            },
            body: JSON.stringify({ url: pdfUrl }),
        },
    );
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}