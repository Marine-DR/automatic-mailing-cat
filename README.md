# automatic-mailing-cat

Google Sheets automation script for cat society management.

## Local workflow

This project is set up as a TypeScript Google Apps Script workspace.

- `npm install`
- `npm run test`
- `npm run typecheck`
- `npm run build`
- `npm run preview:fixture`

## Apps Script flow

The main workflow reads the active source sheet and regenerates a consolidated `Validated Adoptions` sheet.

- Every source row is copied into the consolidated sheet.
- The consolidated sheet adds `Is valid`, `Validation errors`, and `Mail eligible`.
- Invalid fields are highlighted.
- Field-level validation rules are applied to the consolidated output columns.

To push to Apps Script:

1. Copy `.clasp.example.json` to `.clasp.json`.
2. Replace the placeholder script ID.
3. Run `npm run build`.
4. Run `npm run push`.
