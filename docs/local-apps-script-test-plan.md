# Google Sheets Apps Script Local Test Setup With Validated Sheet

## Summary

Set up a TypeScript Apps Script project that can be tested locally and later pushed with `clasp`. The core workflow will read the original adoption sheet, normalize every row into a consolidated validated sheet, add a validation boolean and error details, and apply Google Sheets validation rules to the consolidated sheet fields. For v1, generation is manual so the original sheet remains the source until the normalized sheet is trusted enough to replace it.

## Key Changes

- Add Node/TypeScript tooling with `npm` scripts for `test`, `typecheck`, `build`, and future `clasp push`.
- Add Apps Script entrypoints for:
  - Opening the spreadsheet and adding a custom menu.
  - Manually regenerating the consolidated validated sheet.
  - Later mail/row-processing workflows that consume only validated rows.
- Add a shared typed schema for adoption fields that drives:
  - CSV fixture parsing and local validation.
  - Consolidated sheet column order and normalized field names.
  - Google Sheets data validation rules.
  - Tests for valid and invalid rows.
- Add adapters around Google services:
  - Spreadsheet adapter for reading origin rows, writing consolidated rows, highlighting errors, and applying validation rules.
  - Mail adapter with dry-run local behavior and isolated production `GmailApp` calls.
- Move the sample CSV into a stable fixture path and parse it with a real CSV parser because the current headers include quoted embedded newlines.

## Validated Sheet Behavior

- Create or refresh one consolidated sheet, for example `Validated Adoptions`.
- For every source row, write one normalized output row containing:
  - Source row reference.
  - All normalized adoption fields.
  - `is_valid` boolean.
  - `validation_errors` summary.
  - Optional workflow/status fields such as mail eligibility or sent state.
- Rows with `is_valid = true` become eligible for later cherry-pick workflows.
- Rows with errors remain visible in the consolidated sheet, with invalid fields highlighted and error messages available.
- Apply Google Sheets field-level validation rules to the consolidated sheet, using the same shared schema as local tests.
- Do not delete or mutate the origin sheet in v1.

## Test Plan

- Fixture parsing tests:
  - Load the sample CSV correctly, including multiline headers.
  - Normalize known columns like `Date_adoption`, `Recipient`, `Nom chat`, and `Email Sent`.
- Validation tests:
  - Valid rows produce `is_valid = true`.
  - Invalid rows produce `is_valid = false` with structured field errors.
- Consolidated sheet tests:
  - Every origin row maps to one output row.
  - Output includes source row reference, normalized fields, validation boolean, and error summary.
  - Invalid fields are marked for highlighting.
- Sheet rule tests:
  - Shared schema produces expected Google Sheets validation rules for required fields, dates, emails, booleans, and controlled values.
- Workflow tests:
  - Later mail/row actions consume only rows where `is_valid = true`.
  - Dry-run mail adapter prevents real email during local tests.
- Tooling checks:
  - `npm test`
  - `npm run typecheck`
  - `npm run build`

## Assumptions

- Use TypeScript + `clasp`.
- Use Vitest for local tests.
- Use CSV fixtures for v1 local validation.
- Refresh the consolidated validated sheet manually through a custom menu action.
- Use one shared schema as the source of truth for both local validation and Google Sheets data validation rules.
- Keep the origin sheet until the consolidated validated sheet is good enough to replace it.
- Do not require Google credentials until a later optional sync/import command is added.
