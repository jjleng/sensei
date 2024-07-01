'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ManagedSearchArea } from '@/components/SearchArea';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  // Parent component can disable the submit button
  disabled?: boolean;
}

export default function SearchInput(props: SearchInputProps) {
  const [value, setValue] = useState('');
  const [isMultiline, setIsMultiline] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textMeasureRef = useRef<HTMLDivElement>(null);
  const bufferRange = 40; // Buffer range in pixels

  useEffect(() => {
    if (isMultiline && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    } else if (!isMultiline && inputRef.current) {
      const input = inputRef.current;
      input.focus();
      input.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [isMultiline, cursorPosition]);

  const checkIfMultilineNeeded = (text: string) => {
    if (textMeasureRef.current) {
      textMeasureRef.current.textContent = text;
      const inputWidth =
        (isMultiline
          ? textareaRef.current?.offsetWidth
          : inputRef.current?.offsetWidth) || 0;
      const textWidth = textMeasureRef.current.offsetWidth;

      if (textWidth >= inputWidth - bufferRange) {
        setIsMultiline(true);
      } else if (
        textWidth <= inputWidth - bufferRange * 2 &&
        !text.includes('\n')
      ) {
        setIsMultiline(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setCursorPosition(e.target.selectionStart || 0);
    checkIfMultilineNeeded(newValue);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setCursorPosition(e.target.selectionStart || 0);
    checkIfMultilineNeeded(newValue);
  };

  const triggerSearch = () => {
    if (!value) return;
    props.onSearch(JSON.parse(JSON.stringify(value)));
    setValue('');
    setIsMultiline(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      const selectionStart = target.selectionStart ?? 0;
      const selectionEnd = target.selectionEnd ?? 0;
      const newValue =
        value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd);
      setValue(newValue);
      setCursorPosition(selectionStart + 1);
      setIsMultiline(true);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      triggerSearch();
    }
  };

  const disabled = !!props.disabled || !value;

  return (
    <>
      <div
        ref={textMeasureRef}
        className="absolute top-0 left-0 z-[-1] invisible whitespace-pre"
        style={{ font: 'inherit', padding: 'inherit' }}
      />
      {isMultiline ? (
        <div className="w-full p-1.5 sm:bg-offset rounded-md border-none">
          <ManagedSearchArea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onSubmit={triggerSearch}
            cursorPosition={cursorPosition}
            setCursorPosition={setCursorPosition}
            placeholder={props.placeholder}
            disabled={props.disabled}
            arrowDirection="up"
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
                onChange={handleInputChange}
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
                  className={`flex items-center justify-center w-8 h-8 mr-1 rounded-full ${
                    !disabled ? 'bg-brand hover:opacity-75' : 'bg-muted'
                  }`}
                  disabled={disabled}
                >
                  <ArrowUp
                    className={cn(
                      !disabled
                        ? 'text-brand-foreground'
                        : 'text-muted-foreground'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
