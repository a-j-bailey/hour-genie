/**
 * Cloudflare Worker entry point for Hour Genie API
 * 
 * This worker handles API requests for business and operating hours management.
 * Deploy this to Cloudflare Workers using:
 *   wrangler deploy
 * 
 * Make sure to set the following environment variables in Cloudflare Workers:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
 * 
 * For local development, environment variables are loaded from .env.local.
 */

import {
  handleGet as handleGetBusinesses,
  handleGetById,
  handlePost as handlePostBusiness,
  handlePut as handlePutBusiness,
  handleDelete as handleDeleteBusiness,
  handleOptions as handleOptionsBusinesses,
} from "./routes/businesses";
import {
  handleGet as handleGetOverrides,
  handlePost as handlePostOverride,
  handlePut as handlePutOverride,
  handleDelete as handleDeleteOverride,
  handleOptions as handleOptionsOverrides,
} from "./routes/hours-overrides";
import {
  handleGet as handleGetIntegrations,
  handleGetByType,
  handlePost as handlePostIntegration,
  handlePut as handlePutIntegration,
  handleDelete as handleDeleteIntegration,
  handleOptions as handleOptionsIntegrations,
} from "./routes/integrations";
import {
  handleGet as handleGetEmbed,
  handleOptions as handleOptionsEmbed,
} from "./routes/embed";
import {
  handleGet as handleGetSubscriptions,
  handlePost as handlePostSubscriptions,
  handleGetPortal,
  handleOptions as handleOptionsSubscriptions,
} from "./routes/subscriptions";
import {
  handlePost as handlePostWebhook,
  handleOptions as handleOptionsWebhook,
} from "./routes/stripe-webhook";
import {
  handlePost as handlePostEmailWebhook,
  handleOptions as handleOptionsEmailWebhook,
} from "./routes/email-webhook";
import { handleScheduled } from "./scheduled/holiday-reminders";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PAYMENT_LINK_ID?: string;
  STRIPE_PRICE_ID?: string;
  STRIPE_MONTHLY_PRICE_ID?: string;
  STRIPE_ANNUAL_PRICE_ID?: string;
  STRIPE_MONTHLY_PAYMENT_LINK_ID?: string;
  STRIPE_ANNUAL_PAYMENT_LINK_ID?: string;
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
  SENDGRID_REPLY_TO_EMAIL?: string;
  XAI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      // Return appropriate OPTIONS handler based on path
      if (path.startsWith("/api/stripe-webhook")) {
        return handleOptionsWebhook();
      } else if (path.startsWith("/api/email-webhook")) {
        return handleOptionsEmailWebhook();
      } else if (path.startsWith("/api/subscriptions")) {
        return handleOptionsSubscriptions();
      } else if (path.startsWith("/api/embed")) {
        return handleOptionsEmbed();
      } else if (path.startsWith("/api/businesses") && path.includes("/integrations")) {
        return handleOptionsIntegrations();
      } else if (path.startsWith("/api/businesses")) {
        return handleOptionsBusinesses();
      } else if (path.startsWith("/api/hours-overrides") || path.includes("/hours-overrides")) {
        return handleOptionsOverrides();
      }
      // Generic OPTIONS for other routes
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Route: /api/email-webhook (public endpoint for SendGrid Inbound Parse)
    if (path === "/api/email-webhook") {
      if (method === "POST") {
        return handlePostEmailWebhook(request, env);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route: /api/stripe-webhook (public endpoint, signature verified)
    if (path === "/api/stripe-webhook") {
      if (method === "POST") {
        return handlePostWebhook(request, env);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route: /api/subscriptions/portal
    if (path === "/api/subscriptions/portal") {
      if (method === "GET") {
        return handleGetPortal(request, env);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route: /api/subscriptions
    if (path === "/api/subscriptions") {
      if (method === "GET") {
        return handleGetSubscriptions(request, env);
      } else if (method === "POST") {
        return handlePostSubscriptions(request, env);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route: /api/embed/hours (public endpoint, no auth required)
    if (path === "/api/embed/hours") {
      if (method === "GET") {
        return handleGetEmbed(request, env);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route: /api/businesses/:businessId/integrations/:integrationType (check this first, more specific)
    const integrationTypeMatch = path.match(/^\/api\/businesses\/([^\/]+)\/integrations\/([^\/]+)$/);
    if (integrationTypeMatch) {
      const businessId = integrationTypeMatch[1];
      const integrationType = integrationTypeMatch[2];
      if (method === "GET") {
        return handleGetByType(request, env, businessId, integrationType);
      } else if (method === "PUT") {
        return handlePutIntegration(request, env, businessId, integrationType);
      } else if (method === "DELETE") {
        return handleDeleteIntegration(request, env, businessId, integrationType);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route: /api/businesses/:businessId/integrations
    const integrationsPathMatch = path.match(/^\/api\/businesses\/([^\/]+)\/integrations$/);
    if (integrationsPathMatch) {
      const businessId = integrationsPathMatch[1];
      if (method === "GET") {
        return handleGetIntegrations(request, env, businessId);
      } else if (method === "POST") {
        return handlePostIntegration(request, env, businessId);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route: /api/businesses/:businessId/hours-overrides (check this first, more specific)
    const overridePathMatch = path.match(/^\/api\/businesses\/([^\/]+)\/hours-overrides$/);
    if (overridePathMatch) {
      const businessId = overridePathMatch[1];
      if (method === "GET") {
        return handleGetOverrides(request, env, businessId);
      } else if (method === "POST") {
        return handlePostOverride(request, env, businessId);
      } else {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Route: /api/businesses
    if (path.startsWith("/api/businesses")) {
      // Extract business ID if present (e.g., /api/businesses/{id})
      const businessPathMatch = path.match(/^\/api\/businesses\/([^\/]+)$/);
      const businessId = businessPathMatch ? businessPathMatch[1] : null;

      if (businessId) {
        // Routes with business ID: GET, PUT, DELETE /api/businesses/:id
        if (method === "GET") {
          return handleGetById(request, env, businessId);
        } else if (method === "PUT") {
          return handlePutBusiness(request, env, businessId);
        } else if (method === "DELETE") {
          return handleDeleteBusiness(request, env, businessId);
        } else {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { "Content-Type": "application/json" } }
          );
        }
      } else if (path === "/api/businesses") {
        // Routes without ID: GET (list), POST (create)
        if (method === "GET") {
          return handleGetBusinesses(request, env);
        } else if (method === "POST") {
          return handlePostBusiness(request, env);
        } else {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Route: /api/hours-overrides/:id
    const overrideIdMatch = path.match(/^\/api\/hours-overrides\/([^\/]+)$/);
    if (overrideIdMatch) {
      const overrideId = overrideIdMatch[1];
      if (method === "PUT") {
        return handlePutOverride(request, env, overrideId);
      } else if (method === "DELETE") {
        return handleDeleteOverride(request, env, overrideId);
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

  // Scheduled event handler for cron jobs
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(event, env));
  },
};

