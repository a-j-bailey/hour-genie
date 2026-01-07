import Stripe from "stripe";
import { createSupabaseClient } from "../utils/supabase";
import { getAuthenticatedUser } from "../utils/auth";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PAYMENT_LINK_ID?: string;
  STRIPE_MONTHLY_PAYMENT_LINK_ID?: string;
  STRIPE_ANNUAL_PAYMENT_LINK_ID?: string;
}

export interface Subscription {
  id?: string;
  user_id?: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  subscription_status: string;
  plan_name?: string | null;
  price_amount?: number | null;
  price_currency?: string;
  billing_interval?: string | null;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Handle GET request - Get current user's subscription status
 */
export async function handleGet(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No subscription found - return null
        return new Response(
          JSON.stringify({ subscription: null }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ subscription: data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle POST request - Create Stripe payment link
 */
export async function handlePost(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!env.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Check if user already has a subscription
    const supabase = createSupabaseClient(env);
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.userId)
      .single();

    if (existingSubscription && existingSubscription.subscription_status === "active") {
      return new Response(
        JSON.stringify({ error: "User already has an active subscription" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get billing interval from request body
    const body = await request.json().catch(() => ({}));
    const billingInterval = body.billing_interval || "monthly"; // default to monthly

    // Determine payment link ID based on billing interval
    let paymentLinkId: string | undefined;

    if (billingInterval === "monthly") {
      paymentLinkId = env.STRIPE_MONTHLY_PAYMENT_LINK_ID || env.STRIPE_PAYMENT_LINK_ID;
    } else if (billingInterval === "annual") {
      paymentLinkId = env.STRIPE_ANNUAL_PAYMENT_LINK_ID;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid billing_interval. Must be 'monthly' or 'annual'." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Payment link ID is required
    if (!paymentLinkId) {
      return new Response(
        JSON.stringify({ 
          error: `Payment link ID is required for ${billingInterval} subscription. Please set STRIPE_${billingInterval.toUpperCase()}_PAYMENT_LINK_ID in environment.` 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Retrieve and return payment link URL with client_reference_id and prefilled email
    const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
    const urlWithParams = `${paymentLink.url}?client_reference_id=${encodeURIComponent(user.userId)}&prefilled_email=${encodeURIComponent(user.email)}`;
    return new Response(
      JSON.stringify({ url: urlWithParams }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error: any) {
    console.error("Error creating payment link:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle GET /portal request - Generate Stripe Customer Portal session
 */
export async function handleGetPortal(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!env.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(env);
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.userId)
      .single();

    if (error || !subscription) {
      return new Response(
        JSON.stringify({ error: "No subscription found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/billing`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

