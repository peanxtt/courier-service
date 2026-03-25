import { Package, Shipment } from "../types/types";

/**
 * Returns all non-empty combinations of `packages` whose total weight fits
 * within `maxWeight` (O(2^n) combinations).
 */
const getValidShipmentCandidates = (packages: Package[], maxWeight: number): Shipment[] => {
  const candidates = packages
    .reduce<Package[][]>((subsets, pkg) => [...subsets, ...subsets.map((s) => [...s, pkg])], [[]])
    .filter((selected) => selected.length > 0)
    .map((selected) => ({
      packages: selected,
      totalWeight: selected.reduce((sum, p) => sum + p.weight, 0),
      maxDistance: Math.max(...selected.map((p) => p.distance)),
    }))
    .filter((shipment) => shipment.totalWeight <= maxWeight);

  return candidates;
}

/**
 * Picks the best shipment from remaining packages using a 3-tier sort:
 * 1. Most packages (maximise utilisation)
 * 2. Heaviest total weight (maximise payload)
 * 3. Shortest max distance (return sooner)
 */
const selectBestShipment = (packages: Package[], maxWeight: number): Shipment | null => {
  const subsets = getValidShipmentCandidates(packages, maxWeight);
  if (subsets.length === 0) return null;

  subsets.sort((a, b) => {
    if (b.packages.length !== a.packages.length) return b.packages.length - a.packages.length;
    if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight;
    return a.maxDistance - b.maxDistance;
  });

  return subsets[0];
};

export const planShipments = (packages: Package[], maxWeight: number): Shipment[] => {
  const overweight = packages.filter((p) => p.weight > maxWeight);
  if (overweight.length > 0) {
    const ids = overweight.map((p) => p.id).join(", ");
    throw new Error(`Package(s) exceed max carriable weight of ${maxWeight}kg: ${ids}`);
  }

  const shipments: Shipment[] = [];
  let remaining = [...packages];

  while (remaining.length > 0) {
    const shipment = selectBestShipment(remaining, maxWeight);
    if (!shipment) break;

    shipments.push(shipment);
    const shippedIds = new Set(shipment.packages.map((p) => p.id));
    remaining = remaining.filter((p) => !shippedIds.has(p.id));
  }

  return shipments;
};
