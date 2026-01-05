/**
 * NLP parser for extracting hours information from natural language text
 * Handles email replies and converts them to structured hours data
 */

import { format, parse, isValid, addDays } from "date-fns";

export interface DayHours {
  day_of_week: number; // 0-6 (0 = Sunday)
  is_open: boolean;
  is_open_24_7: boolean;
  open_time: string | null; // "HH:MM" format
  close_time: string | null; // "HH:MM" format
}

interface ParsedHours {
  hours: DayHours[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  title?: string;
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
 * Parse time string to HH:MM format
 * Handles: "9am", "9:00am", "9:30am", "9 PM", "21:00", etc.
 */
function parseTime(timeStr: string): string | null {
  if (!timeStr) return null;

  // Remove whitespace and convert to lowercase
  const cleaned = timeStr.trim().toLowerCase();

  // Handle 24-hour format (e.g., "21:00", "09:30")
  const militaryMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = militaryMatch[2];
    if (hours >= 0 && hours < 24) {
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }
  }

  // Handle 12-hour format with am/pm
  const amPmMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2] || "00";
    const period = amPmMatch[3];

    if (period === "pm" && hours !== 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Handle just number (assume 24-hour if > 12, otherwise assume am)
  const numMatch = cleaned.match(/^(\d{1,2})$/);
  if (numMatch) {
    const hours = parseInt(numMatch[1], 10);
    if (hours >= 0 && hours < 24) {
      return `${String(hours).padStart(2, "0")}:00`;
    }
  }

  return null;
}

/**
 * Parse day name to day_of_week number (0 = Sunday)
 */
function parseDayName(dayName: string): number | null {
  const days: { [key: string]: number } = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  return days[dayName.toLowerCase()] ?? null;
}

/**
 * Extract date from text (relative or absolute)
 */
function extractDate(text: string, referenceDate: Date = new Date()): Date | null {
  // Try to parse common date formats
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{1,2})\/(\d{1,2})/, // MM/DD (assume current year)
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*(\d{4}))?/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*(\d{4}))?/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Try to parse the date
      try {
        const dateStr = match[0];
        const parsed = parse(dateStr, "P", referenceDate);
        if (isValid(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }

  // Handle relative dates
  const lowerText = text.toLowerCase();
  if (lowerText.includes("today")) return referenceDate;
  if (lowerText.includes("tomorrow")) return addDays(referenceDate, 1);

  return null;
}

/**
 * Parse hours from natural language text
 * Uses regex patterns and fallback to XAI if needed
 */
export async function parseHoursFromText(
  text: string,
  holidayDate?: string,
  holidayName?: string,
  useXAI: boolean = false,
  XAIApiKey?: string
): Promise<ParsedHours | null> {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const cleanedText = text.trim().toLowerCase();
  const hours = createDefaultHoursStructure();
  let startDate = holidayDate || format(new Date(), "yyyy-MM-dd");
  let endDate = holidayDate || format(new Date(), "yyyy-MM-dd");
  let title = holidayName || null;

  // Pattern 1: "We're closed on [holiday/date]"
  if (cleanedText.match(/(?:we're|we are|we'll be|closed|closing)\s+(?:on|for)?/)) {
    // Extract date if mentioned
    const dateMatch = extractDate(text);
    if (dateMatch) {
      startDate = format(dateMatch, "yyyy-MM-dd");
      endDate = format(dateMatch, "yyyy-MM-dd");
    }
    // All days closed
    return {
      hours,
      startDate,
      endDate,
      title: title || "Holiday Hours",
    };
  }

  // Pattern 2: "Open [time] to [time] on [date/day]"
  const openTimePattern = /(?:open|opens?)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|until)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:on|for)?\s*([^,\.]+)?/i;
  const openMatch = text.match(openTimePattern);
  if (openMatch) {
    const openTime = parseTime(openMatch[1]);
    const closeTime = parseTime(openMatch[2]);
    const dayOrDate = openMatch[3]?.trim();

    if (openTime && closeTime) {
      // Try to extract day or date
      let targetDay: number | null = null;
      let targetDate: Date | null = null;

      if (dayOrDate) {
        targetDay = parseDayName(dayOrDate);
        if (!targetDay) {
          targetDate = extractDate(dayOrDate);
        }
      }

      if (targetDay !== null) {
        // Apply to specific day of week
        hours[targetDay] = {
          day_of_week: targetDay,
          is_open: true,
          is_open_24_7: false,
          open_time: openTime,
          close_time: closeTime,
        };
      } else if (targetDate) {
        // Apply to specific date
        startDate = format(targetDate, "yyyy-MM-dd");
        endDate = format(targetDate, "yyyy-MM-dd");
        const dayOfWeek = targetDate.getDay();
        hours[dayOfWeek] = {
          day_of_week: dayOfWeek,
          is_open: true,
          is_open_24_7: false,
          open_time: openTime,
          close_time: closeTime,
        };
      } else {
        // Apply to all days (default)
        for (let i = 0; i < 7; i++) {
          hours[i] = {
            day_of_week: i,
            is_open: true,
            is_open_24_7: false,
            open_time: openTime,
            close_time: closeTime,
          };
        }
      }

      return {
        hours,
        startDate,
        endDate,
        title: title || "Updated Hours",
      };
    }
  }

  // Pattern 3: "[Day]: [time]-[time] or Closed"
  const dayTimePattern = /(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)[:\s]+(?:(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|until)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)|closed)/gi;
  let dayMatch;
  while ((dayMatch = dayTimePattern.exec(text)) !== null) {
    const dayName = dayMatch[1];
    const dayOfWeek = parseDayName(dayName);
    if (dayOfWeek !== null) {
      if (dayMatch[2] && dayMatch[3]) {
        const openTime = parseTime(dayMatch[2]);
        const closeTime = parseTime(dayMatch[3]);
        if (openTime && closeTime) {
          hours[dayOfWeek] = {
            day_of_week: dayOfWeek,
            is_open: true,
            is_open_24_7: false,
            open_time: openTime,
            close_time: closeTime,
          };
        }
      } else if (dayMatch[0].toLowerCase().includes("closed")) {
        hours[dayOfWeek] = {
          day_of_week: dayOfWeek,
          is_open: false,
          is_open_24_7: false,
          open_time: null,
          close_time: null,
        };
      }
    }
  }

  // Pattern 4: "Regular hours except closed [date/day]"
  if (cleanedText.match(/regular\s+hours?\s+except/)) {
    // This would require knowing the default hours, which we don't have here
    // For now, mark as needing more context
    // Could use OpenAI to parse this more intelligently
  }

  // If we found at least one day with hours set, return the result
  const hasHours = hours.some((day) => day.is_open || day.open_time !== null);
  if (hasHours) {
    return {
      hours,
      startDate,
      endDate,
      title: title || "Updated Hours",
    };
  }

  // Fallback to OpenAI if enabled and no patterns matched
  if (useXAI && XAIApiKey) {
    return await parseHoursWithXAI(text, XAIApiKey, holidayDate, holidayName);
  }

  return null;
}

/**
 * Parse hours using OpenAI API (fallback for complex cases)
 */
async function parseHoursWithXAI(
  text: string,
  XAIApiKey: string,
  holidayDate?: string,
  holidayName?: string
): Promise<ParsedHours | null> {
  try {
    const prompt = `Extract operating hours information from the following text and return it as JSON.

Text: "${text}"
${holidayDate ? `Holiday Date: ${holidayDate}` : ""}
${holidayName ? `Holiday Name: ${holidayName}` : ""}

Return a JSON object with this structure:
{
  "hours": [
    {"day_of_week": 0, "is_open": false, "is_open_24_7": false, "open_time": null, "close_time": null},
    ...
  ],
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "title": "string or null"
}

day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
open_time and close_time: "HH:MM" format or null
If closed, set is_open to false.`;

    const response = await fetch("https://api.x.ai/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAIApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts operating hours from text and returns structured JSON data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("X.AI API error:", await response.text());
      return null;
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    // Validate and return
    if (content.hours && Array.isArray(content.hours) && content.hours.length === 7) {
      return {
        hours: content.hours,
        startDate: content.startDate || holidayDate || format(new Date(), "yyyy-MM-dd"),
        endDate: content.endDate || holidayDate || format(new Date(), "yyyy-MM-dd"),
        title: content.title || holidayName || null,
      };
    }
  } catch (error) {
    console.error("Error parsing hours with X.AI:", error);
  }

  return null;
}

