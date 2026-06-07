import flavorsData from '../data/flavors.json';
import type { Flavor } from '../types/app';

export function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const coreFlavorNames = [
  'Buffalo',
  'Sweet Heat BBQ',
  'Homemade BBQ',
  'BBQ',
  'Honey Garlic',
  'Honey Teriyaki',
  'Honeyaki',
  'Khmer Chili',
  'Korean Yangnyeom',
  'Korean Glaze',
  'Jerk',
  'Jamaican Jerk',
  'Fire Storm',
  'Firestorm',
];

export const allWingFlavors = (flavorsData.flavors as Flavor[]).filter((flavor) => flavor.includedAsWingFlavor !== false);

export function isDryRub(flavor: Flavor): boolean {
  const text = normalize(`${flavor.type} ${flavor.name}`);
  return text.includes('dry') || text.includes('rub') || text.includes('dust') || text.includes('cajun');
}

function coreRank(flavor: Flavor): number {
  const name = normalize(flavor.name);
  const exact = coreFlavorNames.findIndex((label) => normalize(label) === name);
  if (exact >= 0) return exact;
  const partial = coreFlavorNames.findIndex((label) => name.includes(normalize(label)) || normalize(label).includes(name));
  return partial >= 0 ? partial : 999;
}

export const coreFlavors = allWingFlavors
  .filter((flavor) => flavor.available && !isDryRub(flavor) && coreRank(flavor) < 999)
  .sort((a, b) => coreRank(a) - coreRank(b) || (a.number || 999) - (b.number || 999));

export const dryRubFlavors = allWingFlavors
  .filter((flavor) => flavor.available && isDryRub(flavor))
  .sort((a, b) => (a.number || 999) - (b.number || 999));

export const expertFlavors = allWingFlavors
  .filter((flavor) => flavor.available && !isDryRub(flavor) && coreRank(flavor) === 999)
  .sort((a, b) => (a.number || 999) - (b.number || 999));

export const unavailableFlavors = allWingFlavors
  .filter((flavor) => !flavor.available)
  .sort((a, b) => (a.number || 999) - (b.number || 999));
