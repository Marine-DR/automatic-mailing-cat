import { ADOPTION_FIELDS, type FieldSchema, SYSTEM_COLUMNS } from "../config/fields";
import { normalizeHeader } from "./normalize";

export function getFieldSchemaByKey(fieldKey: string): FieldSchema {
  const schema = ADOPTION_FIELDS.find((field) => field.key === fieldKey);
  if (!schema) {
    throw new Error(`Unknown field schema: ${fieldKey}`);
  }
  return schema;
}

export function getConsolidatedHeaders(): string[] {
  return [
    ...ADOPTION_FIELDS.map((field) => field.label),
    ...SYSTEM_COLUMNS.map((column) => column.label)
  ];
}

export function buildSourceIndex(headers: string[]): Record<string, number> {
  const normalizedHeaderMap = new Map<string, number>();

  headers.forEach((header, index) => {
    normalizedHeaderMap.set(normalizeHeader(header), index);
  });

  const indexByFieldKey: Record<string, number> = {};

  for (const field of ADOPTION_FIELDS) {
    const candidates = [field.sourceLabel, ...field.sourceAliases].map(normalizeHeader);
    const foundIndex = candidates
      .map((candidate) => normalizedHeaderMap.get(candidate))
      .find((candidate): candidate is number => candidate !== undefined);

    if (foundIndex !== undefined) {
      indexByFieldKey[field.key] = foundIndex;
    }
  }

  return indexByFieldKey;
}
