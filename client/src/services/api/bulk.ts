import { apiClient } from "./client";

export const bulkService = {
  // --- Upload Methods ---
  uploadInventoryCSV: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/bulk/inventory/upload-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadOrdersCSV: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/bulk/orders/upload-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // --- Export Methods ---
  exportInventoryCSV: () =>
    apiClient.get("/bulk/inventory/export-csv", {
      responseType: "blob",
    }),

  exportOrdersCSV: () =>
    apiClient.get("/bulk/orders/export-csv", {
      responseType: "blob",
    }),

  // --- Template Methods ---
  downloadInventoryTemplate: () =>
    apiClient.get("/bulk/inventory/template", {
      responseType: "blob",
    }),

  downloadOrderTemplate: () =>
    apiClient.get("/bulk/orders/template", {
      responseType: "blob",
    }),

  // --- Error File Methods ---
  downloadInventoryErrorFile: (id: string) =>
    apiClient.get(`/bulk/inventory/download-errors/${id}`, {
      responseType: "blob",
    }),

  downloadOrderErrorFile: (id: string) =>
    apiClient.get(`/bulk/orders/download-errors/${id}`, {
      responseType: "blob",
    }),

  // --- Legacy/Helper Generic Method (Keep if you use it) ---
  downloadTemplate: (type: "inventory" | "orders") =>
    apiClient.get(`/bulk/${type}/template`, {
      responseType: "blob",
    }),
};
