import { useState } from "react";
import AdminCoupons from "./AdminCoupons";
import AdminOrders from "./AdminOrders";
import AdminProducts from "./AdminProducts";
import styles from "./Admin.module.css";

type Tab = "products" | "orders" | "coupons";

const tabs: { id: Tab; label: string }[] = [
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "coupons", label: "Coupons" },
];

// The admin page: a sidebar with tabs, and the chosen tab on the right.
// (RequireAdmin in App.tsx makes sure only the admin gets here.)
function Admin() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>Admin</p>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? styles.tabActive : styles.tab}
          >
            {t.label}
          </button>
        ))}
      </aside>

      <section className={styles.main}>
        {tab === "products" && <AdminProducts />}
        {tab === "orders" && <AdminOrders />}
        {tab === "coupons" && <AdminCoupons />}
      </section>
    </div>
  );
}

export default Admin;
