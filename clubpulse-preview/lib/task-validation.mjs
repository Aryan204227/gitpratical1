/**
 * Strict calendar-date validation for ISO date form fields.
 * It intentionally rejects normalized overflow dates such as 2026-02-31.
 */
export function isValidIsoDate(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

/**
 * Accept a positive, safe integer ID or a digit-only form value.
 * Returning null keeps malformed values out of database queries.
 */
export function parsePositiveId(value) {
  let parsed;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    parsed = Number(value.trim());
  } else {
    return null;
  }
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
