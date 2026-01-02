/**
 * Cloudflare Worker entry point for Hour Genie API
 * 
 * This worker handles API requests for operating hours management.
 * Deploy this to Cloudflare Workers using:
 *   wrangler deploy
 * 
 * Make sure to set the following environment variables in Cloudflare Workers:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
 */

// Note: This file is for Cloudflare Workers deployment
// @ts-ignore
import { handleGet, handlePost, handleOptions } from "./routes/operating-hours";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    // Route: /api/operating-hours
    if (path === "/api/operating-hours" || path.startsWith("/api/operating-hours")) {
      if (request.method === "GET") {
        return handleGet(request);
      } else if (request.method === "POST") {
        return handlePost(request);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  },
};

