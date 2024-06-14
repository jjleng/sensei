'use client';

import React, { useContext, useReducer } from 'react';
import { ToastProvider } from './hooks/use-toast';
import ClientToasts from './components/ClientToasts';
import Context, { reducer } from './context';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialState = useContext(Context);
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <Context.Provider value={{ ...state, dispatch }}>
      <ToastProvider>
        {children}
        <ClientToasts />
      </ToastProvider>
    </Context.Provider>
  );
}
