import { withMethodCheck, buildResponse } from "../_shared/cors.ts";

Deno.serve(
  withMethodCheck("GET", async (_: Request, supabase: any) => {
    // TODO: currently, we have only anonymous users. Later you can add filtering by userId.
    const { data: resp, error } = await supabase
      .from("distinct_user_search_activity")
      .select("search_keyword, grade")
      .limit(5);

    if (error) {
      console.error(error);
      return buildResponse({ error: error.message });
    }

    return buildResponse(resp);
  }),
);
