import { buildConsolidatedSheetFromValidatedRows, buildRawValues } from "../domain/consolidate";
import { buildSourceIndex } from "../domain/schema";
import type { ConsolidatedSheetData, SourceSheetSnapshot } from "../domain/types";
import { validateRow } from "../domain/validation";
import type { RowCriteria, RowCriteriaContext } from "../domain/rowCriteria";

export interface FilterRowsToSheetPort {
  getActiveSourceSheet(): SourceSheetSnapshot;
  writeValidatedSheet(sheetName: string, data: ConsolidatedSheetData): void;
}

export interface FilterRowsToSheetOptions {
  outputSheetName: string;
  criteria: RowCriteria;
}

export interface FilterRowsToSheetResult {
  sourceSheetName: string;
  outputSheetName: string;
  totalRows: number;
  matchedRows: number;
  validRows: number;
  invalidRows: number;
}

export function filterRowsToSheet(
  spreadsheet: FilterRowsToSheetPort,
  options: FilterRowsToSheetOptions
): FilterRowsToSheetResult {
  const sourceSheet = spreadsheet.getActiveSourceSheet();
  const sourceIndex = buildSourceIndex(sourceSheet.headers);
  const validatedRows = sourceSheet.rows
    .map((row, sourceRowIndex) => {
      const context: RowCriteriaContext = {
        sourceRowIndex,
        sourceRowNumber: sourceRowIndex + 2
      };

      return {
        context,
        validatedRow: validateRow(buildRawValues(sourceIndex, row))
      };
    })
    .filter(({ context, validatedRow }) => options.criteria(validatedRow, context))
    .map(({ validatedRow }) => validatedRow);

  const outputSheet = buildConsolidatedSheetFromValidatedRows(validatedRows);
  spreadsheet.writeValidatedSheet(options.outputSheetName, outputSheet);

  const validRows = validatedRows.filter((row) => row.isValid).length;

  return {
    sourceSheetName: sourceSheet.name,
    outputSheetName: options.outputSheetName,
    totalRows: sourceSheet.rows.length,
    matchedRows: validatedRows.length,
    validRows,
    invalidRows: validatedRows.length - validRows
  };
}
