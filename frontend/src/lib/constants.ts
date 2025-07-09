export const COLORS = {
  primary: '#205a99',
  secondary: '#3b7ac7',
  tertiary: '#4a8ad8',
  error: '#e74c3c',
  success: '#27ae60',
  gradient: {
    start: '#eaf2fb',
    end: '#f4f8ff'
  }
} as const;

export const FONT_FAMILIES = {
  brand: 'Orbitron, Arial, sans-serif',
  orbitron: 'Orbitron'
} as const;

export const CONFIG = {
  encryption: {
    keyType: 'rsa',
    keyBits: 4096,
    sharesTotal: 5,
    sharesRequired: 3
  },
  ui: {
    loadingDelay: 100
  },
  validation: {
    minReward: 10
  }
} as const;

export const MESSAGES = {
  wallet: {
    connectError: 'Failed to connect wallet',
    notInstalled: 'Install MetaMask',
    connect: 'Connect Wallet',
    connecting: 'Connecting...',
    connected: 'Wallet Connected'
  },
  encryption: {
    starting: 'Starting PGP encryption...',
    keyGenerated: 'Generated PGP key pair',
    messageEncrypted: 'Message encrypted successfully',
    sharesCreated: 'Private key split into shares',
    recoveryTest: 'Testing recovery with random shares',
    recoverySuccess: 'Key recovery successful',
    failed: 'Encryption Failed',
    encrypting: 'Encrypting...',
    encrypted: 'Encrypted',
    encrypt: 'Encrypt'
  },
  validation: {
    setDate: 'Set Date',
    setTime: 'Set Time',
    futureDate: 'Selected date and time must be in the future',
    datePassed: 'Date passed',
    setChr: 'Set CHR',
    minChr: 'Min 10 CHR'
  },
  ui: {
    noAssignments: 'No active assignments are linked to your account at this time.',
    payAndSend: 'Pay & Send',
    sending: 'Sending...',
    updatePgpKey: 'Update Personal Data',
    submitShare: 'Submit Share',
    loading: 'Loading...',
    refresh: 'Refresh',
    loadingTasks: 'Loading tasks...',
    noTasksAvailable: 'No tasks available at the moment.',
    connectWalletToSeeTasks: 'Please connect your wallet to see your tasks.',
    refreshTasks: 'Refresh tasks'
  },
  decrypt: {
    description: 'Provide your decrypted share to help the community unlock messages.',
    inputLabel: 'Enter any decrypted share you possess:',
    inputPlaceholder: 'Paste your decrypted share here...',
    filterAllTasks: 'All Tasks',
    filterMyTasks: 'My Tasks',
    scheduledFor: 'Scheduled for:',
    chanceFor: 'Chance for',
    taskBody: 'Encrypted share task'
  },
  published: {
    refreshMessages: 'Refresh published messages',
    tagline: 'Secrets shared become eternal whispers.',
    loadingMessages: 'Loading published messages...',
    noMessagesAvailable: 'No published messages available yet.',
    publishedAt: 'Published at:',
    decryptingMessage: 'Decrypting message...',
    failedToDecrypt: 'Failed to decrypt:',
    scheduledFor: 'Scheduled for:',
    scheduledForShort: 'Planned:',
    authorPaid: 'Author paid:',
    authorPaidShort: 'Paid:',
    notEnoughShares: 'Not enough shares available for decryption'
  },
  encrypt: {
    description: 'Leave an encrypted message that will be published at a specific time.',
    yourMessage: 'Your message:',
    encryptedMessage: 'Encrypted message:',
    messagePlaceholder: 'Type your message here...',
    scheduledDate: 'Scheduled date:',
    scheduledTime: 'Scheduled time (UTC):',
    rewardLabel: 'Reward for key guardians (CHR):',
    rewardPlaceholder: 'Enter reward amount',
    feeNote: '10% of your reward will be used to support the operation of this dApp.',
    noteLabel: 'Note:'
  },
  errors: {
    enterDecryptedShare: 'Please enter a decrypted share',
    walletNotConnected: 'Wallet not connected',
    invalidShare: 'Invalid share',
    shareAlreadyRedeemed: 'Share already redeemed',
    tooEarlyOrTooLate: 'Wrong timing',
    submitFailed: 'Submit failed',
    emptyMessage: 'Empty Message',
    notEnoughGuardians: 'Not enough guardians',
    noSharesAvailable: 'No shares available. Please encrypt message first.',
    notEnoughBalance: 'Not enough balance',
    failedToSendMessage: 'Failed to send message'
  },
  success: {
    shareSubmittedSuccessfully: 'Share submitted successfully',
    messageSent: 'Message sent'
  }
} as const;
