import { createContext, useContext } from "react";
import type { User } from "@/types/user";

type AuthContextType = {
  user: User | null; // null = nobody logged in
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}