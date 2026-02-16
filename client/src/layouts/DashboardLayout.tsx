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
  FileUp,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsModal } from "@/components/settings/SettingsModal";

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
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100",
        isActive && "bg-blue-50 text-blue-600 font-medium",
        !isExpanded && "justify-center",
      )
    }
  >
    <Icon className="h-5 w-5 flex-shrink-0" />
    <span
      className={cn(
        "overflow-hidden transition-all",
        isExpanded ? "w-full" : "w-0",
      )}
    >
      {label}
    </span>
  </NavLink>
);

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/forecast", label: "AI Forecast", icon: Brain },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/logistics", label: "Logistics", icon: Truck },
  { to: "/import", label: "Import / Export", icon: FileUp },
  { to: "/users", label: "Users", icon: Users },
];

const MobileSidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/30 transition-opacity md:hidden",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-72 bg-white border-r border-gray-200 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Truck className="h-6 w-6 text-blue-600" />
              <span className="text-gray-900">SupplyChain AI</span>
            </NavLink>
            <button onClick={onClose}>
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 p-2 text-sm font-medium">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} isExpanded={true} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSettingsSave = () => {
    setIsSettingsModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsSave={handleSettingsSave}
      />

      <div
        className={cn(
          "grid min-h-screen w-full bg-gray-50 text-gray-900 transition-[grid-template-columns] duration-300",
          isSidebarExpanded
            ? "md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]"
            : "md:grid-cols-[70px_1fr]",
        )}
      >
        {/* Desktop Sidebar */}
        <div className="hidden border-r border-gray-200 bg-white md:block shadow-sm">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
              <NavLink
                to="/"
                className="flex items-center gap-2 font-semibold overflow-hidden"
              >
                <Truck className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity",
                    isSidebarExpanded ? "opacity-100" : "opacity-0",
                  )}
                >
                  SupplyChain AI
                </span>
              </NavLink>

              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <PanelLeft
                  className={cn(
                    "h-5 w-5 transition-transform",
                    !isSidebarExpanded && "rotate-180",
                  )}
                />
              </button>
            </div>

            <nav className="flex-1 px-2 py-2 text-sm font-medium">
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

        {/* Main Area */}
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm">
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1"></div>

            <Bell className="h-5 w-5 text-gray-600" />

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-auto">
            <Outlet context={{ refreshKey }} />
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
