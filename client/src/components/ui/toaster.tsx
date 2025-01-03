import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useEffect } from "react"

export function Toaster() {
  const { toasts } = useToast()

  useEffect(() => {
    console.log('Toasts updated:', toasts)
  }, [toasts])

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => {
        console.log('Rendering toast:', { id, title, description, props });
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="fixed bottom-0 right-0 flex flex-col p-4 sm:bottom-0 sm:right-0 sm:top-auto md:max-w-[420px] gap-2" />
    </ToastProvider>
  )
}