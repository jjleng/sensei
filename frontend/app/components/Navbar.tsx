import React from 'react';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 md:px-0">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center space-x-4"></div>
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}
