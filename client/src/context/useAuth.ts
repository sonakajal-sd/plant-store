import { createContext, useContext } from "react";

export type User = {
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null; // null = nobody logged in
  login: (user: User) => void;
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