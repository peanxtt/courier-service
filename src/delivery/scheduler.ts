import { Package, VehicleConfig, DeliveryCostResult, DeliveryTimeResult, Shipment, DiscountFn } from "../types/types";
import { roundDown } from "../libs/utils";
import { calculatePackageCost } from "./cost";
import { planShipments } from "./planner";

/**
 * Centihour helpers: convert truncated hour values to integers (×100) for
 * all accumulation arithmetic, preventing floating-point drift (e.g. 2.84 + 1.35 ≠ 4.19).
 */
const toCenti = (hours: number): number => Math.round(hours * 100);
const fromCenti = (centi: number): number => centi / 100;

const buildCostMap = (
  packages: Package[],
  baseCost: number,
  calculateDiscount: DiscountFn
): Map<string, DeliveryCostResult> => {
  const map = new Map<string, DeliveryCostResult>();
  for (const pkg of packages) {
    map.set(pkg.id, calculatePackageCost(pkg, baseCost, calculateDiscount));
  }
  return map;
};

const scheduleShipments = (
  shipments: Shipment[],
  vehicleCount: number,
  maxSpeed: number
): Map<string, number> => {
  const vehicleAvailableCenti = new Array<number>(vehicleCount).fill(0);
  const deliveryTimeCenti = new Map<string, number>();

  for (const shipment of shipments) {
    vehicleAvailableCenti.sort((a, b) => a - b);
    const startCenti = vehicleAvailableCenti[0];

    const oneWayTime = roundDown(shipment.maxDistance / maxSpeed);
    const roundTripCenti = 2 * toCenti(oneWayTime);

    for (const pkg of shipment.packages) {
      const pkgTime = roundDown(pkg.distance / maxSpeed);
      deliveryTimeCenti.set(pkg.id, startCenti + toCenti(pkgTime));
    }

    vehicleAvailableCenti[0] = startCenti + roundTripCenti;
  }

  return deliveryTimeCenti;
};

const assembleResults = (
  packages: Package[],
  costMap: Map<string, DeliveryCostResult>,
  timeMap: Map<string, number>
): DeliveryTimeResult[] =>
  // Both maps are built from the same packages array, so all lookups are always defined.
  packages.map((pkg) => ({
    ...costMap.get(pkg.id)!,
    estimatedDeliveryTime: fromCenti(timeMap.get(pkg.id)!),
  }));

export const estimateDeliveryTimes = (
  packages: Package[],
  baseCost: number,
  vehicleConfig: VehicleConfig,
  calculateDiscount: DiscountFn
): DeliveryTimeResult[] => {
  const { count: vehicleCount, maxSpeed, maxWeight } = vehicleConfig;

  const costMap = buildCostMap(packages, baseCost, calculateDiscount);
  const shipments = planShipments(packages, maxWeight);
  const timeMap = scheduleShipments(shipments, vehicleCount, maxSpeed);

  return assembleResults(packages, costMap, timeMap);
};
