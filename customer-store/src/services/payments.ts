import { apiClient } from "./client";

export const paymentService = {
  // Matches backend: POST /api/customer/payments/razorpay/create-order
  createRazorpayOrder: (data: any) =>
    apiClient.post("/customer/payments/razorpay/create-order", data),

  // Matches backend: POST /api/customer/payments/razorpay/verify
  verifyPayment: (data: any) =>
    apiClient.post("/customer/payments/razorpay/verify", data),
};
