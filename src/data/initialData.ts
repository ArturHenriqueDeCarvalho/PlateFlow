import { DynamicRedirect, PlateTemplate, PhysicalPlate, AnalyticsLog } from '../types';

export const DEFAULT_TEMPLATE_1_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="1200" height="1600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Fundo Placa Acrílica -->
  <rect width="1200" height="1600" rx="48" fill="url(#bgGrad)" />
  <rect x="24" y="24" width="1152" height="1552" rx="36" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.6" />

  <!-- Detalhe superior -->
  <circle cx="600" cy="140" r="48" fill="#1f2937" stroke="url(#goldGrad)" stroke-width="3" />
  <!-- Ícone Google G / Star -->
  <path d="M600 115 L608 132 L627 134 L613 147 L617 165 L600 156 L583 165 L587 147 L573 134 L592 132 Z" fill="#f59e0b" />

  <!-- Estrelas de Avaliação -->
  <g transform="translate(420, 210) scale(1.2)">
    <polygon points="25,2 32,18 49,19 36,31 40,48 25,39 10,48 14,31 1,19 18,18" fill="#fbbf24" />
    <polygon points="75,2 82,18 99,19 86,31 90,48 75,39 60,48 64,31 51,19 68,18" fill="#fbbf24" />
    <polygon points="125,2 132,18 149,19 136,31 140,48 125,39 110,48 114,31 101,19 118,18" fill="#fbbf24" />
    <polygon points="175,2 182,18 199,19 186,31 190,48 175,39 160,48 164,31 151,19 168,18" fill="#fbbf24" />
    <polygon points="225,2 232,18 249,19 236,31 240,48 225,39 210,48 214,31 201,19 218,18" fill="#fbbf24" />
  </g>

  <!-- Tipografia Principal -->
  <text x="600" y="320" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="52" fill="#ffffff" letter-spacing="1">
    SUA OPINIÃO IMPORTA
  </text>
  <text x="600" y="375" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="28" fill="#9ca3af" letter-spacing="2">
    AVALIE NOSSO ATENDIMENTO NO GOOGLE
  </text>

  <!-- Moldura reservada para o QR Code -->
  <rect x="350" y="460" width="500" height="500" rx="32" fill="#ffffff" filter="url(#glow)" />
  <rect x="370" y="480" width="460" height="460" rx="20" fill="none" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="8 8" />

  <!-- Chamada NFC / Instrução -->
  <rect x="280" y="1020" width="640" height="120" rx="60" fill="#1e293b" stroke="#334155" stroke-width="2" />
  <circle cx="340" cy="1080" r="32" fill="#0284c7" />
  <!-- Ícone NFC Wave -->
  <path d="M332 1070 C340 1074, 340 1086, 332 1090" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" />
  <path d="M338 1064 C350 1072, 350 1088, 338 1096" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" />
  <path d="M344 1058 C360 1070, 360 1090, 344 1102" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" />
  <text x="510" y="1075" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="26" fill="#38bdf8">
    APROXIME SEU CELULAR
  </text>
  <text x="510" y="1108" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="400" font-size="20" fill="#94a3b8">
    Compatível com NFC e Câmera
  </text>

  <!-- Rodapé / Branding -->
  <text x="600" y="1500" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="600" font-size="22" fill="#64748b" letter-spacing="3">
    POWERED BY NFC &amp; QR DINÂMICO
  </text>
</svg>
`)}`;

export const DEFAULT_TEMPLATE_2_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="1200" height="1600">
  <defs>
    <linearGradient id="bgLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
  </defs>

  <rect width="1200" height="1600" rx="40" fill="url(#bgLight)" />
  <rect x="24" y="24" width="1152" height="1552" rx="32" fill="none" stroke="#cbd5e1" stroke-width="2" />

  <!-- Header Header -->
  <rect x="24" y="24" width="1152" height="240" rx="32" fill="#0f172a" />
  <text x="600" y="130" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="54" fill="#ffffff" letter-spacing="2">
    CARDÁPIO DIGITAL &amp; PIX
  </text>
  <text x="600" y="190" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="26" fill="#94a3b8" letter-spacing="1">
    FAÇA SEU PEDIDO E PAGAMENTO DIRETO NA MESA
  </text>

  <!-- Moldura QR -->
  <rect x="350" y="440" width="500" height="500" rx="32" fill="#ffffff" filter="url(#softShadow)" stroke="#e2e8f0" stroke-width="3" />

  <text x="600" y="1030" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="36" fill="#0f172a">
    ESCANEE O QR CODE ACIMA
  </text>
  <text x="600" y="1080" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="24" fill="#64748b">
    Ou encoste a parte superior do seu smartphone
  </text>

  <!-- Emblema NFC -->
  <g transform="translate(540, 1140)">
    <circle cx="60" cy="60" r="50" fill="#2563eb" />
    <path d="M48 45 C60 52, 60 68, 48 75" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M56 37 C74 48, 74 72, 56 83" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M64 29 C88 44, 88 76, 64 91" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" />
  </g>

  <rect x="350" y="1320" width="500" height="64" rx="32" fill="#dbeafe" />
  <text x="600" y="1362" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="22" fill="#1d4ed8">
    TAG NFC HABILITADA NESTE TOTEM
  </text>
</svg>
`)}`;

export const INITIAL_TEMPLATES: PlateTemplate[] = [
  {
    id: 'tmpl-google-gold',
    name: 'Placa Acrílica Black & Gold - Google Reviews',
    description: 'Template premium para mesas de restaurantes e balcões com chamada para avaliação 5 estrelas.',
    backgroundUrl: DEFAULT_TEMPLATE_1_SVG,
    backgroundWidth: 1200,
    backgroundHeight: 1600,
    qrX: 380,
    qrY: 490,
    qrSize: 440,
    badgeColor: '#fbbf24',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tmpl-menu-pix',
    name: 'Totem Minimalista Mesa - Cardápio & Pix',
    description: 'Design limpo e claro com moldura reforçada para leitura rápida de pedidos e chave Pix.',
    backgroundUrl: DEFAULT_TEMPLATE_2_SVG,
    backgroundWidth: 1200,
    backgroundHeight: 1600,
    qrX: 380,
    qrY: 470,
    qrSize: 440,
    badgeColor: '#2563eb',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_REDIRECTS: DynamicRedirect[] = [
  {
    slug: 'mesa-01',
    type: 'url',
    title: 'Google Reviews - Salão Principal',
    destinationUrl: 'https://maps.google.com/?cid=1029384756',
    status: 'active',
    clicks: 142,
    metadata: {
      socialNetwork: 'Google Reviews'
    },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    slug: 'mesa-02',
    type: 'whatsapp',
    title: 'Cardápio & Pedidos WhatsApp',
    destinationUrl: 'https://wa.me/5511999998888?text=Ola%2C%20gostaria%20de%20ver%20o%20cardapio',
    status: 'active',
    clicks: 89,
    metadata: {
      whatsappPhone: '5511999998888',
      whatsappMessage: 'Olá, gostaria de ver o cardápio da mesa 02'
    },
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    slug: 'mesa-03',
    type: 'pix',
    title: 'Pagamento Direto via Pix',
    destinationUrl: 'https://nubank.com.br/pagar/exemplo-restaurante',
    status: 'active',
    clicks: 64,
    metadata: {
      pixKey: 'contato@restaurantecapital.com.br',
      pixName: 'Restaurante Capital Ltda',
      pixCity: 'São Paulo'
    },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    slug: 'lote-demo-04',
    type: 'url',
    title: 'Tag Virgem para Nova Instalação',
    destinationUrl: '',
    status: 'virgin',
    clicks: 0,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    slug: 'lote-demo-05',
    type: 'url',
    title: 'Placa Balcão - Em Manutenção',
    destinationUrl: 'https://instagram.com/restaurantecapital',
    status: 'paused',
    clicks: 12,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

export const INITIAL_PLATES: PhysicalPlate[] = [
  {
    id: 'plate-01',
    slug: 'mesa-01',
    templateId: 'tmpl-google-gold',
    batchIdentifier: 'LOTE-2026-A1',
    plateNumber: 1,
    customerNotes: 'Mesa 01 - Próxima à Entrada',
    nfcWritten: true,
    nfcWrittenAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'plate-02',
    slug: 'mesa-02',
    templateId: 'tmpl-menu-pix',
    batchIdentifier: 'LOTE-2026-A1',
    plateNumber: 2,
    customerNotes: 'Mesa 02 - Área Externa Varanda',
    nfcWritten: true,
    nfcWrittenAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'plate-03',
    slug: 'mesa-03',
    templateId: 'tmpl-menu-pix',
    batchIdentifier: 'LOTE-2026-A1',
    plateNumber: 3,
    customerNotes: 'Mesa 03 - Salão Central',
    nfcWritten: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'plate-04',
    slug: 'lote-demo-04',
    templateId: 'tmpl-google-gold',
    batchIdentifier: 'LOTE-2026-A2',
    plateNumber: 4,
    customerNotes: 'Reserva Estoque Gráfica',
    nfcWritten: false,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'plate-05',
    slug: 'lote-demo-05',
    templateId: 'tmpl-google-gold',
    batchIdentifier: 'LOTE-2026-A2',
    plateNumber: 5,
    customerNotes: 'Balcão de Atendimento',
    nfcWritten: true,
    nfcWrittenAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  }
];

export const INITIAL_ANALYTICS: AnalyticsLog[] = [
  {
    id: 'log-1',
    slug: 'mesa-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    referrer: 'https://l.instagram.com',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    device: 'iOS (iPhone)'
  },
  {
    id: 'log-2',
    slug: 'mesa-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    referrer: '',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B)',
    device: 'Android'
  },
  {
    id: 'log-3',
    slug: 'mesa-02',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    referrer: '',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
    device: 'iOS (iPhone)'
  },
  {
    id: 'log-4',
    slug: 'mesa-03',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    referrer: '',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    device: 'Desktop'
  }
];
