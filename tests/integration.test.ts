import { describe, it, expect } from "vitest";
import { parseInput } from "../src/cli/parser";
import { defaultDiscountCalculator } from "../src/delivery/offers";
import { calculateAllPackageCosts } from "../src/delivery/cost";
import { estimateDeliveryTimes } from "../src/delivery/scheduler";

describe("Integration: Problem 1 - Delivery Cost Estimation with Offers", () => {
  it("produces exact PDF sample output", () => {
    const input = `100 3
PKG1 5 5 OFR001
PKG2 15 5 OFR002
PKG3 10 100 OFR003`;

    const { baseCost, packages } = parseInput(input);
    const calculateDiscount = defaultDiscountCalculator;
    const results = calculateAllPackageCosts(packages, baseCost, calculateDiscount);

    expect(results).toEqual([
      { packageId: "PKG1", discount: 0, totalCost: 175 },
      { packageId: "PKG2", discount: 0, totalCost: 275 },
      { packageId: "PKG3", discount: 35, totalCost: 665 },
    ]);
  });

  it("handles all valid offer codes applied correctly", () => {
    const input = `100 3
PKG1 100 150 OFR001
PKG2 150 100 OFR002
PKG3 50 100 OFR003`;

    const { baseCost, packages } = parseInput(input);
    const calculateDiscount = defaultDiscountCalculator;
    const results = calculateAllPackageCosts(packages, baseCost, calculateDiscount);

    expect(results[0]).toEqual({ packageId: "PKG1", discount: 185, totalCost: 1665 });
    expect(results[1]).toEqual({ packageId: "PKG2", discount: 147, totalCost: 1953 });
    expect(results[2]).toEqual({ packageId: "PKG3", discount: 55, totalCost: 1045 });
  });

  it("handles all packages with no valid offers", () => {
    const input = `50 2
P1 5 5 NA
P2 10 10 BOGUS`;

    const { baseCost, packages } = parseInput(input);
    const calculateDiscount = defaultDiscountCalculator;
    const results = calculateAllPackageCosts(packages, baseCost, calculateDiscount);

    expect(results).toEqual([
      { packageId: "P1", discount: 0, totalCost: 125 },
      { packageId: "P2", discount: 0, totalCost: 200 },
    ]);
  });
});

describe("Integration: Problem 2 - Delivery Time Estimation", () => {
  it("produces exact PDF sample output", () => {
    const input = `100 5
PKG1 50 30 OFR001
PKG2 75 125 OFR008
PKG3 175 100 OFR003
PKG4 110 60 OFR002
PKG5 155 95 NA
2 70 200`;

    const { baseCost, packages, vehicleConfig } = parseInput(input);
    const calculateDiscount = defaultDiscountCalculator;
    const results = estimateDeliveryTimes(packages, baseCost, vehicleConfig!, calculateDiscount);

    expect(results).toEqual([
      { packageId: "PKG1", discount: 0, totalCost: 750, estimatedDeliveryTime: 3.98 },
      { packageId: "PKG2", discount: 0, totalCost: 1475, estimatedDeliveryTime: 1.78 },
      { packageId: "PKG3", discount: 0, totalCost: 2350, estimatedDeliveryTime: 1.42 },
      { packageId: "PKG4", discount: 105, totalCost: 1395, estimatedDeliveryTime: 0.85 },
      { packageId: "PKG5", discount: 0, totalCost: 2125, estimatedDeliveryTime: 4.19 },
    ]);
  });

  it("works with single vehicle delivering all packages sequentially", () => {
    const input = `50 2
P1 100 100 NA
P2 100 50 NA
1 50 200`;

    const { baseCost, packages, vehicleConfig } = parseInput(input);
    const calculateDiscount = defaultDiscountCalculator;
    const results = estimateDeliveryTimes(packages, baseCost, vehicleConfig!, calculateDiscount);

    const byId = new Map(results.map((r) => [r.packageId, r]));
    expect(byId.get("P1")!.estimatedDeliveryTime).toBe(2);
    expect(byId.get("P2")!.estimatedDeliveryTime).toBe(1);
  });

  it("end-to-end with single package and single vehicle", () => {
    const input = `0 1
P1 50 100 NA
1 100 200`;

    const { baseCost, packages, vehicleConfig } = parseInput(input);
    const calculateDiscount = defaultDiscountCalculator;
    const results = estimateDeliveryTimes(packages, baseCost, vehicleConfig!, calculateDiscount);

    expect(results).toEqual([
      { packageId: "P1", discount: 0, totalCost: 1000, estimatedDeliveryTime: 1 },
    ]);
  });
});

describe("Integration: Parser validation", () => {
  it("throws on empty input", () => {
    expect(() => parseInput("")).toThrow();
  });

  it("throws on whitespace-only input", () => {
    expect(() => parseInput("   \n  \n  ")).toThrow();
  });

  it("throws on missing package lines", () => {
    expect(() => parseInput("100 3\nPKG1 5 5 OFR001")).toThrow(
      "Expected 3 package lines but got 1"
    );
  });

  it("throws on invalid package weight", () => {
    expect(() => parseInput("100 1\nPKG1 abc 5 OFR001")).toThrow("Invalid weight");
  });

  it("throws on negative distance", () => {
    expect(() => parseInput("100 1\nPKG1 5 -10 OFR001")).toThrow("Invalid distance");
  });

  it("throws on negative base cost", () => {
    expect(() => parseInput("-50 1\nPKG1 5 10 OFR001")).toThrow("Invalid base delivery cost");
  });

  it("throws on 0 packages declared", () => {
    expect(() => parseInput("100 0")).toThrow("Invalid number of packages");
  });

  it("throws on negative package count", () => {
    expect(() => parseInput("100 -1")).toThrow("Invalid number of packages");
  });

  it("throws on fractional package count", () => {
    // parseInt("2.5", 10) = 2, so "100 2.5" parses as 2 packages.
    // With only 1 package line, it should throw "Expected 2 package lines but got 1"
    expect(() => parseInput("100 2.5\nPKG1 5 5 OFR001")).toThrow("Expected 2");
  });

  it("throws when vehicle max weight is less than the heaviest package", () => {
    expect(() => parseInput("100 2\nPKG1 50 30 NA\nPKG2 100 50 NA\n2 70 80")).toThrow(
      "Max carriable weight (80 kg) is less than the heaviest package (100 kg)"
    );
  });

  it("throws on vehicle line with 0 vehicles", () => {
    expect(() => parseInput("100 1\nPKG1 5 5 OFR001\n0 70 200")).toThrow("Invalid vehicle count");
  });

  it("throws on vehicle line with 0 speed", () => {
    expect(() => parseInput("100 1\nPKG1 5 5 OFR001\n2 0 200")).toThrow("Invalid max speed");
  });

  it("throws on vehicle line with 0 max weight", () => {
    expect(() => parseInput("100 1\nPKG1 5 5 OFR001\n2 70 0")).toThrow("Invalid max carriable weight");
  });

  it("throws on duplicate package IDs", () => {
    expect(() => parseInput("100 2\nPKG1 5 10 NA\nPKG1 10 20 NA")).toThrow('Duplicate package ID: "PKG1"');
  });

  it("throws on package line with too few fields", () => {
    expect(() => parseInput("100 1\nPKG1 5 5")).toThrow("Invalid package line");
  });

  it("throws on package line with too many fields", () => {
    expect(() => parseInput("100 1\nPKG1 5 5 OFR001 EXTRA")).toThrow("Invalid package line");
  });

  it("correctly detects Problem 1 (no vehicle line)", () => {
    const result = parseInput("100 1\nPKG1 5 5 OFR001");
    expect(result.vehicleConfig).toBeNull();
  });

  it("correctly detects Problem 2 (with vehicle line)", () => {
    const result = parseInput("100 1\nPKG1 5 5 OFR001\n2 70 200");
    expect(result.vehicleConfig).toEqual({ count: 2, maxSpeed: 70, maxWeight: 200 });
  });

  it("handles decimal base cost", () => {
    const result = parseInput("99.5 1\nPKG1 5 5 OFR001");
    expect(result.baseCost).toBe(99.5);
  });

  it("handles tabs as separators", () => {
    const input = "100\t1\nPKG1\t5\t5\tOFR001";
    const result = parseInput(input);
    expect(result.packages[0].id).toBe("PKG1");
    expect(result.packages[0].weight).toBe(5);
  });

  it("handles multiple spaces as separators", () => {
    const input = "100    1\nPKG1    5    5    OFR001";
    const result = parseInput(input);
    expect(result.packages[0].id).toBe("PKG1");
  });

  it("handles leading and trailing whitespace on lines", () => {
    const input = "  100 1  \n  PKG1 5 5 OFR001  ";
    const result = parseInput(input);
    expect(result.packages[0].id).toBe("PKG1");
  });

  it("handles Windows-style CRLF line endings", () => {
    const input = "100 1\r\nPKG1 5 5 OFR001\r\n";
    const result = parseInput(input);
    expect(result.packages[0].id).toBe("PKG1");
    expect(result.packages[0].weight).toBe(5);
  });

  it("skips empty lines interspersed in input", () => {
    const input = "100 2\n\nPKG1 5 5 OFR001\n\nPKG2 10 10 NA\n";
    const result = parseInput(input);
    expect(result.packages).toHaveLength(2);
  });

  it("handles unicode characters in package IDs", () => {
    const input = "100 1\nPKG-αβγ 5 5 NA";
    const result = parseInput(input);
    expect(result.packages[0].id).toBe("PKG-αβγ");
  });

  it("ignores extra lines after vehicle config", () => {
    const input = "100 1\nPKG1 5 5 OFR001\n2 70 200\nsome extra stuff";
    // Parser only reads up to vehicle line, extra lines are ignored
    const result = parseInput(input);
    expect(result.vehicleConfig).toEqual({ count: 2, maxSpeed: 70, maxWeight: 200 });
  });
});
