import { normalizeCellValue } from "./normalize";

export function parseFlexibleDate(value: string): Date | null {
  const trimmed = normalizeCellValue(value);
  if (!trimmed) {
    return null;
  }

  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = trimmed.match(ddmmyyyy);

  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = Number(match[3]);
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : first;
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day
    ) {
      return candidate;
    }
  }

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfTargetMonth)));
}

export function isAtLeastMonthsOld(value: string, months: number, today: Date): boolean {
  const date = parseFlexibleDate(value);
  if (!date) {
    return false;
  }

  return addMonthsClamped(date, months).getTime() <= startOfUtcDay(today).getTime();
}
