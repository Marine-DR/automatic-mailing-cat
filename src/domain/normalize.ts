export function normalizeHeader(value: string): string {
  return stripDiacritics(value)
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeCellValue(value: string): string {
  return value.replace(/\r?\n/g, " ").trim();
}

export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
