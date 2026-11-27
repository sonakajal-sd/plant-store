import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import { fetchMyOrders } from "@/services/orderService";
import { formatDate, formatOrderId } from "@/utils/format";
import type { Order, OrderStatus } from "@/types/order";
import styles from "./Orders.module.css";

const steps: OrderStatus[] = ["Placed", "Shipped", "Delivered"];

function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Which order is open (null = none)
  const [openId, setOpenId] = useState<number | null>(null);

  // Load my orders from the server (again if a different user logs in)
  useEffect(() => {
    if (!user) return; // nobody logged in → nothing to load
    fetchMyOrders()
      .then((data) => setOrders(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  function toggleDetails(id: number) {
    setOpenId(openId === id ? null : id);
  }

  // Not logged in
  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔒</span>
          <h1>Please log in to see your orders</h1>
          <Link to="/login" className={styles.primaryButton}>Go to login</Link>
        </div>
      </div>
    );
  }

  // Still waiting for the server
  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading your orders…</p>
      </div>
    );
  }

  // The server said no (or is not running)
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>⚠️</span>
          <h1>Could not load your orders</h1>
          <p>{error}</p>
        </div>
      </div>
    );
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
                  <h2 className={styles.orderId}>Order #{formatOrderId(order.id)}</h2>
                  <p className={styles.muted}>
                    Placed on {formatDate(order.createdAt)} · {itemCount} items
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
                      {/* item.price = price of one item when the order was placed */}
                      <strong>₹ {item.price * item.quantity}</strong>
                    </div>
                  ))}
                  <p className={styles.muted}>
                    Delivery to: {order.customerName}, {order.address},{" "}
                    {order.city}, {order.state} – {order.pincode}
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