# Daily Operating Procedure

## Before opening

1. Start bot backend if using Termux/local server.
2. Send `/start` from owner Telegram.
3. Open Mini App.
4. Submit one internal test order if major menu changes were made.
5. Confirm staff group receives message.
6. Confirm unavailable items are hidden/blocked.

## During service

Staff handles orders in this order:

1. Check item.
2. Check quantity.
3. Check flavor.
4. Check sauce vs dry rub.
5. Check add-ons/dips/drizzles.
6. Check pickup/delivery.
7. Confirm payment if required.
8. Cook.
9. Package.
10. Mark completed.

## If order has missing price

Staff confirms final total manually before cooking.

## If order has missing info

Use clarification script from Staff Academy.

## After service

1. Export or back up `orders.json` if needed.
2. Review failed orders / missing info patterns.
3. Patch menu JSON if customers were confused.
4. Do not edit production code during busy hours unless emergency.
