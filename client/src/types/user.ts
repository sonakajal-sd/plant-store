export type User = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

// What the server sends back after login or register
export type AuthResponse = {
  token: string;
  user: User;
};