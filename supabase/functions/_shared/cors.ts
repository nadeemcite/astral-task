import process from "node:process";
import { getSupabaseClient } from "../_shared/supabaseClient.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.VERCEL_URL!,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const methodCheck = (req: Request, method: "GET" | "POST") => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== method) {
    return new Response(
      JSON.stringify({ error: `Method Not Allowed. Use ${method}.` }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  return null;
};

export const withMethodCheck = (
  method: "GET" | "POST",
  handler: (
    req: Request,
    supabase: any,
    userId: string,
  ) => Promise<Response> | Response,
) => {
  return async (req: Request): Promise<Response> => {
    const checkResponse = methodCheck(req, method);
    if (checkResponse) {
      return checkResponse;
    }
    const supabase = getSupabaseClient(req.headers.get("Authorization")!);
    const { data: response, error: pagesError } = await supabase
      .from("users")
      .select("id")
      .eq("email", "anon@anon.com")
      .maybeSingle();
    if (pagesError) {
      throw new Error("anonymous user does not exist in db.");
    }
    return await handler(req, supabase, response?.id);
  };
};

export const buildResponse = (
  jsonResponse: Record<string, string | any>,
  status: number = 200,
  contentType: string = "application/json",
) => {
  return new Response(JSON.stringify(jsonResponse), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": contentType,
    },
  });
};
