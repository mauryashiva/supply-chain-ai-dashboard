// src/services/api/users.ts
import { apiClient } from "./client";
import type { User, UserCreate, UserUpdate } from "@/types";

export const userService = {
  getUsers: () => apiClient.get<User[]>("/users/"),
  createUser: (data: UserCreate) => apiClient.post<User>("/users/", data),
  updateUser: (id: number, data: UserUpdate) =>
    apiClient.put<User>(`/users/${id}`, data),
  deleteUser: (id: number) => apiClient.delete(`/users/${id}`),
};
