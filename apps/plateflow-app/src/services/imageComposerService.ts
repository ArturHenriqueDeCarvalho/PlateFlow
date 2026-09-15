import QRCode from 'qrcode';
import JSZip from 'jszip';
import { PlateTemplate, PhysicalPlate } from '../types';

export interface ComposeOptions {
  baseUrl?: string;
  showSlugLabel?: boolean;
}

export const ImageComposerService = {
  /**
   * Generates a data URL for a QR Code
   */
  async generateQrDataUrl(text: string, size = 400): Promise<string> {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  },

  /**
   * Loads an image from a URL or Data URI into an HTMLImageElement
   */
  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Only set crossOrigin for remote URLs (data: and blob: are already same-origin)
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => resolve(img);
      img.onerror = () => {
        // If crossOrigin failed on remote URL, retry without crossOrigin
        if (img.crossOrigin) {
          const retryImg = new Image();
          retryImg.onload = () => resolve(retryImg);
          retryImg.onerror = (err) => reject(new Error(`Falha ao carregar arte do modelo: ${err}`));
          retryImg.src = src;
        } else {
          reject(new Error(`Falha ao carregar imagem: ${src.substring(0, 60)}...`));
        }
      };
      img.src = src;
    });
  },

  /**
   * Composes a single plate with its QR Code stamped at exact (x, y, size)
   */
  async composePlate(
    template: PlateTemplate,
    shortUrl: string,
    slug: string,
    options: ComposeOptions = {}
  ): Promise<string> {
    const bgImg = await this.loadImage(template.backgroundUrl);
    const qrDataUrl = await this.generateQrDataUrl(shortUrl, template.qrSize * 2);
    const qrImg = await this.loadImage(qrDataUrl);

    const canvas = document.createElement('canvas');
    canvas.width = template.backgroundWidth || bgImg.naturalWidth || 1200;
    canvas.height = template.backgroundHeight || bgImg.naturalHeight || 1600;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível obter o contexto 2D do Canvas');

    // Draw background
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // Draw white backing rectangle behind QR code for high contrast scan reliability
    const padding = 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    // Rounded rect if supported
    const rx = template.qrX - padding;
    const ry = template.qrY - padding;
    const rw = template.qrSize + padding * 2;
    const rh = template.qrSize + padding * 2;
    const radius = 16;
    if (ctx.roundRect) {
      ctx.roundRect(rx, ry, rw, rh, radius);
      ctx.fill();
    } else {
      ctx.fillRect(rx, ry, rw, rh);
    }

    // Draw QR Code
    ctx.drawImage(qrImg, template.qrX, template.qrY, template.qrSize, template.qrSize);

    // Optional tiny slug verification mark at the bottom edge for print identification
    if (options.showSlugLabel !== false) {
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = 'rgba(100, 116, 139, 0.75)';
      ctx.textAlign = 'right';
      ctx.fillText(`ID: ${slug}`, canvas.width - 32, canvas.height - 24);
    }

    try {
      return canvas.toDataURL('image/png', 0.95);
    } catch (err: any) {
      throw new Error(
        `Não foi possível exportar a placa: a imagem do template "${template.name}" possui restrições de segurança do navegador (CORS). Faça o upload do arquivo de imagem diretamente para resolver.`
      );
    }
  },

  /**
   * Generates a complete ZIP containing all composed high-resolution plates for print shop
   */
  async generateBatchZip(
    template: PlateTemplate,
    plates: PhysicalPlate[],
    baseUrl: string,
    onProgress?: (current: number, total: number, currentSlug: string) => void
  ): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder(`lote_${plates[0]?.batchIdentifier || 'artes'}`);

    let specTxt = `==========================================================\n`;
    specTxt += `GUIA DE IMPRESSÃO - LOTE DE PLACAS ACRÍLICAS COM QR E NFC\n`;
    specTxt += `==========================================================\n\n`;
    specTxt += `Template: ${template.name}\n`;
    specTxt += `Dimensões das Artes: ${template.backgroundWidth}x${template.backgroundHeight} px\n`;
    specTxt += `Área do QR Code: X=${template.qrX}, Y=${template.qrY}, Tamanho=${template.qrSize}px\n`;
    specTxt += `Total de Unidades: ${plates.length}\n`;
    specTxt += `Data de Geração: ${new Date().toLocaleString('pt-BR')}\n\n`;
    specTxt += `LISTA DE PLACAS E SLUGS DINÂMICOS:\n`;
    specTxt += `----------------------------------------------------------\n`;

    const total = plates.length;

    for (let i = 0; i < total; i++) {
      const plate = plates[i];
      const shortUrl = `${baseUrl.replace(/\/$/, '')}/r/${plate.slug}`;

      if (onProgress) {
        onProgress(i + 1, total, plate.slug);
      }

      specTxt += `[#${(i + 1).toString().padStart(2, '0')}] ${plate.slug} -> URL Curta: ${shortUrl} | Nota: ${plate.customerNotes || 'N/A'}\n`;

      const dataUrl = await this.composePlate(template, shortUrl, plate.slug, { showSlugLabel: true });
      // Extract base64
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

      const fileName = `placa_${(i + 1).toString().padStart(2, '0')}_${plate.slug}.png`;
      folder?.file(fileName, base64Data, { base64: true });
    }

    specTxt += `\nINSTRUÇÕES DE INSTALAÇÃO DA TAG NFC:\n`;
    specTxt += `1. Fixe a etiqueta NFC (NTAG213/215) no verso da placa correspondente ao símbolo de onda.\n`;
    specTxt += `2. Grave a respectiva URL Curta de cada placa utilizando o aplicativo NFC Tools no iPhone.\n`;
    specTxt += `3. O redirecionamento poderá ser alterado a qualquer momento no painel sem alterar o QR ou a tag física.\n`;

    folder?.file('LEIAME_GRAFICA.txt', specTxt);

    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
  }
};
