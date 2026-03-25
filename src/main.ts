import { parseInput } from "./cli/parser";
import { defaultDiscountCalculator } from "./delivery/offers";
import { calculateAllPackageCosts } from "./delivery/cost";
import { estimateDeliveryTimes } from "./delivery/scheduler";
import { runInteractive } from "./cli/prompts";

const readStdin = (): Promise<string> =>
  new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });

const runPiped = async (): Promise<void> => {
  const input = await readStdin();
  const { baseCost, packages, vehicleConfig } = parseInput(input);
  if (vehicleConfig) {
    const results = estimateDeliveryTimes(packages, baseCost, vehicleConfig, defaultDiscountCalculator);
    for (const r of results) {
      console.log(`${r.packageId} ${r.discount} ${r.totalCost} ${r.estimatedDeliveryTime}`);
    }
  } else {
    const results = calculateAllPackageCosts(packages, baseCost, defaultDiscountCalculator);
    for (const r of results) {
      console.log(`${r.packageId} ${r.discount} ${r.totalCost}`);
    }
  }
};

const main = async (): Promise<void> => {
  if (process.stdin.isTTY) {
    await runInteractive();
  } else {
    await runPiped();
  }
};

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
