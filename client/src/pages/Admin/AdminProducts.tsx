import { useEffect, useState } from "react";
import {
  createProduct,
  fetchProducts,
  removeProduct,
  updateProduct,
} from "@/services/productService";
import type { Product, ProductInput } from "@/types/product";
import ProductForm from "./ProductForm";
import styles from "./Admin.module.css";

type Filter = "active" | "archived";

// The form is closed, open for a new product, or open to edit one product
type FormState = { open: false } | { open: true; product: Product | null };

// The fields the server needs to save a product
function toInput(p: Product): ProductInput {
  return {
    name: p.name, category: p.category, price: p.price, stock: p.stock, light: p.light,
    water: p.water, description: p.description, tag: p.tag, petSafe: p.petSafe, isActive: p.isActive,
  };
}

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [form, setForm] = useState<FormState>({ open: false });
  const [notice, setNotice] = useState(""); // e.g. "Snake Plant was archived"
  const [busyId, setBusyId] = useState<number | null>(null); // row that is saving

  // Load ALL products, archived ones too (only the admin can ask for those)
  useEffect(() => {
    fetchProducts({ includeArchived: true })
      .then((data) => setProducts(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Put the server's version of a product into the list
  function replaceInList(updated: Product) {
    setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function handleSave(input: ProductInput) {
    if (form.open && form.product) {
      const updated = await updateProduct(form.product.id, input);
      replaceInList(updated);
      setNotice(`${updated.name} was saved.`);
    } else {
      const created = await createProduct(input);
      setProducts((list) => [...list, created]);
      setNotice(`${created.name} was added.`);
    }
    setForm({ open: false });
  }

  // Runs an action for one row, with the row's buttons disabled meanwhile
  async function runForRow(id: number, action: () => Promise<void>) {
    setBusyId(id);
    setNotice("");
    try {
      await action();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function changeStock(product: Product, amount: number) {
    const newStock = Math.max(0, product.stock + amount);
    return runForRow(product.id, async () => {
      replaceInList(await updateProduct(product.id, { ...toInput(product), stock: newStock }));
    });
  }

  function handleDelete(product: Product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    return runForRow(product.id, async () => {
      const result = await removeProduct(product.id);
      if (result.archived && result.product) {
        replaceInList(result.product); // in past orders → archived instead
      } else {
        setProducts((list) => list.filter((p) => p.id !== product.id));
      }
      setNotice(result.message);
    });
  }

  function handleRestore(product: Product) {
    return runForRow(product.id, async () => {
      replaceInList(await updateProduct(product.id, { ...toInput(product), isActive: true }));
      setNotice(`${product.name} is back in the shop.`);
    });
  }

  if (loading) return <p>Loading products…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  // Numbers for the top cards
  const active = products.filter((p) => p.isActive);
  const archived = products.filter((p) => !p.isActive);
  const outOfStock = active.filter((p) => p.stock === 0).length;
  const shown = filter === "active" ? active : archived;

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span>Products in the shop</span>
          <strong>{active.length}</strong>
        </div>
        <div className={styles.stat}>
          <span>Out of stock</span>
          <strong className={styles.red}>{outOfStock}</strong>
        </div>
        <div className={styles.stat}>
          <span>Archived</span>
          <strong>{archived.length}</strong>
        </div>
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>Products</h1>
        {!form.open && (
          <button className={styles.primaryButton} onClick={() => setForm({ open: true, product: null })}>
            + Add product
          </button>
        )}
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}

      {/* The same form is used for Add and Edit. "key" gives a fresh form for each product. */}
      {form.open && (
        <ProductForm
          key={form.product?.id ?? "new"}
          product={form.product}
          onSave={handleSave}
          onCancel={() => setForm({ open: false })}
        />
      )}

      <div className={styles.filterRow}>
        <button
          className={filter === "active" ? styles.statusActive : styles.statusButton}
          onClick={() => setFilter("active")}
        >
          Active ({active.length})
        </button>
        <button
          className={filter === "archived" ? styles.statusActive : styles.statusButton}
          onClick={() => setFilter("archived")}
        >
          Archived ({archived.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <p>{filter === "active" ? "No products yet." : "No archived products."}</p>
      ) : (
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
              {shown.map((p) => {
                const busy = busyId === p.id;
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      {!p.isActive && <span className={styles.archivedTag}>Archived</span>}
                    </td>
                    <td>{p.category}</td>
                    <td>₹ {p.price}</td>
                    <td>
                      <div className={styles.stockControl}>
                        <button onClick={() => changeStock(p, -1)} disabled={busy}>−</button>
                        <span className={p.stock === 0 ? styles.red : ""}>
                          {p.stock === 0 ? "Out" : p.stock}
                        </span>
                        <button onClick={() => changeStock(p, 1)} disabled={busy}>+</button>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowButtons}>
                        <button
                          className={styles.editButton}
                          onClick={() => setForm({ open: true, product: p })}
                          disabled={busy}
                        >
                          Edit
                        </button>
                        {p.isActive ? (
                          <button className={styles.deleteButton} onClick={() => handleDelete(p)} disabled={busy}>
                            Delete
                          </button>
                        ) : (
                          <button className={styles.editButton} onClick={() => handleRestore(p)} disabled={busy}>
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default AdminProducts;
