# Phase 5 Patch Report

## Legacy file reviewed

`/mnt/data/index.js` was used as the legacy reference and copied to `docs/legacy-index.reference.js`.

## Main fixes implemented in new backend

1. **TMA payload support**
   - Receives `web_app_data`.
   - Parses `wingboss_tma_order_v1` from Phase 4.
   - Normalizes customer, item, flavor, add-on, pricing, and heat data.

2. **Heat Economy conflict fixed**
   - Legacy logic awarded spice/heat points during order placement.
   - New backend awards Heat Points only when order is paid + completed + not refunded.

3. **Staff kitchen summary rebuilt**
   - Uses required kitchen checklist.
   - Displays issue flags.
   - Shows heat score meter.
   - Avoids marketing copy in staff message.

4. **Missing price protection**
   - Any `PRICE_REQUIRED_FROM_MENU` becomes staff confirmation required.
   - No fake `$0.00` totals are generated.

5. **Security boundaries**
   - Bot token, staff group ID, owner ID, and staff IDs are `.env` only.
   - Staff actions require owner/staff authorization.

## Remaining blocked items

- Live Telegram test requires real `BOT_TOKEN` and `MINI_APP_URL`.
- Production deployment target is not selected.
- Staff Telegram IDs beyond owner ID must be supplied before strict staff gating.
- Payment proof/photo logic is not included in this TMA backend MVP; it can be patched later.
