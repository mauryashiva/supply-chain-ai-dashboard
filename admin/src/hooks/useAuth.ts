import { useState } from "react";
import { authService } from "@/services/api";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = new URLSearchParams();
      payload.append("username", email);
      payload.append("password", password);

      const res = await authService.login(payload);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/");
      // Refresh to ensure axios interceptor picks up the new token
      window.location.reload();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await authService.signup(data);
      return true; // Success
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Signup failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, signup, loading, error, setError };
};
