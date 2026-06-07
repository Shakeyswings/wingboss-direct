# Menu Update Procedure

## Rule

Do not edit app logic for normal menu changes. Edit JSON data.

## Main files

Frontend data:

```text
apps/miniapp/src/data/menu.json
apps/miniapp/src/data/flavors.json
apps/miniapp/src/data/addons.json
apps/miniapp/src/data/heat-system.json
```

Backend data:

```text
apps/bot/menu/menu.json
apps/bot/menu/flavors.json
apps/bot/menu/addons.json
apps/bot/menu/heat-system.json
```

## Safe update sequence

1. Back up current JSON files.
2. Edit one file at a time.
3. Validate JSON.
4. Run frontend build.
5. Run backend verify.
6. Test one order.
7. Deploy.

## Validate JSON manually

```bash
python3 -m json.tool menu.json > /dev/null
python3 -m json.tool flavors.json > /dev/null
python3 -m json.tool addons.json > /dev/null
python3 -m json.tool heat-system.json > /dev/null
```

## Missing price rule

If price is not confirmed from latest menu, use:

```text
PRICE_REQUIRED_FROM_MENU
```

Do not use:

```text
0
0.00
free
estimated
approx
```

unless the latest menu explicitly says so.

## Availability rule

Do not delete seasonal/out-of-stock items unless permanently removed. Set:

```json
"available": false
```

This preserves order history and future comeback logic.
