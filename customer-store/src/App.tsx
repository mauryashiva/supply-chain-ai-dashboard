import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { MobileAppShell } from "./components/layout/MobileAppShell";
import { MobileDiscoveryPage } from "./pages/customer/MobileDiscoveryPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AuthPage } from "./pages/AuthPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <Router>
      <MobileAppShell>
        <Routes>
          {/* Mobile Storefront Home */}
          <Route path="/" element={<MobileDiscoveryPage />} />

            {/* Product Details */}
            <Route path="/product/:id" element={<ProductDetailsPage />} />

            {/* Auth */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Order History - Protected */}
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <OrderHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Checkout - Protected */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* Optional: Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MobileAppShell>
      </Router>
  );
}

export default App;
