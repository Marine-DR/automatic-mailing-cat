import { ADOPTION_FIELDS } from "../src/config/fields";

describe("field schema coverage", () => {
  it("defines validation metadata for every output field", () => {
    expect(ADOPTION_FIELDS.length).toBeGreaterThan(20);
    expect(ADOPTION_FIELDS.every((field) => field.label.length > 0)).toBe(true);
    expect(ADOPTION_FIELDS.every((field) => field.sourceAliases.length > 0)).toBe(true);
  });

  it("keeps required validated output fields explicit", () => {
    const requiredKeys = ADOPTION_FIELDS.filter((field) => field.required).map((field) => field.key);
    expect(requiredKeys).toEqual(
      expect.arrayContaining([
        "adoptionDate",
        "store",
        "lastName",
        "firstName",
        "recipientEmail",
        "catName",
        "identificationNumber",
        "birthDate",
        "ageGroup",
        "sex"
      ])
    );
  });
});
