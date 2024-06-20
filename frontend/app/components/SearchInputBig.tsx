'use client';

import React, { useState } from 'react';

interface SearchInputBigProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  // Parent component can disable the submit button
  disabled?: boolean;
}

const SearchInputBig = (props: SearchInputBigProps) => {
  const [value, setValue] = useState('');
  const maxHeight = 450; // Max height for the textarea

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = 'auto'; // Reset height to auto to recalculate
    e.target.style.height = `${e.target.scrollHeight}px`; // Set height based on scroll height
  };

  const triggerSearch = () => {
    if (!value) return;
    props.onSearch(JSON.parse(JSON.stringify(value)));
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSearch();
    }
  };

  const disabled = !!props.disabled || !value;

  return (
    <div className="flex flex-col items-center p-4 px-2 rounded-md w-full max-w-2xl border border-2">
      <textarea
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={{ maxHeight: maxHeight }}
        className={`w-full p-2 bg-background rounded-md focus:outline-none overflow-y-auto resize-none `}
        placeholder={props.placeholder || 'Ask anything...'}
      />
      <div className="w-full flex justify-between mt-2">
        <div></div>
        <button
          onClick={triggerSearch}
          className={`ml-2 p-2 rounded-full flex items-center justify-center ${
            !disabled ? 'bg-brand hover:opacity-75' : 'bg-muted'
          }`}
          disabled={disabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-4 h-4 ${
              !disabled ? 'text-brand-foreground' : 'text-muted-foreground'
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchInputBig;
