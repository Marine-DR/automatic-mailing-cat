import { ADOPTION_FIELDS } from "../config/fields";
import { buildSourceIndex, getConsolidatedHeaders } from "./schema";
import { normalizeCellValue } from "./normalize";
import type { ConsolidatedSheetData, SourceSheetSnapshot, ValidatedRow } from "./types";
import { validateRow } from "./validation";

function summarizeErrors(messages: string[]): string {
  return messages.join(" | ");
}

export function buildRawValues(
  sourceIndex: Record<string, number>,
  row: string[]
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of ADOPTION_FIELDS) {
    const index = sourceIndex[field.key];
    values[field.key] = index === undefined ? "" : normalizeCellValue(row[index] ?? "");
  }

  return values;
}

export function buildConsolidatedSheet(snapshot: SourceSheetSnapshot): ConsolidatedSheetData {
  const sourceIndex = buildSourceIndex(snapshot.headers);
  const validatedRows = snapshot.rows.map((row) => validateRow(buildRawValues(sourceIndex, row)));

  return buildConsolidatedSheetFromValidatedRows(validatedRows);
}

export function buildConsolidatedRow(validatedRow: ValidatedRow): Array<string | boolean> {
  const errorSummary = summarizeErrors(validatedRow.errors.map((error) => error.message));

  return [
    ...ADOPTION_FIELDS.map((field) => validatedRow.values[field.key] ?? ""),
    validatedRow.mailEligible,
    errorSummary,
    validatedRow.isValid
  ];
}

export function buildInvalidColumnIndexes(validatedRow: ValidatedRow): number[] {
  const invalidColumns = new Set<number>();

  for (const error of validatedRow.errors) {
    const fieldIndex = ADOPTION_FIELDS.findIndex((field) => field.key === error.fieldKey);
    if (fieldIndex >= 0) {
      invalidColumns.add(fieldIndex);
    }
  }

  return [...invalidColumns];
}

export function buildConsolidatedSheetFromValidatedRows(
  validatedRows: ValidatedRow[]
): ConsolidatedSheetData {

  const headers = getConsolidatedHeaders();
  const rows = validatedRows.map((validatedRow) => buildConsolidatedRow(validatedRow));
  const invalidCellMap = validatedRows.map((validatedRow) => buildInvalidColumnIndexes(validatedRow));

  return {
    headers,
    rows,
    invalidCellMap,
    validatedRows
  };
}
