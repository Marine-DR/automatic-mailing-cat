import { DryRunMailPort } from "../src/adapters/mail";
import {
  createSterilizationReminderEmailSheet,
  EMAIL_SENT_COLUMN_LABEL,
  sendSterilizationReminderEmailsFromSheet,
  STERILIZATION_REMINDER_SHEET_NAME,
  type SheetColumnUpdate,
  type SterilizationReminderSheetPort
} from "../src/app/sterilizationReminderEmails";
import type { ConsolidatedSheetData, SourceSheetSnapshot } from "../src/domain/types";

const sourceHeaders = [
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
  "Sté_Fait",
  "Sapca / Retour / Perdu / dcd"
];

function buildSourceRow(overrides: Record<string, string> = {}): string[] {
  const values = {
    adoptionDate: "20/01/2026",
    store: "Truffaut Balma",
    courtesyTitle: "Me",
    lastName: "Martin",
    firstName: "Lea",
    recipientEmail: "lea@example.com",
    phone: "00 00 00 00 00",
    catName: "Nala",
    identificationNumber: "123456789101112",
    birthDate: "01/01/2026",
    ageGroup: "Chaton",
    sex: "F",
    sterilized: "NON",
    lifeStatus: "",
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
    values.sterilized,
    values.lifeStatus
  ];
}

function buildPort(sourceSheet: SourceSheetSnapshot): SterilizationReminderSheetPort & {
  activeSheet: SourceSheetSnapshot;
  columnUpdates: Array<{ sheetName: string; columnNumber: number; updates: SheetColumnUpdate[] }>;
  namedSheets: Record<string, SourceSheetSnapshot>;
  writtenSheet?: { sheetName: string; data: ConsolidatedSheetData };
} {
  return {
    activeSheet: sourceSheet,
    columnUpdates: [],
    namedSheets: {},
    getActiveSourceSheet: () => sourceSheet,
    getActiveSheetSnapshot() {
      return this.activeSheet;
    },
    getSheetSnapshot(sheetName) {
      const sheet = this.namedSheets[sheetName];
      if (!sheet) {
        throw new Error(`Missing test sheet: ${sheetName}`);
      }

      return sheet;
    },
    setSheetColumnValues(sheetName, columnNumber, updates) {
      this.columnUpdates.push({ sheetName, columnNumber, updates });
    },
    writeValidatedSheet(sheetName, data) {
      this.writtenSheet = { sheetName, data };
    }
  };
}

describe("sterilization reminder emails", () => {
  it("creates a reminder sheet for valid cats at least 5 months old needing sterilization", () => {
    const port = buildPort({
      name: "Adoptions",
      headers: sourceHeaders,
      rows: [
        buildSourceRow({ catName: "Nala", birthDate: "01/01/2026", sterilized: "NON" }),
        buildSourceRow({ catName: "Milo", birthDate: "20/03/2026", sterilized: "NON" }),
        buildSourceRow({ catName: "Pip", birthDate: "01/01/2026", sterilized: "OK" }),
        buildSourceRow({ catName: "Uma", birthDate: "01/01/2026", lifeStatus: "Retour" })
      ]
    });

    const result = createSterilizationReminderEmailSheet(
      port,
      new Date(Date.UTC(2026, 6, 14))
    );

    expect(result.matchedRows).toBe(1);
    expect(port.writtenSheet?.sheetName).toBe(STERILIZATION_REMINDER_SHEET_NAME);
    expect(port.writtenSheet?.data.headers.at(-1)).toBe(EMAIL_SENT_COLUMN_LABEL);
    expect(port.writtenSheet?.data.rows[0].at(-1)).toBe(false);
    expect(port.writtenSheet?.data.validatedRows[0].values.catName).toBe("Nala");
  });

  it("sends unsent reminder rows and marks each successful row as sent", () => {
    const port = buildPort({ name: "Adoptions", headers: sourceHeaders, rows: [] });
    port.activeSheet = {
      name: STERILIZATION_REMINDER_SHEET_NAME,
      headers: [
        "Civilite",
        "Prenom",
        "Nom",
        "Recipient",
        "Nom chat",
        EMAIL_SENT_COLUMN_LABEL
      ],
      rows: [
        ["Me", "Lea", "Martin", "lea@example.com", "Nala", "FALSE"],
        ["M", "Tom", "Bernard", "tom@example.com", "Milo", "TRUE"]
      ]
    };
    const mailer = new DryRunMailPort();

    const result = sendSterilizationReminderEmailsFromSheet(port, mailer);

    expect(result).toEqual({
      sheetName: STERILIZATION_REMINDER_SHEET_NAME,
      totalRows: 2,
      skippedRows: 1,
      sentRows: 1
    });
    expect(mailer.sentDrafts).toHaveLength(1);
    expect(mailer.sentDrafts[0].to).toBe("lea@example.com");
    expect(mailer.sentDrafts[0].body).toContain("Me Lea Martin,");
    expect(mailer.sentDrafts[0].body).toContain("Nala a plus de 5 mois");
    expect(port.columnUpdates).toEqual([
      {
        sheetName: STERILIZATION_REMINDER_SHEET_NAME,
        columnNumber: 6,
        updates: [{ rowNumber: 2, value: true }]
      }
    ]);
  });

  it("refuses to send from any sheet except the sterilization reminder sheet", () => {
    const port = buildPort({ name: "Adoptions", headers: sourceHeaders, rows: [] });
    port.activeSheet = {
      name: "Emails custom",
      headers: ["Civilite", "Prenom", "Nom", "Recipient", "Nom chat", EMAIL_SENT_COLUMN_LABEL],
      rows: [["Me", "Ari", "Durand", "ari@example.com", "Pim", "FALSE"]]
    };
    const mailer = new DryRunMailPort();

    expect(() => sendSterilizationReminderEmailsFromSheet(port, mailer)).toThrow(
      "Select the Emails rappels ste sheet before sending emails."
    );

    expect(mailer.sentDrafts).toHaveLength(0);
    expect(port.columnUpdates).toHaveLength(0);
  });
});
