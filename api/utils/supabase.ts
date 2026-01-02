import { createClient } from "@supabase/supabase-js";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Create Supabase client for server-side operations
 * Uses service role key for bypassing RLS
 * 
 * Note: This file is for Cloudflare Workers deployment.
 * Install @supabase/supabase-js in your Worker environment.
 */
export function createSupabaseClient(env: Env) {
  const supabaseUrl = env.SUPABASE_URL || "";
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

