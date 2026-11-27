import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import type { LoginRedirectState } from "@/components/RouteGuards/RouteGuards";
import { loginRequest, registerRequest } from "@/services/authService";
import styles from "./Login.module.css";

type Mode = "login" | "register";

type LoginForm = {
  name: string;
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof LoginForm, string>>;

function validate(form: LoginForm, mode: Mode): FormErrors {
  const errors: FormErrors = {};

  // Name is only needed when creating an account
  if (mode === "register" && form.name.trim() === "") {
    errors.name = "Please enter your name";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email, like you@example.com";
  }
  if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
}

function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // Where we were sent from (e.g. /checkout) and why (e.g. "session expired")
  const location = useLocation();
  const redirect = (location.state ?? {}) as LoginRedirectState;

  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<LoginForm>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(""); // e.g. "Wrong email or password"
  const [loading, setLoading] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setErrors({}); // clear old errors when switching
    setServerError("");
  }

      async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors = validate(form, mode);
    setErrors(newErrors);
    setServerError("");
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      // Ask the server: register or log in
      const result =
        mode === "register"
          ? await registerRequest(form.name, form.email, form.password)
          : await loginRequest(form.email, form.password);

      login(result.token, result.user);

      // Go back to the page we came from. Otherwise: admin → Admin panel, others → Home.
      const cameFrom = redirect.from && !redirect.from.startsWith("/login") ? redirect.from : null;
      const home = result.user.role === "ADMIN" ? "/admin" : "/";
      navigate(cameFrom ?? home, { replace: true });
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setLoading(false); // runs whether it worked or not
    }
  }

  // Already logged in → show account info instead of the form
  if (user) {
    return (
      <div className={styles.page}>
        <div className={styles.loggedIn}>
          <div className={styles.avatar}>{user.name[0].toUpperCase()}</div>
          <h1>Hi, {user.name} 👋</h1>
          <p>You are logged in as {user.email}</p>
          <div className={styles.buttons}>
            <Link to="/orders" className={styles.primaryButton}>My orders</Link>
            <button onClick={logout} className={styles.secondaryButton}>Log out</button>
          </div>
        </div>
      </div>
    );
  }

  const isRegister = mode === "register";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Left: green welcome panel */}
        <div className={styles.welcome}>
          <span className={styles.welcomeIcon}>🪴</span>
          <h2>Welcome to Leaf &amp; Clay</h2>
          <p>Log in to track your orders and check out faster.</p>
        </div>

        {/* Right: form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={!isRegister ? styles.tabActive : styles.tab}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={isRegister ? styles.tabActive : styles.tab}
            >
              Create account
            </button>
          </div>

          <h1 className={styles.title}>
            {isRegister ? "Create your account" : "Log in to your account"}
          </h1>

          {/* e.g. "Your session has expired. Please log in again." */}
          {redirect.message && <p className={styles.notice}>{redirect.message}</p>}

          {/* Name: only in register mode */}
          {isRegister && (
            <label className={styles.field}>
              Full name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className={errors.name ? styles.inputError : styles.input}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </label>
          )}

          <label className={styles.field}>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={errors.email ? styles.inputError : styles.input}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </label>

          <label className={styles.field}>
            Password
            <div className={styles.passwordRow}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                className={errors.password ? styles.inputError : styles.input}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </label>

          {serverError && <p className={styles.serverError}>{serverError}</p>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
          </button>

          <p className={styles.switchText}>
            {isRegister ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => switchMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "Log in" : "Create an account"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;