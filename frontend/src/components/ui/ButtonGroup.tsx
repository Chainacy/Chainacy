import { COLORS, MESSAGES } from '@/lib/constants';

interface ButtonGroupProps {
  variant: 'encrypt' | 'encrypt-combined' | 'decrypt';
  isWalletConnected?: boolean;
  isConnectingWallet?: boolean;
  isEncrypted?: boolean;
  isEncrypting?: boolean;
  isPayingSaving?: boolean;
  isSubmitting?: boolean;
  encryptError?: string;
  payError?: string;
  paySuccess?: string;
  submitError?: string;
  submitSuccess?: string;
  walletError?: string;
  onEncrypt?: () => void;
  onConnectWallet?: () => void;
  onPaySave?: () => void;
  onEncryptAndSend?: () => void;
  onSubmitShare?: () => void;
}

export const ButtonGroup = ({
  variant,
  isWalletConnected = false,
  isConnectingWallet = false,
  isEncrypted = false,
  isEncrypting = false,
  isPayingSaving = false,
  isSubmitting = false,
  encryptError = '',
  payError = '',
  paySuccess = '',
  submitError = '',
  submitSuccess = '',
  walletError = '',
  onEncrypt,
  onConnectWallet,
  onPaySave,
  onEncryptAndSend,
  onSubmitShare
}: ButtonGroupProps) => {
  const baseButtonStyle = "flex-1 h-[38px] sm:h-[42px] px-3 sm:px-4 py-2 text-white font-semibold text-xs sm:text-sm font-sans border-none cursor-pointer disabled:cursor-not-allowed";
  const errorButtonStyle = `${baseButtonStyle}`;
  const normalButtonStyle = `${baseButtonStyle} transition-colors duration-200 hover:opacity-90 disabled:opacity-70`;
  
  if (variant === 'encrypt-combined') {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center mt-5 sm:mt-7 mb-1.5 h-auto sm:h-[42px] gap-2 w-full">
        <button
          className={`${walletError ? errorButtonStyle : normalButtonStyle} rounded sm:rounded-l sm:rounded-r-none`}
          style={{ backgroundColor: walletError ? COLORS.error : COLORS.primary }}
          onClick={onConnectWallet}
          disabled={isWalletConnected || isConnectingWallet || !!walletError}
        >
          {walletError || (isConnectingWallet ? MESSAGES.wallet.connecting : (isWalletConnected ? MESSAGES.wallet.connected : MESSAGES.wallet.connect))}
        </button>
        
        <button
          className={`${(encryptError || payError) ? errorButtonStyle : normalButtonStyle} rounded sm:rounded-r sm:rounded-l-none`}
          style={{ 
            backgroundColor: paySuccess ? COLORS.success : ((encryptError || payError) ? COLORS.error : COLORS.secondary)
          }}
          onClick={onEncryptAndSend}
          disabled={!isWalletConnected || !!encryptError || !!payError || !!paySuccess || isEncrypting || isPayingSaving}
        >
          {paySuccess || encryptError || payError || (
            isEncrypting ? MESSAGES.encryption.encrypting : 
            isPayingSaving ? MESSAGES.ui.sending : 
            'Encrypt & Send'
          )}
        </button>
      </div>
    );
  }
  
  if (variant === 'encrypt') {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center mt-5 sm:mt-7 mb-1.5 h-auto sm:h-[42px] gap-2 w-full">
        <button
          className={`${walletError ? errorButtonStyle : normalButtonStyle} rounded sm:rounded-l sm:rounded-r-none`}
          style={{ backgroundColor: walletError ? COLORS.error : COLORS.primary }}
          onClick={onConnectWallet}
          disabled={isWalletConnected || isConnectingWallet || !!walletError}
        >
          {walletError || (isConnectingWallet ? MESSAGES.wallet.connecting : (isWalletConnected ? MESSAGES.wallet.connected : MESSAGES.wallet.connect))}
        </button>
        
        <button
          className={`${encryptError ? errorButtonStyle : normalButtonStyle} rounded sm:rounded-none`}
          style={{ backgroundColor: encryptError ? COLORS.error : COLORS.secondary }}
          onClick={onEncrypt}
          disabled={!isWalletConnected || !!encryptError || isEncrypting || isEncrypted}
        >
          {encryptError || (isEncrypting ? MESSAGES.encryption.encrypting : isEncrypted ? MESSAGES.encryption.encrypted : MESSAGES.encryption.encrypt)}
        </button>
        
        <button
          className={`${payError ? errorButtonStyle : normalButtonStyle} rounded sm:rounded-r sm:rounded-l-none`}
          style={{ 
            backgroundColor: paySuccess ? COLORS.success : (payError ? COLORS.error : COLORS.tertiary)
          }}
          onClick={onPaySave}
          disabled={!isWalletConnected || !isEncrypted || !!payError || !!paySuccess || isPayingSaving}
        >
          {paySuccess || payError || (isPayingSaving ? MESSAGES.ui.sending : MESSAGES.ui.payAndSend)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center mt-5 sm:mt-7 mb-1.5 h-auto sm:h-[42px] gap-2 w-full">
      <button
        className={`${walletError ? errorButtonStyle : normalButtonStyle} rounded-l sm:rounded-l rounded-r sm:rounded-r-none`}
        style={{ backgroundColor: walletError ? COLORS.error : COLORS.primary }}
        onClick={onConnectWallet}
        disabled={isWalletConnected || isConnectingWallet || !!walletError}
      >
        {walletError || (isConnectingWallet ? MESSAGES.wallet.connecting : (isWalletConnected ? MESSAGES.wallet.connected : MESSAGES.wallet.connect))}
      </button>
      
      <button
        className={`${submitError ? errorButtonStyle : normalButtonStyle} rounded-r sm:rounded-r rounded-l sm:rounded-l-none`}
        style={{ 
          backgroundColor: submitSuccess ? COLORS.success : (submitError ? COLORS.error : COLORS.tertiary)
        }}
        onClick={onSubmitShare}
        disabled={!isWalletConnected || isSubmitting || !!submitError || !!submitSuccess}
      >
        {submitSuccess || submitError || (isSubmitting ? MESSAGES.ui.sending : MESSAGES.ui.submitShare)}
      </button>
    </div>
  );
};
