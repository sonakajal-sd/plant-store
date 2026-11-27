import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { categories, lightOptions } from "@/data/products";
import type { LightLevel, Product, ProductInput } from "@/types/product";
import styles from "./Admin.module.css";

// Form values are strings while typing; we turn them into numbers on save
type FormValues = {
  name: string;
  category: string;
  price: string;
  stock: string;
  light: LightLevel;
  water: string;
  description: string;
  tag: string;
  petSafe: boolean;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

// Empty form for "Add", or the product's values for "Edit"
function startValues(product: Product | null): FormValues {
  if (!product) {
    return {
      name: "", category: categories[0], price: "", stock: "", light: "Indirect light",
      water: "", description: "", tag: "", petSafe: false, isActive: true,
    };
  }
  return {
    name: product.name,
    category: product.category,
    price: String(product.price),
    stock: String(product.stock),
    light: product.light,
    water: product.water,
    description: product.description,
    tag: product.tag,
    petSafe: product.petSafe,
    isActive: product.isActive,
  };
}

// true for "12", false for "", "1.5" or "abc"
function isWholeNumber(text: string): boolean {
  return /^\d+$/.test(text.trim());
}

// Checks every field and returns the errors (same rules as the server)
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim() === "") errors.name = "Please enter a name";
  if (!isWholeNumber(values.price) || Number(values.price) < 1 || Number(values.price) > 1_000_000) {
    errors.price = "A whole number from 1 to 10,00,000";
  }
  if (!isWholeNumber(values.stock) || Number(values.stock) > 100_000) {
    errors.stock = "A whole number from 0 to 1,00,000";
  }
  if (values.water.trim() === "") errors.water = "e.g. Water weekly";
  return errors;
}

type ProductFormProps = {
  product: Product | null; // null = add a new product
  onSave: (input: ProductInput) => Promise<void>;
  onCancel: () => void;
};

function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<FormValues>(() => startValues(product));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  // Checkboxes use "checked" (true/false) instead of "value"
  function handleCheckbox(e: ChangeEvent<HTMLInputElement>) {
    setValues({ ...values, [e.target.name]: e.target.checked });
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
        name: values.name.trim(),
        category: values.category,
        price: Number(values.price),
        stock: Number(values.stock),
        light: values.light,
        water: values.water.trim(),
        description: values.description.trim(),
        tag: values.tag.trim() || "New",
        petSafe: values.petSafe,
        isActive: values.isActive,
      });
    } catch (err) {
      setServerError((err as Error).message);
      setSaving(false); // stay on the form so the admin can fix it
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.formTitle}>{product ? `Edit: ${product.name}` : "Add a product"}</h2>

      <label>
        Name
        <input name="name" value={values.name} onChange={handleChange} placeholder="e.g. Rubber Plant" />
        {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
      </label>
      <label>
        Category
        <select name="category" value={values.category} onChange={handleChange}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Price (₹)
        <input name="price" inputMode="numeric" value={values.price} onChange={handleChange} />
        {errors.price && <span className={styles.fieldError}>{errors.price}</span>}
      </label>
      <label>
        Stock
        <input name="stock" inputMode="numeric" value={values.stock} onChange={handleChange} />
        {errors.stock && <span className={styles.fieldError}>{errors.stock}</span>}
      </label>
      <label>
        Light
        <select name="light" value={values.light} onChange={handleChange}>
          {lightOptions.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </label>
      <label>
        Watering
        <input name="water" value={values.water} onChange={handleChange} placeholder="e.g. Water weekly" />
        {errors.water && <span className={styles.fieldError}>{errors.water}</span>}
      </label>
      <label>
        Tag
        <input name="tag" value={values.tag} onChange={handleChange} placeholder="e.g. New arrival" />
      </label>
      <label className={styles.checkboxLabel}>
        <input name="petSafe" type="checkbox" checked={values.petSafe} onChange={handleCheckbox} />
        Safe for pets
      </label>
      <label className={styles.checkboxLabel}>
        <input name="isActive" type="checkbox" checked={values.isActive} onChange={handleCheckbox} />
        Show in the shop (active)
      </label>
      <label className={styles.fullWidth}>
        Description
        <textarea name="description" value={values.description} onChange={handleChange} rows={3} placeholder="A short description for the product page" />
      </label>

      {serverError && <p className={styles.error}>{serverError}</p>}

      <div className={styles.formButtons}>
        <button type="submit" className={styles.primaryButton} disabled={saving}>
          {saving ? "Saving…" : "Save product"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
