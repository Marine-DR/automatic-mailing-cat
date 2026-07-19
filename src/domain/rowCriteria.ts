import { ADOPTION_FIELDS } from "../config/fields";
import { isAtLeastMonthsOld } from "./date";
import { normalizeCellValue } from "./normalize";
import type { ValidatedRow } from "./types";

export interface RowCriteriaContext {
  sourceRowIndex: number;
  sourceRowNumber: number;
}

export type RowCriteria = (row: ValidatedRow, context: RowCriteriaContext) => boolean;

function assertKnownField(fieldKey: string): void {
  if (!ADOPTION_FIELDS.some((field) => field.key === fieldKey)) {
    throw new Error(`Unknown field criteria: ${fieldKey}`);
  }
}

function normalizeCriteriaValue(value: string): string {
  return normalizeCellValue(value).toLowerCase();
}

export const rowCriteria = {
  all(): RowCriteria {
    return () => true;
  },

  valid(): RowCriteria {
    return (row) => row.isValid;
  },

  invalid(): RowCriteria {
    return (row) => !row.isValid;
  },

  mailEligible(): RowCriteria {
    return (row) => row.mailEligible;
  },

  fieldEquals(fieldKey: string, expectedValue: string): RowCriteria {
    assertKnownField(fieldKey);
    const expected = normalizeCriteriaValue(expectedValue);

    return (row) => normalizeCriteriaValue(row.values[fieldKey] ?? "") === expected;
  },

  fieldIsBlank(fieldKey: string): RowCriteria {
    assertKnownField(fieldKey);

    return (row) => normalizeCellValue(row.values[fieldKey] ?? "") === "";
  },

  fieldIsNotBlank(fieldKey: string): RowCriteria {
    assertKnownField(fieldKey);

    return (row) => normalizeCellValue(row.values[fieldKey] ?? "") !== "";
  },

  fieldIsAtLeastMonthsOld(fieldKey: string, months: number, today: Date): RowCriteria {
    assertKnownField(fieldKey);

    return (row) => isAtLeastMonthsOld(row.values[fieldKey] ?? "", months, today);
  },

  and(...criteria: RowCriteria[]): RowCriteria {
    return (row, context) => criteria.every((criterion) => criterion(row, context));
  },

  or(...criteria: RowCriteria[]): RowCriteria {
    return (row, context) => criteria.some((criterion) => criterion(row, context));
  }
};
