import { createContext, useContext, useReducer, useCallback } from 'react';
import { reducer } from '@/hooks/use-toast';
import type { ToasterToast } from '@/hooks/use-toast';

type ToastContextType = {
  toasts: ToasterToast[];
  toast: (props: Omit<ToasterToast, "id">) => void;
  dismiss: (toastId?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    toasts: [],
  });

  const toast = useCallback((props: Omit<ToasterToast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id });
        },
      },
    });
    return {
      id,
      dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
      update: (props: ToasterToast) =>
        dispatch({
          type: "UPDATE_TOAST",
          toast: { ...props, id },
        }),
    };
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    dispatch({ type: "DISMISS_TOAST", toastId });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
