import { normalizeCellValue, normalizeHeader, stripDiacritics } from "../src/domain/normalize";

describe("normalization helpers", () => {
  it("treats undefined and null values as blank strings", () => {
    expect(normalizeHeader(undefined)).toBe("");
    expect(normalizeHeader(null)).toBe("");
    expect(normalizeCellValue(undefined)).toBe("");
    expect(stripDiacritics(undefined)).toBe("");
  });

  it("normalizes non-string sheet values without throwing", () => {
    expect(normalizeHeader(1234)).toBe("1234");
    expect(normalizeCellValue(true)).toBe("true");
  });
});
