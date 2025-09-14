import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart2,
  Package,
  Truck,
  Users,
  Settings,
  Bell,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
// --- CHANGE 1: Import the new SettingsModal ---
import { SettingsModal } from "@/components/settings/SettingsModal";

// NavItem Component (No Change)
interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isExpanded: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon: Icon,
  label,
  isExpanded,
}) => (
  <NavLink
    to={to}
    className={({ isActive }: { isActive: boolean }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:text-white hover:bg-zinc-700/50",
        isActive && "bg-zinc-700 text-white",
        !isExpanded && "justify-center"
      )
    }
  >
    <Icon className="h-5 w-5 flex-shrink-0" />
    <span
      className={cn(
        "overflow-hidden transition-all",
        isExpanded ? "w-full" : "w-0"
      )}
    >
      {label}
    </span>
  </NavLink>
);

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/logistics", label: "Logistics", icon: Truck },
  { to: "/users", label: "Users", icon: Users },
];

// Mobile Sidebar Component (No Change)
const MobileSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/60 transition-opacity md:hidden",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Truck className="h-6 w-6 text-cyan-400" />
              <span>SupplyChain AI</span>
            </NavLink>
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start p-2 text-sm font-medium">
              {navItems.map((item) => (
                <NavItem key={item.to} {...item} isExpanded={true} />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main DashboardLayout Component
const DashboardLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- CHANGE 2: New state to control the Settings modal ---
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <>
      {/* --- CHANGE 3: Render the SettingsModal here --- */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <div
        className={cn(
          "grid min-h-screen w-full bg-zinc-950 text-white transition-[grid-template-columns] duration-300 ease-in-out",
          isSidebarExpanded
            ? "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
            : "md:grid-cols-[68px_1fr]"
        )}
      >
        {/* --- DESKTOP SIDEBAR --- */}
        <div className="hidden border-r border-zinc-800 bg-zinc-900/50 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4 lg:h-[60px]">
              <NavLink
                to="/"
                className="flex items-center gap-2 font-semibold overflow-hidden"
              >
                <Truck className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity",
                    isSidebarExpanded ? "opacity-100" : "opacity-0"
                  )}
                >
                  SupplyChain AI
                </span>
              </NavLink>
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-2 rounded-md hover:bg-zinc-700/50"
              >
                <PanelLeft
                  className={cn(
                    "h-5 w-5 transition-transform",
                    !isSidebarExpanded && "rotate-180"
                  )}
                />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="grid items-start px-2 text-sm font-medium">
                {navItems.map((item) => (
                  <NavItem
                    key={item.to}
                    {...item}
                    isExpanded={isSidebarExpanded}
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-screen overflow-hidden">
          <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-900/50 px-4 lg:h-[60px] lg:px-6">
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="w-full flex-1"></div>
            <Bell className="h-5 w-5 text-zinc-400" />

            {/* --- CHANGE 4: Make the Settings icon clickable --- */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1 rounded-full hover:bg-zinc-700/50"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-zinc-400" />
            </button>
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-zinc-950 overflow-auto">
            <Outlet />
          </main>
        </div>
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>
    </>
  );
};

export default DashboardLayout;
