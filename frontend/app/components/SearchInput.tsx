'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ManagedSearchArea } from '@/components/SearchArea';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  // Parent component can disable the submit button
  disabled?: boolean;
}

export default function SearchInput(props: SearchInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const input = inputRef.current;

    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, [value]);

  const triggerSearch = () => {
    if (!value) return;
    props.onSearch(JSON.parse(JSON.stringify(value)));
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setValue((prev) => `${prev}\n`);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      triggerSearch();
    }
  };

  const disabled = !!props.disabled || !value;

  return (
    <>
      {value.includes('\n') ? (
        <div className="w-full p-1.5 sm:bg-offset rounded-md border-none">
          <ManagedSearchArea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onSubmit={() => {
              triggerSearch();
            }}
          />
        </div>
      ) : (
        <form
          className="w-full"
          id="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            triggerSearch();
          }}
        >
          <div className="w-full p-1.5 sm:bg-offset rounded-full border-none">
            <div className="flex items-center w-full p-1 bg-background rounded-full border border-2">
              <input
                ref={inputRef}
                onChange={(e) => {
                  setValue(e.target.value);
                }}
                onKeyDown={handleKeyDown}
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
                      !disabled
                        ? 'text-brand-foreground'
                        : 'text-muted-foreground'
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
          </div>
        </form>
      )}
    </>
  );
}
