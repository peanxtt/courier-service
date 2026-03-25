import { DeliveryCostResult, DeliveryTimeResult } from "../types/types";

const BORDER = "─".repeat(54);

const col  = (s: string | number, width: number): string => String(s).padEnd(width);
const rCol = (s: string | number, width: number): string => String(s).padStart(width);

export const printCostResults = (results: DeliveryCostResult[]): void => {
  console.log();
  console.log(`  Delivery Cost Results`);
  console.log(`  ${BORDER}`);
  console.log(`  ${col("Package", 12)} ${rCol("Discount", 12)} ${rCol("Total Cost", 12)}`);
  console.log(`  ${BORDER}`);
  for (const r of results) {
    console.log(`  ${col(r.packageId, 12)} ${rCol(r.discount, 12)} ${rCol(r.totalCost, 12)}`);
  }
  console.log(`  ${BORDER}`);
  console.log();
};

export const printTimeResults = (results: DeliveryTimeResult[]): void => {
  console.log();
  console.log(`  Delivery Cost & Time Results`);
  console.log(`  ${BORDER}`);
  console.log(`  ${col("Package", 12)} ${rCol("Discount", 12)} ${rCol("Total Cost", 12)} ${rCol("Est. Time", 12)}`);
  console.log(`  ${BORDER}`);
  for (const r of results) {
    console.log(`  ${col(r.packageId, 12)} ${rCol(r.discount, 12)} ${rCol(r.totalCost, 12)} ${rCol(r.estimatedDeliveryTime + " hr", 12)}`);
  }
  console.log(`  ${BORDER}`);
  console.log();
};
