import { buildConsolidatedSheetFromValidatedRows, buildRawValues } from "../domain/consolidate";
import { buildSourceIndex } from "../domain/schema";
import type { ConsolidatedSheetData, SourceSheetSnapshot, ValidatedRow } from "../domain/types";
import { validateRow } from "../domain/validation";
import type { RowCriteria, RowCriteriaContext } from "../domain/rowCriteria";

export interface FilterRowsToSheetPort {
  getActiveSourceSheet(): SourceSheetSnapshot;
  writeValidatedSheet(sheetName: string, data: ConsolidatedSheetData): void;
}

export interface FilterRowsToSheetOptions {
  outputSheetName: string;
  criteria: RowCriteria;
  extraColumns?: FilterRowsToSheetExtraColumn[];
}

export interface FilterRowsToSheetExtraColumn {
  header: string;
  value: string | boolean | number | ((row: ValidatedRow, context: RowCriteriaContext) => string | boolean | number);
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
  const matchedRows = sourceSheet.rows
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
    .filter(({ context, validatedRow }) => options.criteria(validatedRow, context));
  const validatedRows = matchedRows.map(({ validatedRow }) => validatedRow);

  const outputSheet = buildConsolidatedSheetFromValidatedRows(validatedRows);
  appendExtraColumns(outputSheet, matchedRows, options.extraColumns ?? []);
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

function appendExtraColumns(
  outputSheet: ConsolidatedSheetData,
  matchedRows: Array<{ context: RowCriteriaContext; validatedRow: ValidatedRow }>,
  extraColumns: FilterRowsToSheetExtraColumn[]
): void {
  if (extraColumns.length === 0) {
    return;
  }

  outputSheet.headers.push(...extraColumns.map((column) => column.header));
  outputSheet.rows = outputSheet.rows.map((row, rowIndex) => [
    ...row,
    ...extraColumns.map((column) =>
      typeof column.value === "function"
        ? column.value(matchedRows[rowIndex].validatedRow, matchedRows[rowIndex].context)
        : column.value
    )
  ]);
}
