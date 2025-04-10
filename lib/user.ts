"use client";

import supabaseClient from "@/lib/supabaseClient";
import { ISearchHistory } from "@/types";

export const getUserActivities = async (): Promise<ISearchHistory[]> => {
  const { data } = await supabaseClient.get("/user-history");
  return data;
};
