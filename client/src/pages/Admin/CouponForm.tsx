import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Coupon, CouponInput, CouponType } from "@/types/coupon";
import styles from "./Admin.module.css";

// Everything is text while typing; we turn it into numbers/dates on save
type FormValues = {
  code: string;
  type: CouponType;
  value: string;
  minOrder: string;
  maxDiscount: string; // "" = no cap
  expiresOn: string; // "2026-12-31" or "" = never
  usageLimit: string; // "" = no limit
  perUserLimit: string; // "" = no limit
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

function startValues(coupon: Coupon | null): FormValues {
  if (!coupon) {
    return {
      code: "", type: "PERCENT", value: "", minOrder: "0", maxDiscount: "",
      expiresOn: "", usageLimit: "", perUserLimit: "", isActive: true,
    };
  }
  return {
    code: coupon.code,
    type: coupon.type,
    value: String(coupon.value),
    minOrder: String(coupon.minOrder),
    maxDiscount: coupon.maxDiscount === null ? "" : String(coupon.maxDiscount),
    expiresOn: coupon.expiresAt ? toDateInput(coupon.expiresAt) : "",
    usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit),
    perUserLimit: coupon.perUserLimit === null ? "" : String(coupon.perUserLimit),
    isActive: coupon.isActive,
  };
}

// A date from the server → "YYYY-MM-DD" in the admin's own time zone (for <input type="date">)
function toDateInput(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

const isWhole = (text: string) => /^\d+$/.test(text.trim());

// Same rules as the server, so the admin sees problems before saving
function validate(v: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!/^[A-Z0-9]{3,20}$/.test(v.code.trim().toUpperCase())) {
    errors.code = "3–20 letters or numbers, e.g. WELCOME10";
  }
  if (!isWhole(v.value) || Number(v.value) < 1) errors.value = "A whole number above 0";
  else if (v.type === "PERCENT" && Number(v.value) > 90) errors.value = "At most 90%";
  if (!isWhole(v.minOrder)) errors.minOrder = "A whole number, 0 or more";
  if (v.maxDiscount !== "" && (!isWhole(v.maxDiscount) || Number(v.maxDiscount) < 1)) {
    errors.maxDiscount = "Empty, or a whole number above 0";
  }
  if (v.usageLimit !== "" && (!isWhole(v.usageLimit) || Number(v.usageLimit) < 1)) {
    errors.usageLimit = "Empty, or a whole number above 0";
  }
  if (v.perUserLimit !== "" && (!isWhole(v.perUserLimit) || Number(v.perUserLimit) < 1)) {
    errors.perUserLimit = "Empty, or a whole number above 0";
  }
  return errors;
}

type CouponFormProps = {
  coupon: Coupon | null; // null = create a new one
  onSave: (input: CouponInput) => Promise<void>;
  onCancel: () => void;
};

function CouponForm({ coupon, onSave, onCancel }: CouponFormProps) {
  const [values, setValues] = useState<FormValues>(() => startValues(coupon));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors = validate(values);
    setErrors(newErrors);
    setServerError("");
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        code: values.code.trim().toUpperCase(),
        type: values.type,
        value: Number(values.value),
        minOrder: Number(values.minOrder),
        maxDiscount: values.type === "PERCENT" && values.maxDiscount !== "" ? Number(values.maxDiscount) : null,
        // Valid until the END of the chosen day (in the admin's time zone)
        expiresAt: values.expiresOn ? new Date(`${values.expiresOn}T23:59:59`).toISOString() : null,
        usageLimit: values.usageLimit === "" ? null : Number(values.usageLimit),
        perUserLimit: values.perUserLimit === "" ? null : Number(values.perUserLimit),
        isActive: values.isActive,
      });
    } catch (err) {
      setServerError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.formTitle}>{coupon ? `Edit: ${coupon.code}` : "New coupon"}</h2>

      <label>
        Code
        <input name="code" value={values.code} onChange={handleChange} placeholder="e.g. MONSOON15" />
        {errors.code && <span className={styles.fieldError}>{errors.code}</span>}
      </label>
      <label>
        Type
        <select name="type" value={values.type} onChange={handleChange}>
          <option value="PERCENT">Percent off (%)</option>
          <option value="FLAT">Flat amount off (₹)</option>
        </select>
      </label>
      <label>
        {values.type === "PERCENT" ? "Percent off" : "Rupees off"}
        <input name="value" inputMode="numeric" value={values.value} onChange={handleChange} />
        {errors.value && <span className={styles.fieldError}>{errors.value}</span>}
      </label>
      <label>
        Minimum order (₹)
        <input name="minOrder" inputMode="numeric" value={values.minOrder} onChange={handleChange} />
        {errors.minOrder && <span className={styles.fieldError}>{errors.minOrder}</span>}
      </label>
      {/* A cap only makes sense for percent coupons */}
      {values.type === "PERCENT" && (
        <label>
          Max discount (₹, empty = no cap)
          <input name="maxDiscount" inputMode="numeric" value={values.maxDiscount} onChange={handleChange} />
          {errors.maxDiscount && <span className={styles.fieldError}>{errors.maxDiscount}</span>}
        </label>
      )}
      <label>
        Expires on (empty = never)
        <input name="expiresOn" type="date" value={values.expiresOn} onChange={handleChange} />
      </label>
      <label>
        Usage limit (empty = no limit)
        <input name="usageLimit" inputMode="numeric" value={values.usageLimit} onChange={handleChange} />
        {errors.usageLimit && <span className={styles.fieldError}>{errors.usageLimit}</span>}
      </label>
      <label>
        Uses per customer (empty = no limit)
        <input name="perUserLimit" inputMode="numeric" value={values.perUserLimit} onChange={handleChange} placeholder="e.g. 1" />
        {errors.perUserLimit && <span className={styles.fieldError}>{errors.perUserLimit}</span>}
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => setValues({ ...values, isActive: e.target.checked })}
        />
        Active (customers can use it)
      </label>

      {serverError && <p className={styles.error}>{serverError}</p>}

      <div className={styles.formButtons}>
        <button type="submit" className={styles.primaryButton} disabled={saving}>
          {saving ? "Saving…" : "Save coupon"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default CouponForm;
