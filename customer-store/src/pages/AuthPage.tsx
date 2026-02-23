import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, loginUser } from "@/services/api";
import { ArrowRight } from "lucide-react";

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const loginPayload = new FormData();
        loginPayload.append("username", formData.email);
        loginPayload.append("password", formData.password);

        const res = await loginUser(loginPayload);

        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } else {
        await signupUser({
          email: formData.email,
          password: formData.password,
        });

        alert("Account created successfully. Please login.");
        setIsLogin(true);
        setLoading(false);
        return;
      }

      navigate(-1);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Mobile-friendly input styles integrated with theme variables
  const inputClass =
    "w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:ring-4 focus:ring-yellow-500/30 outline-none transition-all appearance-none";

  const labelClass =
    "block text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-foreground mb-2 ml-1 opacity-80";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden w-full transition-colors duration-300">
      {/* AUTH CARD: Theme-aware background and borders */}
      <div className="w-full max-w-105 bg-card border border-border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl transition-all duration-300">
        <header className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground uppercase italic">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-muted-foreground text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-2">
            {isLogin
              ? "Login to continue"
              : "Create account using Email & Password"}
          </p>
          <div className="h-1.5 w-12 bg-yellow-500 mt-4 rounded-full" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* EMAIL */}
          <div className="group">
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              required
              className={inputClass}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* PASSWORD */}
          <div className="group">
            <label className={labelClass}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className={inputClass}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-[0.2em] py-4 sm:py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-yellow-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            {!loading && (
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            )}
          </button>
        </form>

        {/* TOGGLE AUTH */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] sm:text-xs font-black text-muted-foreground hover:text-yellow-500 dark:hover:text-yellow-400 uppercase tracking-widest transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};
