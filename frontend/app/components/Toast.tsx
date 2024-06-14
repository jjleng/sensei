import React from 'react';

export interface ToastProps {
  message: string;
  show: boolean;
  type: 'success' | 'error' | 'default';
}

const Toast = ({ message, show, type }: ToastProps) => {
  let icon: React.ReactNode;
  let iconColorClass: string;
  let darkIconColorClass: string;

  switch (type) {
    case 'success':
      icon = (
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
        </svg>
      );
      iconColorClass = 'text-green-500';
      darkIconColorClass = 'dark:text-green-200';
      break;
    case 'error':
      icon = (
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
        </svg>
      );
      iconColorClass = 'text-red-500';
      darkIconColorClass = 'dark:text-red-200';
      break;
    case 'default':
    default:
      icon = (
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
        </svg>
      );
      iconColorClass = 'text-blue-500';
      darkIconColorClass = 'dark:text-blue-200';
      break;
  }

  return (
    <div
      className={`flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      role="alert"
    >
      <div
        className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${iconColorClass} rounded-lg ${darkIconColorClass}`}
      >
        {icon}
        <span className="sr-only">{type} icon</span>
      </div>
      <div className="ms-3 text-sm font-normal">{message}</div>
    </div>
  );
};

export default Toast;
