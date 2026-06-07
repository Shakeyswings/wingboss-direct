function getHeatTier(heatSystem, id) {
  const tiers = Array.isArray(heatSystem.heatTiers) ? heatSystem.heatTiers : [];
  return tiers.find(t => t.id === id) || tiers.find(t => t.id === heatSystem.defaultHeatTierId) || { id: 'original', label: 'Original', priceUsd: 0 };
}

function moneyNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function calcLineHeatSpendUsd(heatSystem, line) {
  const tier = getHeatTier(heatSystem, line.heatTierId || 'original');
  const tierSpend = moneyNumber(tier.priceUsd);
  const qty = Math.max(1, Number(line.quantity || 1));
  const addonSpend = Array.isArray(line.addons)
    ? line.addons.reduce((sum, addon) => {
        const n = String(addon.addonName || addon.name || '').toLowerCase();
        const c = String(addon.category || '').toLowerCase();
        const looksHeat = c.includes('heat') || n.includes('hot honey') || n.includes('spicy honey') || n.includes('extreme honey');
        return looksHeat && typeof addon.price === 'number' ? sum + addon.price : sum;
      }, 0)
    : 0;
  return (tierSpend + addonSpend) * qty;
}

function calcOrderHeatSpendUsd(heatSystem, orderPayload) {
  const lines = Array.isArray(orderPayload.items) ? orderPayload.items : [];
  return Number(lines.reduce((sum, line) => sum + calcLineHeatSpendUsd(heatSystem, line), 0).toFixed(2));
}

function calcHeatPoints(heatSystem, heatSpendUsd) {
  const pointsPerUsd = Number(heatSystem.pointsPerUsd || 100);
  return Math.max(0, Math.round(Number(heatSpendUsd || 0) * pointsPerUsd));
}

function getHeatMeter(heatSystem, points) {
  const bars = heatSystem?.meter?.telegramSafeTextBars || [];
  return bars.find(bar => points >= bar.minPoints && (bar.maxPoints === null || points <= bar.maxPoints)) || bars[0] || { bar: '[□□□□□□□□□□]', label: 'No added heat' };
}

function updateHeatProfileOnCompletedPaid(customer, order, heatSystem) {
  if (!customer.heatProfile) customer.heatProfile = createEmptyHeatProfile();
  const hp = customer.heatProfile;
  const spend = Number(order.heat?.heatSpendUsd || 0);
  const points = calcHeatPoints(heatSystem, spend);

  hp.heat_points_available = Number(hp.heat_points_available || 0) + points;
  hp.heat_points_lifetime = Number(hp.heat_points_lifetime || 0) + points;
  hp.heat_spend_lifetime_usd = Number((Number(hp.heat_spend_lifetime_usd || 0) + spend).toFixed(2));
  hp.last_order_heat_spend_usd = spend;
  hp.last_order_heat_score = points;

  const maxHeat = order.heat?.maxHeatLevelReached;
  if (maxHeat) hp.max_heat_level_reached = maxHeat;

  return { earnedPoints: points, heatSpendUsd: spend };
}

function createEmptyHeatProfile() {
  return {
    heat_points_available: 0,
    heat_points_lifetime: 0,
    heat_spend_lifetime_usd: 0,
    heat_points_redeemed_total: 0,
    max_heat_level_reached: 'original',
    bottles_purchased_count: {},
    last_redeem_at: null,
    last_order_heat_spend_usd: 0,
    last_order_heat_score: 0,
  };
}

module.exports = {
  getHeatTier,
  calcLineHeatSpendUsd,
  calcOrderHeatSpendUsd,
  calcHeatPoints,
  getHeatMeter,
  createEmptyHeatProfile,
  updateHeatProfileOnCompletedPaid,
};
