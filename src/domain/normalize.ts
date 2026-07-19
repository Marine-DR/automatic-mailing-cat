export function normalizeHeader(value: unknown): string {
  return stripDiacritics(value)
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeCellValue(value: unknown): string {
  return String(value ?? "").replace(/\r?\n/g, " ").trim();
}

export function stripDiacritics(value: unknown): string {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
