const { safeMoney } = require('./sanitize');
const { getHeatMeter } = require('./heatEngine');

function formatCustomerConfirmation(order) {
  const lines = [];
  lines.push('Wing⚡Boss Order Received');
  lines.push('');
  lines.push(`Name: ${order.customer.name}`);
  lines.push(`Phone: ${order.customer.phone}`);
  lines.push(`Order Type: ${capitalize(order.customer.orderType)}`);
  if (order.customer.orderType === 'delivery') lines.push(`Address: ${order.customer.address}`);
  lines.push('');
  lines.push('Items:');
  for (const line of order.items) {
    lines.push(`- ${line.quantity}× ${line.itemName}`);
    lines.push(`  Flavor: ${line.flavor ? line.flavor.flavorName : 'None'}`);
    if (line.heatTierId && line.heatTierId !== 'original') lines.push(`  Heat: ${line.heatTierId}`);
    if (line.addons.length) lines.push(`  Add-ons: ${line.addons.map(a => a.addonName).join(', ')}`);
  }
  if (order.customer.notes) lines.push(`Notes: ${order.customer.notes}`);
  lines.push(`Total: ${typeof order.pricing.total === 'number' ? safeMoney(order.pricing.total) : 'Staff will confirm'}`);
  lines.push('Status: Staff will confirm shortly.');
  return lines.join('\n');
}

function formatStaffKitchenSummary(order, heatSystem) {
  const meter = getHeatMeter(heatSystem, order.heat.currentOrderHeatScore);
  const lines = [];
  lines.push('NEW WING⚡BOSS ORDER');
  lines.push('');
  lines.push(`Order ID: ${order.orderId}`);
  lines.push(`Customer: ${order.customer.name}`);
  lines.push(`Telegram: ${order.telegramUser.username ? '@' + order.telegramUser.username : order.telegramUser.id || '-'}`);
  lines.push(`Phone: ${order.customer.phone}`);
  lines.push(`Type: ${capitalize(order.customer.orderType)}`);
  if (order.customer.orderType === 'delivery') lines.push(`Address: ${order.customer.address}`);
  lines.push('');
  lines.push('ITEMS:');
  lines.push('');
  for (const line of order.items) {
    lines.push(`- ${line.quantity}× ${line.itemName}`);
    lines.push(`  Flavor: ${line.flavor ? `${line.flavor.flavorName} (${String(line.flavor.type || '').toUpperCase() || 'FLAVOR'})` : 'MISSING / NONE'}`);
    lines.push(`  Heat: ${line.heatTierId || 'original'}`);
    if (line.addons.length) lines.push(`  Add-ons: ${line.addons.map(a => a.addonName).join(', ')}`);
    if (line.notes) lines.push(`  Notes: ${line.notes}`);
    lines.push('');
  }
  if (order.customer.notes) lines.push(`Customer Notes: ${order.customer.notes}`);
  lines.push(`Total: ${typeof order.pricing.total === 'number' ? safeMoney(order.pricing.total) : 'STAFF CONFIRM REQUIRED'}`);
  lines.push('');
  lines.push('🔥 HEAT SCORE');
  lines.push(`${meter.bar} ${order.heat.currentOrderHeatScore} pts — ${meter.label}`);
  lines.push(`Heat spend this order: ${safeMoney(order.heat.heatSpendUsd)}`);
  lines.push('');
  lines.push('KITCHEN CHECK:');
  lines.push('[ ] Item correct');
  lines.push('[ ] Flavor correct');
  lines.push('[ ] Add-ons correct');
  lines.push('[ ] Sauce/dry rub checked');
  lines.push('[ ] Packed correctly');
  lines.push('[ ] Customer confirmed');
  lines.push('');
  lines.push('ISSUES:');
  const issues = [...(order.validation.blockingIssues || []), ...(order.validation.staffReviewIssues || []), ...(order.pricing.issues || [])];
  if (!issues.length) lines.push('- None');
  else Array.from(new Set(issues)).forEach(issue => lines.push(`- ${issue}`));
  return lines.join('\n');
}

function formatOrderStatus(order) {
  return `Order ${order.orderId}: ${order.status}`;
}

function capitalize(s) { return String(s || '').slice(0,1).toUpperCase() + String(s || '').slice(1); }

module.exports = { formatCustomerConfirmation, formatStaffKitchenSummary, formatOrderStatus };
