import * as readline from "readline";
import { Package, VehicleConfig } from "../types/types";
import { defaultDiscountCalculator, DEFAULT_OFFERS } from "../delivery/offers";
import { calculateAllPackageCosts } from "../delivery/cost";
import { estimateDeliveryTimes } from "../delivery/scheduler";
import { printCostResults, printTimeResults } from "./display";

const createRL = (): readline.Interface =>
  readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (rl: readline.Interface, question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));

const askNumber = async (
  rl: readline.Interface,
  prompt: string,
  validate: (n: number) => string | null
): Promise<number> => {
  while (true) {
    const raw = await ask(rl, prompt);
    const n = parseFloat(raw);
    if (isNaN(n)) { console.log(`  ✗  Please enter a valid number.`); continue; }
    const err = validate(n);
    if (err) { console.log(`  ✗  ${err}`); continue; }
    return n;
  }
};

const askInt = async (
  rl: readline.Interface,
  prompt: string,
  validate: (n: number) => string | null
): Promise<number> => {
  while (true) {
    const raw = await ask(rl, prompt);
    const n = parseInt(raw, 10);
    if (isNaN(n)) { console.log(`  ✗  Please enter a whole number.`); continue; }
    const err = validate(n);
    if (err) { console.log(`  ✗  ${err}`); continue; }
    return n;
  }
};

const printOfferTable = (): void => {
  console.log(`    Available offers:`);
  for (const offer of DEFAULT_OFFERS) {
    console.log(`    ${offer.code}  ${offer.discountPercent}% off  |  weight ${offer.minWeight}–${offer.maxWeight} kg,  distance ${offer.minDistance}–${offer.maxDistance} km`);
  }
  console.log(`    (enter NA if no offer applies)`);
};

const collectPackages = async (rl: readline.Interface, count: number): Promise<Package[]> => {
  const packages: Package[] = [];
  for (let i = 1; i <= count; i++) {
    console.log(`\n  Package ${i} of ${count}`);

    const id = await ask(rl, `    Package ID          : `);
    if (!id) { console.log(`  ✗  ID cannot be empty.`); i--; continue; }

    const weight   = await askNumber(rl, `    Weight (kg)         : `, (n) => n < 0 ? "Weight must be >= 0." : null);
    const distance = await askNumber(rl, `    Distance (km)       : `, (n) => n < 0 ? "Distance must be >= 0." : null);

    console.log();
    printOfferTable();
    const rawCode = await ask(rl, `    Offer code          : `);

    packages.push({ id, weight, distance, offerCode: rawCode || "NA" });
  }
  return packages;
};

const collectVehicleConfig = async (rl: readline.Interface): Promise<VehicleConfig> => {
  console.log(`\n  Vehicle Fleet Configuration`);
  const count     = await askInt(rl,    `    Number of vehicles  : `, (n) => n < 1 ? "Must have at least 1 vehicle." : null);
  const maxSpeed  = await askNumber(rl, `    Max speed (km/hr)   : `, (n) => n <= 0 ? "Speed must be > 0." : null);
  const maxWeight = await askNumber(rl, `    Max carriable wt(kg): `, (n) => n <= 0 ? "Max weight must be > 0." : null);
  return { count, maxSpeed, maxWeight };
};

export const runInteractive = async (): Promise<void> => {
  const rl = createRL();

  console.log();
  console.log(`  ╔══════════════════════════════════════════════════════╗`);
  console.log(`  ║         Kiki's Courier Service — Estimator           ║`);
  console.log(`  ╚══════════════════════════════════════════════════════╝`);
  console.log();
  console.log(`  Which problem would you like to solve?`);
  console.log(`  1. Delivery Cost Estimation     (discount calculation)`);
  console.log(`  2. Delivery Time Estimation     (scheduling + cost)`);
  console.log();

  let mode: 1 | 2 | null = null;
  while (mode === null) {
    const choice = await ask(rl, "  Enter 1 or 2: ");
    if (choice === "1") mode = 1;
    else if (choice === "2") mode = 2;
    else console.log(`  ✗  Please enter 1 or 2.`);
  }

  console.log();
  console.log(`  Order Details`);

  const baseCost    = await askNumber(rl, `    Base delivery cost  : `, (n) => n < 0 ? "Base cost must be >= 0." : null);
  const numPackages = await askInt(rl,    `    Number of packages  : `, (n) => n < 1 ? "Must have at least 1 package." : null);
  const packages    = await collectPackages(rl, numPackages);

  if (mode === 1) {
    rl.close();
    printCostResults(calculateAllPackageCosts(packages, baseCost, defaultDiscountCalculator));
  } else {
    const vehicleConfig = await collectVehicleConfig(rl);
    rl.close();
    try {
      printTimeResults(estimateDeliveryTimes(packages, baseCost, vehicleConfig, defaultDiscountCalculator));
    } catch (err: unknown) {
      console.error(`\n  ✗  ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
  }

  console.log(`  Tip: pipe a file to skip prompts:  npx tsx src/main.ts < input.txt`);
  console.log();
};
