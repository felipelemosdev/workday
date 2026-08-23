import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex items-center justify-center transition-colors"
    >
      {theme === "dark" ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.6} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.6} />}
    </button>
  );
}