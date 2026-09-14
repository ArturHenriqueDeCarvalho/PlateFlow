export type RedirectType = 'url' | 'whatsapp' | 'pix' | 'vcard' | 'social';

export type RedirectStatus = 'virgin' | 'active' | 'paused';

export interface DynamicRedirect {
  slug: string;
  type: RedirectType;
  title: string;
  destinationUrl: string;
  status: RedirectStatus;
  clicks: number;
  metadata?: {
    whatsappPhone?: string;
    whatsappMessage?: string;
    pixKey?: string;
    pixName?: string;
    pixCity?: string;
    vcardName?: string;
    vcardPhone?: string;
    vcardEmail?: string;
    vcardOrg?: string;
    vcardRole?: string;
    socialNetwork?: string;
    socialUsername?: string;
  };
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
  badgeColor?: string;
  createdAt: string;
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
}

export interface AnalyticsLog {
  id: string;
  slug: string;
  timestamp: string;
  referrer: string;
  userAgent: string;
  device: 'iOS (iPhone)' | 'Android' | 'Desktop' | 'Outro';
}

export interface AuthUser {
  email: string;
  name?: string;
  role: 'admin' | 'user';
}

