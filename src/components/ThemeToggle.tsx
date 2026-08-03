"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-between w-14 h-7 p-1 rounded-full bg-[#141A29] dark:bg-[#141A29] border border-[#232D42] cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${className}`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle light and dark mode"
    >
      <div
        className={`w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md transform transition-transform duration-300 ${
          theme === "light" ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {theme === "light" ? (
          <Sun className="w-3 h-3 text-amber-100" />
        ) : (
          <Moon className="w-3 h-3 text-white" />
        )}
      </div>

      <Sun
        className={`w-3.5 h-3.5 text-amber-400 transition-opacity ${
          theme === "light" ? "opacity-100" : "opacity-30"
        }`}
      />
      <Moon
        className={`w-3.5 h-3.5 text-indigo-300 transition-opacity ${
          theme === "dark" ? "opacity-100" : "opacity-30"
        }`}
      />
    </button>
  );
}
