import { useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../data/orders";
import type { OrderStatus } from "../data/orders";
import { getItemPrice } from "../context/useCart";
import styles from "./Orders.module.css";

const steps: OrderStatus[] = ["Placed", "Shipped", "Delivered"];

function Orders() {
  // Read the orders once, when the page opens
  const [orders] = useState(() => getOrders());

  // Which order is open (null = none)
  const [openId, setOpenId] = useState<string | null>(null);

  function toggleDetails(id: string) {
    setOpenId(openId === id ? null : id);
  }

  // No orders yet
  if (orders.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📦</span>
          <h1>No orders yet</h1>
          <p>When you place an order, it will show up here.</p>
          <Link to="/shop" className={styles.primaryButton}>Start shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My orders</h1>
      <p className={styles.subtitle}>
        Track your plants from our nursery to your door.
      </p>

      <div className={styles.list}>
        {orders.map((order) => {
          const currentStep = steps.indexOf(order.status); // 0, 1 or 2
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const isOpen = openId === order.id;

          return (
            <article key={order.id} className={styles.card}>
              {/* Top row */}
              <div className={styles.topRow}>
                <div>
                  <h2 className={styles.orderId}>Order #{order.id}</h2>
                  <p className={styles.muted}>
                    Placed on {order.date} · {itemCount} items
                  </p>
                </div>
                <div className={styles.topRight}>
                  <span className={styles[`badge${order.status}`]}>{order.status}</span>
                  <strong className={styles.total}>₹ {order.total}</strong>
                </div>
              </div>

              {/* Tracker */}
              <div className={styles.tracker}>
                {steps.map((step, index) => (
                  <div key={step} className={styles.step}>
                    <div
                      className={
                        index <= currentStep ? styles.barDone : styles.bar
                      }
                    />
                    <span
                      className={
                        index === currentStep ? styles.stepActive : styles.stepLabel
                      }
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={styles.detailsButton}
                onClick={() => toggleDetails(order.id)}
              >
                {isOpen ? "Hide details" : "View details"}
              </button>

              {/* Details (only when open) */}
              {isOpen && (
                <div className={styles.details}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.line}>
                      <span>
                        {item.product.name} ({item.size}) × {item.quantity}
                      </span>
                      <strong>₹ {getItemPrice(item) * item.quantity}</strong>
                    </div>
                  ))}
                  <p className={styles.muted}>
                    Delivery to: {order.customer.name}, {order.customer.address},{" "}
                    {order.customer.city}, {order.customer.state} –{" "}
                    {order.customer.pincode}
                  </p>
                  <p className={styles.muted}>Payment: Cash on delivery</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default Orders;