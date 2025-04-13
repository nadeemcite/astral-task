import { withMethodCheck, buildResponse } from "../_shared/cors.ts";
import { CustomError, UserActivityQueryError } from "../_shared/errors.ts";

Deno.serve(
  withMethodCheck("GET", async (_: Request, supabase: any) => {
    try {
      // TODO: currently, we have only anonymous users. Later you can add filtering by userId.
      const { data: resp, error } = await supabase
        .from("distinct_user_search_activity")
        .select("search_keyword, grade")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        throw new UserActivityQueryError(error.message);
      }

      return buildResponse(resp);
    } catch (err: any) {
      if (err instanceof CustomError) {
        console.error("Custom error in GET user search activity:", err);
        return err.getErrorResponse();
      }
      console.error("Unknown error in GET user search activity:", err);
      return buildResponse({ error: "An unexpected error occurred." }, 500);
    }
  }),
);
