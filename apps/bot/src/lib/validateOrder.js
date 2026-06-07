const { cleanText, cleanPhone } = require('./sanitize');
const { calcOrderHeatSpendUsd, calcHeatPoints, getHeatTier } = require('./heatEngine');

function isMissingPrice(value) {
  return value === 'PRICE_REQUIRED_FROM_MENU' || value === 'STAFF_CONFIRM_REQUIRED' || value === undefined || value === null || value === '';
}

function normalizeOrderPayload(raw, telegramUser, menuData) {
  const blockingIssues = [];
  const staffReviewIssues = [];

  if (!raw || typeof raw !== 'object') throw new Error('Order payload is not an object');
  if (raw.type !== 'wingboss_tma_order_v1') throw new Error('Unsupported order payload type');

  const customer = {
    name: cleanText(raw.customer?.name, 80),
    phone: cleanPhone(raw.customer?.phone),
    orderType: raw.customer?.orderType === 'delivery' ? 'delivery' : 'pickup',
    address: cleanText(raw.customer?.address, 300),
    notes: cleanText(raw.customer?.notes, 500),
  };

  if (!customer.name) blockingIssues.push('MISSING_CUSTOMER_NAME');
  if (!customer.phone) blockingIssues.push('MISSING_PHONE');
  if (customer.orderType === 'delivery' && !customer.address) blockingIssues.push('MISSING_DELIVERY_ADDRESS');

  const items = Array.isArray(raw.items) ? raw.items.map((line, idx) => normalizeLine(line, idx, staffReviewIssues, blockingIssues, menuData)) : [];
  if (!items.length) blockingIssues.push('EMPTY_ORDER');

  const heatSpendUsd = calcOrderHeatSpendUsd(menuData.heatSystem, { items });
  const currentOrderHeatScore = calcHeatPoints(menuData.heatSystem, heatSpendUsd);
  const maxHeatLevelReached = getMaxHeatLevel(menuData.heatSystem, items);

  const verifiedPricing = !staffReviewIssues.includes('MISSING_PRICE');
  const frontendTotal = raw.pricing?.total;

  const pricing = {
    verified: Boolean(raw.pricing?.verified && verifiedPricing && typeof frontendTotal === 'number'),
    total: typeof frontendTotal === 'number' && verifiedPricing ? Number(frontendTotal.toFixed(2)) : 'STAFF_CONFIRM_REQUIRED',
    currency: 'USD',
    issues: Array.from(new Set([...(raw.pricing?.issues || []), ...staffReviewIssues])),
  };

  return {
    type: raw.type,
    createdAt: raw.createdAt || new Date().toISOString(),
    telegramUser: {
      id: telegramUser?.id || null,
      username: telegramUser?.username || null,
      firstName: telegramUser?.first_name || telegramUser?.firstName || null,
      languageCode: telegramUser?.language_code || null,
    },
    customer,
    items,
    pricing,
    heat: {
      heatSpendUsd,
      currentOrderHeatScore,
      maxHeatLevelReached,
      earnRule: 'Only paid + completed + not refunded orders count toward lifetime points.',
    },
    validation: {
      isValid: blockingIssues.length === 0,
      blockingIssues: Array.from(new Set(blockingIssues)),
      staffReviewIssues: Array.from(new Set(staffReviewIssues)),
    },
    status: 'submitted',
  };
}

function normalizeLine(line, idx, staffReviewIssues, blockingIssues, menuData) {
  const normalized = {
    lineId: cleanText(line.lineId || `line_${idx + 1}`, 80),
    itemId: cleanText(line.itemId, 80),
    itemName: cleanText(line.itemName, 120),
    quantity: Math.max(1, Number(line.quantity || 1)),
    basePrice: line.basePrice,
    flavor: line.flavor ? {
      flavorId: cleanText(line.flavor.flavorId, 80),
      flavorName: cleanText(line.flavor.flavorName, 120),
      type: cleanText(line.flavor.type, 40),
      price: line.flavor.price,
    } : null,
    heatTierId: cleanText(line.heatTierId || 'original', 40),
    addons: Array.isArray(line.addons) ? line.addons.map(addon => ({
      addonId: cleanText(addon.addonId, 80),
      addonName: cleanText(addon.addonName, 120),
      category: cleanText(addon.category || '', 80),
      price: addon.price,
    })) : [],
    notes: cleanText(line.notes, 300),
  };

  if (!normalized.itemName) blockingIssues.push(`MISSING_ITEM_NAME_LINE_${idx + 1}`);
  if (isMissingPrice(normalized.basePrice)) staffReviewIssues.push('MISSING_PRICE');
  if (normalized.flavor && isMissingPrice(normalized.flavor.price)) staffReviewIssues.push('MISSING_PRICE');
  for (const addon of normalized.addons) if (isMissingPrice(addon.price)) staffReviewIssues.push('MISSING_PRICE');

  const tier = getHeatTier(menuData.heatSystem, normalized.heatTierId);
  if (!tier || tier.available === false) staffReviewIssues.push('HEAT_TIER_REVIEW_REQUIRED');

  return normalized;
}

function getMaxHeatLevel(heatSystem, items) {
  const tiers = Array.isArray(heatSystem.heatTiers) ? heatSystem.heatTiers : [];
  const order = new Map(tiers.map((tier, idx) => [tier.id, idx]));
  let maxId = heatSystem.defaultHeatTierId || 'original';
  for (const item of items) {
    const id = item.heatTierId || maxId;
    if ((order.get(id) ?? -1) > (order.get(maxId) ?? -1)) maxId = id;
  }
  return maxId;
}

module.exports = { normalizeOrderPayload, isMissingPrice };
