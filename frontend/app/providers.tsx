'use client';

import React, { useContext, useReducer, useEffect } from 'react';
import { ToastProvider } from './hooks/use-toast';
import ClientToasts from './components/ClientToasts';
import Context, { reducer } from './context';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialState = useContext(Context);
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    isSidebarOpen: JSON.parse(localStorage.getItem('isSidebarOpen') || 'false'),
  });

  useEffect(() => {
    // Save the sidebar state to localStorage whenever it changes
    localStorage.setItem('isSidebarOpen', JSON.stringify(state.isSidebarOpen));
  }, [state.isSidebarOpen]);

  return (
    <Context.Provider value={{ ...state, dispatch }}>
      <ToastProvider>
        {children}
        <ClientToasts />
      </ToastProvider>
    </Context.Provider>
  );
}
