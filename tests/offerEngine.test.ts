import { describe, it, expect } from "vitest";
import { buildDiscountCalculator, defaultDiscountCalculator } from "../src/delivery/offers";
import { OfferCriteria } from "../src/types/types";

const discount = defaultDiscountCalculator;

describe("defaultDiscountCalculator", () => {
  describe("OFR001 - 10% discount, distance 0-200, weight 70-200", () => {
    it("applies 10% discount when criteria are met", () => {
      expect(discount(1000, 100, 150, "OFR001")).toBe(100);
    });

    it("returns 0 when weight is below minimum", () => {
      expect(discount(175, 5, 5, "OFR001")).toBe(0);
    });

    it("returns 0 when distance exceeds maximum", () => {
      expect(discount(1000, 100, 201, "OFR001")).toBe(0);
    });

    it("works at boundary values", () => {
      expect(discount(1000, 70, 200, "OFR001")).toBe(100);
      expect(discount(1000, 200, 0, "OFR001")).toBe(100);
    });

    it("returns 0 when weight is one above max", () => {
      expect(discount(1000, 201, 100, "OFR001")).toBe(0);
    });

    it("returns 0 when weight is one below min", () => {
      expect(discount(1000, 69, 100, "OFR001")).toBe(0);
    });
  });

  describe("OFR002 - 7% discount, distance 50-150, weight 100-250", () => {
    it("applies 7% discount when criteria are met", () => {
      expect(discount(1500, 110, 60, "OFR002")).toBeCloseTo(105, 10);
    });

    it("returns 0 when weight is below minimum", () => {
      expect(discount(1000, 99, 100, "OFR002")).toBe(0);
    });

    it("returns 0 when distance is below minimum", () => {
      expect(discount(1000, 150, 49, "OFR002")).toBe(0);
    });

    it("applies at exact min distance boundary (50)", () => {
      expect(discount(1000, 150, 50, "OFR002")).toBe(70);
    });

    it("applies at exact max distance boundary (150)", () => {
      expect(discount(1000, 150, 150, "OFR002")).toBe(70);
    });

    it("returns 0 when distance is one above max (151)", () => {
      expect(discount(1000, 150, 151, "OFR002")).toBe(0);
    });

    it("applies at exact min weight boundary (100)", () => {
      expect(discount(1000, 100, 100, "OFR002")).toBe(70);
    });

    it("applies at exact max weight boundary (250)", () => {
      expect(discount(1000, 250, 100, "OFR002")).toBe(70);
    });

    it("returns 0 when weight is one above max (251)", () => {
      expect(discount(1000, 251, 100, "OFR002")).toBe(0);
    });
  });

  describe("OFR003 - 5% discount, distance 50-250, weight 10-150", () => {
    it("applies 5% discount when criteria are met", () => {
      expect(discount(700, 10, 100, "OFR003")).toBe(35);
    });

    it("returns 0 when weight exceeds maximum", () => {
      expect(discount(700, 151, 100, "OFR003")).toBe(0);
    });

    it("applies at exact min weight boundary (10)", () => {
      expect(discount(1000, 10, 100, "OFR003")).toBe(50);
    });

    it("returns 0 when weight is one below min (9)", () => {
      expect(discount(1000, 9, 100, "OFR003")).toBe(0);
    });

    it("applies at exact max distance boundary (250)", () => {
      expect(discount(1000, 50, 250, "OFR003")).toBe(50);
    });

    it("returns 0 when distance is one above max (251)", () => {
      expect(discount(1000, 50, 251, "OFR003")).toBe(0);
    });
  });

  describe("invalid/unknown offer codes", () => {
    it("returns 0 for unknown offer code", () => {
      expect(discount(1000, 100, 100, "OFR999")).toBe(0);
    });

    it("returns 0 for NA", () => {
      expect(discount(1000, 100, 100, "NA")).toBe(0);
    });

    it("returns 0 for empty string", () => {
      expect(discount(1000, 100, 100, "")).toBe(0);
    });

    it("is case sensitive (lowercase does not match)", () => {
      expect(discount(1000, 100, 100, "ofr001")).toBe(0);
      expect(discount(1000, 100, 100, "Ofr001")).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("returns 0 when both weight and distance are out of range", () => {
      expect(discount(1000, 5, 300, "OFR001")).toBe(0);
    });

    it("returns 0 when delivery cost is zero (even if criteria met)", () => {
      expect(discount(0, 100, 100, "OFR001")).toBe(0);
    });

    it("handles very large delivery cost without losing precision", () => {
      expect(discount(1000000, 100, 100, "OFR001")).toBe(100000);
    });
  });
});

describe("buildDiscountCalculator", () => {
  it("creates a calculator with custom offers", () => {
    const custom = buildDiscountCalculator([
      { code: "NEWOFR", discountPercent: 20, minDistance: 0, maxDistance: 500, minWeight: 0, maxWeight: 500 },
    ]);
    expect(custom(1000, 100, 100, "NEWOFR")).toBe(200);
  });

  it("returns 0 for unregistered code", () => {
    const custom = buildDiscountCalculator([]);
    expect(custom(1000, 100, 100, "OFR001")).toBe(0);
  });

  it("supports 0% discount", () => {
    const custom = buildDiscountCalculator([
      { code: "ZERO", discountPercent: 0, minDistance: 0, maxDistance: 999, minWeight: 0, maxWeight: 999 },
    ]);
    expect(custom(1000, 100, 100, "ZERO")).toBe(0);
  });

  it("supports 100% discount", () => {
    const custom = buildDiscountCalculator([
      { code: "FREE", discountPercent: 100, minDistance: 0, maxDistance: 999, minWeight: 0, maxWeight: 999 },
    ]);
    expect(custom(1000, 100, 100, "FREE")).toBe(1000);
  });

  it("last matching offer wins when codes overlap (finds first match)", () => {
    const offers: OfferCriteria[] = [
      { code: "OFR001", discountPercent: 10, minDistance: 0, maxDistance: 200, minWeight: 70, maxWeight: 200 },
      { code: "OFR001", discountPercent: 50, minDistance: 0, maxDistance: 200, minWeight: 70, maxWeight: 200 },
    ];
    const custom = buildDiscountCalculator(offers);
    // Array.find returns first match, so 10% wins
    expect(custom(1000, 100, 100, "OFR001")).toBe(100);
  });
});
