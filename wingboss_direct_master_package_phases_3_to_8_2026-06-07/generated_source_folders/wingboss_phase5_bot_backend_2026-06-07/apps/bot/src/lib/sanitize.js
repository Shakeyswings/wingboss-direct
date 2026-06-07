function cleanText(value, maxLen = 500) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function cleanPhone(value) {
  return cleanText(value, 40).replace(/[^0-9+()\-\s]/g, '').trim();
}

function safeMoney(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `$${value.toFixed(2)}` : 'Staff will confirm';
}

module.exports = { cleanText, cleanPhone, safeMoney };
