import { ADOPTION_FIELDS } from "../config/fields";
import type { MailDraft, MailPort } from "../adapters/mail";
import { filterRowsToSheet, type FilterRowsToSheetPort, type FilterRowsToSheetResult } from "./filterRowsToSheet";
import { normalizeHeader } from "../domain/normalize";
import { rowCriteria } from "../domain/rowCriteria";
import type { SourceSheetSnapshot } from "../domain/types";

export const STERILIZATION_REMINDER_SHEET_NAME = "Emails rappels ste";
export const EMAIL_SENT_COLUMN_LABEL = "Email sent";
export const STERILIZATION_REMINDER_SUBJECT = "Rappel sterilisation";
export const STERILIZATION_REMINDER_TEMPLATE = [
  "{{ M_Me }} {{ Prénom }} {{ Nom }},",
  "",
  "Nous vous rappelons que {{ Nom chat }} a plus de 5 mois, il est temps de prévoir sa stérilisation.",
  "",
  "Cordialement,",
  "",
  "Cha'Mania"
].join("\n");

export interface SterilizationReminderSheetPort extends FilterRowsToSheetPort {
  getActiveSheetSnapshot(): SourceSheetSnapshot;
  getSheetSnapshot(sheetName: string): SourceSheetSnapshot;
  setSheetColumnValues(sheetName: string, columnNumber: number, updates: SheetColumnUpdate[]): void;
}

export interface SheetColumnUpdate {
  rowNumber: number;
  value: string | boolean | number;
}

export interface SendSterilizationReminderEmailsResult {
  sheetName: string;
  totalRows: number;
  skippedRows: number;
  sentRows: number;
}

export function createSterilizationReminderEmailSheet(
  spreadsheet: FilterRowsToSheetPort,
  today = new Date()
): FilterRowsToSheetResult {
  return filterRowsToSheet(spreadsheet, {
    outputSheetName: STERILIZATION_REMINDER_SHEET_NAME,
    criteria: rowCriteria.and(
      rowCriteria.valid(),
      rowCriteria.fieldIsAtLeastMonthsOld("birthDate", 5, today),
      rowCriteria.or(
        rowCriteria.fieldEquals("sterilized", "NON"),
        rowCriteria.fieldEquals("sterilized", "N/A")
      ),
      rowCriteria.fieldIsBlank("lifeStatus")
    ),
    extraColumns: [{ header: EMAIL_SENT_COLUMN_LABEL, value: false }]
  });
}

export function sendSterilizationReminderEmailsFromSheet(
  spreadsheet: SterilizationReminderSheetPort,
  mailer: MailPort
): SendSterilizationReminderEmailsResult {
  const snapshot = spreadsheet.getActiveSheetSnapshot();
  if (normalizeHeader(snapshot.name) !== normalizeHeader(STERILIZATION_REMINDER_SHEET_NAME)) {
    throw new Error(`Select the ${STERILIZATION_REMINDER_SHEET_NAME} sheet before sending emails.`);
  }

  const emailSentColumnIndex = findLastHeaderIndex(snapshot.headers, EMAIL_SENT_COLUMN_LABEL);
  const recipientColumnIndex = findFieldHeaderIndex(snapshot.headers, "recipientEmail");
  const sentUpdates: SheetColumnUpdate[] = [];
  let skippedRows = 0;

  snapshot.rows.forEach((row, rowIndex) => {
    if (isTruthyCell(row[emailSentColumnIndex])) {
      skippedRows += 1;
      return;
    }

    const recipient = row[recipientColumnIndex]?.trim() ?? "";
    if (!recipient) {
      skippedRows += 1;
      return;
    }

    mailer.send(buildSterilizationReminderDraft(snapshot.headers, row, recipient));
    sentUpdates.push({
      rowNumber: rowIndex + 2,
      value: true
    });
  });

  if (sentUpdates.length > 0) {
    spreadsheet.setSheetColumnValues(
      snapshot.name,
      emailSentColumnIndex + 1,
      sentUpdates
    );
  }

  return {
    sheetName: snapshot.name,
    totalRows: snapshot.rows.length,
    skippedRows,
    sentRows: sentUpdates.length
  };
}

function buildSterilizationReminderDraft(
  headers: string[],
  row: string[],
  recipient: string
): MailDraft {
  return {
    to: recipient,
    subject: STERILIZATION_REMINDER_SUBJECT,
    body: renderTemplate(STERILIZATION_REMINDER_TEMPLATE, headers, row)
  };
}

function renderTemplate(template: string, headers: string[], row: string[]): string {
  const values = buildTemplateValues(headers, row);

  return template.replace(/{{\s*([^}]+?)\s*}}/g, (_match, rawPlaceholder: string) => {
    const placeholder = normalizeHeader(rawPlaceholder);
    return values.get(placeholder) ?? "";
  });
}

function buildTemplateValues(headers: string[], row: string[]): Map<string, string> {
  const values = new Map<string, string>();

  headers.forEach((header, index) => {
    values.set(normalizeHeader(header), row[index] ?? "");
  });

  for (const field of ADOPTION_FIELDS) {
    const index = findAnyHeaderIndex(headers, [field.label, field.sourceLabel, ...field.sourceAliases]);
    if (index < 0) {
      continue;
    }

    for (const alias of [field.label, field.sourceLabel, ...field.sourceAliases]) {
      values.set(normalizeHeader(alias), row[index] ?? "");
    }
  }

  return values;
}

function findFieldHeaderIndex(headers: string[], fieldKey: string): number {
  const field = ADOPTION_FIELDS.find((candidate) => candidate.key === fieldKey);
  if (!field) {
    throw new Error(`Unknown email field: ${fieldKey}`);
  }

  const index = findAnyHeaderIndex(headers, [field.label, field.sourceLabel, ...field.sourceAliases]);
  if (index < 0) {
    throw new Error(`Missing required email column: ${field.label}`);
  }

  return index;
}

function findAnyHeaderIndex(headers: string[], candidates: string[]): number {
  const normalizedCandidates = new Set(candidates.map(normalizeHeader));
  return headers.findIndex((header) => normalizedCandidates.has(normalizeHeader(header)));
}

function findLastHeaderIndex(headers: string[], headerLabel: string): number {
  const normalizedLabel = normalizeHeader(headerLabel);

  for (let index = headers.length - 1; index >= 0; index -= 1) {
    if (normalizeHeader(headers[index]) === normalizedLabel) {
      return index;
    }
  }

  throw new Error(`Missing required email column: ${headerLabel}`);
}

function isTruthyCell(value: string | undefined): boolean {
  return ["true", "yes", "oui", "1"].includes(normalizeHeader(value ?? ""));
}
