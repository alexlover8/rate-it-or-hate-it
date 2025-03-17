'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'default' | 'warning';

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (props: Omit<ToastProps, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(({ 
    title, 
    description, 
    type = 'default', 
    duration = 5000 
  }: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, type, duration };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto dismiss after duration
    if (duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 rounded-lg shadow-lg 
              transform transition-all duration-300 ease-out
              p-4 mb-2 
              ${t.type === 'success' ? 'bg-white dark:bg-gray-800 border-l-4 border-green-500' : 
                t.type === 'error' ? 'bg-white dark:bg-gray-800 border-l-4 border-red-500' : 
                t.type === 'warning' ? 'bg-white dark:bg-gray-800 border-l-4 border-yellow-500' : 
                'bg-white dark:bg-gray-800 border-l-4 border-blue-500'}
              animate-in fade-in slide-in-from-right-full
            `}
            role="alert"
          >
            <div className="flex-shrink-0">
              {t.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : t.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : t.type === 'warning' ? (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              ) : (
                <Info className="h-5 w-5 text-blue-500" />
              )}
            </div>
            
            <div className="flex-1 ml-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {t.title}
              </p>
              {t.description && (
                <p className="text-gray-500 dark:text-gray-300 text-xs mt-1">
                  {t.description}
                </p>
              )}
            </div>
            
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 ml-auto text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 p-1 rounded-full"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};