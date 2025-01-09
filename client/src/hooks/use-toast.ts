import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

interface State {
  toasts: ToasterToast[];
}

type Toast = Omit<ToasterToast, "id">;

interface ToastContextValue {
  toasts: ToasterToast[];
  toast: (props: Toast) => void;
  dismiss: (toastId?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  toasts: [],
  toast: () => null,
  dismiss: () => null,
});

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, dispatch: React.Dispatch<Action>) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, {
    toasts: [],
  });

  React.useEffect(() => {
    state.toasts.forEach((toast) => {
      if (!toast.open) {
        addToRemoveQueue(toast.id, dispatch);
      }
    });
  }, [state.toasts]);

  const toast = React.useCallback((props: Toast) => {
    const id = genId();
    const newToast: ToasterToast = {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id });
      },
    };
    dispatch({ type: "ADD_TOAST", toast: newToast });
  }, []);

  const dismiss = React.useCallback((toastId?: string) => {
    dispatch({ type: "DISMISS_TOAST", toastId });
  }, []);

  const value = React.useMemo(
    () => ({
      toasts: state.toasts,
      toast,
      dismiss,
    }),
    [state.toasts, toast, dismiss]
  );

  return React.createElement(ToastContext.Provider, { value }, children);
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export type { ToasterToast };