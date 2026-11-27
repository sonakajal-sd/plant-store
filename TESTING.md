# Leaf & Clay — Test data

Everything here comes from the **development** seed. It wipes the database and fills it again with the same data every time:

```bash
cd server
npm run seed:dev
```

> ⚠️ `seed:dev` deletes everything. It refuses to run when `NODE_ENV=production` or when `DATABASE_URL` is not on `localhost`.
> For a live database use the safe seed instead: `npm run seed` (it only adds the admin and, if the shop is empty, the starter products).

Ids always start from 1 after `seed:dev`, so the ids below stay the same.

## Test accounts

| Email | Password | Role | Useful for |
|---|---|---|---|
| admin@leafandclay.com | `ADMIN_PASSWORD` from `server/.env` | Admin | Admin page, all orders, changing status |
| asha@test.com | `Test@1234` | Customer | Delivered orders; can write the **first** review for Rubber Plant |
| ravi@test.com | `Test@1234` | Customer | Has a Delivered order with the **archived** Christmas Cactus |
| priya@test.com | `Test@1234` | Customer | Mix of Delivered, Shipped and Cancelled |
| karthik@test.com | `Test@1234` | Customer | Bought 3 × Tulsi; has a cheap Placed order (below free delivery) |
| meena@test.com | `Test@1234` | Customer | The most orders (5) |

The customer passwords are for **development only**. Never create these accounts on the live site.

## Coupons

| Code | Rule | Expected result |
|---|---|---|
| `WELCOME10` | 10% off, min ₹499, max ₹200 off, **once per customer** | ₹600 → ₹60 off. ₹2,500 → ₹200 off (capped). ₹400 → "minimum order" error. Asha, Karthik and Ravi have **already used it** → "You have already used WELCOME10"; Priya and Meena can still use it |
| `FLAT100` | ₹100 off, min ₹999 | Works from ₹999. Below that → "minimum order" error |
| `PLANT50` | ₹50 off, no minimum, usage limit 3 | Already used **2 times** → works **once more**, then "usage limit reached" |
| `EXPIRED20` | 20% off, expired yesterday | Always "expired" error |
| `OLDCODE` | ₹75 off, inactive | Always "not active" error |

Delivery is free when the subtotal **after** the discount is ₹999 or more; otherwise it costs ₹60.

## Edge-case products

| Id | Product | Why it's there |
|---|---|---|
| 5 | Hibiscus | **Sold out** (stock 0) |
| 11 | Fiddle Leaf Fig | **Sold out**, and is on Ravi's wishlist |
| 18 | Bougainvillea | **Sold out**, and is on Meena's wishlist |
| 27 | Orchid (Phalaenopsis) | **Sold out**, and is on Asha's wishlist |
| 22 | Bird of Paradise | **Only 1 left**: try ordering 2 → "not enough stock" |
| 10 | Monstera Deliciosa | **Only 2 left** |
| 31 | Hand-painted Ceramic Planter | **Only 2 left** |
| 17 | Bonsai Ficus | **Only 3 left**, and the most expensive (₹1,999) |
| 23 | Mini Cactus | The cheapest (₹99) |
| 26 | Christmas Cactus | **Archived** (`isActive` false) but in a past order → must stay in old orders and can't be deleted |
| 34 | Old Plastic Pot | **Archived**, not in any order |
| 14 | Rubber Plant | Delivered to Asha but has **no reviews** yet |

Products with reviews (2–4 each): Snake Plant (1), Money Plant (2), Peace Lily (3), Aloe Vera (4), Jade Plant (6), Areca Palm (7), Tulsi (8), ZZ Plant (12), Spider Plant (13), Calathea Orbifolia (15). Every review comes from a customer with a Delivered order containing that product.

Pet-safe products include Spider Plant, Calathea, Boston Fern, Areca Palm, Tulsi and all the pots.

## Orders (20, over the last 60 days)

| Ids | Status | Notes |
|---|---|---|
| 1–8 | Delivered | Paid (cash on delivery). 4 used a coupon |
| 9–12 | Shipped | Order 10 used PLANT50, 11 used FLAT100 |
| 13–16 | Placed | The newest. These are the only ones a customer can cancel |
| 17–20 | Cancelled | Can't be changed or cancelled again |

There are orders above and below the ₹999 free-delivery limit. Every order's subtotal, discount, delivery fee and total come from the server's own pricing rules (`server/src/utils/pricing.ts`).

## Wishlists

Every customer has 2–4 wishlist items, and some of them are sold out on purpose.

## Quick tests for shopping features

| Feature | Try this | Expected |
|---|---|---|
| Search | `fern`, `SUCCULENT`, `pet` | Matches name, category or description; upper/lower case doesn't matter |
| Filters | Indoor + Pet-safe + In stock + ₹200–₹700 | Spider Plant, Boston Fern, Calathea, Areca Palm |
| Pagination | Shop with no filters | 32 plants → 3 pages of 12 |
| Coupon below minimum | Cart of ₹400 + `WELCOME10` | "Add ₹99 more to use this coupon…" |
| Coupon cap | Cart above ₹2,000 + `WELCOME10` | Discount is ₹200, not 10% |
| Delivery after discount | Cart of ₹1,050 + `FLAT100` | Subtotal after discount ₹950 → ₹60 delivery |
| Usage limit | Place one order with `PLANT50` | Next try: "usage limit reached". Cancel that order → it works again |
| Review allowed | Asha on Rubber Plant (`/product/14`) | Review form shown; she can post and later edit ONE review |
| Review not allowed | Ravi on Rubber Plant | "You can review this plant once it has been delivered to you" |
| Wishlist | Any customer → click ♡ on a card | Heart fills; plant appears on `/wishlist` |

## Tests for the safety fixes

| # | Fix | Try this | Expected |
|---|---|---|---|
| 1 | Order status only moves forward | Admin → Orders → a **Placed** order | Only "Shipped" and "Cancel" can be clicked. A Shipped order: only "Delivered" and "Cancel". Delivered/Cancelled: nothing |
| 1 | No overwriting a cancel | Two tabs: Asha cancels order #13 in one; the admin clicks "Shipped" on #13 in the other (without refreshing) | Admin gets "This order was just changed by someone else. Please refresh." The order stays Cancelled |
| 2 | Old tokens stop working | Log in as Asha in two browsers (or a normal + a private window). Change the password in one | The changing browser stays logged in. The other one is sent to the login page with "Your session has expired" on its next click |
| 2 | Role comes from the database | (Needs SQL) set the admin's role to USER, then click in Admin | "Admins only" straight away, without logging out. Set it back to ADMIN afterwards |
| 3 | Coupon once per customer | Asha: apply `WELCOME10` in the cart | "You have already used WELCOME10. It can be used once per customer." Priya: works once; her second order with it is refused |
| 3 | Cancelling gives it back | Priya cancels her WELCOME10 order (while Placed) | She can use WELCOME10 again |
| 4 | Limits | Product page "+" | Stops at 20 (or at the stock, if lower) |
| 4 | Limits | Admin product price `2000000` or stock `200000` | Error under the field |
| 4 | Limits | Register with a 61-character name or a 73-character password | Error under the field |
| 5 | Sizes share stock | Bird of Paradise (only 1 in stock): add Small, then try Large | "All 1 in stock are already in your cart." The cart's "+" doesn't go above the stock either |
| 6 | Coupon re-checked | Apply `PLANT50` in the cart; in Admin switch PLANT50 **Off**; open the Cart or Checkout again | Yellow box: "Coupon PLANT50 was removed: This coupon is no longer active" and the discount is gone |
| 7 | Broken browser data | DevTools → Application → Local Storage: set `cart` to `{oops` (or `user` to `123`) and refresh | The site still opens: an empty cart (or logged out) instead of a white screen |
| 8 | My Orders pages | Meena has 5 orders; place 6 more as Meena | My Orders shows 10, then "Page 1 of 2" |

