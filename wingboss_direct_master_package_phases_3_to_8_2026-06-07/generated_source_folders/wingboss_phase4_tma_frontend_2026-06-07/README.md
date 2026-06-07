# Wing⚡Boss Direct — Phase 4 Telegram Mini App Frontend

Status: Prepared frontend source package.  
Scope: React + Vite Telegram Mini App only.  
Backend bot integration target: Telegram `WebApp.sendData()` payload.

## What this includes

- Mobile-first React + Vite frontend
- 3-step ordering flow
- JSON-driven menu/flavors/add-ons/staff academy/heat system
- Telegram Mini App SDK bridge through `window.Telegram.WebApp`
- LocalStorage fallback for last order, customer profile, favorites, and heat profile preview
- Missing-price protection
- Unavailable-item protection
- Order review screen
- Heat Score meter and bottle suggestion logic
- Staff Academy frontend section
- Staff-mode gate UI placeholder
- Telegram-safe order payload generation

## What this does not include

- Bot backend patching
- Production deployment
- Live Telegram BotFather configuration
- Real payment processing
- Completed translations for Khmer/Chinese/Korean/Japanese/Russian
- Final food item prices where the Phase 3 package only had placeholders

## Setup

```bash
cd apps/miniapp
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Telegram Mini App usage

The frontend sends order payloads using:

```js
window.Telegram.WebApp.sendData(JSON.stringify(orderPayload))
```

If opened outside Telegram, the app shows a copyable fallback payload for manual testing.

## Important menu rule

Any price value equal to `PRICE_REQUIRED_FROM_MENU` is treated as unverified. The UI shows `Staff will confirm` instead of calculating fake totals.
