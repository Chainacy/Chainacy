import { useChromiaSession } from './chromia';

interface UseWalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  error: string;
}

interface UseWalletActions {
  connectWallet: () => Promise<void>;
  disconnect: () => void;
}

type UseWalletReturn = UseWalletState & UseWalletActions;

export const useWallet = (): UseWalletReturn => {
  const { isConnected, isConnecting, connectWallet: chromiaConnect, disconnect: chromiaDisconnect, accountId, error: chromiaError } = useChromiaSession();

  const connectWallet = async () => {
    await chromiaConnect();
  };

  const disconnect = () => {
    chromiaDisconnect();
  };

  return {
    isConnected,
    isConnecting,
    address: accountId ? `0x${accountId.toString('hex').slice(0, 8)}...` : null,
    error: chromiaError,
    connectWallet,
    disconnect,
  };
};
