/**
 * =============================================================================
 * NOTIFICATION SERVICE
 * =============================================================================
 * DESCRIPCIÓ:
 * Servei de notificacions utilitzant react-hot-toast per a l'aplicació.
 *
 * ÍNDEX:
 * - MÈTODES DE NOTIFICACIÓ: success, error, info, warning, loading, dismiss, promise.
 * =============================================================================
 */

import toast from 'react-hot-toast';

export const notificationService = {
  success: (message: string) => {
    toast.success(message);
  },
  
  error: (message: string) => {
    toast.error(message);
  },
  
  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
      className: 'bg-info text-info-foreground border-border border p-4 rounded-lg shadow-lg',
    });
  },
  
  warning: (message: string) => {
    toast(message, {
      icon: '⚠️',
      className: 'bg-warning text-warning-foreground border-border border p-4 rounded-lg shadow-lg',
    });
  },
  
  loading: (message: string) => {
    return toast.loading(message);
  },
  
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
  
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  }
};
