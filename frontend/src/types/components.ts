export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FormInputProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface WalletDependentProps {
  isWalletConnected: boolean;
  isConnectingWallet: boolean;
  onConnectWallet: () => Promise<void>;
  walletError?: string;
}

export interface TabProps extends BaseComponentProps {
  active?: boolean;
}

export interface AsyncState {
  isLoading: boolean;
  error: string;
  success: string;
}

export interface EncryptionState {
  isEncrypted: boolean;
  isEncrypting: boolean;
  message: string;
  encryptedMessage: string;
  scheduledDate: string;
  scheduledTime: string;
  reward: string;
  shares?: import('@/lib/encryption').ShareData[];
}

export interface DecryptionState {
  decryptedShare: string;
  currentFilter: 'all' | 'mine';
  hasLoadedAll: boolean;
  hasLoadedMine: boolean;
}

export interface PublishedState {
  hasLoaded: boolean;
}

export interface UserSettings {
  pgpKey: string;
  telegramUsername: string;
}
