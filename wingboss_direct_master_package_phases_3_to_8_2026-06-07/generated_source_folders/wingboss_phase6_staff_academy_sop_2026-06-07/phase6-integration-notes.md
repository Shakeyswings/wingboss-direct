# Phase 6 Integration Notes

## Frontend integration

The Staff Academy page from Phase 4 should load `staff-academy-expanded.json` instead of the smaller Phase 3 file.

Recommended route:

```text
/staff-academy
```

Recommended screens:

```text
Category List → Lesson List → Lesson Detail → Quick Check → Checklist / Script Reference
```

## Backend integration

The Phase 5 backend can use:

- `sop-checklists.json` to attach checklist IDs to staff order summaries.
- `customer-clarification-scripts.json` for `/script missing_flavor`, `/script missing_price`, etc.
- `training-matrix.json` later for role-based staff permissions/training.

## Staff summary hardening

Every staff kitchen summary should expose:

```text
KITCHEN CHECK:
[ ] Item correct
[ ] Flavor correct
[ ] Add-ons correct
[ ] Sauce/dry rub checked
[ ] Heat checked
[ ] Packed correctly
[ ] Customer confirmed
```

## Critical rule

If any order contains `PRICE_REQUIRED_FROM_MENU`, staff must confirm the total before payment/cooking. Do not guess.

## Heat system rule

Heat points are not earned when order is merely submitted. They are earned only after:

```text
paymentStatus = paid
fulfillmentStatus = completed
refunded = false
```
