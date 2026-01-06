import Stripe from "stripe";
import { createSupabaseClient } from "../utils/supabase";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

/**
 * Handle POST request - Process Stripe webhook events
 */
export async function handlePost(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Stripe webhook not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(env);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Only process subscription checkouts
        if (session.mode === "subscription" && session.customer) {
          const customerId = typeof session.customer === "string" 
            ? session.customer 
            : session.customer.id;

          // Get subscription details
          const subscriptionId = session.subscription as string;
          if (!subscriptionId) {
            console.error("No subscription ID in checkout session");
            break;
          }

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const price = priceId ? await stripe.prices.retrieve(priceId) : null;
          const planName = price?.nickname || price?.product || "Unknown Plan";

          // Get user_id from metadata or customer metadata
          let userId = session.metadata?.user_id;
          if (!userId && customerId) {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted && typeof customer !== "string") {
              userId = customer.metadata?.user_id;
            }
          }

          if (!userId) {
            console.error("No user_id found in session or customer metadata");
            break;
          }

          // Upsert subscription record
          const { error: upsertError } = await supabase
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                subscription_status: subscription.status,
                plan_name: planName,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "user_id",
              }
            );

          if (upsertError) {
            console.error("Error upserting subscription:", upsertError);
            return new Response(
              JSON.stringify({ error: "Database error" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        // Get plan name
        const priceId = subscription.items.data[0]?.price.id;
        const price = priceId ? await stripe.prices.retrieve(priceId) : null;
        const planName = price?.nickname || price?.product || "Unknown Plan";

        // Get user_id from customer metadata
        let userId: string | undefined;
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer.deleted && typeof customer !== "string") {
            userId = customer.metadata?.user_id;
          }
        }

        if (!userId) {
          console.error("No user_id found in customer metadata");
          break;
        }

        // Update subscription record
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            subscription_status: subscription.status,
            plan_name: planName,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
          return new Response(
            JSON.stringify({ error: "Database error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        // Update subscription status to canceled
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
          return new Response(
            JSON.stringify({ error: "Database error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
    },
  });
}

