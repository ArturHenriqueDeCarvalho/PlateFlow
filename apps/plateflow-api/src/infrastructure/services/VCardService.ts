export interface VCardData {
  name: string;
  phone?: string;
  email?: string;
  org?: string;
  role?: string;
}

export function generateVCardString(data: VCardData): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.name}`,
    `N:${data.name};;;;`,
    data.phone ? `TEL;TYPE=CELL,VOICE:${data.phone}` : '',
    data.email ? `EMAIL;TYPE=PREF,INTERNET:${data.email}` : '',
    data.org ? `ORG:${data.org}` : '',
    data.role ? `TITLE:${data.role}` : '',
    'END:VCARD',
  ];

  return lines.filter(Boolean).join('\r\n');
}
