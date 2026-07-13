import { readFile } from "node:fs/promises";
import Papa from "papaparse";

interface PapaParseResult {
  data: string[][];
  errors: Array<{ message: string }>;
}

export async function loadCsvFixture(filePath: string): Promise<string[][]> {
  const fileContents = await readFile(filePath, "utf8");
  const parsed = Papa.parse(fileContents, {
    skipEmptyLines: false
  }) as PapaParseResult;

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((error) => error.message).join(", "));
  }

  return parsed.data.filter(
    (row) => row.some((value) => value !== undefined)
  );
}
