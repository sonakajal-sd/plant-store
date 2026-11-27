import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import { categories } from "@/data/products";
import { fetchAllOrders, updateOrderStatus } from "@/services/orderService";
import { createProduct, updateProduct, removeProduct } from "@/services/productService";
import { useProducts } from "@/hooks/useProducts";
import { formatDate, formatOrderId } from "@/utils/format";
import type { Order, OrderStatus } from "@/types/order";
import type { Product } from "@/types/product";
import styles from "./Admin.module.css";

type Tab = "products" | "orders";

// Form values are strings while typing; we turn them into numbers on save
type NewProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
  care: string;
  tag: string;
};

const emptyForm: NewProductForm = {
  name: "",
  category: categories[0],
  price: "",
  stock: "",
  care: "",
  tag: "",
};

const statuses: OrderStatus[] = ["Placed", "Shipped", "Delivered"];

function Admin() {
    const { isAdmin } = useAuth();

  const [tab, setTab] = useState<Tab>("products");
    // Rename products → productList so the rest of the page doesn't change
  const { products: productList, setProducts: setProductList } = useProducts();
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewProductForm>(emptyForm);
  const [formError, setFormError] = useState("");

  // Load all orders from the server (only for the admin).
  // Hooks must run BEFORE the "Admins only" return below.
  useEffect(() => {
    if (!isAdmin) return;
    fetchAllOrders()
      .then((data) => setOrderList(data))
      .catch((err: Error) => setOrdersError(err.message))
      .finally(() => setOrdersLoading(false));
  }, [isAdmin]);

  // Only the admin can see this page
    if (!isAdmin) {
    return (
      <div className={styles.blocked}>
        <h1>Admins only 🔒</h1>
        <p>Log in with the admin account to manage the store.</p>
        <Link to="/login" className={styles.primaryButton}>Go to login</Link>
      </div>
    );
  }

    // ---------- Products ----------

  async function changeStock(product: Product, amount: number) {
    const newStock = Math.max(0, product.stock + amount);
    try {
      const updated = await updateProduct(product.id, { ...product, stock: newStock });
      // Replace the old product with the updated one from the server
      setProductList(productList.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function deleteProduct(id: number) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await removeProduct(id);
      setProductList(productList.filter((p) => p.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function handleFormChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (form.name.trim() === "" || price <= 0 || form.stock === "" || stock < 0) {
      setFormError("Please enter a name, a price above 0, and the stock.");
      return;
    }

    try {
      const newProduct = await createProduct({
        name: form.name.trim(),
        category: form.category,
        price: price,
        stock: stock,
        care: form.care.trim() || "Bright light · Water weekly",
        tag: form.tag.trim() || "New",
      });
      setProductList([...productList, newProduct]);
      setForm(emptyForm);
      setFormError("");
      setShowForm(false);
    } catch (err) {
      setFormError((err as Error).message);
    }
  }

  // ---------- Orders ----------

  async function changeStatus(orderId: number, status: OrderStatus) {
    try {
      const updated = await updateOrderStatus(orderId, status);
      // Use the status the server saved. Keep the row's items and user,
      // because the server doesn't send them back here.
      setOrderList(
        orderList.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
      );
    } catch (err) {
      alert((err as Error).message);
    }
  }

  // ---------- Numbers for the top cards ----------
  const outOfStock = productList.filter((p) => p.stock === 0).length;
  const toShip = orderList.filter((o) => o.status === "Placed").length;

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
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
        {/* Stat cards */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>Products</span>
            <strong>{productList.length}</strong>
          </div>
          <div className={styles.stat}>
            <span>Out of stock</span>
            <strong className={styles.red}>{outOfStock}</strong>
          </div>
          <div className={styles.stat}>
            <span>Orders to ship</span>
            <strong>{toShip}</strong>
          </div>
        </div>

        {/* ===== PRODUCTS TAB ===== */}
        {tab === "products" && (
          <>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Products</h1>
              <button
                className={styles.primaryButton}
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "Close" : "+ Add product"}
              </button>
            </div>

            {/* Add product form */}
            {showForm && (
              <form className={styles.form} onSubmit={handleAddProduct} noValidate>
                <label>
                  Name
                  <input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Rubber Plant" />
                </label>
                <label>
                  Category
                  <select name="category" value={form.category} onChange={handleFormChange}>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price (₹)
                  <input name="price" type="number" value={form.price} onChange={handleFormChange} />
                </label>
                <label>
                  Stock
                  <input name="stock" type="number" value={form.stock} onChange={handleFormChange} />
                </label>
                <label>
                  Care (light · water)
                  <input name="care" value={form.care} onChange={handleFormChange} placeholder="Low light · Water weekly" />
                </label>
                <label>
                  Tag
                  <input name="tag" value={form.tag} onChange={handleFormChange} placeholder="e.g. New arrival" />
                </label>

                {formError && <p className={styles.error}>{formError}</p>}

                <button type="submit" className={styles.primaryButton}>
                  Save product
                </button>
              </form>
            )}

            {/* Products table */}
            <div className={styles.tableBox}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Plant</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.category}</td>
                      <td>₹ {p.price}</td>
                      <td>
                        <div className={styles.stockControl}>
                                                   <button onClick={() => changeStock(p, -1)}>−</button>
                          <span className={p.stock === 0 ? styles.red : ""}>
                            {p.stock === 0 ? "Out" : p.stock}
                          </span>
                                                    <button onClick={() => changeStock(p, 1)}>+</button>
                        </div>
                      </td>
                      <td>
                        <button className={styles.deleteButton} onClick={() => deleteProduct(p.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== ORDERS TAB ===== */}
        {tab === "orders" && (
          <>
            <h1 className={styles.title}>Orders</h1>

            {ordersLoading ? (
              <p>Loading orders…</p>
            ) : ordersError ? (
              <p className={styles.error}>{ordersError}</p>
            ) : orderList.length === 0 ? (
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
                    {orderList.map((o) => (
                      <tr key={o.id}>
                        <td><strong>#{formatOrderId(o.id)}</strong></td>
                        <td>
                          {o.user?.name ?? o.customerName}
                          <span className={styles.email}>{o.user?.email}</span>
                        </td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td>₹ {o.total}</td>
                        <td>
                          <div className={styles.statusRow}>
                            {statuses.map((s) => (
                              <button
                                key={s}
                                onClick={() => changeStatus(o.id, s)}
                                className={s === o.status ? styles.statusActive : styles.statusButton}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default Admin;