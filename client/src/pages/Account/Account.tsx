import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import { changePassword, updateMyName } from "@/services/accountService";
import styles from "./Account.module.css";

function Account() {
  // RequireAuth in App.tsx makes sure "user" is there
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <h1 className={styles.title}>My account</h1>
          <p className={styles.muted}>{user.email}</p>
        </div>
      </div>

      <div className={styles.links}>
        <Link to="/orders" className={styles.linkCard}>📦 My orders</Link>
        <Link to="/wishlist" className={styles.linkCard}>♡ My wishlist</Link>
      </div>

      <div className={styles.grid}>
        <NameForm currentName={user.name} />
        <PasswordForm />
      </div>

      <button className={styles.secondaryButton} onClick={logout}>Log out</button>
    </div>
  );
}

// ---- Change name ----

function NameForm({ currentName }: { currentName: string }) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(currentName);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (name.trim() === "") {
      setError("Please enter your name");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateMyName(name.trim());
      updateUser(updated); // the header shows the new initial straight away
      setMessage("Your name was saved.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.cardTitle}>Your name</h2>
      <label className={styles.field}>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}
      <button type="submit" className={styles.primaryButton} disabled={saving}>
        {saving ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}

// ---- Change password ----

function PasswordForm() {
  const { user, login } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    // Check on this side first, so the user sees mistakes straight away
    if (current === "") {
      setError("Please enter your current password");
      return;
    }
    if (next.length < 8 || next.length > 72) {
      setError("The new password must be 8 to 72 characters");
      return;
    }
    if (next !== repeat) {
      setError("The two new passwords don't match");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const newToken = await changePassword(current, next);
      // Save the new token, so THIS browser stays logged in (other devices are logged out)
      if (user) login(newToken, user);
      setMessage("Your password was changed. Other devices have been logged out.");
      setCurrent("");
      setNext("");
      setRepeat("");
    } catch (err) {
      setError((err as Error).message); // e.g. "Your current password is wrong"
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.cardTitle}>Change password</h2>
      <label className={styles.field}>
        Current password
        <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label className={styles.field}>
        New password
        <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="8 to 72 characters" maxLength={72} />
      </label>
      <label className={styles.field}>
        Repeat new password
        <input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}
      <button type="submit" className={styles.primaryButton} disabled={saving}>
        {saving ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

export default Account;
