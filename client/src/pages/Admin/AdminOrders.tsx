import { useEffect, useState } from "react";
import { fetchAllOrders, updateOrderStatus } from "@/services/orderService";
import { formatDate, formatOrderId } from "@/utils/format";
import type { Order, OrderStatus } from "@/types/order";
import styles from "./Admin.module.css";

const statuses: OrderStatus[] = ["Placed", "Shipped", "Delivered", "Cancelled"];

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null); // order that is saving

  useEffect(() => {
    fetchAllOrders()
      .then((data) => setOrders(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(order: Order, status: OrderStatus) {
    if (status === order.status) return;
    if (status === "Cancelled") {
      const ok = window.confirm(
        `Cancel order #${formatOrderId(order.id)}? Its stock goes back to the shop. This can't be undone.`
      );
      if (!ok) return;
    }

    setBusyId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, status);
      // Use the server's answer (it includes items and the customer)
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p>Loading orders…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  const toShip = orders.filter((o) => o.status === "Placed").length;
  const onTheWay = orders.filter((o) => o.status === "Shipped").length;

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span>Orders to ship</span>
          <strong className={styles.red}>{toShip}</strong>
        </div>
        <div className={styles.stat}>
          <span>On the way</span>
          <strong>{onTheWay}</strong>
        </div>
        <div className={styles.stat}>
          <span>All orders</span>
          <strong>{orders.length}</strong>
        </div>
      </div>

      <h1 className={styles.title}>Orders</h1>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>#{formatOrderId(o.id)}</strong></td>
                  <td>
                    {o.user?.name ?? o.customerName}
                    <span className={styles.email}>{o.user?.email}</span>
                  </td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>₹ {o.total}</td>
                  <td>
                    {/* A cancelled order is final, so no buttons */}
                    {o.status === "Cancelled" ? (
                      <span className={styles.cancelled}>Cancelled</span>
                    ) : (
                      <div className={styles.statusRow}>
                        {statuses.map((s) => (
                          <button
                            key={s}
                            onClick={() => changeStatus(o, s)}
                            // A delivered order can't be cancelled; nothing can be clicked while saving
                            disabled={busyId === o.id || (s === "Cancelled" && o.status === "Delivered")}
                            className={s === o.status ? styles.statusActive : styles.statusButton}
                          >
                            {s === "Cancelled" ? "Cancel" : s}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default AdminOrders;
