import { useState, useEffect } from "react";
import { Search, Truck, LogOut, Package, Home } from "lucide-react";
import { CartDrawer } from "./CartDrawer";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";

type StoredUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* --- TOP HEADER --- */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-2 md:gap-4">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-black text-foreground text-lg md:text-xl cursor-pointer shrink-0"
          >
            <Truck className="h-5 w-5 md:h-6 md:w-6 text-cyan-500" />
            <span className="tracking-tighter xs:block hidden">
              StoreFront AI
            </span>
            <span className="tracking-tighter xs:hidden block">SF-AI</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 relative max-w-md mx-2 md:mx-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full rounded-full bg-secondary/50 border border-border py-1.5 md:py-2 pl-9 md:pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-1 md:gap-4">
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6 border-r border-border pr-4">
              <button
                onClick={() => navigate("/")}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-bold transition-colors",
                  isActive("/")
                    ? "text-cyan-500"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Home size={18} />
                <span>Home</span>
              </button>

              {user && (
                <button
                  onClick={() => navigate("/my-orders")}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold transition-colors",
                    isActive("/my-orders")
                      ? "text-cyan-500"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Package size={18} />
                  <span>Orders</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* CART: Hidden on Mobile Top Bar, Visible on Desktop Top Bar */}
              <div className="hidden md:flex h-10 items-center justify-center">
                <CartDrawer />
              </div>
            </div>

            {/* Desktop Auth Button */}
            <div className="hidden md:block">
              {!user ? (
                <button
                  onClick={() => navigate("/auth")}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all"
                >
                  Login
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg bg-destructive px-5 py-2 text-sm font-bold text-white hover:bg-red-600 transition-all shadow-md shadow-red-500/10"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- MOBILE BOTTOM NAVBAR --- */}
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/95 backdrop-blur-md border-t border-border md:hidden px-4 transition-colors duration-300">
        <div className="grid h-full grid-cols-4 mx-auto">
          <button
            onClick={() => navigate("/")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              isActive("/") ? "text-cyan-500" : "text-muted-foreground",
            )}
          >
            <Home size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              Home
            </span>
          </button>

          <button
            onClick={() => navigate("/my-orders")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              isActive("/my-orders")
                ? "text-cyan-500"
                : "text-muted-foreground",
            )}
          >
            <Package size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              Orders
            </span>
          </button>

          {/* CART: Always visible in Bottom Bar for Mobile */}
          <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <div className="h-6 flex items-center justify-center">
              <CartDrawer />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              Cart
            </span>
          </div>

          <button
            onClick={user ? handleLogout : () => navigate("/auth")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              user ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <LogOut size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {user ? "Logout" : "Login"}
            </span>
          </button>
        </div>
      </div>

      <div className="h-16 md:hidden" />
    </>
  );
};
