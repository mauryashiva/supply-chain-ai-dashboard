import type { UserRole } from "./common";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface UserCreate extends Omit<User, "id" | "is_active"> {
  password: string;
}

export interface UserUpdate extends Partial<User> {}
