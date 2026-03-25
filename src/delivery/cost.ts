import { Package, DeliveryCostResult, DiscountFn } from "../types/types";
import { round2 } from "../libs/utils";

const WEIGHT_RATE = 10;
const DISTANCE_RATE = 5;

export const calculateDeliveryCost = (
  baseCost: number,
  weight: number,
  distance: number
): number => baseCost + (weight * WEIGHT_RATE) + (distance * DISTANCE_RATE);

export const calculatePackageCost = (
  pkg: Package,
  baseCost: number,
  calculateDiscount: DiscountFn
): DeliveryCostResult => {
  const deliveryCost = calculateDeliveryCost(baseCost, pkg.weight, pkg.distance);
  const discount = calculateDiscount(deliveryCost, pkg.weight, pkg.distance, pkg.offerCode);

  return {
    packageId: pkg.id,
    discount: round2(discount),
    totalCost: round2(deliveryCost - discount),
  };
};

export const calculateAllPackageCosts = (
  packages: Package[],
  baseCost: number,
  calculateDiscount: DiscountFn
): DeliveryCostResult[] =>
  packages.map((pkg) => calculatePackageCost(pkg, baseCost, calculateDiscount));
