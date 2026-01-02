// @ts-ignore - Cloudflare Workers environment
import { createClient } from "@supabase/supabase-js";

/**
 * Create Supabase client for server-side operations
 * Uses service role key for bypassing RLS
 * 
 * Note: This file is for Cloudflare Workers deployment.
 * Install @supabase/supabase-js in your Worker environment.
 */
export function createSupabaseClient() {
  // @ts-ignore - Cloudflare Workers global
  const supabaseUrl = SUPABASE_URL || "";
  // @ts-ignore - Cloudflare Workers global
  const supabaseServiceKey = SUPABASE_SERVICE_ROLE_KEY || "";

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

