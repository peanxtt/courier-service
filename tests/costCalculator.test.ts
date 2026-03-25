import { describe, it, expect } from "vitest";
import {
  calculateDeliveryCost,
  calculatePackageCost,
  calculateAllPackageCosts,
} from "../src/delivery/cost";
import { buildDiscountCalculator, defaultDiscountCalculator } from "../src/delivery/offers";
import { Package } from "../src/types/types";

describe("calculateDeliveryCost", () => {
  it("applies the formula: base + weight*10 + distance*5", () => {
    expect(calculateDeliveryCost(100, 5, 5)).toBe(175);
    expect(calculateDeliveryCost(100, 15, 5)).toBe(275);
    expect(calculateDeliveryCost(100, 10, 100)).toBe(700);
  });

  it("handles zero weight and distance", () => {
    expect(calculateDeliveryCost(100, 0, 0)).toBe(100);
  });

  it("handles zero base cost", () => {
    expect(calculateDeliveryCost(0, 10, 20)).toBe(200);
  });

  it("handles all zeros", () => {
    expect(calculateDeliveryCost(0, 0, 0)).toBe(0);
  });

  it("handles fractional weight and distance", () => {
    expect(calculateDeliveryCost(100, 5.5, 10.7)).toBe(100 + 55 + 53.5);
  });

  it("handles very large values", () => {
    expect(calculateDeliveryCost(10000, 500, 1000)).toBe(10000 + 5000 + 5000);
  });
});

describe("calculatePackageCost", () => {
  const calculateDiscount = defaultDiscountCalculator;

  it("PKG1 from PDF Problem 1 sample: no discount (OFR001 criteria not met)", () => {
    const pkg: Package = { id: "PKG1", weight: 5, distance: 5, offerCode: "OFR001" };
    const result = calculatePackageCost(pkg, 100, calculateDiscount);
    expect(result.packageId).toBe("PKG1");
    expect(result.discount).toBe(0);
    expect(result.totalCost).toBe(175);
  });

  it("PKG2 from PDF Problem 1 sample: no discount (OFR002 criteria not met)", () => {
    const pkg: Package = { id: "PKG2", weight: 15, distance: 5, offerCode: "OFR002" };
    const result = calculatePackageCost(pkg, 100, calculateDiscount);
    expect(result.packageId).toBe("PKG2");
    expect(result.discount).toBe(0);
    expect(result.totalCost).toBe(275);
  });

  it("PKG3 from PDF Problem 1 sample: 5% discount (OFR003 met)", () => {
    const pkg: Package = { id: "PKG3", weight: 10, distance: 100, offerCode: "OFR003" };
    const result = calculatePackageCost(pkg, 100, calculateDiscount);
    expect(result.packageId).toBe("PKG3");
    expect(result.discount).toBe(35);
    expect(result.totalCost).toBe(665);
  });

  it("rounds discount to 2 decimal places", () => {
    const customDiscount = buildDiscountCalculator([
      { code: "ODD", discountPercent: 3, minDistance: 0, maxDistance: 999, minWeight: 0, maxWeight: 999 },
    ]);
    // cost = 0 + 10*10 + 10*5 = 150. 3% of 150 = 4.5
    const pkg: Package = { id: "X", weight: 10, distance: 10, offerCode: "ODD" };
    const result = calculatePackageCost(pkg, 0, customDiscount);
    expect(result.discount).toBe(4.5);
    expect(result.totalCost).toBe(145.5);
  });

  it("handles package with no matching offer (NA)", () => {
    const pkg: Package = { id: "P1", weight: 100, distance: 100, offerCode: "NA" };
    const result = calculatePackageCost(pkg, 50, calculateDiscount);
    expect(result.discount).toBe(0);
    expect(result.totalCost).toBe(50 + 1000 + 500);
  });

  it("handles zero weight and distance package", () => {
    const pkg: Package = { id: "P0", weight: 0, distance: 0, offerCode: "NA" };
    const result = calculatePackageCost(pkg, 100, calculateDiscount);
    expect(result.discount).toBe(0);
    expect(result.totalCost).toBe(100);
  });
});

describe("calculateAllPackageCosts", () => {
  it("processes the full PDF Problem 1 sample correctly", () => {
    const packages: Package[] = [
      { id: "PKG1", weight: 5, distance: 5, offerCode: "OFR001" },
      { id: "PKG2", weight: 15, distance: 5, offerCode: "OFR002" },
      { id: "PKG3", weight: 10, distance: 100, offerCode: "OFR003" },
    ];

    const results = calculateAllPackageCosts(packages, 100, defaultDiscountCalculator);

    expect(results).toEqual([
      { packageId: "PKG1", discount: 0, totalCost: 175 },
      { packageId: "PKG2", discount: 0, totalCost: 275 },
      { packageId: "PKG3", discount: 35, totalCost: 665 },
    ]);
  });

  it("preserves input order in output", () => {
    const packages: Package[] = [
      { id: "Z", weight: 10, distance: 10, offerCode: "NA" },
      { id: "A", weight: 20, distance: 20, offerCode: "NA" },
      { id: "M", weight: 30, distance: 30, offerCode: "NA" },
    ];
    const results = calculateAllPackageCosts(packages, 0, defaultDiscountCalculator);
    expect(results.map((r) => r.packageId)).toEqual(["Z", "A", "M"]);
  });

  it("handles single package", () => {
    const packages: Package[] = [
      { id: "SOLO", weight: 80, distance: 100, offerCode: "OFR001" },
    ];
    const results = calculateAllPackageCosts(packages, 100, defaultDiscountCalculator);
    // cost = 100 + 800 + 500 = 1400. OFR001: weight 80 in [70,200], dist 100 in [0,200] -> 10% = 140
    expect(results).toEqual([{ packageId: "SOLO", discount: 140, totalCost: 1260 }]);
  });
});
