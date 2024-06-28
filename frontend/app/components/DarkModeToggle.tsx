'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function DarkModeTogglePlain({ size }: { size?: number }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <span onClick={toggleTheme} aria-label="Toggle Dark Mode">
      {theme === 'light' ? (
        <Moon size={size ?? 24} />
      ) : (
        <Sun size={size ?? 24} />
      )}
    </span>
  );
}

export default function DarkModeToggle() {
  return (
    <button className="p-2 rounded-full" aria-label="Toggle Dark Mode">
      <DarkModeTogglePlain />
    </button>
  );
}
