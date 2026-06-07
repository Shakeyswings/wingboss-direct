import type { Addon, CustomerDetails, Flavor, MenuItem, OrderDraft, OrderLine } from '../types/app';
import { isVerifiedPrice, sumVerified } from './price';
import { calcHeatSpend, heatPointsFromSpend } from './heat';

export function createEmptyCustomer(): CustomerDetails {
  return { name: '', phone: '', orderType: 'pickup', address: '', notes: '' };
}

export function createOrderLine(item: MenuItem, flavor: Flavor | null): OrderLine {
  return {
    lineId: `line_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    item,
    quantity: 1,
    flavor,
    heatTierId: 'original',
    addons: [],
    notes: '',
  };
}

export function linePrice(line: OrderLine) {
  const unitValues = [line.item.price, line.flavor?.price, ...line.addons.map((a: Addon) => a.price)];
  const result = sumVerified(unitValues);
  return { total: result.total * line.quantity, verified: result.verified };
}

export function orderPricing(lines: OrderLine[]) {
  let total = 0;
  let verified = true;
  for (const line of lines) {
    const p = linePrice(line);
    total += p.total;
    if (!p.verified) verified = false;
  }
  return { total, verified };
}

export function validateDraft(draft: OrderDraft): string[] {
  const issues: string[] = [];
  if (!draft.lines.length) issues.push('Add at least one item.');
  for (const line of draft.lines) {
    if (!line.item.available) issues.push(`${line.item.name} is unavailable.`);
    if (line.item.requiresFlavor && !line.flavor) issues.push(`${line.item.name} needs a flavor.`);
    if (line.flavor && !line.flavor.available) issues.push(`${line.flavor.name} is unavailable.`);
    for (const addon of line.addons) if (!addon.available) issues.push(`${addon.name} is unavailable.`);
  }
  if (!draft.customer.name.trim()) issues.push('Add customer name.');
  if (!draft.customer.phone.trim()) issues.push('Add phone number.');
  if (draft.customer.orderType === 'delivery' && !draft.customer.address.trim()) issues.push('Add delivery address or choose pickup.');
  return issues;
}

export function buildTelegramPayload(draft: OrderDraft) {
  const pricing = orderPricing(draft.lines);
  const heatSpendUsd = calcHeatSpend(draft.lines);
  const heatScore = heatPointsFromSpend(heatSpendUsd);
  return {
    type: 'wingboss_tma_order_v1',
    createdAt: new Date().toISOString(),
    customer: draft.customer,
    items: draft.lines.map((line) => ({
      lineId: line.lineId,
      itemId: line.item.id,
      itemName: line.item.name,
      quantity: line.quantity,
      basePrice: line.item.price,
      flavor: line.flavor ? {
        flavorId: line.flavor.id,
        flavorName: line.flavor.name,
        type: line.flavor.type,
        price: line.flavor.price,
      } : null,
      heatTierId: line.heatTierId,
      addons: line.addons.map((a) => ({ addonId: a.id, addonName: a.name, price: a.price })),
      notes: line.notes,
    })),
    pricing: {
      verified: pricing.verified,
      total: pricing.verified ? Number(pricing.total.toFixed(2)) : 'STAFF_CONFIRM_REQUIRED',
      currency: 'USD',
      issues: pricing.verified ? [] : ['MISSING_PRICE'],
    },
    heat: {
      heatSpendUsd: Number(heatSpendUsd.toFixed(2)),
      currentOrderHeatScore: heatScore,
      earnRule: 'Only paid + completed + not refunded orders count toward lifetime points.',
    },
    status: 'submitted',
  };
}
