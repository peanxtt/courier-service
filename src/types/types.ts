export interface Package {
  id: string;
  weight: number;
  distance: number;
  offerCode: string;
}

export interface OfferCriteria {
  code: string;
  discountPercent: number;
  minDistance: number;
  maxDistance: number;
  minWeight: number;
  maxWeight: number;
}

export interface DeliveryCostResult {
  packageId: string;
  discount: number;
  totalCost: number;
}

export interface DeliveryTimeResult extends DeliveryCostResult {
  estimatedDeliveryTime: number;
}

export interface VehicleConfig {
  count: number;
  maxSpeed: number;
  maxWeight: number;
}

export interface Shipment {
  packages: Package[];
  totalWeight: number;
  maxDistance: number;
}

export interface ParsedInput {
  baseCost: number;
  packages: Package[];
  vehicleConfig: VehicleConfig | null;
}

export type DiscountFn = (
  cost: number,
  weight: number,
  distance: number,
  code: string
) => number;
