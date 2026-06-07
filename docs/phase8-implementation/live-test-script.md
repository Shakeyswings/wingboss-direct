# Live Test Script

Use this after frontend deployment and backend startup.

## Test 1 — Bot start

1. Open Telegram.
2. Send `/start` to the bot.
3. Expected: bot replies with Wing⚡Boss Direct launch button.

Status:

```text
PASS / FAIL
```

## Test 2 — Mini App opens

1. Tap launch button.
2. Expected: app opens inside Telegram.
3. Check: Home screen, Start Order, Order Again if available, language switcher.

Status:

```text
PASS / FAIL
```

## Test 3 — Pickup order

1. Start order.
2. Pick item.
3. Pick flavor.
4. Add optional add-on.
5. Choose Pickup.
6. Enter name and phone.
7. Submit.

Expected:

- customer sees confirmation
- staff group receives kitchen summary
- missing prices show as staff-confirmed if applicable

Status:

```text
PASS / FAIL
```

## Test 4 — Delivery order

Repeat Test 3 but choose Delivery and enter address.

Expected:

- address appears in staff summary
- missing address blocks submission

Status:

```text
PASS / FAIL
```

## Test 5 — Missing flavor

Try to submit an order that requires flavor without selecting flavor.

Expected:

- frontend blocks order
- no staff message sent

Status:

```text
PASS / FAIL
```

## Test 6 — Heat Economy

1. Select heat upgrades.
2. Confirm Heat Score appears.
3. Submit order.
4. Confirm Heat Points are not awarded immediately.
5. Staff marks paid/confirmed.
6. Staff marks completed.
7. Confirm Heat Points are awarded only now.

Status:

```text
PASS / FAIL
```

## Test 7 — Cancel/refund

1. Submit order.
2. Cancel or refund.
3. Confirm no Heat Points are awarded.

Status:

```text
PASS / FAIL
```

## Test 8 — Staff Academy

1. Open Staff Academy.
2. Open lessons.
3. Confirm English displays.
4. Confirm Khmer placeholders do not break UI.

Status:

```text
PASS / FAIL
```
