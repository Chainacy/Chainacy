import { CONFIG, MESSAGES } from './constants';

export const isKeyProperlyFormatted = (key: string): boolean => {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  const trimmedKey = key.trim();
  
  if (!trimmedKey.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') || 
      !trimmedKey.includes('-----END PGP PUBLIC KEY BLOCK-----')) {
    return false;
  }

  if (!trimmedKey.includes('\n')) {
    return false;
  }
  
  const lines = trimmedKey.split('\n');
  const beginIndex = lines.findIndex(line => line.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----'));
  const endIndex = lines.findIndex(line => line.includes('-----END PGP PUBLIC KEY BLOCK-----'));
  
  if (beginIndex === -1 || endIndex === -1) {
    return false;
  }
  
  let foundBlankLine = false;
  let inHeaderSection = true;
  
  for (let i = beginIndex + 1; i < endIndex; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (inHeaderSection) {
      if (trimmedLine === '') {
        foundBlankLine = true;
        inHeaderSection = false;
        continue;
      }
      
      if (trimmedLine.match(/^(Version|Comment|Charset|Hash):/i)) {
        continue;
      }
      
      inHeaderSection = false;
      
      if (!foundBlankLine) {
        return false;
      }
    }
    
    if (!inHeaderSection && trimmedLine.length > 0 && trimmedLine.length > 64) {
      return false;
    }
  }
  
  return foundBlankLine;
};

export const formatArmoredKey = (key: string): string => {
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid key: must be a non-empty string');
  }
  
  const trimmedKey = key.trim();
  
  if (!trimmedKey.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') || 
      !trimmedKey.includes('-----END PGP PUBLIC KEY BLOCK-----')) {
    throw new Error('Invalid PGP key format: missing required headers');
  }

  const beginHeader = '-----BEGIN PGP PUBLIC KEY BLOCK-----';
  const endHeader = '-----END PGP PUBLIC KEY BLOCK-----';
  
  const beginIndex = trimmedKey.indexOf(beginHeader);
  const endIndex = trimmedKey.indexOf(endHeader);
  
  if (beginIndex === -1 || endIndex === -1) {
    throw new Error('Invalid PGP key format: malformed headers');
  }
  
  const keyPart = trimmedKey.substring(beginIndex, endIndex + endHeader.length);
  
  let lines: string[];
  if (keyPart.includes('\n')) {
    lines = keyPart.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  } else {
    const contentAfterBegin = keyPart.substring(beginHeader.length);
    const contentBeforeEnd = contentAfterBegin.substring(0, contentAfterBegin.indexOf(endHeader));
    
    const headerPatterns = [
      /Version: [^\n]*/g,
      /Comment: [^\n]*/g,
      /Charset: [^\n]*/g,
      /Hash: [^\n]*/g
    ];
    
    let remainingContent = contentBeforeEnd;
    const extractedHeaders: string[] = [];
    
    for (const pattern of headerPatterns) {
      const match = remainingContent.match(pattern);
      if (match && remainingContent.indexOf(match[0]) < 50) {
        extractedHeaders.push(match[0]);
        remainingContent = remainingContent.replace(match[0], '');
      }
    }
    
    const bodyPart = remainingContent;
    
    lines = [beginHeader];
    if (extractedHeaders.length > 0) {
      lines.push(...extractedHeaders);
      lines.push('');
    } else {
      lines.push('');
    }
    
    if (bodyPart.trim()) {
      lines.push(bodyPart.trim());
    }
    
    lines.push(endHeader);
  }
  
  const actualBeginIndex = lines.findIndex(line => line.includes(beginHeader));
  const actualEndIndex = lines.findIndex(line => line.includes(endHeader));
  
  if (actualBeginIndex === -1 || actualEndIndex === -1) {
    throw new Error('Invalid PGP key format: header indices not found');
  }
  
  const beginLine = lines[actualBeginIndex].trim();
  const endLine = lines[actualEndIndex].trim();
  
  const headerLines: string[] = [];
  const bodyLines: string[] = [];
  let isInBody = false;
  
  for (let i = actualBeginIndex + 1; i < actualEndIndex; i++) {
    const line = lines[i].trim();
    
    if (!line && !isInBody) {
      continue;
    }
    
    if (!isInBody && line.includes(':') && 
        (line.startsWith('Version:') || line.startsWith('Comment:') || 
         line.startsWith('Charset:') || line.startsWith('Hash:'))) {
      headerLines.push(line);
    } else {
      isInBody = true;
      if (line) {
        bodyLines.push(line);
      }
    }
  }
  
  const bodyContent = bodyLines.join('');
  
  if (bodyContent.length === 0) {
    throw new Error('Invalid PGP key: no body content found');
  }
  
  const formattedBody = bodyContent.replace(/(.{64})/g, '$1\n').replace(/\n$/, '');
  
  const result = [beginLine];
  
  if (headerLines.length > 0) {
    result.push(...headerLines);
  }
  
  result.push('');
  
  if (formattedBody) {
    result.push(formattedBody);
  }
  
  result.push(endLine);
  
  return result.join('\n');
};

export const validatePGPKey = async (keyString: string): Promise<{ isValid: boolean; error?: string; formattedKey?: string }> => {
  if (typeof window === 'undefined') {
    return { isValid: false, error: 'Validation is only available in browser environment' };
  }

  if (!keyString?.trim()) {
    return { isValid: false, error: 'PGP key empty' };
  }

  try {
    const openpgp = await import('openpgp');
    
    let keyToValidate = keyString.trim();
    
    if (keyToValidate.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') && !isKeyProperlyFormatted(keyToValidate)) {
      try {
        keyToValidate = formatArmoredKey(keyToValidate);
      } catch {
        return { isValid: false, error: 'Invalid PGP key format' };
      }
    }

    const publicKey = await openpgp.readKey({ armoredKey: keyToValidate });
    const encryptionKey = await publicKey.getEncryptionKey();
    
    if (!encryptionKey) {
      return { isValid: false, error: 'PGP key does not support encryption' };
    }

    return { isValid: true, formattedKey: keyToValidate };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { isValid: false, error: `Invalid PGP key: ${errorMessage}` };
  }
};

export const validateScheduleTime = (date: string, time: string): string | null => {
  if (!date) return MESSAGES.validation.setDate;
  if (!time) return MESSAGES.validation.setTime;
  
  const publishDateTime = new Date(`${date}T${time}:00Z`);
  const currentTime = new Date();
  const minTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
  
  if (publishDateTime <= currentTime) {
    return MESSAGES.validation.datePassed;
  }
  
  if (publishDateTime < minTime) {
    return "Min 24h ahead";
  }
  
  return null;
};

export const validateReward = (reward: string): string | null => {
  if (!reward) return MESSAGES.validation.setChr;
  const rewardNumber = parseInt(reward, 10);
  if (isNaN(rewardNumber) || rewardNumber < CONFIG.validation.minReward) return MESSAGES.validation.minChr;
  return null;
};

export const validateTelegramUsername = (username: string): string | null => {
  if (!username || username.trim() === '') {
    return null;
  }
  
  if (username.includes('@')) {
    return 'Please enter username without @ symbol. The @ is already shown before the input field.';
  }
  
  const telegramRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
  
  if (!telegramRegex.test(username)) {
    return 'Invalid Telegram username. Must start with a letter, be 5-32 characters long, and contain only letters, numbers, and underscores.';
  }
  
  return null;
};

export const validationRules = {
  required: (value: string) => 
    !value?.trim() ? 'This field is required' : null,
    
  minLength: (min: number) => (value: string) =>
    value.length < min ? `Minimum ${min} characters required` : null,
    
  maxLength: (max: number) => (value: string) =>
    value.length > max ? `Maximum ${max} characters allowed` : null,
    
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? 'Invalid email format' : null;
  },
  
  reward: validateReward,
  
  scheduleDateTime: validateScheduleTime,
  
  pgpKey: async (keyString: string) => {
    const validation = await validatePGPKey(keyString);
    return validation.isValid ? null : (validation.error || 'Invalid PGP key');
  },
  
  telegramUsername: validateTelegramUsername
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const composeValidators = (...validators: Array<(value: any) => string | null>) => 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };

export const commonValidations = {
  requiredText: composeValidators(validationRules.required),
  requiredEmail: composeValidators(validationRules.required, validationRules.email),
  requiredPgpKey: validationRules.pgpKey,
  requiredReward: validationRules.reward
};
