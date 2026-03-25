import { OfferCriteria, DiscountFn } from "../types/types";

const DEFAULT_OFFERS: OfferCriteria[] = [
  { code: "OFR001", discountPercent: 10, minDistance: 0,  maxDistance: 200, minWeight: 70,  maxWeight: 200 },
  { code: "OFR002", discountPercent: 7,  minDistance: 50, maxDistance: 150, minWeight: 100, maxWeight: 250 },
  { code: "OFR003", discountPercent: 5,  minDistance: 50, maxDistance: 250, minWeight: 10,  maxWeight: 150 },
];

const matchesCriteria = (offer: OfferCriteria, weight: number, distance: number): boolean => {
  const weightOk = weight >= offer.minWeight && weight <= offer.maxWeight;
  const distanceOk = distance >= offer.minDistance && distance <= offer.maxDistance;
  return weightOk && distanceOk;
};

const applyDiscount = (
  offers: OfferCriteria[],
  cost: number,
  weight: number,
  distance: number,
  code: string
): number => {
  const offer = offers.find((o) => o.code === code);
  if (!offer || !matchesCriteria(offer, weight, distance)) return 0;
  return (offer.discountPercent / 100) * cost;
};

export const buildDiscountCalculator = (offers: OfferCriteria[]): DiscountFn =>
  (cost, weight, distance, code) => applyDiscount(offers, cost, weight, distance, code);

export const defaultDiscountCalculator = buildDiscountCalculator(DEFAULT_OFFERS);
