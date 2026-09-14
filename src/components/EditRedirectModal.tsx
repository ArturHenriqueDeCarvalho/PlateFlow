import React, { useState } from 'react';
import {
  Link as LinkIcon,
  MessageCircle,
  QrCode,
  User,
  Instagram,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  ExternalLink
} from 'lucide-react';
import { DynamicRedirect, PhysicalPlate, RedirectType, RedirectStatus } from '../types';

interface EditRedirectModalProps {
  redirect?: DynamicRedirect;
  plate?: PhysicalPlate;
  baseUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRedirect: DynamicRedirect, updatedPlate?: PhysicalPlate) => void;
}

export const EditRedirectModal: React.FC<EditRedirectModalProps> = ({
  redirect,
  plate,
  baseUrl,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !redirect) return null;

  const [type, setType] = useState<RedirectType>(redirect.type || 'url');
  const [status, setStatus] = useState<RedirectStatus>(redirect.status || 'active');
  const [title, setTitle] = useState(redirect.title || '');
  const [destinationUrl, setDestinationUrl] = useState(redirect.destinationUrl || '');
  const [customerNotes, setCustomerNotes] = useState(plate?.customerNotes || '');

  // Specific form states
  const [waPhone, setWaPhone] = useState(redirect.metadata?.whatsappPhone || '55');
  const [waMsg, setWaMsg] = useState(redirect.metadata?.whatsappMessage || '');
  const [pixKey, setPixKey] = useState(redirect.metadata?.pixKey || '');
  const [pixName, setPixName] = useState(redirect.metadata?.pixName || '');
  const [vcardName, setVcardName] = useState(redirect.metadata?.vcardName || '');
  const [vcardPhone, setVcardPhone] = useState(redirect.metadata?.vcardPhone || '');
  const [vcardEmail, setVcardEmail] = useState(redirect.metadata?.vcardEmail || '');
  const [socialUser, setSocialUser] = useState(redirect.metadata?.socialUsername || '');

  const shortUrl = `${baseUrl.replace(/\/$/, '')}/r/${redirect.slug}`;

  const calculateFinalUrl = (): string => {
    if (type === 'whatsapp') {
      const cleanPhone = waPhone.replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(waMsg);
      return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
    }
    if (type === 'pix') {
      return destinationUrl || `https://pix.bcb.gov.br/qr/${encodeURIComponent(pixKey)}`;
    }
    if (type === 'social') {
      const cleanHandle = socialUser.replace(/^@/, '');
      return `https://instagram.com/${cleanHandle}`;
    }
    return destinationUrl;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = calculateFinalUrl();

    const updatedRedirect: DynamicRedirect = {
      ...redirect,
      type,
      status,
      title: title.trim() || `Redirecionamento ${redirect.slug}`,
      destinationUrl: finalUrl,
      metadata: {
        whatsappPhone: waPhone,
        whatsappMessage: waMsg,
        pixKey,
        pixName,
        vcardName,
        vcardPhone,
        vcardEmail,
        socialUsername: socialUser
      },
      updatedAt: new Date().toISOString()
    };

    const updatedPlate: PhysicalPlate | undefined = plate
      ? { ...plate, customerNotes }
      : undefined;

    onSave(updatedRedirect, updatedPlate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Editar Destino Dinâmico</span>
              <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 font-mono text-xs text-indigo-300 border border-indigo-500/30">
                {redirect.slug}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Altere o destino a qualquer momento sem trocar o QR Code impresso ou chip NFC.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Status selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold border transition-all cursor-pointer ${
                status === 'active'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Ativo</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('paused')}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold border transition-all cursor-pointer ${
                status === 'paused'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <PauseCircle className="h-4 w-4 text-amber-400" />
              <span>Pausado</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('virgin')}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold border transition-all cursor-pointer ${
                status === 'virgin'
                  ? 'bg-slate-700 border-slate-500 text-slate-200 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <AlertCircle className="h-4 w-4 text-slate-400" />
              <span>Virgem</span>
            </button>
          </div>

          {/* Type tabs */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tipo de Destino Final
            </label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('url')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'url'
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                <span>Link / Reviews</span>
              </button>

              <button
                type="button"
                onClick={() => setType('whatsapp')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setType('pix')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'pix'
                    ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>Pix / Pagar</span>
              </button>

              <button
                type="button"
                onClick={() => setType('social')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'social'
                    ? 'border-pink-500 bg-pink-600/20 text-pink-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Instagram className="h-4 w-4" />
                <span>Instagram</span>
              </button>
            </div>
          </div>

          {/* Title & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">
                Título de Identificação
              </label>
              <input
                id="input-redirect-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Google Reviews - Mesa 01"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">
                Anotações do Cliente / Local
              </label>
              <input
                id="input-customer-notes"
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Ex: Barbearia VIP - Balcão Principal"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic field details based on Type */}
          {type === 'url' && (
            <div>
              <label className="text-xs font-medium text-slate-300">
                URL de Destino Final (Google Maps, Cardápio, Site, etc.)
              </label>
              <div className="mt-1 relative">
                <input
                  id="input-dest-url"
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://g.page/r/exemplo-reviews/review"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none pr-9 font-mono"
                />
                {destinationUrl && (
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-indigo-400"
                    title="Testar link em nova aba"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {type === 'whatsapp' && (
            <div className="space-y-3 rounded-xl bg-slate-950 p-3.5 border border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Número do WhatsApp (com DDI e DDD)
                </label>
                <input
                  id="input-wa-phone"
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="5511999998888"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Mensagem Pré-preenchida
                </label>
                <input
                  id="input-wa-msg"
                  type="text"
                  value={waMsg}
                  onChange={(e) => setWaMsg(e.target.value)}
                  placeholder="Olá! Gostaria de ver o cardápio da mesa 01."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {type === 'pix' && (
            <div className="space-y-3 rounded-xl bg-slate-950 p-3.5 border border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Chave Pix (E-mail, CPF, CNPJ ou Celular)
                </label>
                <input
                  id="input-pix-key"
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="pix@restaurante.com.br"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Nome do Beneficiário
                </label>
                <input
                  id="input-pix-name"
                  type="text"
                  value={pixName}
                  onChange={(e) => setPixName(e.target.value)}
                  placeholder="Restaurante &amp; Bar Exemplo Ltda"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  URL de Pagamento Direto (Opcional - link do gateway/Nubank/Mercado Pago)
                </label>
                <input
                  id="input-pix-url"
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://nubank.com.br/pagar/..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {type === 'social' && (
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
              <label className="text-xs font-medium text-slate-300">
                Nome de Usuário no Instagram (@)
              </label>
              <div className="mt-1 flex rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
                <span className="px-3 py-2 bg-slate-800 text-slate-400 text-xs flex items-center font-mono">
                  @
                </span>
                <input
                  id="input-social-user"
                  type="text"
                  value={socialUser}
                  onChange={(e) => setSocialUser(e.target.value)}
                  placeholder="restauranteoficial"
                  required
                  className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Link interno imutável: <strong className="text-slate-300 font-mono">{shortUrl}</strong></span>
            <span>{redirect.clicks} leituras registradas</span>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="btn-save-redirect"
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
