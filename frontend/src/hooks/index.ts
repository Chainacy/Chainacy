'use client';

import { useState, useCallback } from 'react';
import type { TabType } from '@/types';

export { useFontLoaded } from './useFontLoaded';

export const useTabs = (initialTab: TabType = 'encrypt') => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return { activeTab, switchTab };
};

export const useForm = <T extends Record<string, string>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);

  const updateValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return { values, updateValue, resetForm };
};

export { useWallet } from './useWallet';
export { useAsyncState } from './useAsyncState';
export { useChromiaSession, useChromiaOperation, useChromiaQuery } from './chromia';
