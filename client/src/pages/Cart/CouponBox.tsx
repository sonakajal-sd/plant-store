import { useState } from "react";
import type { FormEvent } from "react";
import { useCart } from "@/context/cart/useCart";
import { validateCoupon } from "@/services/couponService";
import styles from "./Cart.module.css";

// "Have a coupon?" box: type a code → Apply → shows it, with a Remove button
function CouponBox() {
  const { subtotal, coupon, couponProblem, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleApply(e: FormEvent) {
    e.preventDefault();
    if (code.trim() === "") {
      setError("Please enter a code");
      return;
    }

    setChecking(true);
    setError("");
    try {
      // The server checks the code (expired? minimum order? used up?)
      const result = await validateCoupon(code, subtotal);
      applyCoupon({
        code: result.code,
        type: result.type,
        value: result.value,
        maxDiscount: result.maxDiscount,
        minOrder: result.minOrder,
      });
      setCode("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setChecking(false);
    }
  }

  // A coupon is applied → show it with a Remove button
  if (coupon) {
    return (
      <div className={styles.couponApplied}>
        <span>
          🏷️ <strong>{coupon.code}</strong> applied
        </span>
        <button type="button" className={styles.linkButton} onClick={removeCoupon}>
          Remove
        </button>
        {/* e.g. the customer lowered the quantity below the coupon's minimum */}
        {couponProblem && <p className={styles.couponError}>{couponProblem}</p>}
      </div>
    );
  }

  return (
    <form className={styles.couponForm} onSubmit={handleApply}>
      <div className={styles.couponRow}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          aria-label="Coupon code"
        />
        <button type="submit" disabled={checking}>
          {checking ? "Checking…" : "Apply"}
        </button>
      </div>
      {error && <p className={styles.couponError}>{error}</p>}
    </form>
  );
}

export default CouponBox;
