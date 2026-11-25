import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "@/context/auth/useAuth";
import type { User } from "@/types/user";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Load the saved user (or nobody)
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? (JSON.parse(saved) as User) : null;
  });

  // Save or remove the user when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  function login(newUser: User) {
    setUser(newUser);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}