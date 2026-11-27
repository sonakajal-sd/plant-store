import { useEffect, useState } from "react";
import { createCoupon, fetchCoupons, updateCoupon } from "@/services/couponService";
import { formatDate } from "@/utils/format";
import type { Coupon, CouponInput } from "@/types/coupon";
import CouponForm from "./CouponForm";
import styles from "./Admin.module.css";

type FormState = { open: false } | { open: true; coupon: Coupon | null };

// The fields the server needs to save a coupon
function toInput(c: Coupon): CouponInput {
  return {
    code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxDiscount: c.maxDiscount,
    expiresAt: c.expiresAt, isActive: c.isActive, usageLimit: c.usageLimit, perUserLimit: c.perUserLimit,
  };
}

// "10% off (max ₹200)" or "₹100 off"
function describeRule(c: Coupon): string {
  if (c.type === "FLAT") return `₹${c.value} off`;
  return c.maxDiscount ? `${c.value}% off (max ₹${c.maxDiscount})` : `${c.value}% off`;
}

function isExpired(c: Coupon): boolean {
  return c.expiresAt !== null && new Date(c.expiresAt) < new Date();
}

function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({ open: false });
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    fetchCoupons()
      .then((data) => setCoupons(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function replaceInList(updated: Coupon) {
    setCoupons((list) => list.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function handleSave(input: CouponInput) {
    if (form.open && form.coupon) {
      replaceInList(await updateCoupon(form.coupon.id, input));
      setNotice(`${input.code} was saved.`);
    } else {
      const created = await createCoupon(input);
      setCoupons((list) => [created, ...list]);
      setNotice(`${created.code} was created.`);
    }
    setForm({ open: false });
  }

  async function toggleActive(coupon: Coupon) {
    setBusyId(coupon.id);
    setNotice("");
    try {
      const updated = await updateCoupon(coupon.id, { ...toInput(coupon), isActive: !coupon.isActive });
      replaceInList(updated);
      setNotice(`${updated.code} is now ${updated.isActive ? "on" : "off"}.`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p>Loading coupons…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Coupons</h1>
        {!form.open && (
          <button className={styles.primaryButton} onClick={() => setForm({ open: true, coupon: null })}>
            + New coupon
          </button>
        )}
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}

      {form.open && (
        <CouponForm
          key={form.coupon?.id ?? "new"}
          coupon={form.coupon}
          onSave={handleSave}
          onCancel={() => setForm({ open: false })}
        />
      )}

      {coupons.length === 0 ? (
        <p>No coupons yet.</p>
      ) : (
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min order</th>
                <th>Used</th>
                <th>Expires</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{describeRule(c)}</td>
                  <td>{c.minOrder > 0 ? `₹ ${c.minOrder}` : "—"}</td>
                  <td>
                    {c.usedCount} / {c.usageLimit ?? "∞"}
                    {c.perUserLimit !== null && (
                      <span className={styles.email}>max {c.perUserLimit} per customer</span>
                    )}
                  </td>
                  <td className={isExpired(c) ? styles.red : ""}>
                    {c.expiresAt ? formatDate(c.expiresAt) : "Never"}
                    {isExpired(c) && " (expired)"}
                  </td>
                  <td>
                    <button
                      className={c.isActive ? styles.statusActive : styles.statusButton}
                      onClick={() => toggleActive(c)}
                      disabled={busyId === c.id}
                      aria-pressed={c.isActive}
                    >
                      {c.isActive ? "On" : "Off"}
                    </button>
                  </td>
                  <td>
                    <button
                      className={styles.editButton}
                      onClick={() => setForm({ open: true, coupon: c })}
                      disabled={busyId === c.id}
                    >
                      Edit
                    </button>
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

export default AdminCoupons;
