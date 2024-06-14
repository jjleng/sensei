import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ToastProps } from '../components/Toast';

type ToastWithId = ToastProps & { id: string };

interface ToastContextProps {
  toasts: ToastWithId[];
  addToast: (
    message: string,
    type: ToastProps['type'],
    duration?: number
  ) => void;
}

type Props = {
  children: ReactNode;
};

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<Props> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastProps['type'], duration: number = 3000) => {
      const id = uuidv4();
      setToasts((prevToasts) => [
        ...prevToasts,
        { id, message, type, duration, show: true },
      ]);
      setTimeout(() => {
        setToasts((prevToasts) =>
          prevToasts.map((toast) =>
            toast.id === id ? { ...toast, show: false } : toast
          )
        );
        setTimeout(() => {
          setToasts((prevToasts) =>
            prevToasts.filter((toast) => toast.id !== id)
          );
        }, 300); // Wait for the fade-out transition
      }, duration);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
