import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 3500) => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5 transition-all animate-in slide-in-from-bottom-2 duration-200 border-slate-200"
          >
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />}

            <div className="flex-1">
              <h4 className="text-xs font-semibold text-slate-900">{toast.title}</h4>
              {toast.message && <p className="mt-0.5 text-xs text-slate-500 leading-normal">{toast.message}</p>}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 rounded p-1 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
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
