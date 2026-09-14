import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ExternalLink,
  QrCode,
  MessageCircle,
  X,
  Radio,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Zap
} from 'lucide-react';
import { DynamicRedirect, PhysicalPlate } from '../types';

interface RedirectSimulatorModalProps {
  initialSlug?: string;
  redirects: DynamicRedirect[];
  plates: PhysicalPlate[];
  baseUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onRecordScan: (slug: string) => void;
}

export const RedirectSimulatorModal: React.FC<RedirectSimulatorModalProps> = ({
  initialSlug,
  redirects,
  plates,
  baseUrl,
  isOpen,
  onClose,
  onRecordScan,
}) => {
  if (!isOpen) return null;

  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialSlug || redirects[0]?.slug || 'mesa-01'
  );
  const [copiedKey, setCopiedKey] = useState(false);
  const [scanLogged, setScanLogged] = useState(false);

  useEffect(() => {
    if (initialSlug) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug]);

  // When selectedSlug changes, simulate scan hit
  useEffect(() => {
    if (selectedSlug) {
      onRecordScan(selectedSlug);
      setScanLogged(true);
      const t = setTimeout(() => setScanLogged(false), 2000);
      return () => clearTimeout(t);
    }
  }, [selectedSlug]);

  const activeRedirect = redirects.find(
    r => r.slug.toLowerCase() === selectedSlug.toLowerCase()
  );
  const activePlate = plates.find(
    p => p.slug.toLowerCase() === selectedSlug.toLowerCase()
  );

  const shortUrl = `${baseUrl.replace(/\/$/, '')}/r/${selectedSlug}`;

  const handleCopyPix = () => {
    if (activeRedirect?.metadata?.pixKey) {
      navigator.clipboard.writeText(activeRedirect.metadata.pixKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Simulador de Leitura do Cliente</h2>
              <p className="text-[11px] text-slate-400">Scan de Câmera ou Aproximação NFC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quick Slug Switcher */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Placa / Tag Sendo Testada:
            </label>
            <select
              id="select-sim-slug"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-cyan-300 focus:border-indigo-500 focus:outline-none"
            >
              {redirects.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.slug} — {r.title} ({r.status})
                </option>
              ))}
            </select>
          </div>

          {/* Simulated Mobile Device Frame */}
          <div className="rounded-2xl border-2 border-slate-700/80 bg-slate-950 p-5 shadow-inner text-center relative overflow-hidden">
            {/* Notch / Speaker bar */}
            <div className="mx-auto h-1.5 w-16 rounded-full bg-slate-800 mb-4" />

            {scanLogged && (
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30 animate-pulse">
                <CheckCircle2 className="h-3 w-3" />
                <span>Leitura Registrada!</span>
              </div>
            )}

            {!activeRedirect ? (
              <div className="py-8 space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-amber-400" />
                <h3 className="text-sm font-bold text-white">Placa Não Encontrada</h3>
                <p className="text-xs text-slate-400">O código {selectedSlug} não existe no banco de dados.</p>
              </div>
            ) : activeRedirect.status === 'virgin' || !activeRedirect.destinationUrl ? (
              /* Virgin Plate State */
              <div className="py-6 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Radio className="h-6 w-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-white">Dispositivo Pronto para Ativação</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Esta placa física está cadastrada no sistema, mas ainda não foi vinculada a um destino final pelo administrador.
                </p>
                <div className="pt-2">
                  <span className="rounded-full bg-slate-800 px-3 py-1 font-mono text-[10px] text-slate-300">
                    ID: {activeRedirect.slug}
                  </span>
                </div>
              </div>
            ) : activeRedirect.status === 'paused' ? (
              /* Paused State */
              <div className="py-6 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Serviço Temporariamente Pausado</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  O redirecionamento desta placa foi suspenso temporariamente pelo administrador.
                </p>
              </div>
            ) : (
              /* Active Destination State */
              <div className="py-4 space-y-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Conexão Bem-Sucedida
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {activeRedirect.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono break-all px-2">
                    {activeRedirect.destinationUrl}
                  </p>
                </div>

                {/* Specific UI details */}
                {activeRedirect.type === 'whatsapp' && (
                  <div className="rounded-xl bg-emerald-950/30 border border-emerald-800/40 p-3 text-xs text-emerald-300">
                    <p className="font-semibold flex items-center justify-center gap-1.5">
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                      <span>Mensagem Pronta para Envio:</span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-300 italic">
                      "{activeRedirect.metadata?.whatsappMessage || 'Olá!'}"
                    </p>
                  </div>
                )}

                {activeRedirect.type === 'pix' && (
                  <div className="rounded-xl bg-cyan-950/30 border border-cyan-800/40 p-3 text-xs text-cyan-300 space-y-2">
                    <p className="font-semibold flex items-center justify-center gap-1.5">
                      <QrCode className="h-4 w-4 text-cyan-400" />
                      <span>Chave Pix:</span>
                    </p>
                    <p className="font-mono text-white text-[11px] bg-slate-900 py-1 px-2 rounded">
                      {activeRedirect.metadata?.pixKey}
                    </p>
                    <button
                      onClick={handleCopyPix}
                      className="flex items-center justify-center gap-1 mx-auto text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                    </button>
                  </div>
                )}

                {/* Direct Action Button */}
                <a
                  href={activeRedirect.destinationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 px-4 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Acessar Destino Real do Cliente</span>
                </a>
              </div>
            )}

            {/* Bottom URL pill */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>URL Curta: /r/{selectedSlug}</span>
              <span>Cliques: {activeRedirect?.clicks || 0}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-900/90 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Cada teste atualiza as métricas em tempo real.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
