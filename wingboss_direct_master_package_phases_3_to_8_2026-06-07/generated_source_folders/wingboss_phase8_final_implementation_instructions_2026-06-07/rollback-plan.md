# Rollback Plan

## Rollback triggers

Rollback if any of these happen:

- staff group does not receive orders
- customers cannot submit orders
- bot token appears in frontend or public repo
- Heat Points are awarded incorrectly
- staff action buttons change wrong order status
- menu prices display incorrectly
- unavailable items can be ordered
- delivery address is missing from staff summary

## Frontend rollback

1. Revert Cloudflare/GitHub/Netlify/Vercel deployment to previous working build.
2. If rollback is not available, temporarily remove Mini App launch button from bot.
3. Use Telegram manual ordering until fixed.

## Backend rollback

1. Stop current bot process.
2. Restore previous backend folder or ZIP.
3. Restore previous `.env`.
4. Start previous bot.
5. Test `/start` and staff group notification.

## Emergency manual fallback

Bot message should tell customers:

```text
Wing⚡Boss Direct is being updated.
Please send your order here in Telegram and staff will confirm shortly.
```

Do not offer fake discounts as an apology unless owner approves.

## Data backup before deployment

Back up:

```text
apps/bot/data/customers.json
apps/bot/data/orders.json
apps/bot/data/availability.json
apps/bot/menu/*.json
```

Use timestamped folder:

```bash
mkdir -p backups/$(date +%Y%m%d_%H%M)
cp -r apps/bot/data backups/$(date +%Y%m%d_%H%M)/
cp -r apps/bot/menu backups/$(date +%Y%m%d_%H%M)/
```
