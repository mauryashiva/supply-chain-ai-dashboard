import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  // --- 🛠️ Fixed: Using custom hook for auth logic ---
  const { login, signup, loading, error, setError } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      await login(email, password);
    } else {
      const success = await signup({ email, password });
      if (success) {
        setIsLogin(true);
        setError(null);
        alert("Account created successfully. Please login.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans transition-colors duration-500">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Admin Authentication
          </h1>
          <p className="text-sm text-slate-400">
            {isLogin
              ? "Welcome back. Sign in to access your dashboard."
              : "Register a new admin account to get started."}
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="admin@supplychain.ai"
              className="w-full h-11 rounded-xl bg-slate-950 border border-slate-700 px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
              Secret Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full h-11 rounded-xl bg-slate-950 border border-slate-700 px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/10 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading
              ? "Authenticating..."
              : isLogin
                ? "Access Dashboard"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <button
            type="button"
            className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4"
            onClick={() => {
              setIsLogin((v) => !v);
              setError(null);
            }}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Login here"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
