import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@/index.css"; // Import global styles using a path alias

// --- Page & Layout Imports ---
// Import the main application layout
import DashboardLayout from "@/layouts/DashboardLayout";
// Import all page components using path aliases
import DashboardPage from "@/pages/DashboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import OrdersPage from "@/pages/OrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import LogisticsPage from "@/pages/LogisticsPage";
import UsersPage from "@/pages/UsersPage";
import ImportPage from "@/pages/ImportPage"; // Page for CSV import/export
import ForecastPage from "@/pages/ForecastPage"; // Page for AI forecasting

// --- Router Configuration ---
// Define the application's routes using react-router-dom
const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />, // All routes are nested inside the DashboardLayout
    children: [
      { index: true, element: <DashboardPage /> }, // Default page (e.g., "/")
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "forecast", element: <ForecastPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "import", element: <ImportPage /> }, // Route for the new import/export page
      { path: "logistics", element: <LogisticsPage /> },
      { path: "users", element: <UsersPage /> },
      // Add other routes here as needed
    ],
  },
]);

// --- Application Mount ---
// Find the root DOM element and render the application
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Provide the router configuration to the application */}
    <RouterProvider router={router} />
  </React.StrictMode>
);
