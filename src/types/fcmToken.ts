import type { Timestamp } from 'firebase/firestore';

/** Stored at `fcmTokens/{uid}_{deviceId}` */
export interface FcmTokenRecord {
  uid: string;
  token: string;
  deviceId: string;
  platform: 'web';
  userAgent: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
