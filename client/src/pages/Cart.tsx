import { Link } from "react-router-dom";
import { useCart, getItemPrice } from "../context/useCart";
import styles from "./Cart.module.css";

const FREE_DELIVERY_FROM = 999;
const DELIVERY_FEE = 60;

function Cart() {
  const { items, totalCount, subtotal, increase, decrease, removeFromCart } =
    useCart();

  // Empty cart
  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🌱</span>
          <h1>Your cart is empty</h1>
          <p>Find a green friend for your home.</p>
          <Link to="/shop" className={styles.primaryButton}>
            Shop plants
          </Link>
        </div>
      </div>
    );
  }

  const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your cart</h1>

      <div className={styles.layout}>
        {/* Left: items */}
        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.thumb}>🪴</div>

              <div className={styles.itemInfo}>
                <Link to={`/product/${item.product.id}`} className={styles.itemName}>
                  {item.product.name}
                </Link>
                <span className={styles.muted}>Size: {item.size}</span>
                <span>₹ {getItemPrice(item)} each</span>
              </div>

              <div className={styles.quantity}>
                <button onClick={() => decrease(item.id)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => increase(item.id)}>+</button>
              </div>

              <strong className={styles.lineTotal}>
                ₹ {getItemPrice(item) * item.quantity}
              </strong>

              <button
                className={styles.remove}
                onClick={() => removeFromCart(item.id)}
              >
                🗑️
              </button>
            </div>
          ))}

          <Link to="/shop" className={styles.continue}>
            ← Continue shopping
          </Link>
        </div>

        {/* Right: summary */}
        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Order summary</h2>

          <div className={styles.row}>
            <span>Subtotal ({totalCount} items)</span>
            <strong>₹ {subtotal}</strong>
          </div>

          <div className={styles.row}>
            <span>Delivery</span>
            <strong>{delivery === 0 ? "Free" : `₹ ${delivery}`}</strong>
          </div>

          <p className={styles.deliveryNote}>
            {delivery === 0
              ? "You get free delivery on this order 🎉"
              : `Add ₹ ${FREE_DELIVERY_FROM - subtotal} more for free delivery`}
          </p>

          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹ {total}</span>
          </div>

          <Link to="/checkout" className={styles.primaryButton}>
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default Cart;