"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle ${isLight ? "is-light" : "is-dark"} ${className}`.trim()}
      title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={isLight}
    >
      <span className="theme-toggle-track" aria-hidden>
        <Moon className="theme-toggle-end theme-toggle-end-moon" />
        <Sun className="theme-toggle-end theme-toggle-end-sun" />
        <span className="theme-toggle-knob">
          {isLight ? <Sun /> : <Moon />}
        </span>
      </span>
    </button>
  );
}
