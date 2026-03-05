import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAccess?: "full_access" | "view_only";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredAccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAccess, setUserAccess] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Get Session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // 2. Fetch fresh profile data
      // Using maybeSingle() ensures we don't crash if the profile is being updated
      const { data: profile, error } = await supabase
        .from("admin_profiles")
        .select("role, access_level")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!error && profile) {
        // Updated Logic: Check if they have ANY valid admin level
        // 'full_access' or 'view_only' are both "Admins"
        const hasAccess =
          profile.access_level === "full_access" ||
          profile.access_level === "view_only";

        setIsAdmin(hasAccess);
        setUserAccess(profile.access_level);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, [location.pathname]); // Re-check when user changes pages

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="h-8 w-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to login if not a whitelisted admin
  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle specific page restrictions (like Admin Control page)
  if (requiredAccess === "full_access" && userAccess === "view_only") {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-zinc-950">
        <h1 className="text-4xl font-black uppercase italic text-red-600 mb-2">
          Access_Denied
        </h1>
        <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">
          Your account has View-Only privileges.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
