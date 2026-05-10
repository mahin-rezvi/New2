"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const storageKey = "startech-atlas-theme";

function resolveTheme(value: string | null): ThemeMode | null {
  return value === "light" || value === "dark" ? value : null;
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(storageKey, theme);
}

function getBrowserTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = resolveTheme(window.localStorage.getItem(storageKey));
  const documentTheme = resolveTheme(document.documentElement.dataset.theme ?? null);
  const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

  return stored ?? documentTheme ?? systemTheme;
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.5M12 18.75v2.5M4.05 4.05l1.77 1.77M18.18 18.18l1.77 1.77M2.75 12h2.5M18.75 12h2.5M4.05 19.95l1.77-1.77M18.18 5.82l1.77-1.77"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.2 14.66A7.85 7.85 0 0 1 9.34 3.8 8.7 8.7 0 1 0 20.2 14.66Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => getBrowserTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${nextTheme} theme`}
      onClick={() => {
        setTheme(nextTheme);
      }}
    >
      {theme === "dark" ? <MoonIcon /> : <SunIcon />}
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
