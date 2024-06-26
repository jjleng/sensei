'use client';

import React, { useState } from 'react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  // Parent component can disable the submit button
  disabled?: boolean;
}

export default function SearchInput(props: SearchInputProps) {
  const [value, setValue] = useState('');

  const triggerSearch = () => {
    if (!value) return;
    props.onSearch(JSON.parse(JSON.stringify(value)));
    setValue('');
  };

  const disabled = !!props.disabled || !value;

  return (
    <form
      className="w-full"
      id="search-form"
      onSubmit={(e) => {
        e.preventDefault();
        triggerSearch();
      }}
    >
      <div className="flex items-center w-full p-1 bg-background rounded-full border">
        <input
          onChange={(e) => {
            setValue(e.target.value);
          }}
          value={value}
          type="text"
          className="flex-grow px-4 py-2 text-secondary-foreground bg-background border-none rounded-full focus:outline-none"
          placeholder={props.placeholder || 'Ask anything...'}
        />
        <div className="flex items-center space-x-2">
          <button
            type="submit"
            form="search-form"
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              !disabled ? 'bg-brand hover:opacity-75' : 'bg-muted'
            }`}
            disabled={disabled}
          >
            <svg
              className={`w-5 h-5 ${
                !disabled ? 'text-brand-foreground' : 'text-muted-foreground'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
