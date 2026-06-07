import json
from pathlib import Path
base = Path(__file__).parent / 'apps' / 'miniapp'
required = [
 'package.json','index.html','vite.config.ts','tsconfig.json','src/App.tsx','src/main.tsx',
 'src/data/menu.json','src/data/flavors.json','src/data/addons.json','src/data/heat-system.json','src/data/staff-academy.json'
]
missing = [p for p in required if not (base / p).exists()]
if missing:
    raise SystemExit(f'Missing files: {missing}')
for p in (base/'src/data').glob('*.json'):
    json.loads(p.read_text(encoding='utf-8'))
print('Phase 4 file verification passed: required files exist and JSON parses.')
