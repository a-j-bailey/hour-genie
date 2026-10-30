import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// React Router SPA mode still evaluates this module in Node while prerendering
// index.html. Cloudflare Pages Preview does not inherit Production VITE_*
// build vars, so throwing at import time fails the Pages check.
if ((!supabaseUrl || !supabaseAnonKey) && !import.meta.env.SSR) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);
