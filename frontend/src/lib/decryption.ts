import { CONFIG } from './constants';

export interface DecryptionResult {
  success: boolean;
  decryptedMessage?: string;
  error?: string;
}

/**
 * Decrypts a PGP message using Shamir's Secret Sharing reconstruction
 * @param encryptedMessage - The PGP encrypted message
 * @param decryptedShares - Array of decrypted shares (should be at least 3)
 * @returns Promise with decryption result
 */
export const decryptMessageWithShares = async (
  encryptedMessage: string,
  decryptedShares: string[]
): Promise<DecryptionResult> => {
  try {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Decryption only available in browser' };
    }

    if (decryptedShares.length < CONFIG.encryption.sharesRequired) {
      return { 
        success: false, 
        error: `Need at least ${CONFIG.encryption.sharesRequired} shares, got ${decryptedShares.length}` 
      };
    }

    const openpgp = await import('openpgp');
    const { default: secrets } = await import('./secrets-sharing');

    const sharesToUse = decryptedShares.slice(0, CONFIG.encryption.sharesRequired);
    
    const reconstructedHexSecret = secrets.combine(sharesToUse);
    const reconstructedPrivateKeyArmored = secrets.hex2str(reconstructedHexSecret);

    const privateKey = await openpgp.readPrivateKey({ 
      armoredKey: reconstructedPrivateKeyArmored 
    });

    const message = await openpgp.readMessage({ 
      armoredMessage: encryptedMessage 
    });

    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey
    });

    return {
      success: true,
      decryptedMessage: decrypted as string
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Decryption failed'
    };
  }
};
