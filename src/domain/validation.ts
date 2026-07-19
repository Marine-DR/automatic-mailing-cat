import { ADOPTION_FIELDS, type FieldKind, type FieldSchema } from "../config/fields";
import { parseFlexibleDate } from "./date";
import { normalizeCellValue, normalizeHeader } from "./normalize";
import type { ValidationError, ValidatedRow } from "./types";

const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const PHONE_PATTERN = /^(?:\+[0-9]{1,3}[ .-]?)?(?:\(?0?[0-9]\)?[ .-]?)(?:[0-9][ .-]?){7,12}$/;
const YEAR_PATTERN = /^\d{4}$/;
const IDENTIFICATION_NUMBER_PATTERN = /^\d{15}$/;

function canonicalizeEnumValue(field: FieldSchema, value: string): string {
  if (!field.allowedValues) {
    return value;
  }

  const normalizedValue = normalizeHeader(value);
  const canonical = field.allowedValues.find(
    (allowed) => normalizeHeader(allowed) === normalizedValue
  );

  return canonical ?? value;
}

function isValidRecipientList(value: string): boolean {
  const recipients = value
    .split(/[;,]/)
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  return recipients.length > 0 && recipients.every((recipient) => EMAIL_PATTERN.test(recipient));
}

function validateValue(field: FieldSchema, rawValue: string): string | null {
  const value = normalizeCellValue(rawValue);

  if (!value) {
    return field.required ? `${field.label} is required.` : null;
  }

  switch (field.kind) {
    case "email":
      return isValidRecipientList(value)
        ? null
        : `${field.label} must contain valid email address(es).`;
    case "phone":
      return PHONE_PATTERN.test(value) ? null : `${field.label} must look like a phone number.`;
    case "year":
      return YEAR_PATTERN.test(value) ? null : `${field.label} must be a 4-digit year.`;
    case "digits15":
      return IDENTIFICATION_NUMBER_PATTERN.test(value)
        ? null
        : `${field.label} must contain exactly 15 digits.`;
    case "date":
      return parseFlexibleDate(value) ? null : `${field.label} must be a valid date.`;
    case "enum":
      return field.allowedValues &&
        field.allowedValues.some((allowed) => normalizeHeader(allowed) === normalizeHeader(value))
        ? null
        : `${field.label} must be one of: ${field.allowedValues?.join(", ")}.`;
    case "text":
      return null;
    default:
      return assertNever(field.kind);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled field kind: ${value}`);
}

export function normalizeRowValues(rawValues: Record<string, string>): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of ADOPTION_FIELDS) {
    const currentValue = normalizeCellValue(rawValues[field.key] ?? "");
    values[field.key] = field.kind === "enum"
      ? canonicalizeEnumValue(field, currentValue)
      : currentValue;
  }

  return values;
}

export function validateNormalizedValues(values: Record<string, string>): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of ADOPTION_FIELDS) {
    const message = validateValue(field, values[field.key] ?? "");
    if (message) {
      errors.push({
        fieldKey: field.key,
        fieldLabel: field.label,
        message
      });
    }
  }

  const status = values.lifeStatus;
  if (status && !values.lifeStatusDate) {
    errors.push({
      fieldKey: "lifeStatusDate",
      fieldLabel: "Date statut",
      message: "Date statut is required when a life status is set."
    });
  }

  if (values.emailSent && !values.recipientEmail) {
    errors.push({
      fieldKey: "recipientEmail",
      fieldLabel: "Recipient",
      message: "Recipient is required when Email Sent is filled."
    });
  }

  if (normalizeHeader(values.sterilized) === normalizeHeader("OK") && !values.sterilizationVet) {
    errors.push({
      fieldKey: "sterilizationVet",
      fieldLabel: "Veto pour ste",
      message: "Veto pour ste is required when Ste fait is OK."
    });
  }

  if (
    normalizeHeader(values.ieDossierComplete) === normalizeHeader("complet") &&
    !values.ieDossierDate
  ) {
    errors.push({
      fieldKey: "ieDossierDate",
      fieldLabel: "Date dossier IE complet",
      message: "Date dossier IE complet is required when Dossier IE complet is complet."
    });
  }

  return errors;
}

export function buildMailEligible(values: Record<string, string>, errors: ValidationError[]): boolean {
  if (errors.length > 0) {
    return false;
  }

  if (!values.recipientEmail || values.emailSent) {
    return false;
  }

  return !["retour", "perdu", "dcd"].includes(normalizeHeader(values.lifeStatus));
}

export function validateRow(rawValues: Record<string, string>): ValidatedRow {
  const values = normalizeRowValues(rawValues);
  const errors = validateNormalizedValues(values);

  return {
    values,
    errors,
    isValid: errors.length === 0,
    mailEligible: buildMailEligible(values, errors)
  };
}
