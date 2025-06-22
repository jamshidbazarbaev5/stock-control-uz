import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark'; // The actual applied theme (resolved from system)
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    let resolvedTheme: 'light' | 'dark';

    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      resolvedTheme = theme;
    }

    // Apply the theme class
    root.classList.add(resolvedTheme);
    setActualTheme(resolvedTheme);

    // Update CSS custom properties based on theme
    if (resolvedTheme === 'dark') {
      // Apply dark theme variables
      root.style.setProperty('--background', 'oklch(0.145 0 0)');
      root.style.setProperty('--foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--card', 'oklch(0.205 0 0)');
      root.style.setProperty('--card-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--popover', 'oklch(0.205 0 0)');
      root.style.setProperty('--popover-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--primary', 'oklch(0.922 0 0)');
      root.style.setProperty('--primary-foreground', 'oklch(0.205 0 0)');
      root.style.setProperty('--secondary', 'oklch(0.269 0 0)');
      root.style.setProperty('--secondary-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--muted', 'oklch(0.269 0 0)');
      root.style.setProperty('--muted-foreground', 'oklch(0.708 0 0)');
      root.style.setProperty('--accent', 'oklch(0.269 0 0)');
      root.style.setProperty('--accent-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--destructive', 'oklch(0.704 0.191 22.216)');
      root.style.setProperty('--border', 'oklch(1 0 0 / 10%)');
      root.style.setProperty('--input', 'oklch(1 0 0 / 15%)');
      root.style.setProperty('--ring', 'oklch(0.556 0 0)');
      root.style.setProperty('--chart-1', 'oklch(0.488 0.243 264.376)');
      root.style.setProperty('--chart-2', 'oklch(0.696 0.17 162.48)');
      root.style.setProperty('--chart-3', 'oklch(0.769 0.188 70.08)');
      root.style.setProperty('--chart-4', 'oklch(0.627 0.265 303.9)');
      root.style.setProperty('--chart-5', 'oklch(0.645 0.246 16.439)');
      root.style.setProperty('--sidebar', 'oklch(0.205 0 0)');
      root.style.setProperty('--sidebar-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--sidebar-primary', 'oklch(0.488 0.243 264.376)');
      root.style.setProperty('--sidebar-primary-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--sidebar-accent', 'oklch(0.269 0 0)');
      root.style.setProperty('--sidebar-accent-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--sidebar-border', 'oklch(1 0 0 / 10%)');
      root.style.setProperty('--sidebar-ring', 'oklch(0.556 0 0)');
    } else {
      // Apply light theme variables
      root.style.setProperty('--background', 'oklch(1 0 0)');
      root.style.setProperty('--foreground', 'oklch(0.145 0 0)');
      root.style.setProperty('--card', 'oklch(1 0 0)');
      root.style.setProperty('--card-foreground', 'oklch(0.145 0 0)');
      root.style.setProperty('--popover', 'oklch(1 0 0)');
      root.style.setProperty('--popover-foreground', 'oklch(0.145 0 0)');
      root.style.setProperty('--primary', 'oklch(0.205 0 0)');
      root.style.setProperty('--primary-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--secondary', 'oklch(0.97 0 0)');
      root.style.setProperty('--secondary-foreground', 'oklch(0.205 0 0)');
      root.style.setProperty('--muted', 'oklch(0.97 0 0)');
      root.style.setProperty('--muted-foreground', 'oklch(0.556 0 0)');
      root.style.setProperty('--accent', 'oklch(0.97 0 0)');
      root.style.setProperty('--accent-foreground', 'oklch(0.205 0 0)');
      root.style.setProperty('--destructive', 'oklch(0.577 0.245 27.325)');
      root.style.setProperty('--border', 'oklch(0.922 0 0)');
      root.style.setProperty('--input', 'oklch(0.922 0 0)');
      root.style.setProperty('--ring', 'oklch(0.708 0 0)');
      root.style.setProperty('--chart-1', 'oklch(0.646 0.222 41.116)');
      root.style.setProperty('--chart-2', 'oklch(0.6 0.118 184.704)');
      root.style.setProperty('--chart-3', 'oklch(0.398 0.07 227.392)');
      root.style.setProperty('--chart-4', 'oklch(0.828 0.189 84.429)');
      root.style.setProperty('--chart-5', 'oklch(0.769 0.188 70.08)');
      root.style.setProperty('--sidebar', 'oklch(0.985 0 0)');
      root.style.setProperty('--sidebar-foreground', 'oklch(0.145 0 0)');
      root.style.setProperty('--sidebar-primary', 'oklch(0.205 0 0)');
      root.style.setProperty('--sidebar-primary-foreground', 'oklch(0.985 0 0)');
      root.style.setProperty('--sidebar-accent', 'oklch(0.97 0 0)');
      root.style.setProperty('--sidebar-accent-foreground', 'oklch(0.205 0 0)');
      root.style.setProperty('--sidebar-border', 'oklch(0.922 0 0)');
      root.style.setProperty('--sidebar-ring', 'oklch(0.708 0 0)');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Trigger re-evaluation by updating theme state
        setTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};