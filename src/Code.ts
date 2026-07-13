import { GoogleSpreadsheetPort } from "./adapters/googleSpreadsheet";
import { MENU_NAME } from "./config/fields";
import { refreshValidatedSheet } from "./app/refreshValidatedSheet";

function getSpreadsheetPort(): GoogleSpreadsheetPort {
  return new GoogleSpreadsheetPort(SpreadsheetApp.getActiveSpreadsheet());
}

function revalidateValidatedRows(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  firstRow: number,
  lastRow: number
): { validRows: number; editedRows: number } {
  const spreadsheetPort = new GoogleSpreadsheetPort(spreadsheet);
  let validRows = 0;
  let editedRows = 0;

  for (let rowNumber = Math.max(firstRow, 2); rowNumber <= lastRow; rowNumber += 1) {
    const validatedRow = spreadsheetPort.revalidateValidatedSheetRow(rowNumber);
    editedRows += 1;
    if (validatedRow.isValid) {
      validRows += 1;
    }
  }

  return { validRows, editedRows };
}

function toastValidationResult(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  validRows: number,
  editedRows: number
): void {
  spreadsheet.toast(
    editedRows === 1
      ? validRows === 1
        ? "Row validated."
        : "Row validation updated."
      : `Validation updated: ${validRows}/${editedRows} edited rows valid.`,
    MENU_NAME,
    3
  );
}

function onOpen(): void {
  GoogleSpreadsheetPort.createMenu();
}

function refreshValidatedAdoptions(): void {
  const result = refreshValidatedSheet(getSpreadsheetPort());
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Validated sheet refreshed: ${result.validRows}/${result.totalRows} rows valid.`,
    MENU_NAME,
    8
  );
}

function installValidatedSheetEditTrigger(): void {
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === "onEdit") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger("onEdit")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast("Edit trigger installed.", MENU_NAME, 5);
}

function revalidateSelectedValidatedRows(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const range = spreadsheet.getActiveRange();
  if (!range) {
    return;
  }

  const sheet = range.getSheet();
  if (!GoogleSpreadsheetPort.isValidatedSheetName(sheet.getName())) {
    spreadsheet.toast("Select rows in the validated sheet first.", MENU_NAME, 5);
    return;
  }

  const result = revalidateValidatedRows(spreadsheet, range.getRow(), range.getLastRow());
  toastValidationResult(spreadsheet, result.validRows, result.editedRows);
}

function onEdit(event: GoogleAppsScript.Events.SheetsOnEdit): void {
  const spreadsheet = event.source;
  const spreadsheetPort = new GoogleSpreadsheetPort(spreadsheet);

  try {
    if (!spreadsheetPort.shouldHandleValidatedSheetEdit(event)) {
      return;
    }

    const result = revalidateValidatedRows(spreadsheet, event.range.getRow(), event.range.getLastRow());
    toastValidationResult(spreadsheet, result.validRows, result.editedRows);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    spreadsheet.toast(`Validation failed: ${message}`, MENU_NAME, 8);
    throw error;
  }
}

const appsScriptEntrypoints = globalThis as typeof globalThis & {
  onOpen: typeof onOpen;
  onEdit: typeof onEdit;
  installValidatedSheetEditTrigger: typeof installValidatedSheetEditTrigger;
  revalidateSelectedValidatedRows: typeof revalidateSelectedValidatedRows;
  refreshValidatedAdoptions: typeof refreshValidatedAdoptions;
};

appsScriptEntrypoints.onOpen = onOpen;
appsScriptEntrypoints.onEdit = onEdit;
appsScriptEntrypoints.installValidatedSheetEditTrigger = installValidatedSheetEditTrigger;
appsScriptEntrypoints.revalidateSelectedValidatedRows = revalidateSelectedValidatedRows;
appsScriptEntrypoints.refreshValidatedAdoptions = refreshValidatedAdoptions;
