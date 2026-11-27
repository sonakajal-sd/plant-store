import { MAX_QUANTITY_PER_ITEM, sizeExtraPrice } from "@/data/products";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";

// Compares the cart with the latest products from the server.
// Returns the updated cart AND a list of messages telling the user what changed.
// (A "pure" function: it only looks at its inputs and changes nothing outside.)
export function syncCartItems(
  items: CartItem[],
  latestById: Map<number, Product>
): { items: CartItem[]; changes: string[] } {
  const newItems: CartItem[] = [];
  const changes = new Set<string>(); // a Set skips the same message twice

  // Stock still free for each product. Two sizes of one plant share the same stock.
  const stockLeft = new Map<number, number>();

  for (const item of items) {
    const latest = latestById.get(item.product.id);
    const name = item.product.name;

    // 1. Deleted or archived → the server didn't send it back
    if (!latest) {
      changes.add(`${name} is no longer available, so it was removed from your cart.`);
      continue;
    }

    const free = stockLeft.get(latest.id) ?? latest.stock;

    // 2. Nothing left (sold out, or the other sizes in the cart already use all of it)
    if (free === 0) {
      if (latest.stock === 0) {
        changes.add(`${latest.name} (${item.size}) is sold out, so it was removed from your cart.`);
      } else {
        changes.add(
          `Only ${latest.stock} ${latest.name} in stock, and they're already in your cart in another size, so the ${item.size} was removed.`
        );
      }
      continue;
    }

    // 3. Fewer left than in the cart → lower the quantity (and never more than 20 per line)
    let quantity = item.quantity;
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      quantity = MAX_QUANTITY_PER_ITEM;
      changes.add(
        `You can order at most ${MAX_QUANTITY_PER_ITEM} ${latest.name} (${item.size}) at once, so it was changed to ${MAX_QUANTITY_PER_ITEM}.`
      );
    }
    if (quantity > free) {
      quantity = free;
      changes.add(
        `Only ${latest.stock} ${latest.name} in stock, so ${latest.name} (${item.size}) was changed to ${free}.`
      );
    }

    // 4. The price changed
    if (latest.price !== item.product.price) {
      const oldPrice = item.product.price + sizeExtraPrice[item.size];
      const newPrice = latest.price + sizeExtraPrice[item.size];
      changes.add(`${latest.name} (${item.size}) now costs ₹ ${newPrice} (was ₹ ${oldPrice}).`);
    }

    stockLeft.set(latest.id, free - quantity);
    // Keep the item, but with the LATEST product data
    newItems.push({ ...item, product: latest, quantity: quantity });
  }

  return { items: newItems, changes: [...changes] };
}
