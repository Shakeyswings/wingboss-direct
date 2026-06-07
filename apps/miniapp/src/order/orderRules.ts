import type { MenuItem } from '../types/app';

export function isWingItem(item: MenuItem): boolean {
  return item.categoryId === 'classic_wings' || item.categoryId === 'boneless_wings';
}

export function isBurgerItem(item: MenuItem): boolean {
  return item.categoryId === 'burgers';
}

export function isFriesItem(item: MenuItem): boolean {
  return item.categoryId === 'fries_sides';
}

export function isPartyTray(item: MenuItem): boolean {
  return item.categoryId === 'party_trays';
}

export function needsHeatTier(item: MenuItem): boolean {
  return isWingItem(item) || isPartyTray(item);
}

export function needsFlavor(item: MenuItem): boolean {
  return Boolean(item.requiresFlavor);
}
