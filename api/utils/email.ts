/**
 * SendGrid email service for sending holiday reminder emails
 */

import sgMail from "@sendgrid/mail";

interface Env {
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;
  SENDGRID_REPLY_TO_EMAIL: string;
}

interface HolidayEmailData {
  businessId: string;
  businessName: string;
  businessEmail: string;
  holidayName: string;
  holidayDate: string; // YYYY-MM-DD format
  updateHoursUrl: string;
}

/**
 * Initialize SendGrid client
 */
export function initSendGrid(env: Env): void {
  if (!env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is required");
  }
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

/**
 * Generate unique reply-to token for tracking email replies
 * Format: holiday-{businessId}-{holidayDate}-{timestamp}
 */
export function generateReplyToToken(businessId: string, holidayDate: string): string {
  const timestamp = Date.now();
  return `holiday-${businessId}-${holidayDate}-${timestamp}`;
}

/**
 * Generate reply-to email address with token
 */
export function generateReplyToEmail(env: Env, token: string): string {
  // Use format: token@reply-to-domain.com
  // SendGrid Inbound Parse will route this to our webhook
  const domain = env.SENDGRID_REPLY_TO_EMAIL.split("@")[1] || "hourgenie.com";
  return `${token}@${domain}`;
}

/**
 * Generate HTML email template for holiday reminder
 */
function generateHolidayEmailHTML(data: HolidayEmailData): string {
  const { businessName, holidayName, holidayDate, updateHoursUrl } = data;
  
  const formattedDate = new Date(holidayDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Holiday Hours Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin-top: 0;">Holiday Hours Reminder</h1>
    <p style="font-size: 18px; margin-bottom: 0;">Hi ${businessName},</p>
  </div>
  
  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <p><strong>${holidayName}</strong> is coming up on <strong>${formattedDate}</strong>.</p>
    
    <p>Don't forget to update your operating hours for this holiday so your customers know when you're open!</p>
    
    <div style="margin: 30px 0;">
      <a href="${updateHoursUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Update Hours Now</a>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
      <p style="margin-top: 0; font-size: 14px;"><strong>Quick Reply Option:</strong></p>
      <p style="margin-bottom: 0; font-size: 14px;">You can also reply to this email with your hours. For example:</p>
      <ul style="font-size: 14px; margin-top: 10px;">
        <li>"We're closed on ${holidayName}"</li>
        <li>"Open 10am-2pm on ${formattedDate}"</li>
        <li>"Regular hours except closed Dec 25"</li>
      </ul>
    </div>
  </div>
  
  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p>This is an automated reminder from Hour Genie. If you have any questions, please contact support.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email template for holiday reminder
 */
function generateHolidayEmailText(data: HolidayEmailData): string {
  const { businessName, holidayName, holidayDate, updateHoursUrl } = data;
  
  const formattedDate = new Date(holidayDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
Holiday Hours Reminder

Hi ${businessName},

${holidayName} is coming up on ${formattedDate}.

Don't forget to update your operating hours for this holiday so your customers know when you're open!

Update your hours here: ${updateHoursUrl}

Quick Reply Option:
You can also reply to this email with your hours. For example:
- "We're closed on ${holidayName}"
- "Open 10am-2pm on ${formattedDate}"
- "Regular hours except closed Dec 25"

This is an automated reminder from Hour Genie. If you have any questions, please contact support.
  `.trim();
}

/**
 * Send holiday reminder email
 */
export async function sendHolidayReminderEmail(
  env: Env,
  data: HolidayEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL || !env.SENDGRID_REPLY_TO_EMAIL) {
      throw new Error("SendGrid environment variables are not configured");
    }

    initSendGrid(env);

    const replyToToken = generateReplyToToken(data.businessId, data.holidayDate);
    const replyToEmail = generateReplyToEmail(env, replyToToken);

    const msg = {
      to: data.businessEmail,
      from: env.SENDGRID_FROM_EMAIL,
      replyTo: replyToEmail,
      subject: `Reminder: Update Your Hours for ${data.holidayName}`,
      text: generateHolidayEmailText(data),
      html: generateHolidayEmailHTML(data),
      // Store token in custom headers for webhook processing
      customArgs: {
        replyToToken,
        businessId: data.businessId,
        holidayDate: data.holidayDate,
      },
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers["x-message-id"] as string,
    };
  } catch (error: any) {
    console.error("Error sending holiday reminder email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

