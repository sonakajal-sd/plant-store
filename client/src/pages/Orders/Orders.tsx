import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cancelMyOrder, fetchMyOrders } from "@/services/orderService";
import { formatDate, formatOrderId } from "@/utils/format";
import type { Order, OrderStatus } from "@/types/order";
import styles from "./Orders.module.css";

// The tracker steps (a Cancelled order shows a note instead)
const steps: OrderStatus[] = ["Placed", "Shipped", "Delivered"];

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Which order is open (null = none)
  const [openId, setOpenId] = useState<number | null>(null);
  // Which order is being cancelled right now (to disable its button)
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Load my orders from the server when the page opens.
  // (RequireAuth in App.tsx makes sure someone is logged in.)
  useEffect(() => {
    fetchMyOrders()
      .then((data) => setOrders(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleDetails(id: number) {
    setOpenId(openId === id ? null : id);
  }

  async function handleCancel(order: Order) {
    if (!window.confirm(`Cancel order #${formatOrderId(order.id)}?`)) return;

    setCancellingId(order.id);
    try {
      const updated = await cancelMyOrder(order.id);
      // Replace the old order with the cancelled one from the server
      setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCancellingId(null);
    }
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

              {/* Tracker (or a note if the order was cancelled) */}
              {order.status === "Cancelled" ? (
                <p className={styles.cancelledNote}>This order was cancelled.</p>
              ) : (
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
              )}

              <div className={styles.buttonRow}>
                <button
                  className={styles.detailsButton}
                  onClick={() => toggleDetails(order.id)}
                >
                  {isOpen ? "Hide details" : "View details"}
                </button>

                {/* Only orders that haven't shipped yet can be cancelled */}
                {order.status === "Placed" && (
                  <button
                    className={styles.cancelButton}
                    onClick={() => handleCancel(order)}
                    disabled={cancellingId === order.id}
                  >
                    {cancellingId === order.id ? "Cancelling…" : "Cancel order"}
                  </button>
                )}
              </div>

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