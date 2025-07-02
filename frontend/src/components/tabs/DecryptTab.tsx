import { useState, useEffect, useCallback } from 'react';
import { COLORS, MESSAGES } from '@/lib/constants';
import { CHROMIA_CONFIG } from '@/lib/chromia-config';
import { Textarea } from '@/components/ui/Input';
import { ButtonGroup } from '@/components/ui/ButtonGroup';
import { useWallet } from '@/hooks';
import { useAsyncState } from '@/hooks/useAsyncState';
import { useChromiaQuery, useChromiaSession, useChromiaOperation } from '@/hooks/chromia';
import { createClient } from 'postchain-client';
import type { Task } from '@/types';
import type { WalletDependentProps, DecryptionState, TabProps } from '@/types/components';
import type { ShareData } from '@/lib/encryption';

interface DecryptTabProps extends WalletDependentProps, TabProps {
  decryptState: DecryptionState;
  setDecryptState: (state: DecryptionState) => void;
}

export const DecryptTab = ({ 
  isWalletConnected, 
  isConnectingWallet,
  onConnectWallet, 
  decryptState, 
  setDecryptState,
  active
}: DecryptTabProps) => {
  const { error: walletError } = useWallet();
  const { query } = useChromiaQuery();
  const { call } = useChromiaOperation();
  const { accountId } = useChromiaSession();
  
  const {
    isLoading: isLoadingTasks,
    executeAsync: executeFetchTasks
  } = useAsyncState();
  
  const {
    error: submitError,
    success: submitSuccess,
    handleError: handleSubmitError,
    handleSuccess: handleSubmitSuccess,
    clearError: clearSubmitError,
    clearSuccess: clearSubmitSuccess
  } = useAsyncState();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [hasLoadedMine, setHasLoadedMine] = useState(false);
  const [localFilter, setLocalFilter] = useState<'all' | 'mine'>('all');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);

  const mapShareDataToTasks = (shareData: ShareData[]): Task[] => {
    return shareData.map((share, index) => {
      const scheduledDate = new Date(share.scheduled_publish_at || 0);
      const iso = scheduledDate.toISOString();
      const datePart = iso.slice(0, 10);
      const timePart = iso.slice(11, 16);
      const formatted = `${datePart} ${timePart} UTC`;
      return {
        id: `task-${index}`,
        scheduledFor: formatted,
        body: share.decrypted_content || MESSAGES.decrypt.taskBody,
        pgpMessage: share.encrypted_content,
        reward: share.reward ?? share.chr_reward ?? 0
      };
    });
  };

  const fetchAllTasks = useCallback(async () => {
    await executeFetchTasks(async () => {
      const client = await createClient({
        blockchainRid: CHROMIA_CONFIG.blockchainRid,
        directoryNodeUrlPool: CHROMIA_CONFIG.directoryNodeUrlPool,
      });
      const shareData = await client.query('get_all_decrypt_tasks', {}) as unknown as ShareData[];
      const tasks = mapShareDataToTasks(shareData);
      setAllTasks(tasks);
      setHasLoadedAll(true);
      return tasks;
    });
  }, [executeFetchTasks]);

  const fetchMyTasks = useCallback(async () => {
    if (!isWalletConnected || !accountId) return;
    
    await executeFetchTasks(async () => {
      const shareData = await query('get_decrypt_tasks_for_guardian', { pubkey: accountId }) as unknown as ShareData[];
      const tasks = mapShareDataToTasks(shareData);
      setMyTasks(tasks);
      setHasLoadedMine(true);
      return tasks;
    });
  }, [executeFetchTasks, isWalletConnected, query, accountId]);

  useEffect(() => {
    if (active && !hasLoadedAll) {
      fetchAllTasks();
    }
  }, [active, hasLoadedAll, fetchAllTasks]);

  const loadAllTasks = async () => {
    if (hasLoadedAll) return;
    return fetchAllTasks();
  };

  const loadMyTasks = async () => {
    if (hasLoadedMine || !isWalletConnected || !accountId) {
      return;
    }
    
    setHasLoadedMine(true);
    return fetchMyTasks();
  };

  const handleSubmitShare = async () => {
    const originalShare = decryptState.decryptedShare.trim();
    const cleanedShare = originalShare.replace(/[^0-9A-Fa-f]/g, '');
    
    if (!originalShare) {
      handleSubmitError(MESSAGES.errors.enterDecryptedShare);
      return;
    }

    if (!isWalletConnected) {
      handleSubmitError(MESSAGES.errors.walletNotConnected);
      return;
    }

    clearSubmitError();
    clearSubmitSuccess();
    setIsSubmitting(true);

    try {
      await call('redeem_share', [cleanedShare]);
      
      setDecryptState({...decryptState, decryptedShare: ''});
      
      if (localFilter === 'all') {
        fetchAllTasks();
      } else if (localFilter === 'mine') {
        fetchMyTasks();
      }
      
      handleSubmitSuccess(MESSAGES.success.shareSubmittedSuccessfully);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('No records found')) {
        handleSubmitError(MESSAGES.errors.invalidShare);
      } else if (errorMessage.includes('Share already redeemed')) {
        handleSubmitError(MESSAGES.errors.shareAlreadyRedeemed);
      } else if (errorMessage.includes('To early or to late to redeem this share')) {
        handleSubmitError(MESSAGES.errors.tooEarlyOrTooLate);
      } else {
        handleSubmitError(MESSAGES.errors.submitFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = isLoadingTasks ? [] : 
    localFilter === 'mine' ? myTasks : allTasks;    return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-gray-700 mb-3 sm:mb-4 font-orbitron text-sm sm:text-base">{MESSAGES.decrypt.description}</p>
      
      <form className="space-y-3 sm:space-y-4 mb-4 sm:mb-6" onSubmit={(e) => e.preventDefault()}>
        <Textarea
          label={MESSAGES.decrypt.inputLabel}
          placeholder={MESSAGES.decrypt.inputPlaceholder}
          rows={3}
          value={decryptState.decryptedShare}
          onChange={(e) => setDecryptState({...decryptState, decryptedShare: e.target.value})}
          disabled={isSubmitting}
        />

        <ButtonGroup
          variant="decrypt"
          isWalletConnected={isWalletConnected}
          isConnectingWallet={isConnectingWallet}
          onConnectWallet={onConnectWallet}
          onSubmitShare={handleSubmitShare}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitSuccess={submitSuccess}
          walletError={walletError}
        />
      </form>

      <div className="flex items-center justify-between mt-6 sm:mt-8 mb-3 sm:mb-4 gap-2">
        <button
          onClick={() => {
            if (localFilter === 'all') {
              fetchAllTasks();
            } else if (localFilter === 'mine') {
              fetchMyTasks();
            }
          }}
          disabled={localFilter === 'mine' && !isWalletConnected}
          className={`px-2 py-1 h-6 text-xs transition-opacity duration-200 border border-gray-300 rounded bg-gray-50 text-gray-600 flex items-center ${
            localFilter === 'mine' && !isWalletConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
          }`}
          title={MESSAGES.ui.refreshTasks}
        >
          {isLoadingTasks ? MESSAGES.ui.loading : MESSAGES.ui.refresh}
        </button>
        <div className={`flex border border-gray-300 rounded overflow-hidden h-6 min-w-[160px] sm:min-w-[180px]`}> 
          <button
            onClick={() => {
              setLocalFilter('all');
              loadAllTasks();
            }}
            disabled={isLoadingTasks}
            className={`flex-1 px-2 py-1 h-full text-xs transition-opacity duration-200 flex items-center justify-center ${localFilter === 'all' ? 'text-white font-medium' : 'bg-gray-50 text-gray-600'} ${isLoadingTasks ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'} whitespace-nowrap`}
            style={{
              backgroundColor: localFilter === 'all' ? COLORS.tertiary : undefined,
              borderRight: '1px solid #d1d5db',
            }}
          >
            {MESSAGES.decrypt.filterAllTasks}
          </button>
          <button
            onClick={() => {
              setLocalFilter('mine');
              loadMyTasks();
            }}
            disabled={!isWalletConnected || isLoadingTasks}
            className={`flex-1 px-2 py-1 h-full text-xs transition-opacity duration-200 flex items-center justify-center ${localFilter === 'mine' ? 'text-white font-medium' : 'bg-gray-50 text-gray-600'} ${(!isWalletConnected || isLoadingTasks) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'} whitespace-nowrap`}
            style={{
              backgroundColor: localFilter === 'mine' ? COLORS.tertiary : undefined
            }}
          >
            {MESSAGES.decrypt.filterMyTasks}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {isLoadingTasks ? (
          <div className="text-center py-8">
            <p className="text-gray-700 font-orbitron">{MESSAGES.ui.loadingTasks}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-700 font-orbitron">
              {localFilter === 'mine' 
                ? (isWalletConnected ? MESSAGES.ui.noAssignments : MESSAGES.ui.connectWalletToSeeTasks)
                : MESSAGES.ui.noTasksAvailable
              }
            </p>
          </div>
        ) : (
          filteredTasks.map((task: Task) => (
            <div
              key={task.id}
              className="bg-blue-50 rounded-md pt-3.5 px-3.5 pb-2 shadow-sm border-b border-gray-200"
            >
              <div className="text-sm font-bold mb-2 font-orbitron" style={{color: COLORS.primary}}>
                <span>{MESSAGES.decrypt.scheduledFor}: {task.scheduledFor}</span>
              </div>
              <textarea
                className="w-full h-20 p-2 text-xs font-mono bg-gray-50 border border-gray-300 
                  rounded resize-none text-gray-700 leading-tight"
                value={task.pgpMessage}
                readOnly
              />
              <div className="text-xs text-gray-500 mt-1 font-orbitron text-right">
                {MESSAGES.decrypt.chanceFor} {((task.reward ?? 0) / 1_000_000).toFixed(2)} CHR
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
