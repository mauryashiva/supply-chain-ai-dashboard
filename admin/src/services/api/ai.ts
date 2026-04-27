// ai.ts
import { apiClient } from "./client";

export const aiService = {
  generateDescription: (productName: string, category?: string) =>
    apiClient.post("/ai/generate-description", {
      product_name: productName,
      category,
    }),
};
