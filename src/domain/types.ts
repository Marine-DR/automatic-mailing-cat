export interface ValidationError {
  fieldKey: string;
  fieldLabel: string;
  message: string;
}

export interface ValidatedRow {
  values: Record<string, string>;
  errors: ValidationError[];
  isValid: boolean;
  mailEligible: boolean;
}

export interface ConsolidatedSheetData {
  headers: string[];
  rows: Array<Array<string | boolean | number>>;
  invalidCellMap: number[][];
  validatedRows: ValidatedRow[];
}

export interface SourceSheetSnapshot {
  name: string;
  headers: string[];
  rows: string[][];
}

export interface RefreshResult {
  sourceSheetName: string;
  outputSheetName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}
