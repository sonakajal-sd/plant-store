import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import styles from "./RouteGuards.module.css";

// What the login page reads to come back here afterwards
export type LoginRedirectState = { from?: string; message?: string };

// Only logged-in users can see `children`. Everyone else goes to /login,
// and comes BACK to this page after logging in.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const state: LoginRedirectState = {
      from: location.pathname + location.search,
      message: "Please log in to continue.",
    };
    return <Navigate to="/login" replace state={state} />;
  }
  return children;
}

// Only the admin can see `children`.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    const state: LoginRedirectState = {
      from: location.pathname,
      message: "Please log in with the admin account.",
    };
    return <Navigate to="/login" replace state={state} />;
  }

  // Logged in, but not the admin
  if (!isAdmin) {
    return (
      <div className={styles.blocked}>
        <h1>Admins only 🔒</h1>
        <p>This page is only for the store admin.</p>
        <Link to="/" className={styles.primaryButton}>Back to home</Link>
      </div>
    );
  }
  return children;
}
