import { NextResponse } from "next/server";

export async function GET(req: Request) {
  return new NextResponse(JSON.stringify({ "a": "hello" }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
