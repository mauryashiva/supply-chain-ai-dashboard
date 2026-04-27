import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 🛡️ Security Check: Ensure the user actually has a recovery session
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };
    checkSession();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Basic Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 2. Update the user password
      // Supabase uses the token from the URL automatically to authorize this call
      const { error: resetError } = await supabase.auth.updateUser({
        password: password,
      });

      if (resetError) {
        throw resetError;
      }

      // 3. Success state
      setSuccess(true);

      // Auto-logout after reset to force a fresh login with new credentials
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while updating your password.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#09090b]">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 rounded-[2.5rem] text-center space-y-4 shadow-2xl">
          <div className="h-20 w-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-cyan-600 h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
            Password_Updated
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Your security credentials have been synchronized. <br />
            Redirecting to login portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#09090b]">
      <div className="max-w-md w-full space-y-8">
        <form
          onSubmit={handleReset}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] space-y-6 shadow-xl relative overflow-hidden"
        >
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl" />

          <div className="text-center space-y-2 relative">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-zinc-900 dark:text-zinc-50">
              Set_New_Password
            </h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Secure Administrative Access
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-100 dark:border-red-500/20">
              <AlertCircle size={16} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-cyan-500 transition-colors" />
              <input
                type="password"
                placeholder="New Password"
                className="w-full h-14 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-4 ring-cyan-500/10 focus:border-cyan-500 transition-all text-sm font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-cyan-500 transition-colors" />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full h-14 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-4 ring-cyan-500/10 focus:border-cyan-500 transition-all text-sm font-medium"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full h-14 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 font-black uppercase tracking-widest rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
          Supply Chain AI • Secure Protocol v3.0
        </p>
      </div>
    </div>
  );
};
