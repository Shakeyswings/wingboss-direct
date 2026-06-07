const fs = require('fs');
const path = require('path');
const { config } = require('../config');

function loadJson(name) {
  const p = path.join(config.menuDir, name);
  if (!fs.existsSync(p)) throw new Error(`Missing menu data file: ${name}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadMenuData() {
  return {
    menu: loadJson('menu.json'),
    flavors: loadJson('flavors.json'),
    addons: loadJson('addons.json'),
    heatSystem: loadJson('heat-system.json'),
    orderSchema: loadJson('order-schema.json'),
    customerTags: loadJson('customer-tags.json'),
    translations: loadJson('translations.json'),
  };
}

module.exports = { loadMenuData };
