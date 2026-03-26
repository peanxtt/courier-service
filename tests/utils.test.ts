import { describe, it, expect } from "vitest";
import { roundDown, roundUp } from "../src/libs/utils";

describe("roundDown", () => {
  it("truncates to 2 decimal places without rounding up", () => {
    expect(roundDown(3.456)).toBe(3.45);
  });

  it("keeps values that already have 2 or fewer decimals", () => {
    expect(roundDown(1.78)).toBe(1.78);
    expect(roundDown(5.5)).toBe(5.5);
    expect(roundDown(10)).toBe(10);
  });

  it("handles zero", () => {
    expect(roundDown(0)).toBe(0);
  });

  it("truncates long repeating decimals", () => {
    expect(roundDown(100 / 70)).toBe(1.42);
    expect(roundDown(125 / 70)).toBe(1.78);
    expect(roundDown(95 / 70)).toBe(1.35);
    expect(roundDown(30 / 70)).toBe(0.42);
    expect(roundDown(60 / 70)).toBe(0.85);
  });

  it("handles very small positive values", () => {
    expect(roundDown(0.001)).toBe(0);
    expect(roundDown(0.009)).toBe(0);
    expect(roundDown(0.01)).toBe(0.01);
  });

  it("handles large numbers without losing precision", () => {
    expect(roundDown(999999.999)).toBe(999999.99);
    expect(roundDown(100000.005)).toBe(100000);
  });

  it("handles IEEE-754 inexact sums correctly", () => {
    expect(roundDown(0.1 + 0.2)).toBe(0.3);
  });
});

describe("roundUp", () => {
  it("rounds up when the third decimal is >= 5", () => {
    expect(roundUp(3.456)).toBe(3.46);
    expect(roundUp(1234.567)).toBe(1234.57);
  });

  it("rounds down when the third decimal is < 5", () => {
    expect(roundUp(3.454)).toBe(3.45);
    expect(roundUp(9999.994)).toBe(9999.99);
  });

  it("handles zero", () => {
    expect(roundUp(0)).toBe(0);
  });

  it("keeps values already at 2 or fewer decimal places", () => {
    expect(roundUp(4.5)).toBe(4.5);
    expect(roundUp(10)).toBe(10);
    expect(roundUp(3.14)).toBe(3.14);
  });

  it("IEEE-754: 1.005 rounds down to 1 because it is stored as 1.00499...", () => {
    // 1.005 cannot be represented exactly — V8 stores it as ~1.004999999999999945
    // so 1.005 * 100 < 100.5, and Math.round rounds down
    expect(roundUp(1.005)).toBe(1);
  });
});
