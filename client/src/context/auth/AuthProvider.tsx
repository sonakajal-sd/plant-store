import { useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "@/context/auth/useAuth";
import type { User } from "@/types/user";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Logged in only if we have BOTH a saved user and a saved token
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    return savedUser && savedToken ? (JSON.parse(savedUser) as User) : null;
  });

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

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}