import { useState, useEffect, useCallback } from 'react';
import { COLORS, MESSAGES } from '@/lib/constants';
import { CHROMIA_CONFIG } from '@/lib/chromia-config';
import { useAsyncState } from '@/hooks/useAsyncState';
import { createClient } from 'postchain-client';
import { decryptMessageWithShares } from '@/lib/decryption';
import type { PublishedMessage, MessageDto } from '@/types';
import type { TabProps, PublishedState } from '@/types/components';

interface PublishedTabProps extends TabProps {
  publishedState: PublishedState;
  setPublishedState: (state: PublishedState) => void;
}

export const PublishedTab = ({ active, publishedState, setPublishedState }: PublishedTabProps) => {
  const [publishedMessages, setPublishedMessages] = useState<PublishedMessage[]>([]);
  
  const {
    isLoading: isLoadingMessages,
    executeAsync: executeFetchMessages
  } = useAsyncState();

  const fetchPublishedMessages = useCallback(async () => {
    await executeFetchMessages(async () => {
      const client = await createClient({
        blockchainRid: CHROMIA_CONFIG.blockchainRid,
        directoryNodeUrlPool: CHROMIA_CONFIG.directoryNodeUrlPool,
      });
      const messageData = await client.query('get_all_published_messages', {}) as unknown as MessageDto[];
      
      const messages: PublishedMessage[] = messageData.map((msg) => {
        const scheduledDate = new Date(msg.scheduled_publish_at);
        const publishedDate = new Date(msg.published_at);
        
        const scheduledISO = scheduledDate.toISOString();
        const scheduledFormatted = `${scheduledISO.slice(0, 10)} ${scheduledISO.slice(11, 16)} UTC`;
        
        const publishedISO = publishedDate.toISOString();
        const publishedFormatted = `${publishedISO.slice(0, 10)} ${publishedISO.slice(11, 16)} UTC`;
        
        return {
          id: msg.id.toString(),
          encryptedMessage: msg.encrypted_message,
          scheduledFor: scheduledFormatted,
          publishedAt: publishedFormatted,
          totalPaid: msg.total_paid,
          decryptedContent: undefined,
          isDecrypting: false,
          decryptionError: undefined
        };
      });
      
      setPublishedMessages(messages);
      setPublishedState({hasLoaded: true});
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const msgData = messageData.find(data => data.id.toString() === msg.id);
        
        if (msgData && msgData.redeemed_shares.length >= 3) {
          await decryptMessage(msg.id, msgData);
        }
      }
      
      return messages;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeFetchMessages]);

  const decryptMessage = async (messageId: string, messageData: MessageDto) => {
    setPublishedMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isDecrypting: true, decryptionError: undefined }
        : msg
    ));

    try {
      const decryptedShares = messageData.redeemed_shares
        .map(share => share.decrypted_content)
        .filter((content): content is string => content !== undefined);
      
      if (decryptedShares.length < 3) {
        throw new Error(MESSAGES.published.notEnoughShares);
      }
      
      const result = await decryptMessageWithShares(messageData.encrypted_message, decryptedShares);
      
      setPublishedMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              isDecrypting: false,
              decryptedContent: result.success ? result.decryptedMessage : undefined,
              decryptionError: result.success ? undefined : result.error
            }
          : msg
      ));
    } catch (error) {
      setPublishedMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              isDecrypting: false,
              decryptionError: error instanceof Error ? error.message : MESSAGES.published.failedToDecrypt.replace(':', '')
            }
          : msg
      ));
    }
  };

  useEffect(() => {
    if (active && !publishedState.hasLoaded) {
      fetchPublishedMessages();
    }
  }, [active, publishedState.hasLoaded, fetchPublishedMessages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={fetchPublishedMessages}
          className="px-2.5 py-1 text-xs transition-opacity duration-200 border border-gray-300 rounded bg-gray-50 text-gray-600 cursor-pointer hover:opacity-90"
          disabled={isLoadingMessages}
          title={MESSAGES.published.refreshMessages}
        >
          {isLoadingMessages ? MESSAGES.ui.loading : MESSAGES.ui.refresh}
        </button>
        <span className="text-sm text-gray-600 italic font-orbitron">
          {MESSAGES.published.tagline}
        </span>
      </div>

      <div className="space-y-5">
        {isLoadingMessages ? (
          <div className="text-center py-8">
            <p className="text-gray-700 font-orbitron">{MESSAGES.published.loadingMessages}</p>
          </div>
        ) : publishedMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-700 font-orbitron">{MESSAGES.published.noMessagesAvailable}</p>
          </div>
        ) : (
          publishedMessages.map((message) => (
            <div
              key={message.id}
              className="bg-blue-50 rounded-md p-3.5 shadow-sm border-b border-gray-200"
            >
              <input type="hidden" value={message.id} />
              <div className="text-sm font-bold mb-2 font-orbitron" style={{color: COLORS.primary}}>
                <div>{MESSAGES.published.publishedAt} {message.publishedAt}</div>
              </div>
              
              {message.isDecrypting ? (
                <div className="text-gray-600 italic font-orbitron">
                  {MESSAGES.published.decryptingMessage}
                </div>
              ) : message.decryptionError ? (
                <div className="text-red-600 font-orbitron">
                  {MESSAGES.published.failedToDecrypt} {message.decryptionError}
                </div>
              ) : message.decryptedContent ? (
                <div>
                  <div className="text-base text-gray-800 leading-snug font-orbitron bg-white p-3 rounded border break-words overflow-wrap-anywhere max-h-20 overflow-y-auto whitespace-pre-wrap">
                    {message.decryptedContent}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 font-orbitron flex justify-between">
                    <span>{MESSAGES.published.scheduledFor} {message.scheduledFor}</span>
                    <span>{MESSAGES.published.authorPaid} {(message.totalPaid / 1_000_000).toFixed(2)} CHR</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 italic font-orbitron">
                  {MESSAGES.published.notEnoughShares}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
