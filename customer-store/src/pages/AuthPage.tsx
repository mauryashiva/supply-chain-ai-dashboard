import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, loginUser } from "@/services/api";
import { User, Mail, Lock, Phone, MapPin, ArrowRight } from "lucide-react";

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        // Handle Login
        const loginPayload = new FormData();
        loginPayload.append("username", formData.email);
        loginPayload.append("password", formData.password);
        const res = await loginUser(loginPayload);
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } else {
        // Handle Signup with Full Details
        await signupUser(formData);
        alert("Account created! Please login.");
        setIsLogin(true);
        setLoading(false);
        return;
      }
      navigate(-1); // Go back to the page they were on (like Checkout)
    } catch (err: any) {
      alert(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all";

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl">
        <h2 className="text-3xl font-bold text-white mb-2">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-zinc-500 text-sm mb-8">
          {isLogin
            ? "Login to access your orders"
            : "Join us for a professional shopping experience"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Full Name"
                required
                className={inputClass}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="email"
              placeholder="Email Address"
              required
              className={inputClass}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {!isLogin && (
            <>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Phone Number"
                  required
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                <textarea
                  placeholder="Shipping Address"
                  required
                  className={`${inputClass} pl-10 h-20 resize-none`}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="password"
              placeholder="Password"
              required
              className={inputClass}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-zinc-400 hover:text-cyan-400"
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
