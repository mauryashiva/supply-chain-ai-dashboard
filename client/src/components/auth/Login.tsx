import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ShieldCheck, ChevronRight } from "lucide-react";

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (loginError) {
        setError(loginError.message);
        setLoading(false); // Fix: Ensure loading stops on error
        return;
      }

      // 🔍 Updated Logic: Check for ANY valid admin access level
      const { data: profile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("role, access_level")
        .eq("id", authData.user.id)
        .maybeSingle();

      // We now allow 'full_access' OR 'view_only'
      const hasValidAccess =
        profile &&
        (profile.access_level === "full_access" ||
          profile.access_level === "view_only");

      if (profileError || !hasValidAccess) {
        setError(
          "Access Denied: You do not have permission to enter the Admin Portal.",
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // If they passed the check, let them in
      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      setError("An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) setError(error.message);
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(
      formData.email,
      {
        redirectTo: window.location.origin + "/reset-password",
      },
    );
    if (error) setError(error.message);
    else alert("Security reset link dispatched to your inbox.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#ffffff] dark:bg-[#09090b] transition-colors duration-500">
      <div className="max-w-[400px] w-full space-y-8 relative z-10">
        {/* PROFESSIONAL BRANDING */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-zinc-950 dark:bg-white rounded-xl shadow-lg">
              <ShieldCheck className="text-white dark:text-black w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in to Admin Portal
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter your credentials to manage SupplyChain AI
          </p>
        </div>

        {/* AUTH CARD */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 ring-cyan-500/10 focus:border-cyan-500 transition-all text-sm font-medium text-zinc-900 dark:text-white"
                  placeholder="admin@supplychain.ai"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 ring-cyan-500/10 focus:border-cyan-500 transition-all text-sm font-medium text-zinc-900 dark:text-white"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 font-semibold rounded-lg transition-all active:scale-[0.98] hover:opacity-90 flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && <ChevronRight size={16} />}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800"></span>
            </div>
            <span className="relative px-3 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Security OAuth
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full h-11 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 text-zinc-900 dark:text-white text-sm"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </div>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Require a new account?{" "}
          <Link
            to="/signup"
            className="text-cyan-600 font-semibold hover:underline"
          >
            Request Access
          </Link>
        </p>
      </div>
    </div>
  );
};
