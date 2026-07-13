import path from "node:path";
import { loadCsvFixture } from "../domain/csv";
import { buildConsolidatedSheet } from "../domain/consolidate";

async function main(): Promise<void> {
  const fixturePath = process.argv[2];
  if (!fixturePath) {
    throw new Error("Usage: npm run preview:fixture -- <csv-path>");
  }

  const rows = await loadCsvFixture(path.resolve(fixturePath));
  const [headers, ...dataRows] = rows;
  const consolidated = buildConsolidatedSheet({
    name: path.basename(fixturePath),
    headers,
    rows: dataRows
  });

  const validRows = consolidated.validatedRows.filter((row) => row.isValid).length;
  const invalidRows = consolidated.validatedRows.length - validRows;

  console.log(`Rows: ${consolidated.validatedRows.length}`);
  console.log(`Valid rows: ${validRows}`);
  console.log(`Invalid rows: ${invalidRows}`);

  const firstInvalid = consolidated.validatedRows.find((row) => !row.isValid);
  if (firstInvalid) {
    console.log("First invalid row:");
    console.log(`  Errors: ${firstInvalid.errors.map((error) => error.message).join(" | ")}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
