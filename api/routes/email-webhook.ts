/**
 * Email webhook handler for SendGrid Inbound Parse
 * Processes email replies and extracts hours information
 */

import { createSupabaseClient } from "../utils/supabase";
import { parseHoursFromText } from "../utils/hours-parser";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
  SENDGRID_REPLY_TO_EMAIL?: string;
  XAI_API_KEY?: string;
}

/**
 * Extract text content from email (prefer plain text, fallback to HTML)
 */
function extractEmailText(formData: FormData): string {
  const text = formData.get("text") as string;
  const html = formData.get("html") as string;

  if (text) {
    return text;
  }

  if (html) {
    // Simple HTML to text conversion (remove tags)
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  return "";
}

/**
 * Extract reply-to token from email headers or reply-to address
 */
function extractReplyToToken(formData: FormData): string | null {
  // Check custom headers first
  const headers = formData.get("headers") as string;
  if (headers) {
    const tokenMatch = headers.match(/X-Reply-To-Token:\s*([^\r\n]+)/i);
    if (tokenMatch) {
      return tokenMatch[1].trim();
    }
  }

  // Check reply-to email address
  const replyTo = formData.get("reply_to") as string;
  if (replyTo) {
    // Format: token@domain.com
    const match = replyTo.match(/^([^@]+)@/);
    if (match) {
      return match[1];
    }
  }

  // Check from address (might contain token)
  const from = formData.get("from") as string;
  if (from) {
    const match = from.match(/holiday-([^-]+)-([^-]+)-(\d+)/);
    if (match) {
      return `holiday-${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  return null;
}

/**
 * Parse reply-to token to extract business ID and holiday date
 */
function parseReplyToToken(token: string): { businessId: string; holidayDate: string } | null {
  // Format: holiday-{businessId}-{holidayDate}-{timestamp}
  const match = token.match(/^holiday-([^-]+)-([^-]+)-(\d+)$/);
  if (match) {
    return {
      businessId: match[1],
      holidayDate: match[2],
    };
  }
  return null;
}

/**
 * Get business by ID
 */
async function getBusiness(supabase: any, businessId: string) {
  const { data, error } = await supabase
    .from("business")
    .select("*")
    .eq("id", businessId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Create hours override from parsed hours
 */
async function createHoursOverride(
  supabase: any,
  businessId: string,
  userId: string,
  parsedHours: any
) {
  const { data, error } = await supabase
    .from("hours_overrides")
    .insert({
      business_id: businessId,
      start_date: parsedHours.startDate,
      end_date: parsedHours.endDate,
      title: parsedHours.title,
      hours: parsedHours.hours,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating hours override:", error);
    return null;
  }

  return data;
}

/**
 * Update activity_history record with reference to created override
 */
async function updateActivityHistory(
  supabase: any,
  businessId: string,
  holidayDate: string,
  overrideId: string
) {
  const { error } = await supabase
    .from("activity_history")
    .update({
      reference_id: overrideId,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .eq("activity_type", "holiday_email")
    .eq("metadata->>holiday_date", holidayDate);

  if (error) {
    console.error("Error updating activity history:", error);
  }
}

/**
 * Send confirmation email to user
 */
async function sendConfirmationEmail(
  env: Env,
  businessEmail: string,
  businessName: string,
  holidayName: string,
  success: boolean
) {
  if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) {
    return;
  }

  try {
    const subject = success
      ? `Hours Updated for ${holidayName}`
      : `Unable to Process Hours Update for ${holidayName}`;

    const text = success
      ? `Hi ${businessName},\n\nYour hours for ${holidayName} have been successfully updated based on your email reply.\n\nYou can view and edit your hours in the Hour Genie app.\n\nThank you!`
      : `Hi ${businessName},\n\nWe received your email reply about ${holidayName}, but we weren't able to automatically parse your hours.\n\nPlease log in to Hour Genie to update your hours manually, or reply with a clearer format like:\n- "We're closed on ${holidayName}"\n- "Open 10am-2pm on [date]"\n\nThank you!`;

    // Use SendGrid directly for confirmation
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: businessEmail }],
          },
        ],
        from: { email: env.SENDGRID_FROM_EMAIL },
        subject,
        content: [
          {
            type: "text/plain",
            value: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Error sending confirmation email:", await response.text());
    }
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}

/**
 * Handle POST request from SendGrid Inbound Parse webhook
 */
export async function handlePost(request: Request, env: Env): Promise<Response> {
  try {
    // SendGrid Inbound Parse sends data as form-data
    const formData = await request.formData();

    // Extract email content
    const emailText = extractEmailText(formData);
    if (!emailText || emailText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No email content found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract reply-to token
    const replyToToken = extractReplyToToken(formData);
    if (!replyToToken) {
      return new Response(
        JSON.stringify({ error: "Could not extract reply-to token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse token to get business ID and holiday date
    const tokenData = parseReplyToToken(replyToToken);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid reply-to token format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { businessId, holidayDate } = tokenData;

    // Get business information
    const supabase = createSupabaseClient(env);
    const business = await getBusiness(supabase, businessId);
    if (!business) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get holiday name from activity_history
    const { data: activityData } = await supabase
      .from("activity_history")
      .select("metadata")
      .eq("business_id", businessId)
      .eq("activity_type", "holiday_email")
      .eq("metadata->>holiday_date", holidayDate)
      .single();

    const holidayName = activityData?.metadata?.holiday_name || "Holiday";

    // Parse hours from email text
    const parsedHours = await parseHoursFromText(
      emailText,
      holidayDate,
      holidayName,
      !!env.XAI_API_KEY,
      env.XAI_API_KEY
    );

    if (!parsedHours) {
      // Send failure confirmation
      await sendConfirmationEmail(
        env,
        business.email || "",
        business.name,
        holidayName,
        false
      );

      return new Response(
        JSON.stringify({
          error: "Could not parse hours from email",
          message: "Email received but hours could not be parsed",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create hours override
    const override = await createHoursOverride(
      supabase,
      businessId,
      business.user_id,
      parsedHours
    );

    if (!override) {
      return new Response(
        JSON.stringify({ error: "Failed to create hours override" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update activity_history with reference to override
    await updateActivityHistory(supabase, businessId, holidayDate, override.id);

    // Send success confirmation
    await sendConfirmationEmail(
      env,
      business.email || "",
      business.name,
      holidayName,
      true
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Hours override created successfully",
        overrideId: override.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error processing email webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

