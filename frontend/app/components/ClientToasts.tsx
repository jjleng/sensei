'use client';

import React, { useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import Toast from './Toast';

export default function ClientToasts() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          show={toast.show}
          type={toast.type}
        />
      ))}
    </div>
  );
}
