import { apiClient } from "./client";

export const addressService = {
  // GET /api/customer/address/
  getAddresses: () => apiClient.get("/customer/address/"),

  // POST /api/customer/address/
  createAddress: (data: any) => apiClient.post("/customer/address/", data),

  // PUT /api/customer/address/{id}
  updateAddress: (id: number, data: any) =>
    apiClient.put(`/customer/address/${id}`, data),

  // DELETE /api/customer/address/{id}
  deleteAddress: (id: number) => apiClient.delete(`/customer/address/${id}`),
};
