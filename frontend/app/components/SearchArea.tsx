'use client';

import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';

interface SearchAreaProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  // Parent component can disable the submit button
  disabled?: boolean;
}

type ManagedSearchAreaProps = Pick<
  SearchAreaProps,
  'placeholder' | 'disabled'
> & {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onSubmit?: () => void;
  cursorPosition?: number;
  setCursorPosition?: (position: number) => void;
};

export const ManagedSearchArea = forwardRef<
  HTMLTextAreaElement,
  ManagedSearchAreaProps
>((props: ManagedSearchAreaProps, ref) => {
  const maxHeight = 450; // Max height for the textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    props.onChange?.(e);
    if (props.setCursorPosition) {
      props.setCursorPosition(e.target.selectionStart || 0);
    }
  };

  const value = props.value;

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = 'auto'; // Reset height to auto to recalculate
    textarea.style.height = `${textarea.scrollHeight}px`; // Set height based on scroll height
    textarea.focus();
    if (props.cursorPosition !== undefined) {
      textarea.setSelectionRange(props.cursorPosition, props.cursorPosition);
    }
  }, [props.value, props.cursorPosition]);

  const disabled = !!props.disabled || !value;

  return (
    <div className="flex flex-col items-center p-4 px-2 rounded-md w-full max-w-2xl border border-2 bg-background">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={(e) => props.onKeyDown?.(e)}
        style={{ maxHeight: maxHeight }}
        className={`w-full p-2 bg-background rounded-md focus:outline-none overflow-y-auto resize-none `}
        placeholder={props.placeholder || 'Ask anything...'}
      />
      <div className="w-full flex justify-between mt-2">
        <div></div>
        <button
          onClick={() => props.onSubmit?.()}
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
});

const SearchArea = (props: SearchAreaProps) => {
  const [value, setValue] = useState('');
  const maxHeight = 450; // Max height for the textarea

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
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
    <ManagedSearchArea
      value={value}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onSubmit={triggerSearch}
    />
  );
};

export default SearchArea;
