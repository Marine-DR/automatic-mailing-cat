import path from "node:path";
import { ADOPTION_FIELDS } from "../src/config/fields";
import { loadCsvFixture } from "../src/domain/csv";
import {
  buildConsolidatedRow,
  buildConsolidatedSheet,
  buildInvalidColumnIndexes
} from "../src/domain/consolidate";
import { getConsolidatedHeaders } from "../src/domain/schema";
import { validateRow } from "../src/domain/validation";

const fixturePath = path.resolve("fixtures/adoptions-with-errors.csv");

describe("consolidated sheet generation", () => {
  it("parses the CSV fixture with multiline headers", async () => {
    const rows = await loadCsvFixture(fixturePath);
    expect(rows[0]).toContain("Date_adoption");
    expect(rows[0]).toContain("Adulte / \nChaton");
    expect(rows.length).toBeGreaterThan(5);
  });

  it("marks incomplete rows as invalid and complete rows as valid", async () => {
    const rows = await loadCsvFixture(fixturePath);
    const [headers, ...dataRows] = rows;
    const consolidated = buildConsolidatedSheet({
      name: "fixture",
      headers,
      rows: dataRows
    });

    expect(consolidated.headers).toEqual(getConsolidatedHeaders());
    expect(consolidated.headers).not.toContain("Source row");
    expect(consolidated.validatedRows[0].isValid).toBe(false);
    expect(consolidated.validatedRows.some((row) => row.isValid)).toBe(false);
    expect(consolidated.invalidCellMap[0].length).toBeGreaterThan(0);
    expect(consolidated.rows[0][consolidated.rows[0].length - 1]).toBe(false);
  });

  it("keeps track of mail eligibility separately from raw validity", () => {
    const row = validateRow({
      adoptionDate: "20/06/2026",
      store: "Truffaut Balma",
      courtesyTitle: "Me",
      lastName: "Tota",
      firstName: "Truc",
      recipientEmail: "test@example.com",
      phone: "00 00 00 00 00",
      catName: "AAA",
      identificationNumber: "123456789101112",
      birthDate: "06/01/2025",
      ageGroup: "Adulte",
      sex: "F",
      sterilized: "NON",
      sterilizationVet: "",
      remainingService: "ok",
      ieDossierComplete: "",
      year: "",
      ieDossierDate: "",
      ieChangeDone: "NON",
      lifeStatus: "",
      lifeStatusDate: "",
      comments: "",
      followUpDate: "",
      followUpResponse: "",
      lastNewsReceived: "",
      emailSent: ""
    });

    expect(row.isValid).toBe(true);
    expect(row.mailEligible).toBe(true);
  });

  it("recomputes derived cells from validated-sheet values without source provenance", () => {
    const invalidRow = validateRow({
      adoptionDate: "",
      store: "Truffaut Balma",
      courtesyTitle: "Me",
      lastName: "Tota",
      firstName: "Truc",
      recipientEmail: "bad-email",
      phone: "00 00 00 00 00",
      catName: "AAA",
      identificationNumber: "123456789101112",
      birthDate: "06/01/2025",
      ageGroup: "Adulte",
      sex: "F",
      sterilized: "NON",
      sterilizationVet: "",
      remainingService: "",
      ieDossierComplete: "",
      year: "",
      ieDossierDate: "",
      ieChangeDone: "NON",
      lifeStatus: "",
      lifeStatusDate: "",
      comments: "",
      followUpDate: "",
      followUpResponse: "",
      lastNewsReceived: "",
      emailSent: ""
    });

    const rowValues = buildConsolidatedRow(invalidRow);

    expect(rowValues[rowValues.length - 1]).toBe(false);
    expect(rowValues[rowValues.length - 2]).toContain("Date adoption is required.");
    expect(rowValues[rowValues.length - 2]).toContain(
      "Recipient must contain valid email address(es)."
    );
  });

  it("highlights only field cells, not the validation summary cell", () => {
    const invalidRow = validateRow({
      adoptionDate: "",
      store: "Truffaut Balma",
      courtesyTitle: "Me",
      lastName: "Tota",
      firstName: "Truc",
      recipientEmail: "bad-email",
      phone: "00 00 00 00 00",
      catName: "AAA",
      identificationNumber: "123456789101112",
      birthDate: "06/01/2025",
      ageGroup: "Adulte",
      sex: "F",
      sterilized: "NON",
      sterilizationVet: "",
      remainingService: "",
      ieDossierComplete: "",
      year: "",
      ieDossierDate: "",
      ieChangeDone: "NON",
      lifeStatus: "",
      lifeStatusDate: "",
      comments: "",
      followUpDate: "",
      followUpResponse: "",
      lastNewsReceived: "",
      emailSent: ""
    });

    const invalidIndexes = buildInvalidColumnIndexes(invalidRow);

    expect(invalidIndexes).toContain(0);
    expect(invalidIndexes).toContain(5);
    expect(invalidIndexes).not.toContain(ADOPTION_FIELDS.length + 1);
  });

  it("allows comma or semicolon separated recipient email lists", () => {
    const row = validateRow({
      adoptionDate: "20/06/2026",
      store: "Truffaut Balma",
      courtesyTitle: "Me",
      lastName: "Tota",
      firstName: "Truc",
      recipientEmail: "first@example.com, second@example.com; third@example.com",
      phone: "00 00 00 00 00",
      catName: "AAA",
      identificationNumber: "123456789101112",
      birthDate: "06/01/2025",
      ageGroup: "Adulte",
      sex: "F",
      sterilized: "NON",
      sterilizationVet: "",
      remainingService: "ok",
      ieDossierComplete: "",
      year: "",
      ieDossierDate: "",
      ieChangeDone: "NON",
      lifeStatus: "",
      lifeStatusDate: "",
      comments: "",
      followUpDate: "",
      followUpResponse: "",
      lastNewsReceived: "",
      emailSent: ""
    });

    expect(row.errors).not.toContainEqual(
      expect.objectContaining({ fieldKey: "recipientEmail" })
    );
    expect(row.mailEligible).toBe(true);
  });

  it("keeps source business columns first and validation as the last column", () => {
    const headers = getConsolidatedHeaders();
    expect(headers[0]).toBe("Date adoption");
    expect(headers[headers.length - 1]).toBe("Validation");
  });
});
