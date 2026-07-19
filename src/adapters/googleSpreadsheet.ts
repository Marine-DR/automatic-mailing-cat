import { ADOPTION_FIELDS, MENU_NAME, SYSTEM_COLUMNS, VALIDATED_SHEET_NAME, type FieldSchema } from "../config/fields";
import { buildConsolidatedRow, buildInvalidColumnIndexes } from "../domain/consolidate";
import type { ConsolidatedSheetData, SourceSheetSnapshot, ValidatedRow } from "../domain/types";
import { normalizeHeader } from "../domain/normalize";
import { validateRow } from "../domain/validation";

const VALIDATION_ERROR_BACKGROUND = "#f4c7c3";
const VALIDATION_OK_BACKGROUND = "#ffffff";
const EMAIL_LIST_REGEX =
  "^ *[^ @,;]+@[^ @,;]+\\.[^ @,;]+( *[,;] *[^ @,;]+@[^ @,;]+\\.[^ @,;]+)* *$";
const IDENTIFICATION_NUMBER_DIGITS = "123456789101112".length;
const MIN_IDENTIFICATION_NUMBER = 10 ** (IDENTIFICATION_NUMBER_DIGITS - 1);
const MAX_IDENTIFICATION_NUMBER = 10 ** IDENTIFICATION_NUMBER_DIGITS - 1;

function columnToLetter(columnNumber: number): string {
  let column = columnNumber;
  let letter = "";

  while (column > 0) {
    const remainder = (column - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    column = Math.floor((column - 1) / 26);
  }

  return letter;
}

function joinFormulaArgs(...args: string[]): string {
  return args.join(";");
}

function getRelativeCell(columnLetter: string, rowNumber: number): string {
  return `${columnLetter}${rowNumber}`;
}

function buildTextFormula(columnLetter: string, rowNumber: number, required: boolean): string {
  const cell = getRelativeCell(columnLetter, rowNumber);
  return required
    ? `=AND(${joinFormulaArgs(`${cell}<>""`, `ISTEXT(${cell})`)})`
    : `=OR(${joinFormulaArgs(`${cell}=""`, `ISTEXT(${cell})`)})`;
}

function buildDateFormula(columnLetter: string, rowNumber: number, required: boolean): string {
  const cell = getRelativeCell(columnLetter, rowNumber);
  return required
    ? `=AND(${joinFormulaArgs(`${cell}<>""`, `ISNUMBER(${cell})`)})`
    : `=OR(${joinFormulaArgs(`${cell}=""`, `ISNUMBER(${cell})`)})`;
}

function buildValidationRule(
  field: FieldSchema,
  columnNumber: number,
  firstDataRow: number
): GoogleAppsScript.Spreadsheet.DataValidation {
  const builder = SpreadsheetApp.newDataValidation().setAllowInvalid(false);
  const columnLetter = columnToLetter(columnNumber);

  switch (field.kind) {
    case "email":
      {
        const cell = getRelativeCell(columnLetter, firstDataRow);
        const regexMatch = `REGEXMATCH(${joinFormulaArgs(cell, `"${EMAIL_LIST_REGEX}"`)})`;
        builder.requireFormulaSatisfied(
          field.required
            ? `=${regexMatch}`
            : `=OR(${joinFormulaArgs(`${cell}=""`, regexMatch)})`
        );
        break;
      }
    case "phone":
      {
        const cell = getRelativeCell(columnLetter, firstDataRow);
        const regexMatch = `REGEXMATCH(${joinFormulaArgs(cell, '"^[0-9 +().-]{8,}$"')})`;
        builder.requireFormulaSatisfied(
          field.required
            ? `=${regexMatch}`
            : `=OR(${joinFormulaArgs(`${cell}=""`, regexMatch)})`
        );
        break;
      }
    case "year":
      {
        const cell = getRelativeCell(columnLetter, firstDataRow);
        const regexMatch = `REGEXMATCH(${joinFormulaArgs(cell, '"^[0-9]{4}$"')})`;
        builder.requireFormulaSatisfied(
          field.required
            ? `=${regexMatch}`
            : `=OR(${joinFormulaArgs(`${cell}=""`, regexMatch)})`
        );
        break;
      }
    case "digits15":
      builder.requireNumberBetween(MIN_IDENTIFICATION_NUMBER, MAX_IDENTIFICATION_NUMBER);
      break;
    case "enum":
      if (!field.allowedValues) {
        builder.requireFormulaSatisfied(
          buildTextFormula(columnLetter, firstDataRow, field.required)
        );
      } else {
        builder.requireValueInList(field.allowedValues, true);
      }
      break;
    case "date":
      builder.requireFormulaSatisfied(buildDateFormula(columnLetter, firstDataRow, field.required));
      break;
    case "text":
      builder.requireFormulaSatisfied(buildTextFormula(columnLetter, firstDataRow, field.required));
      break;
  }

  return builder.build();
}

function setHeaderRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, headers: string[]): void {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function buildBackgroundMatrix(data: ConsolidatedSheetData): string[][] {
  return data.rows.map((row, rowIndex) =>
    row.map((_, columnIndex) =>
      data.invalidCellMap[rowIndex]?.includes(columnIndex)
        ? VALIDATION_ERROR_BACKGROUND
        : VALIDATION_OK_BACKGROUND
    )
  );
}

function buildBackgroundRow(width: number, invalidIndexes: number[]): string[] {
  return Array.from({ length: width }, (_, columnIndex) =>
    invalidIndexes.includes(columnIndex) ? VALIDATION_ERROR_BACKGROUND : VALIDATION_OK_BACKGROUND
  );
}

function getValidationErrorsColumnIndex(): number {
  return ADOPTION_FIELDS.length + 1;
}

function buildValidationNoteRow(validatedRow: ValidatedRow, width: number): string[] {
  const notes = Array.from({ length: width }, () => "");
  const validationErrorsColumnIndex = getValidationErrorsColumnIndex();

  if (validatedRow.errors.length > 0) {
    notes[validationErrorsColumnIndex] = validatedRow.errors
      .map((error) => error.message)
      .join("\n");
  }

  for (const error of validatedRow.errors) {
    const fieldIndex = ADOPTION_FIELDS.findIndex((field) => field.key === error.fieldKey);
    if (fieldIndex < 0) {
      continue;
    }

    notes[fieldIndex] = notes[fieldIndex]
      ? `${notes[fieldIndex]}\n${error.message}`
      : error.message;
  }

  return notes;
}

function buildValidationNoteMatrix(data: ConsolidatedSheetData): string[][] {
  return data.validatedRows.map((validatedRow) =>
    buildValidationNoteRow(validatedRow, data.headers.length)
  );
}

function applyRowValidationBackgrounds(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  rowNumber: number,
  width: number,
  invalidIndexes: number[]
): void {
  sheet.getRange(rowNumber, 1, 1, width).setBackgrounds([buildBackgroundRow(width, invalidIndexes)]);
}

function applyRowValidationNotes(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  rowNumber: number,
  width: number,
  validatedRow: ValidatedRow
): void {
  sheet.getRange(rowNumber, 1, 1, width).setNotes([buildValidationNoteRow(validatedRow, width)]);
}

function getValidatedFieldStartColumn(): number {
  return 1;
}

function getSystemColumnNumber(key: string): number {
  const systemIndex = SYSTEM_COLUMNS.findIndex((column) => column.key === key);
  if (systemIndex < 0) {
    throw new Error(`Unknown system column: ${key}`);
  }

  return ADOPTION_FIELDS.length + systemIndex + 1;
}

function applyColumnValidations(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  rowCount: number
): void {
  const validationRows = Math.max(rowCount, 200);
  const firstDataRow = 2;

  const isValidColumn = sheet.getRange(
    firstDataRow,
    getSystemColumnNumber("isValid"),
    validationRows,
    1
  );
  isValidColumn.insertCheckboxes();

  const mailEligibleColumn = sheet.getRange(
    firstDataRow,
    getSystemColumnNumber("mailEligible"),
    validationRows,
    1
  );
  mailEligibleColumn.insertCheckboxes();

  ADOPTION_FIELDS.forEach((field, index) => {
    const columnNumber = getValidatedFieldStartColumn() + index;
    const range = sheet.getRange(firstDataRow, columnNumber, validationRows, 1);
    range.setDataValidation(buildValidationRule(field, columnNumber, firstDataRow));
  });
}

export class GoogleSpreadsheetPort {
  constructor(private readonly spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {}

  static createMenu(): void {
    SpreadsheetApp.getUi()
      .createMenu(MENU_NAME)
      .addItem("Refresh validated sheet", "refreshValidatedAdoptions")
      .addItem("Create sterilization reminder emails", "createSterilizationReminderEmails")
      .addItem("Send sterilization reminder emails", "sendSterilizationReminderEmails")
      .addItem("Revalidate selected rows", "revalidateSelectedValidatedRows")
      .addItem("Install edit trigger", "installValidatedSheetEditTrigger")
      .addToUi();
  }

  static isValidatedSheetName(name: string): boolean {
    return normalizeHeader(name) === normalizeHeader(VALIDATED_SHEET_NAME);
  }

  getActiveSourceSheet(): SourceSheetSnapshot {
    const sheet = this.spreadsheet.getActiveSheet();
    return this.readSheetSnapshot(sheet, "The active sheet is empty.");
  }

  getActiveSheetSnapshot(): SourceSheetSnapshot {
    return this.readSheetSnapshot(this.spreadsheet.getActiveSheet(), "The active sheet is empty.");
  }

  getSheetSnapshot(sheetName: string): SourceSheetSnapshot {
    const sheet = this.spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet does not exist: ${sheetName}`);
    }

    return this.readSheetSnapshot(sheet, `Sheet is empty: ${sheetName}`);
  }

  writeValidatedSheet(sheetName: string, data: ConsolidatedSheetData): void {
    const sheet =
      this.spreadsheet.getSheetByName(sheetName) ?? this.spreadsheet.insertSheet(sheetName);

    sheet.clearContents();
    sheet.clearFormats();
    sheet.getDataRange().clearDataValidations();

    setHeaderRow(sheet, data.headers);

    if (data.rows.length > 0) {
      const dataRange = sheet.getRange(2, 1, data.rows.length, data.headers.length);
      dataRange.setValues(data.rows);
      dataRange.setBackgrounds(buildBackgroundMatrix(data));
      dataRange.setNotes(buildValidationNoteMatrix(data));
    }

    applyColumnValidations(sheet, data.rows.length);
    sheet.autoResizeColumns(1, data.headers.length);
  }

  setSheetColumnValues(
    sheetName: string,
    columnNumber: number,
    updates: Array<{ rowNumber: number; value: string | boolean | number }>
  ): void {
    const sheet = this.spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet does not exist: ${sheetName}`);
    }

    for (const update of updates) {
      sheet.getRange(update.rowNumber, columnNumber).setValue(update.value);
    }

    SpreadsheetApp.flush();
  }

  shouldHandleValidatedSheetEdit(event: GoogleAppsScript.Events.SheetsOnEdit): boolean {
    const range = event.range;
    const sheet = range.getSheet();

    if (!GoogleSpreadsheetPort.isValidatedSheetName(sheet.getName())) {
      return false;
    }

    if (range.getLastRow() < 2) {
      return false;
    }

    return range.getColumn() <= ADOPTION_FIELDS.length && range.getLastColumn() >= 1;
  }

  revalidateValidatedSheetRow(rowNumber: number): ValidatedRow {
    SpreadsheetApp.flush();

    const sheet = this.getValidatedSheet();
    const values = this.readValidatedRowValues(sheet, rowNumber);
    const validatedRow = validateRow(values);

    const consolidatedRow = buildConsolidatedRow(validatedRow);
    const invalidIndexes = buildInvalidColumnIndexes(validatedRow);
    const width = SYSTEM_COLUMNS.length + ADOPTION_FIELDS.length;
    const rowRange = sheet.getRange(rowNumber, 1, 1, width);

    rowRange.setValues([consolidatedRow]);
    applyRowValidationBackgrounds(sheet, rowNumber, width, invalidIndexes);
    applyRowValidationNotes(sheet, rowNumber, width, validatedRow);
    SpreadsheetApp.flush();

    return validatedRow;
  }

  private getValidatedSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet = this.spreadsheet.getSheetByName(VALIDATED_SHEET_NAME);
    if (!sheet) {
      throw new Error("Validated sheet does not exist yet. Run Refresh validated sheet first.");
    }

    return sheet;
  }

  private readSheetSnapshot(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    emptyMessage: string
  ): SourceSheetSnapshot {
    const values = sheet.getDataRange().getDisplayValues();
    if (values.length === 0) {
      throw new Error(emptyMessage);
    }

    const [headers, ...rows] = values;
    return {
      name: sheet.getName(),
      headers,
      rows: rows.filter((row) => row.some((value) => value.trim() !== ""))
    };
  }

  private readValidatedRowValues(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    rowNumber: number
  ): Record<string, string> {
    const startColumn = getValidatedFieldStartColumn();
    const rowValues = sheet
      .getRange(rowNumber, startColumn, 1, ADOPTION_FIELDS.length)
      .getDisplayValues()[0];

    const values: Record<string, string> = {};
    ADOPTION_FIELDS.forEach((field, index) => {
      values[field.key] = rowValues[index] ?? "";
    });

    return values;
  }
}
