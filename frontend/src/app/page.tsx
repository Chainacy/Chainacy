'use client';

import { useState } from 'react';
import { useTabs, useWallet } from '@/hooks';
import { Tabs } from '@/components/ui/Tabs';
import { EncryptTab } from '@/components/tabs/EncryptTab';
import { DecryptTab } from '@/components/tabs/DecryptTab';
import { PublishedTab } from '@/components/tabs/PublishedTab';
import { HowItWorksTab } from '@/components/tabs/HowItWorksTab';
import Header from '@/components/layout/Header';
import { ShareData } from '@/lib/encryption';

export default function HomePage() {
  const { activeTab, switchTab } = useTabs('encrypt');
  const { isConnected, isConnecting, connectWallet } = useWallet();
  
  const [encryptState, setEncryptState] = useState<{
    isEncrypted: boolean;
    isEncrypting: boolean;
    message: string;
    encryptedMessage: string;
    scheduledDate: string;
    scheduledTime: string;
    reward: string;
    shares?: ShareData[];
  }>({
    isEncrypted: false,
    isEncrypting: false,
    message: '',
    encryptedMessage: '',
    scheduledDate: '',
    scheduledTime: '',
    reward: '',
    shares: [],
  });

  const [decryptState, setDecryptState] = useState({
    decryptedShare: '',
    currentFilter: 'all' as 'all' | 'mine',
    hasLoadedAll: false,
    hasLoadedMine: false,
  });

  const [publishedState, setPublishedState] = useState({
    hasLoaded: false,
  });

  const [userSettings, setUserSettings] = useState({
    pgpKey: '',
    telegramUsername: '',
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const tabPanels = [
    {
      id: 'encrypt',
      element: (
        <EncryptTab
          isWalletConnected={isConnected}
          isConnectingWallet={isConnecting}
          onConnectWallet={connectWallet}
          encryptState={encryptState}
          setEncryptState={setEncryptState}
        />
      ),
    },
    {
      id: 'decrypt',
      element: (
        <DecryptTab
          isWalletConnected={isConnected}
          isConnectingWallet={isConnecting}
          onConnectWallet={connectWallet}
          decryptState={decryptState}
          setDecryptState={setDecryptState}
          active={activeTab === 'decrypt'}
        />
      ),
    },
    {
      id: 'published',
      element: (
        <PublishedTab 
          active={activeTab === 'published'} 
          publishedState={publishedState}
          setPublishedState={setPublishedState}
        />
      ),
    },
    {
      id: 'how',
      element: <HowItWorksTab />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-1 sm:p-5">
      <div className="max-w-2xl mx-auto">
        <main className="bg-white p-2 sm:p-6 rounded-lg shadow-sm">
          <Header 
            userSettings={userSettings}
            setUserSettings={setUserSettings}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            isWalletConnected={isConnected}
          />
          
          <Tabs
            activeTab={activeTab}
            onTabChange={switchTab}
          />
          
          <div className="mt-4 sm:mt-5">
            {tabPanels.map(({ id, element }) => (
              <div
                key={id}
                style={{ display: activeTab === id ? 'block' : 'none' }}
              >
                {element}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
