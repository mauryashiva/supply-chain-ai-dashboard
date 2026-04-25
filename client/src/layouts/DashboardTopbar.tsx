import React from "react";
import { Menu, Bell, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";

interface DashboardTopbarProps {
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
}

export const DashboardTopbar: React.FC<DashboardTopbarProps> = ({
  setIsMobileSidebarOpen,
  setIsSettingsModalOpen,
}) => {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 shrink-0 transition-colors">
      <button
        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        onClick={() => setIsMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      {/* This component now handles the theme internally */}
      <ThemeToggle />

      <button className="p-2 relative rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all">
        <Bell className="h-5 w-5 text-gray-600 dark:text-zinc-400" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
      </button>

      <button
        onClick={() => setIsSettingsModalOpen(true)}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <Settings className="h-5 w-5 text-gray-600 dark:text-zinc-400" />
      </button>
    </header>
  );
};
