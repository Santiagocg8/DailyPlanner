import { describe, it, expect } from "vitest";
import { ALICIA_PROFILE, FAMILY_PROFILE, SNACK_KEYWORDS } from "@/lib/pantry";

describe("ALICIA_PROFILE", () => {
  it("tiene un ageMonths positivo", () => {
    expect(ALICIA_PROFILE.ageMonths).toBeGreaterThan(0);
  });

  it("nameMatch es lowercase", () => {
    expect(ALICIA_PROFILE.nameMatch).toBe(ALICIA_PROFILE.nameMatch.toLowerCase());
  });

  it("ingredients es un array no vacío de strings", () => {
    expect(ALICIA_PROFILE.ingredients.length).toBeGreaterThan(0);
    ALICIA_PROFILE.ingredients.forEach((i) => expect(typeof i).toBe("string"));
  });

  it("fruits es subconjunto de ingredients", () => {
    ALICIA_PROFILE.fruits.forEach((f) => {
      expect(ALICIA_PROFILE.ingredients).toContain(f);
    });
  });

  it("fruits es un array no vacío", () => {
    expect(ALICIA_PROFILE.fruits.length).toBeGreaterThan(0);
  });
});

describe("FAMILY_PROFILE", () => {
  it("ingredients es un array no vacío de strings", () => {
    expect(FAMILY_PROFILE.ingredients.length).toBeGreaterThan(0);
    FAMILY_PROFILE.ingredients.forEach((i) => expect(typeof i).toBe("string"));
  });

  it("typicalDishes es un array no vacío de strings", () => {
    expect(FAMILY_PROFILE.typicalDishes.length).toBeGreaterThan(0);
    FAMILY_PROFILE.typicalDishes.forEach((d) => expect(typeof d).toBe("string"));
  });
});

describe("SNACK_KEYWORDS", () => {
  it("es un array no vacío de strings", () => {
    expect(SNACK_KEYWORDS.length).toBeGreaterThan(0);
    SNACK_KEYWORDS.forEach((k) => expect(typeof k).toBe("string"));
  });

  it("contiene 'media mañana' y 'media tarde'", () => {
    expect(SNACK_KEYWORDS).toContain("media mañana");
    expect(SNACK_KEYWORDS).toContain("media tarde");
  });
});
