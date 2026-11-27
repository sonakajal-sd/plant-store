import { useEffect, useState } from "react";
import { fetchAllOrders, fetchOrderStats, updateOrderStatus } from "@/services/orderService";
import type { OrderStats } from "@/services/orderService";
import Pagination from "@/components/Pagination/Pagination";
import { formatDate, formatOrderId } from "@/utils/format";
import type { Order, OrderStatus } from "@/types/order";
import styles from "./Admin.module.css";

const statuses: OrderStatus[] = ["Placed", "Shipped", "Delivered", "Cancelled"];

// Where an order may go next (the same rules as the server)
const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  Placed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

const PAGE_SIZE = 20;

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0); // +1 = load the numbers again
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null); // order that is saving

  // Load this page of orders and the numbers for the top cards
  useEffect(() => {
    let ignore = false;
    Promise.all([fetchAllOrders(page, PAGE_SIZE), fetchOrderStats()])
      .then(([result, newStats]) => {
        if (ignore) return;
        setOrders(result.items);
        setTotal(result.total);
        setStats(newStats);
      })
      .catch((err: Error) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page, reloadCount]);

  function goToPage(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      setReloadCount((n) => n + 1); // the numbers on the top cards changed
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p>Loading orders…</p>;
  if (error) return <p className={styles.error}>{error}</p>;


  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span>Orders to ship</span>
          <strong className={styles.red}>{stats?.toShip ?? "–"}</strong>
        </div>
        <div className={styles.stat}>
          <span>On the way</span>
          <strong>{stats?.onTheWay ?? "–"}</strong>
        </div>
        <div className={styles.stat}>
          <span>All orders</span>
          <strong>{stats?.all ?? "–"}</strong>
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
                  <td>
                    ₹ {o.total}
                    {o.couponCode && (
                      <span className={styles.email}>
                        {o.couponCode} − ₹ {o.discount}
                      </span>
                    )}
                  </td>
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
                            // Only the allowed next steps can be clicked; nothing while saving
                            disabled={busyId === o.id || !nextStatuses[o.status].includes(s)}
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

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={goToPage} />
    </>
  );
}

export default AdminOrders;
