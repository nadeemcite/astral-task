import { withMethodCheck, buildResponse } from "../_shared/cors.ts";

Deno.serve(
  withMethodCheck("GET", async (_: Request, supabase: any) => {
    // TODO: assuming currently we have only anonymous user, later we can add userId to filter activity
    const { data: resp } = await supabase
      .from("user_search_activity")
      .select("search_keyword, grade")
      .order("created_at", { ascending: false })
      .limit(5);
    return buildResponse(resp);
  }),
);
