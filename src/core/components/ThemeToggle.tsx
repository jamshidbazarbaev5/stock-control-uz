    import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  const handleThemeChange = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor size={18} className="text-gray-600 dark:text-gray-300" />;
    }
    return actualTheme === 'dark' ? (
      <Moon size={18} className="text-gray-600 dark:text-gray-300" />
    ) : (
      <Sun size={18} className="text-gray-600 dark:text-gray-300" />
    );
  };

  const getTooltipText = () => {
    if (theme === 'light') return 'Switch to dark mode';
    if (theme === 'dark') return 'Switch to system mode';
    return 'Switch to light mode';
  };

  return (
    <button
      onClick={handleThemeChange}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
      title={getTooltipText()}
      aria-label={getTooltipText()}
    >
      <div className="transition-transform duration-200 group-hover:scale-110">
        {getIcon()}
      </div>
      
      {/* Optional: Theme indicator dots */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
        <div 
          className={`w-1 h-1 rounded-full transition-colors duration-200 ${
            theme === 'light' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
          }`} 
        />
        <div 
          className={`w-1 h-1 rounded-full transition-colors duration-200 ${
            theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          }`} 
        />
        <div 
          className={`w-1 h-1 rounded-full transition-colors duration-200 ${
            theme === 'system' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
          }`} 
        />
      </div>
    </button>
  );
}

// Alternative dropdown version for more explicit control
export function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Theme selector"
      >
        {currentTheme && <currentTheme.icon size={18} className="text-gray-600 dark:text-gray-300" />}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
          {currentTheme?.label}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  theme === themeOption.value 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <themeOption.icon size={16} />
                {themeOption.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}