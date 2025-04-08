import process from "node:process";

export const corsHeaders = {
    "Access-Control-Allow-Origin": process.env.VERCEL_URL,
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};
