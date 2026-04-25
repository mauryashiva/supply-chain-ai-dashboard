import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Function to apply theme classes
    const applyTheme = (currentTheme: Theme) => {
      root.classList.remove("light", "dark");

      if (currentTheme === "system") {
        const systemDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        root.classList.add(systemDark ? "dark" : "light");
      } else {
        root.classList.add(currentTheme);
      }
    };

    applyTheme(theme);

    // Listen for System preference changes if theme is set to 'system'
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return { theme, setTheme: updateTheme };
};
