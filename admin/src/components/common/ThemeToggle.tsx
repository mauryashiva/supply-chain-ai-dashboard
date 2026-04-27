import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const modes: Theme[] = ["system", "light", "dark"];
    const currentIndex = modes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme(modes[nextIndex]);
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg border bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 group"
      title={`Current: ${theme}`}
    >
      {theme === "light" && <Sun className="h-5 w-5 text-amber-500" />}
      {theme === "dark" && <Moon className="h-5 w-5 text-blue-400" />}
      {theme === "system" && (
        <Monitor className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
      )}
    </button>
  );
};
