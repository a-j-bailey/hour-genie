import { createSupabaseClient } from "../utils/supabase";
import { getAuthenticatedUser } from "../utils/auth";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface DayHours {
  day_of_week: number; // 0-6
  is_open: boolean;
  is_open_24_7: boolean;
  open_time: string | null; // "HH:MM" format
  close_time: string | null; // "HH:MM" format
}

export interface Business {
  id?: string;
  user_id?: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  default_hours: DayHours[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Validate default_hours JSON structure
 */
function validateDefaultHours(defaultHours: any): defaultHours is DayHours[] {
  if (!Array.isArray(defaultHours) || defaultHours.length !== 7) {
    return false;
  }

  for (let i = 0; i < 7; i++) {
    const day = defaultHours[i];
    if (
      typeof day.day_of_week !== "number" ||
      day.day_of_week !== i ||
      typeof day.is_open !== "boolean" ||
      typeof day.is_open_24_7 !== "boolean" ||
      (day.open_time !== null && typeof day.open_time !== "string") ||
      (day.close_time !== null && typeof day.close_time !== "string")
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Create default hours structure (all closed)
 */
function createDefaultHoursStructure(): DayHours[] {
  return [
    { day_of_week: 0, is_open: false, is_open_24_7: false, open_time: null, close_time: null },
    { day_of_week: 1, is_open: false, is_open_24_7: false, open_time: null, close_time: null },
    { day_of_week: 2, is_open: false, is_open_24_7: false, open_time: null, close_time: null },
    { day_of_week: 3, is_open: false, is_open_24_7: false, open_time: null, close_time: null },
    { day_of_week: 4, is_open: false, is_open_24_7: false, open_time: null, close_time: null },
    { day_of_week: 5, is_open: false, is_open_24_7: false, open_time: null, close_time: null },
    { day_of_week: 6, is_open: false, is_open_24_7: false, open_time: null, close_time: null },
  ];
}

/**
 * Handle GET request - List all businesses for authenticated user
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
      .from("business")
      .select("*")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false });

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
    console.error("Error in handleGet:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle GET by ID request - Get single business
 */
export async function handleGetById(request: Request, env: Env, businessId: string): Promise<Response> {
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
      .from("business")
      .select("*")
      .eq("id", businessId)
      .eq("user_id", user.userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Business not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
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
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle POST request - Create new business
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

    const body = await request.json();
    const { name, address, email, phone, default_hours } = body;

    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "Name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate default_hours if provided, otherwise use default structure
    let hoursToSave = default_hours || createDefaultHoursStructure();
    if (!validateDefaultHours(hoursToSave)) {
      return new Response(
        JSON.stringify({ error: "Invalid default_hours structure" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase
      .from("business")
      .insert({
        user_id: user.userId,
        name,
        address: address || null,
        email: email || null,
        phone: phone || null,
        default_hours: hoursToSave,
      })
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
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error in handlePost:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle PUT request - Update business
 */
export async function handlePut(request: Request, env: Env, businessId: string): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { name, address, email, phone, default_hours } = body;

    // First verify the business belongs to the user
    const supabase = createSupabaseClient(env);
    const { data: existingBusiness, error: fetchError } = await supabase
      .from("business")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.userId)
      .single();

    if (fetchError || !existingBusiness) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Name must be a non-empty string" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.name = name;
    }
    if (address !== undefined) updateData.address = address || null;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (default_hours !== undefined) {
      if (!validateDefaultHours(default_hours)) {
        return new Response(
          JSON.stringify({ error: "Invalid default_hours structure" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.default_hours = default_hours;
    }

    const { data, error } = await supabase
      .from("business")
      .update(updateData)
      .eq("id", businessId)
      .eq("user_id", user.userId)
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
  } catch (error) {
    console.error("Error in handlePut:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle DELETE request - Delete business
 */
export async function handleDelete(request: Request, env: Env, businessId: string): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(env);
    
    // Verify the business belongs to the user
    const { data: existingBusiness, error: fetchError } = await supabase
      .from("business")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.userId)
      .single();

    if (fetchError || !existingBusiness) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete the business (cascade will delete hours_overrides)
    const { error } = await supabase
      .from("business")
      .delete()
      .eq("id", businessId)
      .eq("user_id", user.userId);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Business deleted successfully" }),
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
    console.error("Error in handleDelete:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: errorMessage,
      }),
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

