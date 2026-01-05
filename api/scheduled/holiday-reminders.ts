/**
 * Scheduled handler for holiday reminder emails
 * Runs daily to check for upcoming holidays and send reminder emails
 */

import { createSupabaseClient } from "../utils/supabase";
import { getHolidaysDaysAway } from "../utils/holidays";
import { sendHolidayReminderEmail } from "../utils/email";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
  SENDGRID_REPLY_TO_EMAIL?: string;
  VITE_API_URL?: string; // Frontend URL for update hours link
}

/**
 * Check if business has already been notified about a holiday
 */
async function hasBeenNotified(
  supabase: any,
  businessId: string,
  holidayDate: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("activity_history")
    .select("id")
    .eq("business_id", businessId)
    .eq("activity_type", "holiday_email")
    .eq("metadata->>holiday_date", holidayDate)
    .single();

  return !error && data !== null;
}

/**
 * Log email sent to activity_history
 */
async function logEmailSent(
  supabase: any,
  businessId: string,
  userId: string,
  holidayName: string,
  holidayDate: string,
  emailSubject: string
): Promise<void> {
  const { error } = await supabase.from("activity_history").insert({
    business_id: businessId,
    user_id: userId,
    activity_type: "holiday_email",
    status: "sent",
    metadata: {
      holiday_name: holidayName,
      holiday_date: holidayDate,
      email_subject: emailSubject,
    },
  });

  if (error) {
    console.error("Error logging email to activity_history:", error);
  }
}

/**
 * Get all businesses that should receive holiday reminders
 */
async function getBusinessesForReminders(supabase: any): Promise<any[]> {
  const { data, error } = await supabase
    .from("business")
    .select("id, name, email, user_id")
    .not("email", "is", null); // Only businesses with email addresses

  if (error) {
    console.error("Error fetching businesses:", error);
    return [];
  }

  return data || [];
}


/**
 * Handle scheduled event (cron job)
 */
export async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  try {
    console.log("Running holiday reminder cron job...");

    // Check if SendGrid is configured
    if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL || !env.SENDGRID_REPLY_TO_EMAIL) {
      console.error("SendGrid environment variables not configured. Skipping holiday reminders.");
      return;
    }

    // Get holidays that are 14 days away
    const holidays = getHolidaysDaysAway(14);
    console.log(`Found ${holidays.length} holiday(s) 14 days away`);

    if (holidays.length === 0) {
      console.log("No holidays found 14 days away. Exiting.");
      return;
    }

    // Get all businesses
    const supabase = createSupabaseClient(env);
    const businesses = await getBusinessesForReminders(supabase);
    console.log(`Found ${businesses.length} business(es) to notify`);

    if (businesses.length === 0) {
      console.log("No businesses found. Exiting.");
      return;
    }

    // Get frontend URL for update hours link
    const frontendUrl = env.VITE_API_URL?.replace("/api", "") || "https://hourgenie.com";
    const updateHoursUrl = `${frontendUrl}/hour_management`;

    // Process each holiday
    for (const holiday of holidays) {
      console.log(`Processing holiday: ${holiday.name} (${holiday.dateString})`);

      // Process each business
      for (const business of businesses) {
        try {
          // Check if already notified
          const notified = await hasBeenNotified(supabase, business.id, holiday.dateString);
          if (notified) {
            console.log(
              `Business ${business.name} (${business.id}) already notified about ${holiday.name}. Skipping.`
            );
            continue;
          }

          // Get email address (use business email, skip if not set)
          const emailAddress = business.email;

          if (!emailAddress) {
            console.log(
              `No email address found for business ${business.name} (${business.id}). Skipping.`
            );
            continue;
          }

          // Send email
          console.log(`Sending holiday reminder email to ${emailAddress} for ${business.name}`);
          const result = await sendHolidayReminderEmail(env, {
            businessId: business.id,
            businessName: business.name,
            businessEmail: emailAddress,
            holidayName: holiday.name,
            holidayDate: holiday.dateString,
            updateHoursUrl,
          });

          if (result.success) {
            // Log to activity_history
            await logEmailSent(
              supabase,
              business.id,
              business.user_id,
              holiday.name,
              holiday.dateString,
              `Reminder: Update Your Hours for ${holiday.name}`
            );
            console.log(
              `Successfully sent holiday reminder email to ${emailAddress} for ${business.name}`
            );
          } else {
            console.error(
              `Failed to send holiday reminder email to ${emailAddress} for ${business.name}: ${result.error}`
            );
          }
        } catch (error: any) {
          console.error(
            `Error processing business ${business.name} (${business.id}):`,
            error.message
          );
          // Continue with next business
        }
      }
    }

    console.log("Holiday reminder cron job completed successfully.");
  } catch (error: any) {
    console.error("Error in holiday reminder cron job:", error);
    throw error;
  }
}

