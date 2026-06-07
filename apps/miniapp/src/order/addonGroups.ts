import addonsData from '../data/addons.json';
import type { Addon } from '../types/app';
import { normalize } from './flavorGroups';

export const allAddons = addonsData.addons as Addon[];

export const availableAddons = allAddons.filter((addon) => addon.available);

export function addonText(addon: Addon): string {
  return normalize(`${addon.category} ${addon.name}`);
}

export const dipAddons = availableAddons.filter((addon) => {
  const text = addonText(addon);
  return text.includes('dip') || text.includes('ranch') || text.includes('fireback') || text.includes('ketchup') || text.includes('comeback') || text.includes('bbq');
});

export const drizzleAddons = availableAddons.filter((addon) => addonText(addon).includes('drizzle'));

export const bottleAddons = availableAddons.filter((addon) => {
  const text = addonText(addon);
  return text.includes('bottle') || text.includes('armageddon') || text.includes('mayhem');
});

export const burgerAddons = availableAddons.filter((addon) => {
  const text = addonText(addon);
  return text.includes('cheese') || text.includes('burger') || text.includes('meal');
});

export const otherAddons = availableAddons.filter((addon) => {
  const ids = new Set([...dipAddons, ...drizzleAddons, ...bottleAddons, ...burgerAddons].map((item) => item.id));
  return !ids.has(addon.id);
});

export function getDipSauces(): string[] {
  const sauces = new Set<string>();
  dipAddons.forEach((addon) => {
    const clean = addon.name.replace(/\b(30ml|60ml|90ml)\b/gi, '').replace(/\s+/g, ' ').trim();
    sauces.add(clean);
  });
  return ['No Dip', ...Array.from(sauces).sort()];
}

export function getDipSizesForSauce(sauce: string): string[] {
  if (sauce === 'No Dip') return [];
  return dipAddons
    .filter((addon) => normalize(addon.name).includes(normalize(sauce)))
    .map((addon) => addon.name.match(/\b(30ml|60ml|90ml)\b/i)?.[1])
    .filter((size): size is string => Boolean(size))
    .sort((a, b) => Number(a.replace('ml', '')) - Number(b.replace('ml', '')));
}

export function findDipAddon(sauce: string, size: string): Addon | null {
  if (sauce === 'No Dip') return null;
  return dipAddons.find((addon) => normalize(addon.name).includes(normalize(sauce)) && normalize(addon.name).includes(normalize(size))) || null;
}
