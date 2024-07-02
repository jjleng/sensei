'use client';

import React, { useContext, useReducer, useEffect, useState } from 'react';
import { ToastProvider } from './hooks/use-toast';
import ClientToasts from './components/ClientToasts';
import Context, { reducer } from './context';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialState = useContext(Context);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSidebarState = localStorage.getItem('isSidebarOpen');
      if (savedSidebarState !== null) {
        dispatch({
          type: 'SET_SIDEBAR_OPEN',
          payload: JSON.parse(savedSidebarState),
        });
      }
      setIsHydrated(true);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        'isSidebarOpen',
        JSON.stringify(state.isSidebarOpen)
      );
    }
  }, [state.isSidebarOpen, isHydrated]);

  if (!isHydrated) {
    return null;
  }

  return (
    <Context.Provider value={{ ...state, dispatch }}>
      <ToastProvider>
        {children}
        <ClientToasts />
      </ToastProvider>
    </Context.Provider>
  );
}
