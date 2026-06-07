#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
errors=[]
json_files=[]
for p in ROOT.rglob('*.json'):
    json_files.append(p)
    try:
        json.loads(p.read_text(encoding='utf-8'))
    except Exception as e:
        errors.append(f"JSON parse failed: {p.relative_to(ROOT)}: {e}")
# Check fixtures
fixtures = ROOT/'payload-fixtures'
required = ['valid-pickup-missing-price.json','invalid-missing-phone.json','malformed-wrong-type.json']
for r in required:
    if not (fixtures/r).exists(): errors.append(f"Missing required fixture: {r}")
# Check markdown docs
for r in ['README.md','deployment-preflight-checklist.md','qa-execution-log-template.md']:
    if not (ROOT/r).exists(): errors.append(f"Missing required doc: {r}")
result={'status':'failed' if errors else 'passed','json_files_checked':len(json_files),'errors':errors}
(ROOT/'verification-results.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
if errors: sys.exit(1)
