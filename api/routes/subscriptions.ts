import Stripe from "stripe";
import { createSupabaseClient } from "../utils/supabase";
import { getAuthenticatedUser } from "../utils/auth";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PAYMENT_LINK_ID?: string;
  STRIPE_PRICE_ID?: string;
  STRIPE_MONTHLY_PRICE_ID?: string;
  STRIPE_ANNUAL_PRICE_ID?: string;
  STRIPE_MONTHLY_PAYMENT_LINK_ID?: string;
  STRIPE_ANNUAL_PAYMENT_LINK_ID?: string;
}

export interface Subscription {
  id?: string;
  user_id?: string;
  stripe_customer_id: string;
  subscription_status: string;
  plan_name?: string | null;
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
      apiVersion: "2024-12-18.acacia",
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

    // Determine payment link ID or price ID based on billing interval
    let paymentLinkId: string | undefined;
    let priceId: string | undefined;

    if (billingInterval === "monthly") {
      paymentLinkId = env.STRIPE_MONTHLY_PAYMENT_LINK_ID || env.STRIPE_PAYMENT_LINK_ID;
      priceId = env.STRIPE_MONTHLY_PRICE_ID || env.STRIPE_PRICE_ID;
    } else if (billingInterval === "annual") {
      paymentLinkId = env.STRIPE_ANNUAL_PAYMENT_LINK_ID;
      priceId = env.STRIPE_ANNUAL_PRICE_ID;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid billing_interval. Must be 'monthly' or 'annual'." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // If payment link ID is provided, use it directly
    if (paymentLinkId) {
      const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
      return new Response(
        JSON.stringify({ url: paymentLink.url }),
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

    // Otherwise, create a checkout session using price ID

    if (!priceId) {
      return new Response(
        JSON.stringify({ 
          error: `Price ID is required for ${billingInterval} subscription. Please set STRIPE_${billingInterval.toUpperCase()}_PRICE_ID or STRIPE_${billingInterval.toUpperCase()}_PAYMENT_LINK_ID in environment.` 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.userId,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/billing?canceled=true`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.userId,
      },
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
      apiVersion: "2024-12-18.acacia",
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

