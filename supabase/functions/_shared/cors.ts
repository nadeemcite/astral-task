import process from "node:process";

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
  handler: (req: Request) => Promise<Response> | Response,
) => {
  return async (req: Request): Promise<Response> => {
    const checkResponse = methodCheck(req, method);
    if (checkResponse) {
      return checkResponse;
    }
    return await handler(req);
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
