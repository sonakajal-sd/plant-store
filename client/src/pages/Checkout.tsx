import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart, getItemPrice, getDeliveryFee } from "../context/useCart";
import { saveOrder } from "../data/orders";
import type { CustomerDetails, Order } from "../data/orders";
import styles from "./Checkout.module.css";

// An error message for each field (Partial = not every field needs one)
type FormErrors = Partial<Record<keyof CustomerDetails, string>>;

const emptyForm: CustomerDetails = {
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

// Checks the form and returns the errors
function validate(form: CustomerDetails): FormErrors {
  const errors: FormErrors = {};

  if (form.name.trim() === "") errors.name = "Please enter your name";
  if (!/^\d{10}$/.test(form.phone)) errors.phone = "Enter a 10-digit mobile number";
  if (form.address.trim() === "") errors.address = "Please enter your address";
  if (form.city.trim() === "") errors.city = "Please enter your city";
  if (form.state.trim() === "") errors.state = "Please enter your state";
  if (!/^\d{6}$/.test(form.pincode)) errors.pincode = "Enter a 6-digit PIN code";

  return errors;
}

// ---- A small reusable input with a label and an error ----
type FieldProps = {
  label: string;
  name: keyof CustomerDetails;
  value: string;
  error?: string; // ? means optional
  placeholder?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

function Field({ label, name, value, error, placeholder, onChange }: FieldProps) {
  return (
    <label className={styles.field}>
      {label}
      <input
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={error ? styles.inputError : styles.input}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </label>
  );
}

// ---- The page ----
function Checkout() {
  const { items, subtotal, clearCart } = useCart();

  const [form, setForm] = useState<CustomerDetails>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const delivery = getDeliveryFee(subtotal);
  const total = subtotal + delivery;

  // One function updates ANY input, using the input's "name"
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); // stop the page from reloading

    const newErrors = validate(form);
    setErrors(newErrors);

    // If there is any error, stop here
    if (Object.keys(newErrors).length > 0) return;

    const order: Order = {
      id: "LC-" + Date.now().toString().slice(-6),
      date: new Date().toLocaleDateString("en-IN"),
      customer: form,
      items: items,
      total: total,
      status: "Placed",
    };

    saveOrder(order);
    clearCart();
    setPlacedOrder(order);
  }

  // 1. Success screen (after placing the order)
  if (placedOrder) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.tick}>✓</div>
          <h1>Order placed!</h1>
          <p>
            Thank you, {placedOrder.customer.name}. Your order{" "}
            <strong>#{placedOrder.id}</strong> is confirmed. Please keep{" "}
            <strong>₹ {placedOrder.total}</strong> ready — you pay when your
            plants arrive.
          </p>
          <div className={styles.successButtons}>
            <Link to="/orders" className={styles.primaryButton}>View my orders</Link>
            <Link to="/shop" className={styles.secondaryButton}>Keep shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty cart → nothing to check out
  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Your cart is empty</h1>
        <Link to="/shop" className={styles.primaryButton}>Shop plants</Link>
      </div>
    );
  }

  // 3. The checkout form
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Checkout</h1>

      <form className={styles.layout} onSubmit={handleSubmit} noValidate>
        {/* Left: address + payment */}
        <div className={styles.left}>
          <section className={styles.box}>
            <h2 className={styles.boxTitle}>1. Delivery address</h2>

            <div className={styles.twoCols}>
              <Field label="Full name" name="name" value={form.name} error={errors.name} placeholder="Your name" onChange={handleChange} />
              <Field label="Phone number" name="phone" value={form.phone} error={errors.phone} placeholder="10-digit mobile number" onChange={handleChange} />
            </div>

            <Field label="Address" name="address" value={form.address} error={errors.address} placeholder="House no, street, area" onChange={handleChange} />

            <div className={styles.threeCols}>
              <Field label="City" name="city" value={form.city} error={errors.city} onChange={handleChange} />
              <Field label="State" name="state" value={form.state} error={errors.state} onChange={handleChange} />
              <Field label="PIN code" name="pincode" value={form.pincode} error={errors.pincode} placeholder="6 digits" onChange={handleChange} />
            </div>
          </section>

          <section className={styles.box}>
            <h2 className={styles.boxTitle}>2. Payment method</h2>
            <label className={styles.payActive}>
              <input type="radio" checked readOnly />
              <span>
                <strong>Cash on delivery</strong>
                <br />
                <small>Pay in cash or UPI when your order arrives</small>
              </span>
            </label>
            <label className={styles.payDisabled}>
              <input type="radio" disabled />
              <span>
                <strong>Pay online</strong>
                <br />
                <small>Coming soon</small>
              </span>
            </label>
          </section>
        </div>

        {/* Right: order summary */}
        <aside className={styles.summary}>
          <h2 className={styles.boxTitle}>Your order</h2>

          {items.map((item) => (
            <div key={item.id} className={styles.line}>
              <span>
                {item.product.name} ({item.size}) × {item.quantity}
              </span>
              <strong>₹ {getItemPrice(item) * item.quantity}</strong>
            </div>
          ))}

          <div className={styles.line}>
            <span>Delivery</span>
            <strong>{delivery === 0 ? "Free" : `₹ ${delivery}`}</strong>
          </div>

          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹ {total}</span>
          </div>

          <button type="submit" className={styles.placeButton}>
            Place order
          </button>
        </aside>
      </form>
    </div>
  );
}

export default Checkout;