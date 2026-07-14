import { filterRowsToSheet, type FilterRowsToSheetPort } from "../src/app/filterRowsToSheet";
import { rowCriteria } from "../src/domain/rowCriteria";
import type { ConsolidatedSheetData, SourceSheetSnapshot } from "../src/domain/types";

function buildValidSourceRow(overrides: Record<string, string> = {}): string[] {
  const values = {
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
    emailSent: "",
    ...overrides
  };

  return [
    values.adoptionDate,
    values.store,
    values.courtesyTitle,
    values.lastName,
    values.firstName,
    values.recipientEmail,
    values.phone,
    values.catName,
    values.identificationNumber,
    values.birthDate,
    values.ageGroup,
    values.sex,
    values.emailSent
  ];
}

function buildPort(sourceSheet: SourceSheetSnapshot): FilterRowsToSheetPort & {
  writtenSheet?: { sheetName: string; data: ConsolidatedSheetData };
} {
  return {
    getActiveSourceSheet: () => sourceSheet,
    writeValidatedSheet(sheetName, data) {
      this.writtenSheet = { sheetName, data };
    }
  };
}

const headers = [
  "Date_adoption",
  "Magasin",
  "M_Me",
  "NOM",
  "Prénom",
  "Recipient",
  "Téléphone",
  "Nom chat",
  "Numéro identification",
  "Date de naissance",
  "Adulte / Chaton",
  "Sexe",
  "Email Sent"
];

describe("filter rows to sheet service", () => {
  it("writes only rows matching a reusable field criteria", () => {
    const port = buildPort({
      name: "Adoptions",
      headers,
      rows: [
        buildValidSourceRow({ catName: "Nala", emailSent: "" }),
        buildValidSourceRow({ catName: "Milo", emailSent: "2026-07-14" })
      ]
    });

    const result = filterRowsToSheet(port, {
      outputSheetName: "Reminder Candidates",
      criteria: rowCriteria.fieldIsBlank("emailSent")
    });

    expect(result).toEqual({
      sourceSheetName: "Adoptions",
      outputSheetName: "Reminder Candidates",
      totalRows: 2,
      matchedRows: 1,
      validRows: 1,
      invalidRows: 0
    });
    expect(port.writtenSheet?.sheetName).toBe("Reminder Candidates");
    expect(port.writtenSheet?.data.validatedRows).toHaveLength(1);
    expect(port.writtenSheet?.data.validatedRows[0].values.catName).toBe("Nala");
  });

  it("can combine criteria before writing the output sheet", () => {
    const port = buildPort({
      name: "Adoptions",
      headers,
      rows: [
        buildValidSourceRow({ catName: "Nala", emailSent: "" }),
        buildValidSourceRow({ catName: "Milo", emailSent: "" }),
        buildValidSourceRow({ catName: "Pip", emailSent: "", recipientEmail: "bad-email" })
      ]
    });

    const result = filterRowsToSheet(port, {
      outputSheetName: "Valid Nala Rows",
      criteria: rowCriteria.and(rowCriteria.valid(), rowCriteria.fieldEquals("catName", "nala"))
    });

    expect(result.matchedRows).toBe(1);
    expect(result.validRows).toBe(1);
    expect(port.writtenSheet?.data.validatedRows[0].values.catName).toBe("Nala");
  });
});
