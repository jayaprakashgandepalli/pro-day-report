/**
 * Date Interpretation & Follow-up Scheduling Utilities for Asia/Kolkata (UTC+05:30)
 */

export const SUPPORTED_FOLLOW_UP_TYPES = [
  'Date',
  'Callback',
  'College Visit',
  'Student Visit',
  'After Exams',
  'After Results',
  'General Follow-up',
] as const;

export type SupportedFollowUpType = typeof SUPPORTED_FOLLOW_UP_TYPES[number];

export interface InterpretedDateResult {
  success: boolean;
  date?: Date;
  isoString?: string;
  humanFormattedKolkata?: string;
  error?: string;
}

const KOLKATA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Returns current timestamp adjusted to Asia/Kolkata date boundary.
 */
export function getNowInKolkata(): Date {
  const utcNow = new Date();
  return new Date(utcNow.getTime() + KOLKATA_OFFSET_MS);
}

/**
 * Interprets a natural language date or standard date string in Asia/Kolkata timezone.
 * Supports "tomorrow", "day after tomorrow", "next monday", "after 3 days", "రేపు", etc.
 */
export function interpretNaturalFollowUpDate(
  input: string | Date | null | undefined,
  baseDate: Date = new Date()
): InterpretedDateResult {
  if (!input) {
    return { success: false, error: 'NO_DATE_PROVIDED' };
  }

  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      return { success: false, error: 'INVALID_DATE_OBJECT' };
    }
    return formatInterpretedResult(input);
  }

  const raw = input.trim().toLowerCase();

  // 1. Direct ISO / Standard Date parsing
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return formatInterpretedResult(parsed);
    }
  }

  // 2. Relative Day Interpretations
  const kolkataNow = new Date(baseDate.getTime() + KOLKATA_OFFSET_MS);
  const targetKolkata = new Date(kolkataNow);

  if (raw === 'today' || raw === 'ఈరోజు') {
    // Keep today's date
  } else if (raw === 'tomorrow' || raw === 'రేపు') {
    targetKolkata.setUTCDate(targetKolkata.getUTCDate() + 1);
  } else if (raw === 'day after tomorrow' || raw === 'ఎల్లుండి') {
    targetKolkata.setUTCDate(targetKolkata.getUTCDate() + 2);
  } else if (raw === 'after 2 days' || raw === '2 days later' || raw === '2 రోజులు తర్వాత') {
    targetKolkata.setUTCDate(targetKolkata.getUTCDate() + 2);
  } else if (raw === 'after 3 days' || raw === '3 days later' || raw === '3 రోజులు తర్వాత') {
    targetKolkata.setUTCDate(targetKolkata.getUTCDate() + 3);
  } else if (raw === 'next week' || raw === 'after a week' || raw === 'వచ్చే వారం') {
    targetKolkata.setUTCDate(targetKolkata.getUTCDate() + 7);
  } else if (raw.startsWith('next ') || raw.includes('వారం')) {
    // Weekday match (e.g. "next monday", "next friday")
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const matchedDay = days.findIndex((d) => raw.includes(d));

    if (matchedDay !== -1) {
      const currentDay = targetKolkata.getUTCDay();
      let diff = matchedDay - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      targetKolkata.setUTCDate(targetKolkata.getUTCDate() + diff);
    } else {
      return {
        success: false,
        error: 'AMBIGUOUS_DATE',
      };
    }
  } else {
    // Attempt standard JS Date parse as fallback
    const fallbackParsed = new Date(input);
    if (!isNaN(fallbackParsed.getTime())) {
      return formatInterpretedResult(fallbackParsed);
    }
    return {
      success: false,
      error: 'UNRECOGNIZED_DATE_FORMAT',
    };
  }

  // Set standard morning follow-up call time in Asia/Kolkata: 10:00 AM IST (04:30 AM UTC)
  targetKolkata.setUTCHours(10, 0, 0, 0);

  // Convert back to UTC standard Date
  const finalUtcDate = new Date(targetKolkata.getTime() - KOLKATA_OFFSET_MS);

  return formatInterpretedResult(finalUtcDate);
}

function formatInterpretedResult(date: Date): InterpretedDateResult {
  const now = new Date();
  // Buffer past check by 5 minutes to prevent instant clock-skew rejects
  if (date.getTime() < now.getTime() - 5 * 60 * 1000) {
    return {
      success: false,
      error: 'PAST_DATE_NOT_ALLOWED',
    };
  }

  // Cap at 1 year ahead
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  if (date.getTime() > oneYearFromNow.getTime()) {
    return {
      success: false,
      error: 'DATE_TOO_FAR_IN_FUTURE',
    };
  }

  // Format in Asia/Kolkata human readable string
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    success: true,
    date,
    isoString: date.toISOString(),
    humanFormattedKolkata: formatter.format(date),
  };
}

/**
 * Validates whether a submitted followUpType is supported by the PRO system.
 */
export function isValidFollowUpType(type: string | null | undefined): boolean {
  if (!type) return false;
  return (SUPPORTED_FOLLOW_UP_TYPES as readonly string[]).includes(type.trim());
}

