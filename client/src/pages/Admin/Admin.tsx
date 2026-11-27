import { useState } from "react";
import AdminOrders from "./AdminOrders";
import AdminProducts from "./AdminProducts";
import styles from "./Admin.module.css";

type Tab = "products" | "orders";

// The admin page: a sidebar with tabs, and the chosen tab on the right.
// (RequireAdmin in App.tsx makes sure only the admin gets here.)
function Admin() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>Admin</p>
        <button
          onClick={() => setTab("products")}
          className={tab === "products" ? styles.tabActive : styles.tab}
        >
          Products
        </button>
        <button
          onClick={() => setTab("orders")}
          className={tab === "orders" ? styles.tabActive : styles.tab}
        >
          Orders
        </button>
      </aside>

      <section className={styles.main}>
        {tab === "products" ? <AdminProducts /> : <AdminOrders />}
      </section>
    </div>
  );
}

export default Admin;
