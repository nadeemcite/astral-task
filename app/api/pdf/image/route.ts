import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
  }
  const apiUrl = new URL(`${process.env.SUPABASE_API_PREFIX}/functions/v1/pdf-image/`);
  apiUrl.searchParams.append("id", id);

  const response = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `HTTP error! status: ${response.status}` },
      { status: response.status }
    );
  }
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
}