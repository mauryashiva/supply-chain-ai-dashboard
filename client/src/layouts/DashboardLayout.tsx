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
  Brain, // Import the new icon for AI Forecast
} from "lucide-react";
import { cn } from "@/lib/utils"; // Utility for combining class names
import { SettingsModal } from "@/components/settings/SettingsModal"; // Modal for application settings

// Interface for navigation item props
interface NavItemProps {
  to: string; // The route path
  icon: React.ElementType; // The icon component
  label: string; // The text label
  isExpanded: boolean; // Whether the sidebar is expanded or collapsed
}

/**
 * Reusable navigation link component for the sidebar.
 * Handles active state styling and adapts based on sidebar expansion.
 */
const NavItem: React.FC<NavItemProps> = ({
  to,
  icon: Icon,
  label,
  isExpanded,
}) => (
  <NavLink
    to={to}
    // Dynamically apply classes based on active state and sidebar expansion
    className={({ isActive }: { isActive: boolean }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-all hover:text-white hover:bg-zinc-700/50",
        isActive && "bg-zinc-700 text-white", // Active link style
        !isExpanded && "justify-center" // Center icon when collapsed
      )
    }
  >
    <Icon className="h-5 w-5 flex-shrink-0" />
    <span
      className={cn(
        "overflow-hidden transition-all",
        // Conditionally show/hide the label based on expansion
        isExpanded ? "w-full" : "w-0"
      )}
    >
      {label}
    </span>
  </NavLink>
);

// Define the navigation items for the sidebar
// Re-ordered and added "AI Forecast"
const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/forecast", label: "AI Forecast", icon: Brain }, // New AI Forecast link
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/logistics", label: "Logistics", icon: Truck },
  { to: "/import", label: "Import / Export", icon: FileUp }, // Moved Import/Export
  { to: "/users", label: "Users", icon: Users },
];

/**
 * Sidebar component specifically designed for mobile viewports.
 * Slides in from the left.
 */
const MobileSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  return (
    // Backdrop overlay
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/60 transition-opacity md:hidden",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose} // Close sidebar on backdrop click
    >
      {/* Sidebar panel */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full" // Slide animation
        )}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the panel
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          {/* Mobile Sidebar Header */}
          <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Truck className="h-6 w-6 text-cyan-400" />
              <span>SupplyChain AI</span>
            </NavLink>
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start p-2 text-sm font-medium">
              {/* Render navigation items (always expanded on mobile) */}
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

/**
 * The main layout component for the entire dashboard.
 * Includes the desktop/mobile sidebars, header, and main content area.
 */
const DashboardLayout: React.FC = () => {
  // State for controlling desktop sidebar expansion
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  // State for controlling mobile sidebar visibility
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // State for controlling the settings modal visibility
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // State acting as a "refresh signal" for child routes using Outlet context.
  // Incrementing this key triggers effects in child components that depend on settings.
  const [refreshKey, setRefreshKey] = useState(0);

  // Callback function passed to SettingsModal. Called when settings are successfully saved.
  const handleSettingsSave = () => {
    setIsSettingsModalOpen(false); // Close the settings modal
    setRefreshKey((prevKey) => prevKey + 1); // Trigger the refresh signal by incrementing the key
  };

  return (
    <>
      {/* Settings Modal (rendered outside the main grid) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        // Pass the callback function to handle successful save
        onSettingsSave={handleSettingsSave}
      />

      {/* Main Grid Layout */}
      <div
        className={cn(
          "grid min-h-screen w-full bg-zinc-950 text-white transition-[grid-template-columns] duration-300 ease-in-out",
          // Adjust grid columns based on desktop sidebar state
          isSidebarExpanded
            ? "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]" // Expanded state
            : "md:grid-cols-[68px_1fr]" // Collapsed state
        )}
      >
        {/* --- DESKTOP SIDEBAR --- (Hidden on small screens) */}
        <div className="hidden border-r border-zinc-800 bg-zinc-900/50 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            {/* Desktop Sidebar Header */}
            <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4 lg:h-[60px]">
              <NavLink
                to="/"
                className="flex items-center gap-2 font-semibold overflow-hidden"
              >
                <Truck className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity",
                    isSidebarExpanded ? "opacity-100" : "opacity-0" // Fade label in/out
                  )}
                >
                  SupplyChain AI
                </span>
              </NavLink>
              {/* Sidebar expand/collapse button */}
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-2 rounded-md hover:bg-zinc-700/50"
              >
                <PanelLeft
                  className={cn(
                    "h-5 w-5 transition-transform",
                    !isSidebarExpanded && "rotate-180" // Rotate icon when collapsed
                  )}
                />
              </button>
            </div>
            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-y-auto">
              <nav className="grid items-start px-2 text-sm font-medium">
                {/* Render navigation items, passing the expansion state */}
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

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Header Bar */}
          <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-900/50 px-4 lg:h-[60px] lg:px-6">
            {/* Mobile menu button (visible only on small screens) */}
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Spacer to push icons to the right */}
            <div className="w-full flex-1"></div>
            {/* Header Icons (Notifications, Settings) */}
            <Bell className="h-5 w-5 text-zinc-400" />
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1 rounded-full hover:bg-zinc-700/50"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-zinc-400" />
            </button>
          </header>

          {/* Main Content Area: Renders the active route's component */}
          <main className="flex-1 p-4 sm:p-6 bg-zinc-950 overflow-auto">
            {/* Outlet renders the matched child route component */}
            {/* Pass the refreshKey via context to child routes */}
            <Outlet context={{ refreshKey }} />
          </main>
        </div>

        {/* Mobile Sidebar Component (controlled by state) */}
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>
    </>
  );
};

export default DashboardLayout;
