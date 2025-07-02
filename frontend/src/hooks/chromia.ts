import { useSessionContext } from "@/components/ContextProvider";
import { useCallback } from "react";
import { RawGtv } from "postchain-client";

export function useChromiaSession() {
  const { session, isConnecting, error, connectWallet, disconnect } = useSessionContext();
  
  return {
    session,
    isConnected: !!session,
    isConnecting,
    error,
    connectWallet,
    disconnect,
    accountId: session?.account?.id,
  };
}

export function useChromiaOperation() {
  const { session } = useSessionContext();

  const call = useCallback(async (name: string, args: RawGtv[] = []) => {
    if (!session) {
      throw new Error("No session available. Please connect your wallet first.");
    }

    return await session.call({
      name: name,
      args: args,
    });
  }, [session]);

  return { call };
}

export function useChromiaQuery() {
  const { session } = useSessionContext();

  const query = useCallback(async <T extends RawGtv>(name: string, args: Record<string, RawGtv> = {}) => {
    if (!session) {
      throw new Error("No session available. Please connect your wallet first.");
    }

    return await session.query<T>({ name, args });
  }, [session]);

  return { query };
}
