import heatSystem from '../data/heat-system.json';
import type { Addon, HeatTier, OrderLine } from '../types/app';
import { isVerifiedPrice } from './price';

const tiers = (heatSystem.heatTiers || []) as HeatTier[];

export function getHeatTiers(): HeatTier[] {
  return tiers.filter((tier) => tier.customerFacing && tier.available);
}

export function getHeatTier(id: string): HeatTier {
  return tiers.find((tier) => tier.id === id) || tiers[0];
}

export function calcHeatSpendForLine(line: OrderLine): number {
  const tier = getHeatTier(line.heatTierId);
  const addonHeatSpend = line.addons.reduce((sum, addon: Addon) => {
    const category = addon.category.toLowerCase();
    const looksHeat = category.includes('heat') || addon.name.toLowerCase().includes('hot honey') || addon.name.toLowerCase().includes('spicy honey') || addon.name.toLowerCase().includes('extreme honey');
    return looksHeat && isVerifiedPrice(addon.price) ? sum + addon.price : sum;
  }, 0);
  return Math.max(0, tier.priceUsd + addonHeatSpend) * line.quantity;
}

export function calcHeatSpend(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + calcHeatSpendForLine(line), 0);
}

export function heatPointsFromSpend(spendUsd: number): number {
  return Math.round(spendUsd * Number(heatSystem.pointsPerUsd || 100));
}

export function getHeatMeter(points: number) {
  const bars = heatSystem.meter.telegramSafeTextBars || [];
  return bars.find((bar: any) => points >= bar.minPoints && (bar.maxPoints === null || points <= bar.maxPoints)) || bars[0];
}

export function shouldShowBottleSuggestion(cartHeatSpendUsd: number, lifetimeHeatSpendUsd: number) {
  const trigger = heatSystem.bottleTrigger || {};
  const cartThreshold = Number(trigger.cartHeatSpendUsdThreshold ?? 4);
  const lifetimeThreshold = Number(trigger.lifetimeHeatSpendUsdThreshold ?? 12.5);
  return cartHeatSpendUsd >= cartThreshold || lifetimeHeatSpendUsd >= lifetimeThreshold;
}
