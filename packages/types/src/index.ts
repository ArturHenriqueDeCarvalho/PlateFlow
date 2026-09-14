export type RedirectType = 'url' | 'whatsapp' | 'pix' | 'vcard' | 'social';

export type RedirectStatus = 'virgin' | 'active' | 'paused';

export interface DynamicRedirectMetadata {
  whatsappPhone?: string;
  whatsappMessage?: string;
  pixKey?: string;
  pixName?: string;
  pixCity?: string;
  pixAmount?: number;
  vcardName?: string;
  vcardPhone?: string;
  vcardEmail?: string;
  vcardOrg?: string;
  vcardRole?: string;
  socialNetwork?: string;
  socialUsername?: string;
}

export interface DynamicRedirect {
  id?: string;
  slug: string;
  type: RedirectType;
  title: string;
  destinationUrl: string;
  status: RedirectStatus;
  clicks: number;
  metadata?: DynamicRedirectMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface PlateTemplate {
  id: string;
  name: string;
  description: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  qrX: number;
  qrY: number;
  qrSize: number;
  widthMm?: number;
  heightMm?: number;
  qrXMm?: number;
  qrYMm?: number;
  qrSizeMm?: number;
  badgeColor?: string;
  badgeText?: string;
  customNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PhysicalPlate {
  id: string;
  slug: string;
  templateId: string;
  batchIdentifier: string;
  plateNumber: number;
  customerNotes: string;
  nfcWritten: boolean;
  nfcWrittenAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnalyticsLog {
  id: string;
  slug?: string;
  redirectSlug?: string;
  timestamp: string;
  source?: 'qr' | 'nfc' | 'manual';
  referrer?: string;
  userAgent?: string;
  device?: 'iOS (iPhone)' | 'Android' | 'Desktop' | 'Outro';
  deviceType?: 'iOS (iPhone)' | 'Android' | 'Desktop' | 'Outro';
  browser?: string;
  os?: string;
  ip?: string;
}

export interface AuthUser {
  id?: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
}

export interface BatchGenerationParams {
  templateId: string;
  batchIdentifier: string;
  quantity: number;
  prefix: string;
  customerNotesPrefix: string;
  initialType?: RedirectType;
}
