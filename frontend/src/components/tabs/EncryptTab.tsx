import { useState } from 'react';
import { flushSync } from 'react-dom';
import { MESSAGES } from '@/lib/constants';
import { Input, Textarea } from '@/components/ui/Input';
import { ButtonGroup } from '@/components/ui/ButtonGroup';
import { useForm, useWallet } from '@/hooks';
import { useChromiaQuery, useChromiaOperation } from '@/hooks/chromia';
import { handleEncrypt, ShareData } from '@/lib/encryption';
import { validateScheduleTime, validateReward } from '@/lib/validation';
import { chrToSmallestUnit } from '@/lib/utils';

interface EncryptTabProps {
  isWalletConnected: boolean;
  isConnectingWallet: boolean;
  onConnectWallet: () => void;
  encryptState: {
    isEncrypted: boolean;
    isEncrypting: boolean;
    message: string;
    encryptedMessage: string;
    scheduledDate: string;
    scheduledTime: string;
    reward: string;
    shares?: ShareData[];
  };
  setEncryptState: (state: EncryptTabProps['encryptState']) => void;
}

export const EncryptTab = ({ 
  isWalletConnected, 
  isConnectingWallet,
  onConnectWallet, 
  encryptState, 
  setEncryptState 
}: EncryptTabProps) => {
  const { error: walletError } = useWallet();
  const { query } = useChromiaQuery();
  const { call } = useChromiaOperation();
  const { values, updateValue: updateFormValue } = useForm({
    message: encryptState.isEncrypted ? encryptState.encryptedMessage : encryptState.message,
    scheduledDate: encryptState.scheduledDate,
    scheduledTime: encryptState.scheduledTime,
    reward: encryptState.reward,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFiveActiveGuardians = async (): Promise<any[]> => {
    const seed = Math.floor(Math.random() * 1000000000);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guardians = await query<any>('get_random_guardians', { count: 5, seed });
    return guardians;
  };

  const updateValue = (key: keyof typeof values, value: string) => {
    updateFormValue(key, value);
    if (key === 'message') {
      setEncryptState({...encryptState, message: value});
    } else if (key === 'scheduledDate') {
      setEncryptState({...encryptState, scheduledDate: value});
    } else if (key === 'scheduledTime') {
      setEncryptState({...encryptState, scheduledTime: value});
    } else if (key === 'reward') {
      setEncryptState({...encryptState, reward: value});
    }
  };

  const [encryptError, setEncryptError] = useState('');
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [isPayingSaving, setIsPayingSaving] = useState(false);

  const handleEncryptAndSend = async () => {
    if (encryptState.isEncrypting || isPayingSaving) return;
    
    if (!values.message.trim()) {
      setEncryptError(MESSAGES.errors.emptyMessage);
      setTimeout(() => setEncryptError(''), 3000);
      return;
    }
    
    const dateError = validateScheduleTime(values.scheduledDate, values.scheduledTime);
    if (dateError) {
      setPayError(dateError);
      setTimeout(() => setPayError(''), 3000);
      return;
    }
    
    const rewardError = validateReward(values.reward);
    if (rewardError) {
      setPayError(rewardError);
      setTimeout(() => setPayError(''), 3000);
      return;
    }
    
    let currentShares = encryptState.shares;
    let currentEncryptedMessage = encryptState.encryptedMessage;
    
    if (!encryptState.isEncrypted) {
      try {
        flushSync(() => {
          setEncryptState({
            ...encryptState,
            isEncrypting: true,
            message: values.message
          });
          setEncryptError('');
          setPayError('');
        });
        
        const encryptionResult = await handleEncrypt(values.message, getFiveActiveGuardians);
        updateValue('message', encryptionResult.encryptedMessage);
        
        currentShares = encryptionResult.shares;
        currentEncryptedMessage = encryptionResult.encryptedMessage;
        
        flushSync(() => {
          setEncryptState({
            ...encryptState,
            isEncrypted: true,
            isEncrypting: false,
            message: values.message,
            encryptedMessage: encryptionResult.encryptedMessage,
            shares: encryptionResult.shares
          });
        });
      } catch (error) {
        flushSync(() => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('Not enough active guardians')) {
            setEncryptError(MESSAGES.errors.notEnoughGuardians);
          } else {
            setEncryptError(MESSAGES.encryption.failed);
          }
          setEncryptState({
            ...encryptState,
            isEncrypting: false
          });
        });
        setTimeout(() => setEncryptError(''), 3000);
        return;
      }
    }
    
    if (!currentShares || currentShares.length === 0) {
      setPayError(MESSAGES.errors.noSharesAvailable);
      setTimeout(() => setPayError(''), 3000);
      return;
    }
    
    try {
      flushSync(() => {
        setPayError('');
        setPaySuccess('');
        setIsPayingSaving(true);
      });
      
      const scheduledDateTime = new Date(`${values.scheduledDate}T${values.scheduledTime}:00Z`);
      const scheduledTimestamp = scheduledDateTime.getTime();
      
      const sharesForBlockchain = currentShares.map(share => [
        Buffer.from(share.owner),
        share.encrypted_content,
        share.decrypted_content ?? '',
        Buffer.from(share.share_hash),
        scheduledTimestamp,
        Number(values.reward)
      ]);

      const chrAmountInSmallestUnit = chrToSmallestUnit(values.reward);

      await call('create_message', [
        currentEncryptedMessage,
        scheduledTimestamp,
        chrAmountInSmallestUnit,
        sharesForBlockchain
      ]);
      
      flushSync(() => {
        setPaySuccess(MESSAGES.success.messageSent);
        setIsPayingSaving(false);
        
        const resetState = {
          isEncrypted: false,
          isEncrypting: false,
          message: '',
          encryptedMessage: '',
          scheduledDate: '',
          scheduledTime: '',
          reward: '',
          shares: []
        };
        
        setEncryptState(resetState);
      });
      
      updateFormValue('message', '');
      updateFormValue('scheduledDate', '');
      updateFormValue('scheduledTime', '');
      updateFormValue('reward', '');
      
      setTimeout(() => setPaySuccess(''), 3000);
      
    } catch (error) {
      flushSync(() => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Insufficient') && errorMessage.includes('balance')) {
          setPayError(MESSAGES.errors.notEnoughBalance);
        } else {
          setPayError(MESSAGES.errors.failedToSendMessage);
        }
        setIsPayingSaving(false);
      });
      setTimeout(() => setPayError(''), 3000);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-gray-700 mb-3 sm:mb-4 font-orbitron text-sm sm:text-base">{MESSAGES.encrypt.description}</p>
      
      <form className="space-y-3 sm:space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Textarea
          label={encryptState.isEncrypted ? MESSAGES.encrypt.encryptedMessage : MESSAGES.encrypt.yourMessage}
          placeholder={encryptState.isEncrypted ? '' : MESSAGES.encrypt.messagePlaceholder}
          rows={encryptState.isEncrypted ? 6 : 3}
          value={values.message}
          onChange={(e) => updateValue('message', e.target.value)}
          disabled={encryptState.isEncrypting || encryptState.isEncrypted || isPayingSaving}
          className={
            encryptState.isEncrypted 
              ? 'font-mono text-[9px] sm:text-xs bg-gray-50 border-dashed cursor-not-allowed'
              : encryptState.isEncrypting 
                ? 'bg-gray-50 border-dashed cursor-not-allowed'
                : ''
          }
        />

        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
          <div>
            <Input
              label={MESSAGES.encrypt.scheduledDate}
              type="date"
              value={values.scheduledDate}
              onChange={(e) => updateValue('scheduledDate', e.target.value)}
              disabled={encryptState.isEncrypting || isPayingSaving}
              className="max-w-full"
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
            />
          </div>
          <div>
            <Input
              label={MESSAGES.encrypt.scheduledTime}
              type="time"
              value={values.scheduledTime}
              onChange={(e) => updateValue('scheduledTime', e.target.value)}
              disabled={encryptState.isEncrypting || isPayingSaving}
              className="max-w-full"
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
            />
          </div>
        </div>

        <Input
          label={MESSAGES.encrypt.rewardLabel}
          type="text"
          placeholder={MESSAGES.encrypt.rewardPlaceholder}
          value={values.reward}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            updateValue('reward', value);
          }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          disabled={encryptState.isEncrypting || isPayingSaving}
        />

        <div className="text-xs sm:text-sm text-gray-600 leading-relaxed font-orbitron">
          <span className="font-medium">{MESSAGES.encrypt.noteLabel}</span> {MESSAGES.encrypt.feeNote}
        </div>

        <ButtonGroup
          variant="encrypt-combined"
          isWalletConnected={isWalletConnected}
          isConnectingWallet={isConnectingWallet}
          onConnectWallet={onConnectWallet}
          onEncryptAndSend={handleEncryptAndSend}
          encryptError={encryptError}
          payError={payError}
          paySuccess={paySuccess}
          walletError={walletError}
          isEncrypting={encryptState.isEncrypting}
          isPayingSaving={isPayingSaving}
        />
      </form>
    </div>
  );
};
