"use client";

import {
  Session,
  createKeyStoreInteractor,
  createWeb3ProviderEvmKeyStore,
  createSessionStorageLoginKeyStore,
  hours,
  ttlLoginRule,
} from "@chromia/ft4";
import { createClient } from "postchain-client";
import { ReactNode, createContext, useContext, useState } from "react";
import { CHROMIA_CONFIG } from "@/lib/chromia-config";

declare global {
  interface Window {
    ethereum: unknown;
  }
}

const ChromiaContext = createContext<{
  session: Session | undefined;
  isConnecting: boolean;
  error: string;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  logout?: () => Promise<void>;
} | undefined>(undefined);

export function ContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [logoutFn, setLogoutFn] = useState<(() => Promise<void>) | undefined>(undefined);

  const connectWallet = async () => {
    if (isConnecting || session) return;
    
    try {
      setIsConnecting(true);
      setError('');
      
      if (!window.ethereum) {
        setError("Install MetaMask");
        setTimeout(() => setError(''), 3000);
        return;
      }

      const client = await createClient({
        blockchainRid: CHROMIA_CONFIG.blockchainRid,
        directoryNodeUrlPool: CHROMIA_CONFIG.directoryNodeUrlPool,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const evmKeyStore = await createWeb3ProviderEvmKeyStore(window.ethereum as any);
      const evmKeyStoreInteractor = createKeyStoreInteractor(client, evmKeyStore);
      const accounts = await evmKeyStoreInteractor.getAccounts();

      if (accounts.length > 0) {
        const { session: newSession, logout } = await evmKeyStoreInteractor.login({
          accountId: accounts[0].id,
          config: {
            rules: ttlLoginRule(hours(2)),
            flags: ["ChainacySession"],
          },
          loginKeyStore: createSessionStorageLoginKeyStore(),
        });
        
        setSession(newSession);
        setLogoutFn(() => logout);
        
        newSession.call({
          name: 'update_last_activity_from_web',
          args: []
        }).catch(() => {});
      } else {
        setError("Register Account in Vault");
        setTimeout(() => setError(''), 3000);
      }
    } catch {
      setError("Connection failed");
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (logoutFn) {
      try {
        await logoutFn();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setSession(undefined);
    setLogoutFn(undefined);
    setError('');
  };

  return (
    <ChromiaContext.Provider value={{ 
      session, 
      isConnecting, 
      error, 
      connectWallet, 
      disconnect,
      logout: logoutFn 
    }}>
      {children}
    </ChromiaContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(ChromiaContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a ContextProvider");
  }
  return context;
}
