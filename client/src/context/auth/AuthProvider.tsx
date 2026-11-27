import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/auth/useAuth";
import { AUTH_EXPIRED_EVENT } from "@/services/apiClient";
import { isObject, loadSaved } from "@/utils/storage";
import type { User } from "@/types/user";

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // Logged in only if we have BOTH a saved user and a saved token
  const [user, setUser] = useState<User | null>(() => {
    if (!localStorage.getItem("token")) return null;
    // A saved user must at least have an id, a name and a role
    return loadSaved<User | null>(
      "user",
      (v) => isObject(v) && typeof v.id === "number" && typeof v.name === "string" && typeof v.role === "string",
      null
    );
  });

  // When any API call says "401" (token expired), apiClient sends a signal.
  // We log out and go to the login page, remembering where the user was.
  useEffect(() => {
    function handleExpired() {
      setUser(null);
      navigate("/login", {
        state: { message: SESSION_EXPIRED_MESSAGE, from: window.location.pathname },
      });
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    // Clean up when this component goes away
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, [navigate]);

  function login(token: string, newUser: User) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  // Keep the saved copy in the browser up to date too
  function updateUser(newUser: User) {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
