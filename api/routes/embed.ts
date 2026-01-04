import { createSupabaseClient } from "../utils/supabase";
import type { DayHours } from "./businesses";
import type { HoursOverride } from "./hours-overrides";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Convert 24-hour time (HH:MM) to 12-hour format (H:MM AM/PM)
 */
function formatTimeTo12Hour(time24: string): string {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Get the start of the current week (Sunday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Get date string in YYYY-MM-DD format
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Check if a date falls within a date range
 */
function isDateInRange(date: Date, startDate: string, endDate: string): boolean {
  const dateStr = formatDate(date);
  return dateStr >= startDate && dateStr <= endDate;
}

/**
 * Get current week's hours with overrides applied
 */
function getCurrentWeekHours(
  defaultHours: DayHours[],
  overrides: HoursOverride[]
): DayHours[] {
  const weekStart = getWeekStart(new Date());
  const currentWeek: DayHours[] = [];

  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + dayOfWeek);
    const dateStr = formatDate(currentDate);

    // Find applicable overrides for this day
    const applicableOverrides = overrides.filter(
      (override) =>
        override.day_of_week === dayOfWeek &&
        isDateInRange(currentDate, override.start_date, override.end_date)
    );

    // Use the most recent override if any, otherwise use default
    let dayHours: DayHours = defaultHours[dayOfWeek];
    if (applicableOverrides.length > 0) {
      // Sort by created_at descending to get most recent
      const sortedOverrides = [...applicableOverrides].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
      const override = sortedOverrides[0];
      dayHours = {
        day_of_week: dayOfWeek,
        is_open: override.is_open,
        is_open_24_7: override.is_open_24_7,
        open_time: override.open_time,
        close_time: override.close_time,
      };
    }

    currentWeek.push(dayHours);
  }

  return currentWeek;
}

/**
 * Format hours for display
 */
function formatHoursDisplay(day: DayHours): string {
  if (!day.is_open) {
    return "Closed";
  }
  if (day.is_open_24_7) {
    return "Open 24/7";
  }
  if (day.open_time && day.close_time) {
    return `${formatTimeTo12Hour(day.open_time)} - ${formatTimeTo12Hour(day.close_time)}`;
  }
  return "Hours not set";
}

/**
 * Compare two DayHours to see if they have the same hours
 */
function hasSameHours(day1: DayHours, day2: DayHours): boolean {
  return (
    day1.is_open === day2.is_open &&
    day1.is_open_24_7 === day2.is_open_24_7 &&
    day1.open_time === day2.open_time &&
    day1.close_time === day2.close_time
  );
}

/**
 * Format day range label (e.g., "Mon - Fri" or just "Monday")
 */
function formatDayRange(startDay: number, endDay: number): string {
  const startName = DAYS_OF_WEEK[startDay].substring(0, 3);
  if (startDay === endDay) {
    return DAYS_OF_WEEK[startDay];
  }
  const endName = DAYS_OF_WEEK[endDay].substring(0, 3);
  return `${startName} - ${endName}`;
}

/**
 * Generate condensed table rows (group consecutive days with same hours)
 */
function generateCondensedRows(hours: DayHours[]): string {
  let tableRows = "";
  let i = 0;

  while (i < hours.length) {
    const startDay = hours[i];
    const hoursText = formatHoursDisplay(startDay);
    let endDay = i;

    // Find consecutive days with the same hours
    while (endDay + 1 < hours.length && hasSameHours(startDay, hours[endDay + 1])) {
      endDay++;
    }

    const dayRange = formatDayRange(i, endDay);
    tableRows += `
      <tr>
        <td>${dayRange}</td>
        <td>${hoursText}</td>
      </tr>
    `;

    i = endDay + 1;
  }

  return tableRows;
}

/**
 * Generate HTML for the widget
 */
function generateWidgetHTML(
  hours: DayHours[],
  css: string,
  businessName?: string,
  showSeparators: boolean = true,
  style: "expanded" | "condensed" = "expanded"
): string {
  const separatorCSS = showSeparators ? `
    .hour-genie-widget tr {
      border-bottom: 1px solid #e5e5e5;
    }
    .hour-genie-widget tr:last-child {
      border-bottom: none;
    }
  ` : ``;

  const defaultCSS = `
    .hour-genie-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #333;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
    }
    .hour-genie-widget h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 600;
    }
    .hour-genie-widget table {
      width: 100%;
      border-collapse: collapse;
    }
    ${separatorCSS}
    .hour-genie-widget td {
      padding: 10px 0;
      font-size: 14px;
    }
    .hour-genie-widget td:first-child {
      font-weight: 500;
      width: 40%;
    }
    .hour-genie-widget td:last-child {
      color: #666;
    }
  `;

  const customCSS = css || "";
  const combinedCSS = defaultCSS + "\n" + customCSS;

  let tableRows = "";
  if (style === "condensed") {
    tableRows = generateCondensedRows(hours);
  } else {
    // Expanded style - show all days
    for (const day of hours) {
      const dayName = DAYS_OF_WEEK[day.day_of_week];
      const hoursText = formatHoursDisplay(day);
      tableRows += `
      <tr>
        <td>${dayName}</td>
        <td>${hoursText}</td>
      </tr>
    `;
    }
  }

  const title = businessName ? `<h3>${businessName} Hours</h3>` : "<h3>Business Hours</h3>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Hours</title>
  <style>
    ${combinedCSS}
  </style>
</head>
<body>
  <div class="hour-genie-widget">
    <table>
      ${tableRows}
    </table>
  </div>
</body>
</html>`;
}

/**
 * Handle GET request - Public embed widget endpoint
 */
export async function handleGet(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get("id");

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: "Business ID is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const supabase = createSupabaseClient(env);

    // Fetch business
    const { data: business, error: businessError } = await supabase
      .from("business")
      .select("id, name, default_hours")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get default hours
    const defaultHours: DayHours[] = business.default_hours || [];

    // Fetch active overrides for current week
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const startDateStr = formatDate(weekStart);
    const endDateStr = formatDate(weekEnd);

    const { data: overrides, error: overridesError } = await supabase
      .from("hours_overrides")
      .select("*")
      .eq("business_id", businessId)
      .gte("end_date", startDateStr)
      .lte("start_date", endDateStr)
      .order("created_at", { ascending: false });

    if (overridesError) {
      console.error("Error fetching overrides:", overridesError);
    }

    // Get current week hours with overrides applied
    const currentWeekHours = getCurrentWeekHours(defaultHours, overrides || []);

    // Fetch integration config for CSS customizations and settings
    let customCSS = "";
    let showSeparators = true; // Default to true
    let style: "expanded" | "condensed" = "expanded"; // Default to expanded
    const { data: integration } = await supabase
      .from("integrations")
      .select("config")
      .eq("business_id", businessId)
      .eq("integration_type", "iframe")
      .single();

    if (integration?.config) {
      if (integration.config.css) {
        customCSS = integration.config.css;
      }
      if (integration.config.showSeparators !== undefined) {
        showSeparators = integration.config.showSeparators;
      }
      if (integration.config.style) {
        style = integration.config.style;
      }
    }

    // Generate HTML
    const html = generateWidgetHTML(currentWeekHours, customCSS, business.name, showSeparators, style);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Error in embed handler:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

