# Security + Privacy Final Checklist

## Secrets

- `BOT_TOKEN` is backend-only.
- `STAFF_GROUP_ID` is backend-only where possible.
- `OWNER_TELEGRAM_ID` is backend-only.
- Staff/admin IDs are backend-only.
- `.env` is never committed to public repo.

## Customer data

Collect only:

- Telegram user ID if available
- name
- phone
- order details
- pickup/delivery choice
- delivery address if needed
- notes

Do not collect:

- card numbers
- passwords
- device fingerprints
- IP tracking for marketing
- unnecessary sensitive data

## Heat Economy

Store only safe operational metrics:

- heat_points_available
- heat_points_lifetime
- heat_spend_lifetime_usd
- max_heat_level_reached
- bottles_purchased_count
- last_redeem_at

Do not award Heat Points until:

```text
paymentStatus = paid
fulfillmentStatus = completed
refunded = false
```

## Staff/admin controls

- Staff callbacks must check staff group or staff user ID.
- Admin commands must check owner/admin Telegram ID.
- Unauthorized callbacks must be rejected silently or with a short denial.

## Payload validation

Reject:

- malformed JSON
- wrong payload type
- missing phone
- missing required flavor
- unavailable item
- oversized notes
- unsupported order type
