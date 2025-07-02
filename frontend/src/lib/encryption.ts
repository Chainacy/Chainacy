import { CONFIG } from './constants';
import { validatePGPKey } from './validation';

export interface ShareData {
  owner: Uint8Array;
  encrypted_content: string;
  decrypted_content?: string;
  share_hash: Uint8Array;
  scheduled_publish_at?: number;
  chr_reward?: number;
  reward?: number;
}

export interface EncryptionResult {
  encryptedMessage: string;
  shares: ShareData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleEncrypt = async (message: string, getFiveActiveGuardians?: () => Promise<any[]>): Promise<EncryptionResult> => {
  if (typeof window === 'undefined') {
    throw new Error('Encryption is only available in browser environment');
  }
  
  try {
    const openpgp = await import('openpgp');
    const { default: secrets } = await import('./secrets-sharing');
    
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: CONFIG.encryption.keyBits,
      userIDs: [{ name: 'Anonymous', email: 'anon@example.com' }],
      format: 'armored'
    });
    
    const messageObject = await openpgp.createMessage({ text: message });
    const publicKeyObject = await openpgp.readKey({ armoredKey: publicKey });
    const encrypted = await openpgp.encrypt({
      message: messageObject,
      encryptionKeys: publicKeyObject
    });
    
    const hexSecret = secrets.str2hex(privateKey);
    const shares = secrets.share(hexSecret, CONFIG.encryption.sharesTotal, CONFIG.encryption.sharesRequired);
    
    const shareData: ShareData[] = [];
    
    if (getFiveActiveGuardians && shares.length >= 5) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const guardians = await getFiveActiveGuardians() as any[];
      
      for (let i = 0; i < 5; i++) {
        try {
          const share = shares[i];
          const guardian = guardians[i];
          
          const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(share));
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          
          const shareMessage = await openpgp.createMessage({ text: share });
          
          if (!guardian.pgp_public_key) {
            throw new Error(`Guardian ${i} has no PGP public key`);
          }
          
          const workingKey = guardian.pgp_public_key;
          
          const keyValidation = await validatePGPKey(workingKey);
          
          if (!keyValidation.isValid) {
            throw new Error(`Guardian ${i} has invalid PGP key: ${keyValidation.error}`);
          }
          
          if (keyValidation.formattedKey) {
            guardian.pgp_public_key = keyValidation.formattedKey;
          }
          
          let guardianKey;
          try {
            guardianKey = await openpgp.readKey({ armoredKey: guardian.pgp_public_key });
          } catch (keyError) {
            const keyErrorMessage = keyError instanceof Error ? keyError.message : String(keyError);
            throw new Error(`Invalid PGP key for guardian ${i}: ${keyErrorMessage}`);
          }
          
          let encryptedShare;
          try {
            encryptedShare = await openpgp.encrypt({
              message: shareMessage,
              encryptionKeys: guardianKey
            }) as string;
          } catch (encryptError) {
            const encryptErrorMessage = encryptError instanceof Error ? encryptError.message : String(encryptError);
            throw new Error(`Failed to encrypt share with guardian ${i} key: ${encryptErrorMessage}`);
          }
          
          shareData.push({
            owner: new Uint8Array(guardian.id),
            encrypted_content: encryptedShare,
            share_hash: new Uint8Array(hashArray)
          });
        } catch (guardianError) {
          const errorMessage = guardianError instanceof Error ? guardianError.message : String(guardianError);
          throw new Error(`Failed to encrypt share for guardian ${i}: ${errorMessage}`);
        }
      }
    }
    
    return {
      encryptedMessage: encrypted as string,
      shares: shareData
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Encryption failed: ${errorMessage}`);
  }
};
