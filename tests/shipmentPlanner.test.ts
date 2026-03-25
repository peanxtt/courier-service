import { describe, it, expect } from "vitest";
import { planShipments } from "../src/delivery/planner";
import { Package } from "../src/types/types";

describe("planShipments", () => {
  it("plans shipments for the PDF Problem 2 sample", () => {
    const packages: Package[] = [
      { id: "PKG1", weight: 50, distance: 30, offerCode: "OFR001" },
      { id: "PKG2", weight: 75, distance: 125, offerCode: "OFR008" },
      { id: "PKG3", weight: 175, distance: 100, offerCode: "OFR003" },
      { id: "PKG4", weight: 110, distance: 60, offerCode: "OFR002" },
      { id: "PKG5", weight: 155, distance: 95, offerCode: "NA" },
    ];

    const shipments = planShipments(packages, 200);

    expect(shipments[0].packages.map((p) => p.id).sort()).toEqual(["PKG2", "PKG4"]);
    expect(shipments[0].totalWeight).toBe(185);

    expect(shipments[1].packages.map((p) => p.id)).toEqual(["PKG3"]);
    expect(shipments[1].totalWeight).toBe(175);

    expect(shipments[2].packages.map((p) => p.id)).toEqual(["PKG5"]);
    expect(shipments[2].totalWeight).toBe(155);

    expect(shipments[3].packages.map((p) => p.id)).toEqual(["PKG1"]);
    expect(shipments[3].totalWeight).toBe(50);
  });

  it("returns empty when no packages given", () => {
    expect(planShipments([], 200)).toEqual([]);
  });

  it("handles single package", () => {
    const packages: Package[] = [
      { id: "P1", weight: 50, distance: 10, offerCode: "NA" },
    ];
    const shipments = planShipments(packages, 200);
    expect(shipments).toHaveLength(1);
    expect(shipments[0].packages.map((p) => p.id)).toEqual(["P1"]);
  });

  it("groups all packages into one shipment when total fits", () => {
    const packages: Package[] = [
      { id: "P1", weight: 50, distance: 10, offerCode: "NA" },
      { id: "P2", weight: 50, distance: 20, offerCode: "NA" },
      { id: "P3", weight: 50, distance: 30, offerCode: "NA" },
    ];
    const shipments = planShipments(packages, 200);
    expect(shipments).toHaveLength(1);
    expect(shipments[0].packages).toHaveLength(3);
  });

  it("prefers heavier shipment when package count is tied", () => {
    const packages: Package[] = [
      { id: "P1", weight: 80, distance: 10, offerCode: "NA" },
      { id: "P2", weight: 90, distance: 10, offerCode: "NA" },
      { id: "P3", weight: 100, distance: 10, offerCode: "NA" },
    ];
    const shipments = planShipments(packages, 180);
    expect(shipments[0].packages.map((p) => p.id).sort()).toEqual(["P1", "P3"]);
    expect(shipments[0].totalWeight).toBe(180);
  });

  it("prefers shipment deliverable first when count and weight tie", () => {
    const packages: Package[] = [
      { id: "P1", weight: 50, distance: 100, offerCode: "NA" },
      { id: "P2", weight: 50, distance: 50, offerCode: "NA" },
      { id: "P3", weight: 50, distance: 200, offerCode: "NA" },
      { id: "P4", weight: 50, distance: 30, offerCode: "NA" },
    ];
    const shipments = planShipments(packages, 100);
    expect(shipments[0].packages.map((p) => p.id).sort()).toEqual(["P2", "P4"]);
  });

  describe("overweight packages", () => {
    it("throws when a package exceeds max carriable weight", () => {
      const packages: Package[] = [
        { id: "P1", weight: 50, distance: 10, offerCode: "NA" },
        { id: "P2", weight: 250, distance: 20, offerCode: "NA" },
      ];
      expect(() => planShipments(packages, 200)).toThrow("P2");
    });

    it("throws when all packages exceed max carriable weight", () => {
      const packages: Package[] = [
        { id: "P1", weight: 300, distance: 10, offerCode: "NA" },
        { id: "P2", weight: 250, distance: 20, offerCode: "NA" },
      ];
      expect(() => planShipments(packages, 200)).toThrow();
    });

    it("includes all overweight package IDs in the error message", () => {
      const packages: Package[] = [
        { id: "A", weight: 300, distance: 10, offerCode: "NA" },
        { id: "B", weight: 50, distance: 10, offerCode: "NA" },
        { id: "C", weight: 400, distance: 10, offerCode: "NA" },
      ];
      expect(() => planShipments(packages, 200)).toThrow("A, C");
    });
  });

  describe("weight boundary edge cases", () => {
    it("accepts package at exactly max weight", () => {
      const packages: Package[] = [
        { id: "P1", weight: 200, distance: 10, offerCode: "NA" },
      ];
      const shipments = planShipments(packages, 200);
      expect(shipments).toHaveLength(1);
      expect(shipments[0].totalWeight).toBe(200);
    });

    it("each package at max weight gets its own shipment", () => {
      const packages: Package[] = [
        { id: "P1", weight: 200, distance: 10, offerCode: "NA" },
        { id: "P2", weight: 200, distance: 20, offerCode: "NA" },
        { id: "P3", weight: 200, distance: 30, offerCode: "NA" },
      ];
      const shipments = planShipments(packages, 200);
      expect(shipments).toHaveLength(3);
      shipments.forEach((s) => expect(s.packages).toHaveLength(1));
    });

    it("two packages individually fit but together exceed limit", () => {
      const packages: Package[] = [
        { id: "P1", weight: 120, distance: 10, offerCode: "NA" },
        { id: "P2", weight: 120, distance: 20, offerCode: "NA" },
      ];
      const shipments = planShipments(packages, 200);
      expect(shipments).toHaveLength(2);
    });

    it("total weight exactly equals max weight (included, not excluded)", () => {
      const packages: Package[] = [
        { id: "P1", weight: 100, distance: 10, offerCode: "NA" },
        { id: "P2", weight: 100, distance: 20, offerCode: "NA" },
      ];
      const shipments = planShipments(packages, 200);
      expect(shipments).toHaveLength(1);
      expect(shipments[0].totalWeight).toBe(200);
    });
  });

  describe("special weight/distance values", () => {
    it("handles package with weight 0", () => {
      const packages: Package[] = [
        { id: "P1", weight: 0, distance: 100, offerCode: "NA" },
        { id: "P2", weight: 100, distance: 50, offerCode: "NA" },
      ];
      const shipments = planShipments(packages, 200);
      expect(shipments).toHaveLength(1);
      expect(shipments[0].packages).toHaveLength(2);
    });

    it("handles package with distance 0", () => {
      const packages: Package[] = [
        { id: "P1", weight: 50, distance: 0, offerCode: "NA" },
      ];
      const shipments = planShipments(packages, 200);
      expect(shipments).toHaveLength(1);
      expect(shipments[0].maxDistance).toBe(0);
    });

    it("handles many packages of identical weight and distance", () => {
      const packages: Package[] = Array.from({ length: 6 }, (_, i) => ({
        id: `P${i + 1}`,
        weight: 50,
        distance: 100,
        offerCode: "NA",
      }));
      // max 200 => 4 packages per shipment
      const shipments = planShipments(packages, 200);
      expect(shipments[0].packages).toHaveLength(4);
      expect(shipments[1].packages).toHaveLength(2);
    });
  });
});
