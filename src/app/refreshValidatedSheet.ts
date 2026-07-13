import { VALIDATED_SHEET_NAME } from "../config/fields";
import { buildConsolidatedSheet } from "../domain/consolidate";
import type { ConsolidatedSheetData, RefreshResult, SourceSheetSnapshot } from "../domain/types";

export interface SpreadsheetPort {
  getActiveSourceSheet(): SourceSheetSnapshot;
  writeValidatedSheet(sheetName: string, data: ConsolidatedSheetData): void;
}

export function refreshValidatedSheet(
  spreadsheet: SpreadsheetPort,
  sheetName = VALIDATED_SHEET_NAME
): RefreshResult {
  const sourceSheet = spreadsheet.getActiveSourceSheet();
  const consolidatedSheet = buildConsolidatedSheet(sourceSheet);

  spreadsheet.writeValidatedSheet(sheetName, consolidatedSheet);

  const validRows = consolidatedSheet.validatedRows.filter((row) => row.isValid).length;

  return {
    sourceSheetName: sourceSheet.name,
    outputSheetName: sheetName,
    totalRows: consolidatedSheet.validatedRows.length,
    validRows,
    invalidRows: consolidatedSheet.validatedRows.length - validRows
  };
}
