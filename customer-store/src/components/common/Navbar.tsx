import React, { useState, useEffect } from "react";
import { Search, Truck, LogOut } from "lucide-react";
import { CartDrawer } from "./CartDrawer";
import { useNavigate } from "react-router-dom";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-white text-xl">
          <Truck className="h-6 w-6 text-cyan-400" />
          <span>StoreFront AI</span>
        </div>

        {/* Search */}
        <div className="hidden md:flex relative w-1/3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full rounded-full bg-zinc-900 border-zinc-800 py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 text-zinc-300">
          <CartDrawer />

          {!user ? (
            <button
              onClick={() => navigate("/auth")}
              className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
