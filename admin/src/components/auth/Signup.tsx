import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          display_name: formData.username,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
    } else if (data.user) {
      setIsSent(true);
    }
    setLoading(false);
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#09090b]">
        <div className="max-w-100 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 rounded-2xl text-center space-y-6 shadow-sm">
          <div className="h-16 w-16 bg-cyan-50 dark:bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-100 dark:border-cyan-500/20">
            <CheckCircle className="text-cyan-600 h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Verify your identity
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              We've dispatched a security link to <br />
              <span className="text-zinc-900 dark:text-zinc-200 font-semibold">
                {formData.email}
              </span>
              .
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full h-11 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#09090b] transition-colors duration-500">
      <div className="max-w-100 w-full space-y-8 relative z-10">
        {/* BRANDING */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-zinc-950 dark:bg-white rounded-xl shadow-lg">
              <ShieldCheck className="text-white dark:text-black w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create Admin Account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Join the SupplyChain AI administrative team
          </p>
        </div>

        {/* REGISTRATION CARD */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* FULL NAME */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 ring-cyan-500/10 focus:border-cyan-500 transition-all text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  placeholder="Enter your name"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
            </div>

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
                  className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 ring-cyan-500/10 focus:border-cyan-500 transition-all text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
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
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 ring-cyan-500/10 focus:border-cyan-500 transition-all text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 ring-cyan-500/10 focus:border-cyan-500 transition-all text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 font-semibold rounded-lg transition-all active:scale-[0.98] hover:opacity-90 flex items-center justify-center gap-2 text-sm shadow-sm mt-2"
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ChevronRight size={16} />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already a member?{" "}
          <Link
            to="/login"
            className="text-cyan-600 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
