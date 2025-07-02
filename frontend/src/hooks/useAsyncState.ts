import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState('');
  
  const handleError = useCallback((errorMessage: string, duration = 3000) => {
    setError(errorMessage);
    setTimeout(() => setError(''), duration);
  }, []);
  
  const clearError = useCallback(() => setError(''), []);
  
  return { error, handleError, clearError };
};

export const useSuccessHandler = () => {
  const [success, setSuccess] = useState('');
  
  const handleSuccess = useCallback((successMessage: string, duration = 3000) => {
    setSuccess(successMessage);
    setTimeout(() => setSuccess(''), duration);
  }, []);
  
  const clearSuccess = useCallback(() => setSuccess(''), []);
  
  return { success, handleSuccess, clearSuccess };
};

export const useAsyncState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  const { success, handleSuccess, clearSuccess } = useSuccessHandler();
  
  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      clearError();
      clearSuccess();
      
      const result = await asyncFn();
      
      if (successMessage) {
        handleSuccess(successMessage);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      handleError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError, handleSuccess, clearSuccess]);
  
  return {
    isLoading,
    error,
    success,
    executeAsync,
    handleError,
    handleSuccess,
    clearError,
    clearSuccess
  };
};
