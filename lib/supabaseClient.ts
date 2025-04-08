"use client";
import axios from "axios";

const supabseClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  },
});

export default supabseClient;