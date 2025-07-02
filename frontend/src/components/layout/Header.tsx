import { COLORS } from '@/lib/constants';
import { Textarea } from '@/components/ui/Input';
import { useChromiaOperation, useChromiaQuery, useChromiaSession } from '@/hooks/chromia';
import { validatePGPKey, formatArmoredKey, isKeyProperlyFormatted, validateTelegramUsername } from '@/lib/validation';
import { useEffect, useState } from 'react';
import { useFontLoaded } from '@/hooks/useFontLoaded';

interface HeaderProps {
  className?: string;
  userSettings: {
    pgpKey: string;
    telegramUsername: string;
  };
  setUserSettings: (settings: HeaderProps['userSettings']) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isWalletConnected: boolean;
}

export default function Header({ 
  className = '', 
  userSettings, 
  setUserSettings, 
  isSettingsOpen, 
  setIsSettingsOpen,
  isWalletConnected
}: HeaderProps) {
  const { call } = useChromiaOperation();
  const { query } = useChromiaQuery();
  const { session } = useChromiaSession();
  const isFontLoaded = useFontLoaded('Orbitron');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveErrorType, setSaveErrorType] = useState<'pgp' | 'telegram' | 'general'>('general');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    const fetchGuardianData = async () => {
      if (isSettingsOpen && session) {
        setIsLoading(true);
        try {
          const data = await query<{pgp_public_key: string, telegram_username: string}>('get_guardian_profile', { pubkey: session.account.id.toString('hex') });
          if (data) {
            let formattedPgpKey = data.pgp_public_key || '';
            
            if (formattedPgpKey && formattedPgpKey.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
              const isFormatted = isKeyProperlyFormatted(formattedPgpKey);
              
              if (!isFormatted) {
                try {
                  formattedPgpKey = formatArmoredKey(formattedPgpKey);
                } catch {
                }
              }
            }
            
            setUserSettings({
              pgpKey: formattedPgpKey,
              telegramUsername: data.telegram_username || ''
            });
          }
        } catch {
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchGuardianData();
  }, [isSettingsOpen, session, query, setUserSettings]);

  const handlePGPKeyChange = async (value: string) => {
    if (!value.trim()) {
      setUserSettings({...userSettings, pgpKey: value});
      return;
    }
    
    let finalKey = value;
    
    if (value.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
      const isFormatted = isKeyProperlyFormatted(value);
      
      if (!isFormatted) {
        try {
          finalKey = formatArmoredKey(value);
        } catch {
          finalKey = value;
        }
      }
    }
    
    setUserSettings({...userSettings, pgpKey: finalKey});
  };

  const handleTelegramUsernameChange = (value: string) => {
    setUserSettings({...userSettings, telegramUsername: value});
    setValidationError('');
    setSaveError('');
  };

  const handleSaveSettings = async () => {
    if (!isWalletConnected) return;
    
    setSaveError('');
    setSaveErrorType('general');
    setValidationError('');
    
    if (!userSettings.pgpKey.trim()) {
      setSaveError('PGP key is required');
      setSaveErrorType('pgp');
      setIsButtonDisabled(true);
      
      setTimeout(() => {
        setIsButtonDisabled(false);
        setSaveError('');
      }, 3000);
      
      return;
    }

    const telegramError = validateTelegramUsername(userSettings.telegramUsername);
    if (telegramError) {
      setSaveError(telegramError);
      setSaveErrorType('telegram');
      setIsButtonDisabled(true);
      
      setTimeout(() => {
        setIsButtonDisabled(false);
        setSaveError('');
      }, 3000);
      
      return;
    }
    
    try {
      setIsSaving(true);
      setIsValidating(true);
      const pgpValidation = await validatePGPKey(userSettings.pgpKey);
      setIsValidating(false);
      
      if (!pgpValidation.isValid) {
        setValidationError(pgpValidation.error || 'Invalid PGP key format');
        setIsButtonDisabled(true);
        
        setTimeout(() => {
          setIsButtonDisabled(false);
          setValidationError('');
        }, 3000);
        
        return;
      }
      
      const keyToSave = pgpValidation.formattedKey || userSettings.pgpKey;
      
      if (pgpValidation.formattedKey && pgpValidation.formattedKey !== userSettings.pgpKey) {
        setUserSettings({...userSettings, pgpKey: pgpValidation.formattedKey});
      }

      await call('set_guardian_profile', [
        keyToSave,
        userSettings.telegramUsername
      ]);
      
      setIsSettingsOpen(false);
    } catch {
      setSaveError('Failed to save settings. Please try again.');
      setSaveErrorType('general');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <>
      <header className={`flex justify-between items-center mb-6 mt-3 ${className}`}>
        <h1 className="text-3xl font-bold tracking-wider flex items-center text-[#205a99] select-none" style={{ fontFamily: 'var(--font-orbitron), Orbitron, Arial, sans-serif' }}>
          <svg width="38" height="38" viewBox="0 0 38 38" className="mr-3" fill="none">
            <circle cx="19" cy="19" r="17" fill="#fff" stroke={COLORS.primary} strokeWidth="3"/>
            <circle cx="19" cy="19" r="14" fill={COLORS.primary} fillOpacity="0.13" stroke={COLORS.primary} strokeWidth="1.2"/>
            <circle cx="19" cy="19" r="11.5" fill={COLORS.primary} fillOpacity="0.07" stroke={COLORS.primary} strokeWidth="0.7"/>
            <rect x="18.1" y="8" width="1.8" height="11" rx="0.9" fill={COLORS.primary}/>
            <rect x="18.1" y="19" width="1.8" height="7.5" rx="0.9" fill={COLORS.primary} transform="rotate(30 19 19)"/>
            <circle cx="19" cy="19" r="2.5" fill={COLORS.primary} stroke="#fff" strokeWidth="1"/>
          </svg>
          <span style={{ opacity: isFontLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
            Chainacy
          </span>
        </h1>
        
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`p-1.5 ${!isWalletConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'} text-gray-600 transition-opacity duration-200`}
          disabled={!isWalletConnected}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </header>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full mx-2 sm:mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: COLORS.primary }}>
                Settings
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 hover:bg-gray-100 hover:opacity-90 rounded-full transition-all duration-200"
                style={{ color: COLORS.primary }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="sm:w-[20px] sm:h-[20px]">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
                </svg>
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-32 sm:h-48">
                <p className="text-sm sm:text-base">Loading settings...</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <Textarea
                  label="Your public PGP key:"
                  placeholder="Paste your public PGP key here..."
                  rows={4}
                  value={userSettings.pgpKey}
                  onChange={(e) => handlePGPKeyChange(e.target.value)}
                  disabled={isSaving || isValidating}
                  className="font-mono text-[9px] sm:text-[10px] leading-tight"
                />

                <div className="space-y-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Telegram Username (optional):
                  </label>
                  <div className="flex items-center">
                    <span className="flex items-center justify-center h-[38px] sm:h-[42px] px-2 sm:px-3 text-xs sm:text-sm bg-gray-100 border border-r-0 border-gray-400 rounded-l text-gray-600 font-medium">
                      @
                    </span>
                    <input
                      className="flex-1 h-[38px] sm:h-[42px] px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white border border-gray-400 rounded-r focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="yourusername"
                      value={userSettings.telegramUsername}
                      onChange={(e) => handleTelegramUsernameChange(e.target.value)}
                      disabled={isSaving || isValidating}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-3 sm:pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving || isValidating || isButtonDisabled || !isWalletConnected}
                    className={`w-full sm:w-60 px-4 py-2 rounded font-medium text-white text-sm sm:text-base transition-colors ${
                      (validationError && isButtonDisabled) || saveError 
                        ? 'cursor-not-allowed' 
                        : isSaving || isValidating || isButtonDisabled || !isWalletConnected 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:opacity-90'
                    }`}
                    style={{ 
                      backgroundColor: (validationError && isButtonDisabled) || saveError ? COLORS.error : COLORS.primary 
                    }}
                  >
                    {isValidating ? 'Validating...' : 
                     isSaving ? 'Saving...' : 
                     validationError && isButtonDisabled ? 'Invalid PGP Key' :
                     saveError && isButtonDisabled ? (
                       saveErrorType === 'pgp' ? 'PGP Key Required' :
                       saveErrorType === 'telegram' ? 'Invalid Username' :
                       'Error'
                     ) :
                     'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
