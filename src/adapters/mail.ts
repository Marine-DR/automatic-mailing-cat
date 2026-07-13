import type { ValidatedRow } from "../domain/types";

export interface MailDraft {
  to: string;
  subject: string;
  body: string;
}

export interface MailPort {
  send(draft: MailDraft): void;
}

export function buildReminderDraft(row: ValidatedRow): MailDraft | null {
  if (!row.mailEligible) {
    return null;
  }

  return {
    to: row.values.recipientEmail,
    subject: `Nouvelles demandées pour ${row.values.catName}`,
    body: [
      `Bonjour ${row.values.firstName} ${row.values.lastName},`,
      "",
      `Nous revenons vers vous pour avoir des nouvelles de ${row.values.catName}.`,
      "",
      "Merci pour votre retour."
    ].join("\n")
  };
}

export class DryRunMailPort implements MailPort {
  public readonly sentDrafts: MailDraft[] = [];

  send(draft: MailDraft): void {
    this.sentDrafts.push(draft);
  }
}

export class GmailMailPort implements MailPort {
  send(draft: MailDraft): void {
    GmailApp.sendEmail(draft.to, draft.subject, draft.body);
  }
}
