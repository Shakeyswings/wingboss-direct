const path = require('path');
const { config } = require('../config');
const { ensureDir, readJson, writeJsonAtomic } = require('./jsonStore');
const { createEmptyHeatProfile } = require('./heatEngine');

const CUSTOMERS_PATH = path.join(config.dataDir, 'customers.json');
const ORDERS_PATH = path.join(config.dataDir, 'orders.json');

ensureDir(config.dataDir);

function loadCustomers() { return readJson(CUSTOMERS_PATH, {}); }
function saveCustomers(customers) { writeJsonAtomic(CUSTOMERS_PATH, customers); }
function loadOrders() { return readJson(ORDERS_PATH, {}); }
function saveOrders(orders) { writeJsonAtomic(ORDERS_PATH, orders); }

function getOrCreateCustomer(customers, telegramUser) {
  const id = String(telegramUser.id);
  if (!customers[id]) {
    customers[id] = {
      telegramId: telegramUser.id,
      username: telegramUser.username || null,
      firstName: telegramUser.first_name || null,
      createdAt: new Date().toISOString(),
      ordersCompleted: 0,
      lifetimeSpendUsd: 0,
      lastOrderId: null,
      heatProfile: createEmptyHeatProfile(),
    };
  }
  customers[id].username = telegramUser.username || customers[id].username || null;
  customers[id].firstName = telegramUser.first_name || customers[id].firstName || null;
  return customers[id];
}

module.exports = { loadCustomers, saveCustomers, loadOrders, saveOrders, getOrCreateCustomer };
