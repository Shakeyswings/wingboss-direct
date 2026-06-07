# BotFather + Telegram Mini App Configuration

## 1. Create or use existing bot

In Telegram, open `@BotFather`.

Common commands:

```text
/newbot
/mybots
/setdescription
/setabouttext
/setuserpic
/setcommands
```

## 2. Set bot commands

Recommended commands:

```text
start - Open WingBoss Direct
menu - Open the menu
help - Help and contact
```

## 3. Configure Mini App / Web App URL

Use the deployed frontend URL from Cloudflare Pages, GitHub Pages, Netlify, or Vercel.

Example:

```text
https://your-domain-or-pages-url/wingboss-direct/
```

The Mini App URL must use HTTPS.

## 4. Backend environment

The same URL must be placed in backend `.env`:

```env
MINI_APP_URL=https://your-deployed-frontend-url
```

## 5. Test

1. Send `/start` to the bot.
2. Tap the Mini App button.
3. Confirm the app opens inside Telegram.
4. Submit test order.
5. Confirm bot receives `web_app_data`.
6. Confirm staff group receives order.

## 6. Important

Do not paste the bot token into frontend code, GitHub public files, screenshots, or customer-facing docs.
