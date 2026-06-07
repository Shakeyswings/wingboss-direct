const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const required = [
  'src/index.js',
  'src/config.js',
  'src/lib/validateOrder.js',
  'src/lib/heatEngine.js',
  'src/lib/formatters.js',
  'menu/menu.json',
  'menu/flavors.json',
  'menu/addons.json',
  'menu/heat-system.json',
  'menu/order-schema.json',
];

for (const rel of required) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) throw new Error(`Missing required file: ${rel}`);
}

for (const rel of required.filter(r => r.endsWith('.json'))) {
  JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

console.log('Phase 5 verification passed: required files exist and JSON parses.');
