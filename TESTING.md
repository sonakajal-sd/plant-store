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
| `WELCOME10` | 10% off, min ₹499, max ₹200 off | ₹600 → ₹60 off. ₹2,500 → ₹200 off (capped). ₹400 → "minimum order" error |
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
