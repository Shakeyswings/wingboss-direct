const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value || value.startsWith('REQUIRED')) throw new Error(`Missing ${name} in environment`);
  return value;
}

function parseCsvNumbers(value) {
  if (!value) return [];
  return String(value).split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
}

const config = {
  botToken: required('BOT_TOKEN'),
  staffGroupId: Number(required('STAFF_GROUP_ID')),
  ownerTelegramId: Number(required('OWNER_TELEGRAM_ID')),
  staffTelegramIds: parseCsvNumbers(process.env.STAFF_TELEGRAM_IDS || process.env.OWNER_TELEGRAM_ID),
  miniAppUrl: required('MINI_APP_URL'),
  nodeEnv: process.env.NODE_ENV || 'development',
  timezone: process.env.TIMEZONE || 'Asia/Phnom_Penh',
  usdKhrRate: Number(process.env.USD_KHR_RATE || 4100),
  dataDir: path.join(__dirname, '..', 'data'),
  menuDir: path.join(__dirname, '..', 'menu'),
};

module.exports = { config };
