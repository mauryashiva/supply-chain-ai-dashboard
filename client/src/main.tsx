import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@/index.css";

// --- CHANGE 1: ClerkProvider ko import karein ---
import { ClerkProvider } from "@clerk/clerk-react";

import DashboardLayout from "@/layouts/DashboardLayout";
// Pages
import DashboardPage from "@/pages/DashboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import OrdersPage from "@/pages/OrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import LogisticsPage from "@/pages/LogisticsPage";
import UsersPage from "@/pages/UsersPage";
import ImportPage from "@/pages/ImportPage";
import ForecastPage from "@/pages/ForecastPage";
// --- CHANGE 2: Naye Login/Signup pages ko import karein ---
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";

// --- CHANGE 3: Apni .env file se Publishable Key lein ---
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key in .env file");
}

// --- CHANGE 4: Router ko naye routes ke saath update karein ---
const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "forecast", element: <ForecastPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "import", element: <ImportPage /> },
      { path: "logistics", element: <LogisticsPage /> },
      { path: "users", element: <UsersPage /> },
    ],
  },
  // Naye routes jo Layout ka istemaal NAHI karte
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* --- CHANGE 5: Poori app ko ClerkProvider se wrap karein --- */}
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <RouterProvider router={router} />
    </ClerkProvider>
  </React.StrictMode>
);
