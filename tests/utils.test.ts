import { describe, it, expect } from "vitest";
import { floor2 } from "../src/libs/utils";

describe("floor2", () => {
  it("truncates to 2 decimal places without rounding up", () => {
    expect(floor2(3.456)).toBe(3.45);
  });

  it("keeps values that already have 2 or fewer decimals", () => {
    expect(floor2(1.78)).toBe(1.78);
    expect(floor2(5.5)).toBe(5.5);
    expect(floor2(10)).toBe(10);
  });

  it("handles zero", () => {
    expect(floor2(0)).toBe(0);
  });

  it("truncates long repeating decimals", () => {
    expect(floor2(100 / 70)).toBe(1.42);
    expect(floor2(125 / 70)).toBe(1.78);
    expect(floor2(95 / 70)).toBe(1.35);
    expect(floor2(30 / 70)).toBe(0.42);
    expect(floor2(60 / 70)).toBe(0.85);
  });

  it("handles very small positive values", () => {
    expect(floor2(0.001)).toBe(0);
    expect(floor2(0.009)).toBe(0);
    expect(floor2(0.01)).toBe(0.01);
  });

  it("truncates negative values toward zero (not away)", () => {
    expect(floor2(-3.456)).toBe(-3.45);
    expect(floor2(-1.999)).toBe(-1.99);
    expect(floor2(-0.001)).toBe(0);
  });

  it("handles large numbers without losing precision", () => {
    expect(floor2(999999.999)).toBe(999999.99);
    expect(floor2(100000.005)).toBe(100000);
  });

  it("handles IEEE-754 inexact sums correctly", () => {
    expect(floor2(0.1 + 0.2)).toBe(0.3);
  });
});
