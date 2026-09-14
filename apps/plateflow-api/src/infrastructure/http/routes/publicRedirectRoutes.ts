import type { FastifyPluginAsync } from 'fastify';
import QRCode from 'qrcode';
import { DrizzleRedirectRepository } from '../../database/DrizzleRedirectRepository.js';
import { DrizzleAnalyticsRepository } from '../../database/DrizzleAnalyticsRepository.js';
import { ResolveRedirectUseCase } from '../../../core/use-cases/redirects/ResolveRedirectUseCase.js';
import { generatePixBrCode } from '../../services/PixCodeService.js';
import { generateVCardString } from '../../services/VCardService.js';

function parseDevice(ua: string): 'iOS (iPhone)' | 'Android' | 'Desktop' | 'Outro' {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS (iPhone)';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows|Macintosh|Linux/i.test(ua) && !/Mobile/i.test(ua)) return 'Desktop';
  return 'Outro';
}

function ensureAbsoluteUrl(url: string): string {
  if (!url) return '#';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*?:/.test(url)) return url;
  return `https://${url}`;
}

export const publicRedirectRoutes: FastifyPluginAsync = async (app) => {
  const redirectRepo = new DrizzleRedirectRepository();
  const analyticsRepo = new DrizzleAnalyticsRepository();
  const resolveUseCase = new ResolveRedirectUseCase(redirectRepo, analyticsRepo);

  const handleRedirect = async (req: any, reply: any) => {
    try {
      const { slug } = req.params;
      const srcQuery = req.query?.src;
      const source = srcQuery === 'nfc' ? 'nfc' : 'qr';
      const userAgent = req.headers['user-agent'] || '';
      const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direto / Desconhecido';
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
      const deviceType = parseDevice(userAgent);

      const redirect = await resolveUseCase.execute(slug, {
        source,
        referrer,
        userAgent,
        deviceType,
        ip,
      });

      if (!redirect) {
        return reply.status(404).type('text/html').send(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Placa Não Encontrada | PlateFlow</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full text-center bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
              <h1 class="text-3xl font-extrabold text-red-400 mb-2">Placa Não Encontrada</h1>
              <p class="text-slate-400 mb-6 text-sm">O identificador <code class="text-amber-400 bg-slate-800 px-2 py-0.5 rounded">${slug}</code> não existe ou foi removido.</p>
              <a href="/" class="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30">Ir para o Início</a>
            </div>
          </body>
          </html>
        `);
      }

      if (redirect.status === 'virgin') {
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Placa Virgem - Pronto para Vinculação</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full text-center bg-slate-900/90 border border-amber-500/30 p-8 rounded-3xl shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
              <div class="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold">✨</div>
              <h1 class="text-2xl font-black text-white mb-2">Placa Virgem Pronta</h1>
              <p class="text-slate-400 text-sm mb-6 leading-relaxed">Esta placa física com código <span class="text-amber-400 font-mono font-bold">${redirect.slug}</span> já está gravada e pronta para ser ativada pelo cliente ou operador.</p>
              <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 text-left text-xs text-slate-400 space-y-2">
                <div class="flex justify-between"><span>Identificador:</span><span class="font-mono text-slate-200">${redirect.slug}</span></div>
                <div class="flex justify-between"><span>Status:</span><span class="text-amber-400 font-bold uppercase">Virgem (Não Vinculada)</span></div>
              </div>
              <a href="/" class="block w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all text-sm">Vincular Destino no Painel</a>
            </div>
          </body>
          </html>
        `);
      }

      if (redirect.status === 'paused') {
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Acesso Temporariamente Indisponível</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full text-center bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
              <h1 class="text-2xl font-black text-amber-400 mb-2">Página Temporariamente Pausada</h1>
              <p class="text-slate-400 text-sm mb-6 leading-relaxed">O destino vinculado a esta placa foi temporariamente pausado pelo estabelecimento responsável.</p>
              <a href="/" class="inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all">Voltar ao início</a>
            </div>
          </body>
          </html>
        `);
      }

      const metadata = redirect.metadata || {};

      // 1. Pix BR Code
      if (redirect.type === 'pix') {
        const pixKey = metadata.pixKey || redirect.destinationUrl;
        const pixName = metadata.pixName || redirect.title || 'Recebedor';
        const pixCity = metadata.pixCity || 'SAO PAULO';
        const pixAmount = metadata.pixAmount ? Number(metadata.pixAmount) : undefined;
        const brCode = generatePixBrCode(pixKey, pixName, pixCity, pixAmount);
        const qrImage = await QRCode.toDataURL(brCode, { width: 320, margin: 1 });

        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagamento Pix | ${redirect.title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full text-center bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl shadow-2xl shadow-emerald-500/10">
              <h1 class="text-2xl font-black text-white mb-1">${redirect.title}</h1>
              <p class="text-xs text-slate-400 mb-6">Escaneie o QR Code ou copie o código Pix abaixo</p>
              <div class="bg-white p-4 rounded-2xl inline-block mx-auto mb-6 shadow-xl">
                <img src="${qrImage}" alt="QR Code Pix" class="w-64 h-64 mx-auto" />
              </div>
              <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left mb-6">
                <div class="flex justify-between text-xs mb-1 text-slate-400"><span>Chave Pix:</span><span class="font-mono text-emerald-400 font-bold">${pixKey}</span></div>
                <div class="flex justify-between text-xs mb-1 text-slate-400"><span>Beneficiário:</span><span class="text-white">${pixName}</span></div>
                ${pixAmount ? `<div class="flex justify-between text-xs text-slate-400"><span>Valor:</span><span class="text-emerald-400 font-bold text-sm">R$ ${pixAmount.toFixed(2)}</span></div>` : ''}
              </div>
              <textarea readonly id="brCode" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 resize-none h-20 mb-4 focus:outline-none">${brCode}</textarea>
              <button onclick="navigator.clipboard.writeText(document.getElementById('brCode').value); alert('Código Pix Copia e Cola copiado com sucesso!');" class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition-all text-sm uppercase tracking-wide">Copiar Código Pix (Copia e Cola)</button>
            </div>
          </body>
          </html>
        `);
      }

      // 2. vCard .vcf
      if (redirect.type === 'vcard') {
        const vcardData = {
          name: metadata.vcardName || redirect.title || 'Contato',
          phone: metadata.vcardPhone || '',
          email: metadata.vcardEmail || '',
          org: metadata.vcardOrg || '',
          role: metadata.vcardRole || '',
        };
        const vcardString = generateVCardString(vcardData);

        if (req.query?.download === '1') {
          reply.header('Content-Type', 'text/vcard; charset=utf-8');
          reply.header('Content-Disposition', `attachment; filename="${vcardData.name.replace(/\s+/g, '_')}.vcf"`);
          return reply.send(vcardString);
        }

        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cartão de Contato | ${vcardData.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full text-center bg-slate-900 border border-indigo-500/30 p-8 rounded-3xl shadow-2xl shadow-indigo-500/10">
              <div class="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-3xl font-black text-indigo-400">${vcardData.name.charAt(0).toUpperCase()}</div>
              <h1 class="text-2xl font-black text-white mb-1">${vcardData.name}</h1>
              ${vcardData.role ? `<p class="text-sm text-indigo-400 font-semibold mb-1">${vcardData.role}</p>` : ''}
              ${vcardData.org ? `<p class="text-xs text-slate-400 mb-6">${vcardData.org}</p>` : '<div class="mb-6"></div>'}
              <div class="space-y-3 mb-6">
                ${vcardData.phone ? `<a href="tel:${vcardData.phone}" class="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm hover:border-slate-700 transition-all"><span class="text-slate-400">Telefone</span><span class="font-bold text-white">${vcardData.phone}</span></a>` : ''}
                ${vcardData.email ? `<a href="mailto:${vcardData.email}" class="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm hover:border-slate-700 transition-all"><span class="text-slate-400">E-mail</span><span class="font-bold text-white">${vcardData.email}</span></a>` : ''}
              </div>
              <a href="?download=1" class="block w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm mb-3">Salvar Contato no Celular (.vcf)</a>
            </div>
          </body>
          </html>
        `);
      }

      // 3. WhatsApp
      if (redirect.type === 'whatsapp') {
        const waPhone = (metadata.whatsappPhone || redirect.destinationUrl || '').replace(/\D/g, '');
        const waMsg = encodeURIComponent(metadata.whatsappMessage || '');
        const waUrl = `https://wa.me/${waPhone}${waMsg ? `?text=${waMsg}` : ''}`;
        return reply.status(307).redirect(waUrl);
      }

      // 4. Social
      if (redirect.type === 'social') {
        const handle = (metadata.socialUsername || '').replace(/^@/, '');
        const socialUrl = handle ? `https://instagram.com/${handle}` : ensureAbsoluteUrl(redirect.destinationUrl);
        return reply.status(307).redirect(socialUrl);
      }

      // 5. Standard URL
      const targetUrl = ensureAbsoluteUrl(redirect.destinationUrl);
      return reply.status(307).redirect(targetUrl);
    } catch (err: any) {
      console.error('Redirect handler error:', err.message);
      return reply.status(500).type('text/plain').send('Erro interno ao processar redirecionamento.');
    }
  };

  app.get('/r/:slug', handleRedirect);
  app.get('/api/redirects/:slug/resolve', handleRedirect);
};
