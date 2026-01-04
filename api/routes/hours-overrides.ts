import { createSupabaseClient } from "../utils/supabase";
import { getAuthenticatedUser } from "../utils/auth";
import type { DayHours } from "./businesses";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface HoursOverride {
  id?: string;
  business_id: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  title?: string | null; // Optional title for the override (e.g., "Christmas", "Thanksgiving")
  hours: DayHours[]; // Complete week schedule (7 days, matching default_hours format)
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

/**
 * Verify business belongs to user
 */
async function verifyBusinessOwnership(
  supabase: any,
  businessId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("business")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", userId)
    .single();

  return !error && data !== null;
}

/**
 * Handle GET request - Get hours overrides for a business
 */
export async function handleGet(request: Request, env: Env, businessId: string): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(env);

    // Verify business ownership
    const isOwner = await verifyBusinessOwnership(supabase, businessId, user.userId);
    if (!isOwner) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get query params for optional date filtering
    const url = new URL(request.url);
    const startDateFilter = url.searchParams.get("start_date");
    const endDateFilter = url.searchParams.get("end_date");

    let query = supabase
      .from("hours_overrides")
      .select("*")
      .eq("business_id", businessId);

    // Optional date filtering
    if (startDateFilter) {
      query = query.gte("end_date", startDateFilter);
    }
    if (endDateFilter) {
      query = query.lte("start_date", endDateFilter);
    }

    query = query.order("start_date", { ascending: true });

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data || []),
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
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle POST request - Create hours override(s)
 */
export async function handlePost(request: Request, env: Env, businessId: string): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { start_date, end_date, title, hours } = body; // hours is array of DayHours (7 days, matching default_hours format)

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "start_date and end_date are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!hours || !Array.isArray(hours) || hours.length !== 7) {
      return new Response(
        JSON.stringify({ error: "hours array is required and must contain exactly 7 days" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (endDate < startDate) {
      return new Response(
        JSON.stringify({ error: "end_date must be >= start_date" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(env);

    // Verify business ownership
    const isOwner = await verifyBusinessOwnership(supabase, businessId, user.userId);
    if (!isOwner) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate hours structure (must be 7 days, matching default_hours format)
    for (let i = 0; i < 7; i++) {
      const day = hours[i];
      if (
        typeof day.day_of_week !== "number" ||
        day.day_of_week !== i ||
        typeof day.is_open !== "boolean" ||
        typeof day.is_open_24_7 !== "boolean" ||
        (day.open_time !== null && typeof day.open_time !== "string") ||
        (day.close_time !== null && typeof day.close_time !== "string")
      ) {
        return new Response(
          JSON.stringify({ error: `Invalid hours structure at day ${i}. Each day must have day_of_week matching its index, is_open, is_open_24_7, and optional open_time/close_time` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (day.is_open_24_7 && !day.is_open) {
        return new Response(
          JSON.stringify({ error: `is_open_24_7 can only be true when is_open is true (day ${i})` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Insert single override record with complete week schedule
    const overrideToInsert = {
      business_id: businessId,
      start_date: start_date,
      end_date: end_date,
      title: title || null,
      hours: hours,
      created_by: user.userId,
      updated_by: user.userId,
    };

    const { data, error } = await supabase
      .from("hours_overrides")
      .insert(overrideToInsert)
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in handlePost:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle PUT request - Update hours override
 */
export async function handlePut(request: Request, env: Env, overrideId: string): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { start_date, end_date, title, hours } = body;

    const supabase = createSupabaseClient(env);

    // First get the override to verify business ownership
    const { data: existingOverride, error: fetchError } = await supabase
      .from("hours_overrides")
      .select("business_id, business:business_id(user_id)")
      .eq("id", overrideId)
      .single();

    if (fetchError || !existingOverride) {
      return new Response(
        JSON.stringify({ error: "Override not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify business ownership via join
    const { data: business, error: businessError } = await supabase
      .from("business")
      .select("id")
      .eq("id", existingOverride.business_id)
      .eq("user_id", user.userId)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: "Override not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
        return new Response(
          JSON.stringify({ error: "Invalid date range" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Validate hours if provided
    if (hours !== undefined) {
      if (!Array.isArray(hours) || hours.length !== 7) {
        return new Response(
          JSON.stringify({ error: "hours array must contain exactly 7 days" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      for (let i = 0; i < 7; i++) {
        const day = hours[i];
        if (
          typeof day.day_of_week !== "number" ||
          day.day_of_week !== i ||
          typeof day.is_open !== "boolean" ||
          typeof day.is_open_24_7 !== "boolean" ||
          (day.open_time !== null && typeof day.open_time !== "string") ||
          (day.close_time !== null && typeof day.close_time !== "string")
        ) {
          return new Response(
            JSON.stringify({ error: `Invalid hours structure at day ${i}` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        if (day.is_open_24_7 && !day.is_open) {
          return new Response(
            JSON.stringify({ error: `is_open_24_7 can only be true when is_open is true (day ${i})` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Build update object
    const updateData: any = { updated_by: user.userId };
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (title !== undefined) updateData.title = title || null;
    if (hours !== undefined) updateData.hours = hours;

    const { data, error } = await supabase
      .from("hours_overrides")
      .update(updateData)
      .eq("id", overrideId)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
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
    console.error("Error in handlePut:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle DELETE request - Delete hours override
 */
export async function handleDelete(request: Request, env: Env, overrideId: string): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(env);

    // First get the override to verify business ownership
    const { data: existingOverride, error: fetchError } = await supabase
      .from("hours_overrides")
      .select("business_id")
      .eq("id", overrideId)
      .single();

    if (fetchError || !existingOverride) {
      return new Response(
        JSON.stringify({ error: "Override not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify business ownership
    const isOwner = await verifyBusinessOwnership(supabase, existingOverride.business_id, user.userId);
    if (!isOwner) {
      return new Response(
        JSON.stringify({ error: "Override not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase
      .from("hours_overrides")
      .delete()
      .eq("id", overrideId);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Override deleted successfully" }),
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
    console.error("Error in handleDelete:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function handleOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

