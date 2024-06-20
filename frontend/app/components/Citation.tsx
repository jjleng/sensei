import React from 'react';

interface CitationProps {
  number: number;
}

const Citation: React.FC<CitationProps> = ({ number }) => {
  return (
    // TODO: clean up the colors
    <span className="inline-block rounded-full bg-gray-200 hover:bg-brand dark:bg-gray-700 dark:hover:bg-brand text-gray-500 hover:text-white dark:text-gray-400 dark:hover:text-white text-xs w-4 h-4 flex items-center justify-center ml-1">
      {number}
    </span>
  );
};

export default Citation;
