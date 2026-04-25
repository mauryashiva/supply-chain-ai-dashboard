import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services";
import { Loader2 } from "lucide-react";

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

        const res = await authService.login(loginPayload);

        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate(-1);
      } else {
        await authService.signup({
          email: formData.email,
          password: formData.password,
        });

        alert("Account created successfully. Please login.");
        setIsLogin(true);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        "Authentication failed. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 transition-colors">
      {/* CARD */}
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-8">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">
            {isLogin ? "Sign in" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin
              ? "Enter your credentials to continue"
              : "Get started with your new account"}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500 outline-none transition"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500 outline-none transition"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : isLogin ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="my-6 flex items-center">
          <div className="flex-1 h-px bg-border" />
          <span className="px-3 text-xs text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* TOGGLE */}
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Create a new account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <p className="absolute bottom-5 text-xs text-muted-foreground">
        © 2026 Your Company
      </p>
    </div>
  );
};
