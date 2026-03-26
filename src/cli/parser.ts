import { Package, VehicleConfig, ParsedInput } from "../types/types";

const parseHeader = (line: string): { baseCost: number; numPackages: number } => {
  const parts = line.split(/\s+/);
  if (parts.length !== 2) {
    throw new Error(`Invalid header: expected "base_delivery_cost no_of_packages", got "${line}"`);
  }

  const baseCost = parseFloat(parts[0]);
  const numPackages = parseInt(parts[1], 10);

  if (!isFinite(baseCost) || baseCost < 0) throw new Error(`Invalid base delivery cost: ${parts[0]}`);
  if (isNaN(numPackages) || numPackages < 1) throw new Error(`Invalid number of packages: ${parts[1]}`);

  return { baseCost, numPackages };
};

const parsePackageLine = (line: string, lineIndex: number): Package => {
  const parts = line.split(/\s+/);
  if (parts.length !== 4) {
    throw new Error(`Invalid package line ${lineIndex}: expected "id weight distance offer_code", got "${line}"`);
  }

  const weight = parseFloat(parts[1]);
  const distance = parseFloat(parts[2]);

  if (!isFinite(weight) || weight < 0) throw new Error(`Invalid weight for package ${parts[0]}: ${parts[1]}`);
  if (!isFinite(distance) || distance < 0) throw new Error(`Invalid distance for package ${parts[0]}: ${parts[2]}`);

  return { id: parts[0], weight, distance, offerCode: parts[3] };
};

const parsePackages = (lines: string[], numPackages: number): Package[] => {
  if (lines.length < 1 + numPackages) {
    throw new Error(`Expected ${numPackages} package lines but got ${lines.length - 1}`);
  }

  const packages = lines.slice(1, 1 + numPackages).map((line, i) => parsePackageLine(line, i + 1));

  const seenIds = new Set<string>();
  for (const pkg of packages) {
    if (seenIds.has(pkg.id)) throw new Error(`Duplicate package ID: "${pkg.id}"`);
    seenIds.add(pkg.id);
  }

  return packages;
};

const parseVehicleConfig = (line: string): VehicleConfig => {
  const parts = line.split(/\s+/);
  if (parts.length !== 3) {
    throw new Error(`Invalid vehicle line: expected "count speed max_weight", got "${line}"`);
  }

  const count = parseInt(parts[0], 10);
  const maxSpeed = parseFloat(parts[1]);
  const maxWeight = parseFloat(parts[2]);

  if (isNaN(count) || count < 1) throw new Error(`Invalid vehicle count: ${parts[0]}`);
  if (!isFinite(maxSpeed) || maxSpeed <= 0) throw new Error(`Invalid max speed: ${parts[1]}`);
  if (!isFinite(maxWeight) || maxWeight <= 0) throw new Error(`Invalid max carriable weight: ${parts[2]}`);

  return { count, maxSpeed, maxWeight };
};

export const parseInput = (input: string): ParsedInput => {
  const lines = input.trim().split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 1) throw new Error("Input is empty");

  const { baseCost, numPackages } = parseHeader(lines[0]);
  const packages = parsePackages(lines, numPackages);

  const vehicleLineIndex = 1 + numPackages;
  const vehicleConfig = vehicleLineIndex < lines.length
    ? parseVehicleConfig(lines[vehicleLineIndex])
    : null;

  if (vehicleConfig) {
    const heaviest = Math.max(...packages.map((p) => p.weight));
    if (vehicleConfig.maxWeight < heaviest) {
      throw new Error(`Max carriable weight (${vehicleConfig.maxWeight} kg) is less than the heaviest package (${heaviest} kg)`);
    }
  }

  return { baseCost, packages, vehicleConfig };
};
