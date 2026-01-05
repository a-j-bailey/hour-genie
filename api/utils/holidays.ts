/**
 * Holiday detection utilities for US federal holidays
 */

export interface Holiday {
  name: string;
  date: Date;
  dateString: string; // YYYY-MM-DD format
}

/**
 * Get all US federal holidays for a given year
 */
export function getUSFederalHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // New Year's Day - January 1
  holidays.push({
    name: "New Year's Day",
    date: new Date(year, 0, 1),
    dateString: `${year}-01-01`,
  });

  // Martin Luther King Jr. Day - Third Monday of January
  holidays.push({
    name: "Martin Luther King Jr. Day",
    date: getNthWeekdayOfMonth(year, 0, 1, 3), // January, Monday, 3rd occurrence
    dateString: formatDate(getNthWeekdayOfMonth(year, 0, 1, 3)),
  });

  // Presidents' Day - Third Monday of February
  holidays.push({
    name: "Presidents' Day",
    date: getNthWeekdayOfMonth(year, 1, 1, 3), // February, Monday, 3rd occurrence
    dateString: formatDate(getNthWeekdayOfMonth(year, 1, 1, 3)),
  });

  // Memorial Day - Last Monday of May
  holidays.push({
    name: "Memorial Day",
    date: getLastWeekdayOfMonth(year, 4, 1), // May, Monday
    dateString: formatDate(getLastWeekdayOfMonth(year, 4, 1)),
  });

  // Independence Day - July 4
  holidays.push({
    name: "Independence Day",
    date: new Date(year, 6, 4),
    dateString: `${year}-07-04`,
  });

  // Labor Day - First Monday of September
  holidays.push({
    name: "Labor Day",
    date: getNthWeekdayOfMonth(year, 8, 1, 1), // September, Monday, 1st occurrence
    dateString: formatDate(getNthWeekdayOfMonth(year, 8, 1, 1)),
  });

  // Columbus Day - Second Monday of October
  holidays.push({
    name: "Columbus Day",
    date: getNthWeekdayOfMonth(year, 9, 1, 2), // October, Monday, 2nd occurrence
    dateString: formatDate(getNthWeekdayOfMonth(year, 9, 1, 2)),
  });

  // Veterans Day - November 11
  holidays.push({
    name: "Veterans Day",
    date: new Date(year, 10, 11),
    dateString: `${year}-11-11`,
  });

  // Thanksgiving - Fourth Thursday of November
  holidays.push({
    name: "Thanksgiving",
    date: getNthWeekdayOfMonth(year, 10, 4, 4), // November, Thursday, 4th occurrence
    dateString: formatDate(getNthWeekdayOfMonth(year, 10, 4, 4)),
  });

  // Christmas - December 25
  holidays.push({
    name: "Christmas",
    date: new Date(year, 11, 25),
    dateString: `${year}-12-25`,
  });

  return holidays;
}

/**
 * Get the nth occurrence of a weekday in a month
 * @param year - Year
 * @param month - Month (0-11, where 0 = January)
 * @param weekday - Weekday (0-6, where 0 = Sunday, 1 = Monday, etc.)
 * @param n - Which occurrence (1 = first, 2 = second, etc.)
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  
  // Calculate days to add to get to the first occurrence of the target weekday
  let daysToAdd = (weekday - firstWeekday + 7) % 7;
  
  // If we want the nth occurrence, add (n-1) weeks
  daysToAdd += (n - 1) * 7;
  
  return new Date(year, month, 1 + daysToAdd);
}

/**
 * Get the last occurrence of a weekday in a month
 * @param year - Year
 * @param month - Month (0-11, where 0 = January)
 * @param weekday - Weekday (0-6, where 0 = Sunday, 1 = Monday, etc.)
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  // Get the last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const lastWeekday = lastDay.getDay();
  
  // Calculate days to subtract to get to the target weekday
  let daysToSubtract = (lastWeekday - weekday + 7) % 7;
  
  return new Date(year, month, lastDay.getDate() - daysToSubtract);
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a holiday is X days away from today
 * @param holiday - Holiday to check
 * @param daysAway - Number of days away (default: 14)
 * @returns true if the holiday is exactly X days away
 */
export function isHolidayDaysAway(holiday: Holiday, daysAway: number = 14): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const holidayDate = new Date(holiday.date);
  holidayDate.setHours(0, 0, 0, 0);
  
  const diffTime = holidayDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === daysAway;
}

/**
 * Get holidays that are X days away from today
 * @param daysAway - Number of days away (default: 14)
 * @returns Array of holidays that are X days away
 */
export function getHolidaysDaysAway(daysAway: number = 14): Holiday[] {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  // Get holidays for current year and next year (in case we're near year end)
  const allHolidays = [
    ...getUSFederalHolidays(currentYear),
    ...getUSFederalHolidays(nextYear),
  ];
  
  return allHolidays.filter((holiday) => isHolidayDaysAway(holiday, daysAway));
}

