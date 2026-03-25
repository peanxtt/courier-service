import { describe, it, expect } from "vitest";
import { estimateDeliveryTimes } from "../src/delivery/scheduler";
import { defaultDiscountCalculator } from "../src/delivery/offers";
import { Package, VehicleConfig } from "../src/types/types";

describe("estimateDeliveryTimes", () => {
  const calculateDiscount = defaultDiscountCalculator;

  it("matches the full PDF Problem 2 sample", () => {
    const packages: Package[] = [
      { id: "PKG1", weight: 50, distance: 30, offerCode: "OFR001" },
      { id: "PKG2", weight: 75, distance: 125, offerCode: "OFR008" },
      { id: "PKG3", weight: 175, distance: 100, offerCode: "OFR003" },
      { id: "PKG4", weight: 110, distance: 60, offerCode: "OFR002" },
      { id: "PKG5", weight: 155, distance: 95, offerCode: "NA" },
    ];
    const vehicleConfig: VehicleConfig = { count: 2, maxSpeed: 70, maxWeight: 200 };

    const results = estimateDeliveryTimes(packages, 100, vehicleConfig, calculateDiscount);

    const byId = new Map(results.map((r) => [r.packageId, r]));

    expect(byId.get("PKG1")).toEqual({
      packageId: "PKG1",
      discount: 0,
      totalCost: 750,
      estimatedDeliveryTime: 3.98,
    });
    expect(byId.get("PKG2")).toEqual({
      packageId: "PKG2",
      discount: 0,
      totalCost: 1475,
      estimatedDeliveryTime: 1.78,
    });
    expect(byId.get("PKG3")).toEqual({
      packageId: "PKG3",
      discount: 0,
      totalCost: 2350,
      estimatedDeliveryTime: 1.42,
    });
    expect(byId.get("PKG4")).toEqual({
      packageId: "PKG4",
      discount: 105,
      totalCost: 1395,
      estimatedDeliveryTime: 0.85,
    });
    expect(byId.get("PKG5")).toEqual({
      packageId: "PKG5",
      discount: 0,
      totalCost: 2125,
      estimatedDeliveryTime: 4.19,
    });
  });

  it("handles single vehicle scenario", () => {
    const packages: Package[] = [
      { id: "P1", weight: 50, distance: 70, offerCode: "NA" },
      { id: "P2", weight: 50, distance: 140, offerCode: "NA" },
    ];
    const vehicleConfig: VehicleConfig = { count: 1, maxSpeed: 70, maxWeight: 200 };
    const results = estimateDeliveryTimes(packages, 100, vehicleConfig, calculateDiscount);

    const byId = new Map(results.map((r) => [r.packageId, r]));
    expect(byId.get("P1")!.estimatedDeliveryTime).toBe(1);
    expect(byId.get("P2")!.estimatedDeliveryTime).toBe(2);
  });

  it("handles single package", () => {
    const packages: Package[] = [
      { id: "P1", weight: 50, distance: 100, offerCode: "NA" },
    ];
    const vehicleConfig: VehicleConfig = { count: 2, maxSpeed: 50, maxWeight: 200 };
    const results = estimateDeliveryTimes(packages, 100, vehicleConfig, calculateDiscount);
    expect(results[0].estimatedDeliveryTime).toBe(2);
  });

  describe("vehicle utilization edge cases", () => {
    it("more vehicles than packages leaves extra vehicles unused", () => {
      const packages: Package[] = [
        { id: "P1", weight: 50, distance: 100, offerCode: "NA" },
      ];
      const vehicleConfig: VehicleConfig = { count: 5, maxSpeed: 100, maxWeight: 200 };
      const results = estimateDeliveryTimes(packages, 0, vehicleConfig, calculateDiscount);
      expect(results[0].estimatedDeliveryTime).toBe(1);
    });

    it("more vehicles than shipments uses only what's needed", () => {
      const packages: Package[] = [
        { id: "P1", weight: 50, distance: 100, offerCode: "NA" },
        { id: "P2", weight: 50, distance: 200, offerCode: "NA" },
      ];
      const vehicleConfig: VehicleConfig = { count: 10, maxSpeed: 100, maxWeight: 200 };
      const results = estimateDeliveryTimes(packages, 0, vehicleConfig, calculateDiscount);
      const byId = new Map(results.map((r) => [r.packageId, r]));
      // Both fit in one shipment, delivered by one vehicle
      expect(byId.get("P1")!.estimatedDeliveryTime).toBe(1);
      expect(byId.get("P2")!.estimatedDeliveryTime).toBe(2);
    });
  });

  describe("distance edge cases", () => {
    it("package at distance 0 has delivery time equal to vehicle start time", () => {
      const packages: Package[] = [
        { id: "P1", weight: 50, distance: 0, offerCode: "NA" },
      ];
      const vehicleConfig: VehicleConfig = { count: 1, maxSpeed: 70, maxWeight: 200 };
      const results = estimateDeliveryTimes(packages, 100, vehicleConfig, calculateDiscount);
      expect(results[0].estimatedDeliveryTime).toBe(0);
    });

    it("all packages same distance produces correct times", () => {
      const packages: Package[] = [
        { id: "P1", weight: 100, distance: 70, offerCode: "NA" },
        { id: "P2", weight: 100, distance: 70, offerCode: "NA" },
        { id: "P3", weight: 100, distance: 70, offerCode: "NA" },
      ];
      // max 200 => 2 per shipment. P1+P2 first (count=2), P3 second.
      const vehicleConfig: VehicleConfig = { count: 1, maxSpeed: 70, maxWeight: 200 };
      const results = estimateDeliveryTimes(packages, 0, vehicleConfig, calculateDiscount);
      const byId = new Map(results.map((r) => [r.packageId, r]));
      // Shipment 1: P1+P2, time = floor2(70/70) = 1.0 each. Vehicle returns at 2*1=2
      expect(byId.get("P1")!.estimatedDeliveryTime).toBe(1);
      expect(byId.get("P2")!.estimatedDeliveryTime).toBe(1);
      // Shipment 2: P3, start=2, time = 2 + 1 = 3
      expect(byId.get("P3")!.estimatedDeliveryTime).toBe(3);
    });
  });

  describe("speed edge cases", () => {
    it("speed that divides distance evenly produces exact times", () => {
      const packages: Package[] = [
        { id: "P1", weight: 50, distance: 100, offerCode: "NA" },
      ];
      const vehicleConfig: VehicleConfig = { count: 1, maxSpeed: 50, maxWeight: 200 };
      const results = estimateDeliveryTimes(packages, 0, vehicleConfig, calculateDiscount);
      expect(results[0].estimatedDeliveryTime).toBe(2);
    });

    it("very fast speed produces small delivery times", () => {
      const packages: Package[] = [
        { id: "P1", weight: 50, distance: 10, offerCode: "NA" },
      ];
      const vehicleConfig: VehicleConfig = { count: 1, maxSpeed: 1000, maxWeight: 200 };
      const results = estimateDeliveryTimes(packages, 0, vehicleConfig, calculateDiscount);
      // 10 / 1000 = 0.01
      expect(results[0].estimatedDeliveryTime).toBe(0.01);
    });
  });

  describe("sequential delivery with single vehicle", () => {
    it("single vehicle delivers multiple shipments sequentially", () => {
      const packages: Package[] = [
        { id: "P1", weight: 150, distance: 100, offerCode: "NA" },
        { id: "P2", weight: 150, distance: 50, offerCode: "NA" },
        { id: "P3", weight: 150, distance: 75, offerCode: "NA" },
      ];
      // 1 vehicle, max 150: one package per shipment
      // Shipment order by weight tie => sorted by distance (shortest first)
      const vehicleConfig: VehicleConfig = { count: 1, maxSpeed: 50, maxWeight: 150 };
      const results = estimateDeliveryTimes(packages, 0, vehicleConfig, calculateDiscount);
      const byId = new Map(results.map((r) => [r.packageId, r]));

      // All same weight (150). Sorted by distance: P2(50), P3(75), P1(100)
      // Shipment 1: P2, time=floor2(50/50)=1.0. Vehicle back at 2*1=2
      expect(byId.get("P2")!.estimatedDeliveryTime).toBe(1);
      // Shipment 2: P3, time=2+floor2(75/50)=2+1.5=3.5. Vehicle back at 2+2*1.5=5
      expect(byId.get("P3")!.estimatedDeliveryTime).toBe(3.5);
      // Shipment 3: P1, time=5+floor2(100/50)=5+2=7. Vehicle back at 5+4=9
      expect(byId.get("P1")!.estimatedDeliveryTime).toBe(7);
    });
  });

  describe("output preserves input order", () => {
    it("returns results in the same order as input packages", () => {
      const packages: Package[] = [
        { id: "Z", weight: 50, distance: 10, offerCode: "NA" },
        { id: "A", weight: 50, distance: 20, offerCode: "NA" },
        { id: "M", weight: 50, distance: 15, offerCode: "NA" },
      ];
      const vehicleConfig: VehicleConfig = { count: 2, maxSpeed: 50, maxWeight: 200 };
      const results = estimateDeliveryTimes(packages, 0, vehicleConfig, calculateDiscount);
      expect(results.map((r) => r.packageId)).toEqual(["Z", "A", "M"]);
    });
  });
});
