import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggleButton() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className="relative inline-flex items-center w-28 h-12">
      {/* Background track */}
      <div className={`w-28 h-12 rounded-full transition-colors duration-300 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
      
      {/* Sun icon (left) */}
      <div className="absolute left-1 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
          <Sun size={20} className="text-white stroke-2" />
        </div>
      </div>

      {/* Moon icon (right) */}
      <div className="absolute right-1 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
          <Moon size={20} className="text-white stroke-2" fill="white" />
        </div>
      </div>

      {/* Clickable button overlay */}
      <button
        onClick={toggleTheme}
        className="absolute inset-0 w-full h-full rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400"
        aria-label="Toggle theme"
      />
    </div>
  );
}