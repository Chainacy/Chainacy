export interface Message {
  id: string;
  scheduledFor: string;
  body: string;
  reward?: number;
}

export interface Task extends Message {
  pgpMessage: string;
}

export interface PublishedMessage {
  id: string;
  encryptedMessage: string;
  scheduledFor: string;
  publishedAt: string;
  totalPaid: number;
  decryptedContent?: string;
  isDecrypting?: boolean;
  decryptionError?: string;
}

export interface MessageDto {
  id: number;
  encrypted_message: string;
  scheduled_publish_at: number;
  published_at: number;
  total_paid: number;
  redeemed_shares: import('@/lib/encryption').ShareData[];
}

export type TabType = 'encrypt' | 'decrypt' | 'published' | 'how';
