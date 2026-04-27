import { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

/* ---------------- AUTH COMPONENTS ---------------- */
import { Login } from "@/components/auth/Login";
import { Signup } from "@/components/auth/Signup";
import { ResetPassword } from "@/components/auth/ResetPassword.tsx";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminManagement } from "@/pages/AdminManagement";

/* ---------------- THEME CONTROLLER ---------------- */
/**
 * Handles system and manual theme switching.
 * Applying the class to documentElement ensures Tailwind's 'dark:' variants work.
 */
const ThemeController = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.classList.toggle("dark", systemDark);
    }
  }, []);

  return <>{children}</>;
};

/* ---------------- PAGES & LAYOUTS ---------------- */
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import OrdersPage from "@/pages/OrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import LogisticsPage from "@/pages/LogisticsPage";
import UsersPage from "@/pages/UsersPage";
import ForecastPage from "@/pages/ForecastPage";

/* ---------------- ROUTES CONFIGURATION ---------------- */
const router = createBrowserRouter([
  // PUBLIC AUTH ROUTES
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  // 🔑 RESET PASSWORD ROUTE
  { path: "/reset-password", element: <ResetPassword /> },

  // PROTECTED DASHBOARD ROUTES
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "forecast", element: <ForecastPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "logistics", element: <LogisticsPage /> },
      { path: "users", element: <UsersPage /> },

      // ONLY ACCESSIBLE BY FULL_ACCESS ADMINS
      {
        path: "admin-management",
        element: (
          <ProtectedRoute requiredAccess="full_access">
            <AdminManagement />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // FALLBACK: Redirect any unknown routes to login
  { path: "*", element: <Navigate to="/login" replace /> },
]);

/* ---------------- APP ENTRY POINT ---------------- */
function App() {
  return (
    <ThemeController>
      <RouterProvider router={router} />
    </ThemeController>
  );
}

export default App;
