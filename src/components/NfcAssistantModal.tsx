import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  X,
  Radio,
  HelpCircle
} from 'lucide-react';
import { PhysicalPlate, DynamicRedirect } from '../types';

interface NfcAssistantModalProps {
  plate: PhysicalPlate;
  redirect?: DynamicRedirect;
  baseUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onMarkWritten: (plateId: string, written: boolean) => void;
}

export const NfcAssistantModal: React.FC<NfcAssistantModalProps> = ({
  plate,
  redirect,
  baseUrl,
  isOpen,
  onClose,
  onMarkWritten,
}) => {
  const [copied, setCopied] = useState(false);
  const [isWritten, setIsWritten] = useState(plate.nfcWritten);

  if (!isOpen) return null;

  const shortUrl = `${baseUrl.replace(/\/$/, '')}/r/${plate.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shortUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleToggleWritten = (checked: boolean) => {
    setIsWritten(checked);
    onMarkWritten(plate.id, checked);
  };

  const openNfcTools = () => {
    // Try opening NFC Tools custom scheme
    window.location.href = 'nfctools://';
    // Fallback info after short delay
    setTimeout(() => {
      // If user is on iOS, can open App store or prompt
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gravação NFC Assistida (iPhone)</h2>
              <p className="text-xs text-slate-400">Placa ID: <span className="text-cyan-300 font-mono font-semibold">{plate.slug}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Logical Binding explanation banner */}
          <div className="rounded-xl bg-cyan-950/40 border border-cyan-800/40 p-3.5 text-xs text-cyan-200 flex items-start gap-2.5">
            <Smartphone className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-cyan-300">Vinculação Lógica Definitiva</p>
              <p className="text-cyan-200/80 mt-0.5">
                Grave esta URL curta <strong>apenas uma vez</strong> na tag NFC física. Quando o cliente alterar o link de destino no futuro, o chip atualizará automaticamente pela nuvem sem precisar ser regravado!
              </p>
            </div>
          </div>

          {/* Copy URL Box */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              URL Curta Fixa para o Chip
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 p-2.5">
              <span className="flex-1 font-mono text-xs text-white truncate px-2 select-all">
                {shortUrl}
              </span>
              <button
                id="btn-copy-short-url"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Destino atual configurado: <strong className="text-slate-300">{redirect?.destinationUrl || 'Ainda não ativado (Virgem)'}</strong>
            </p>
          </div>

          {/* 3 Step Visual Guide for iOS */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Passo a Passo no iPhone (Aplicativo NFC Tools)
            </h3>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80 text-xs">
              <div className="p-3 flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-indigo-400 border border-slate-700">
                  1
                </span>
                <div>
                  <p className="font-semibold text-white">Abra o NFC Tools e vá em "Escrever"</p>
                  <p className="text-slate-400 mt-0.5">Toque na aba <strong>Escrever (Write)</strong> e selecione <strong>Adicionar um registro (Add a record)</strong>.</p>
                </div>
              </div>

              <div className="p-3 flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-indigo-400 border border-slate-700">
                  2
                </span>
                <div>
                  <p className="font-semibold text-white">Selecione "URL / URI" e Cole o Link</p>
                  <p className="text-slate-400 mt-0.5">Cole o link que você acabou de copiar acima e confirme em <strong>OK</strong>.</p>
                </div>
              </div>

              <div className="p-3 flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-indigo-400 border border-slate-700">
                  3
                </span>
                <div>
                  <p className="font-semibold text-white">Toque em "Escrever" e Aproxime o iPhone</p>
                  <p className="text-slate-400 mt-0.5">Encoste a parte superior do iPhone na etiqueta NFC no verso da placa até ouvir o bipe de sucesso.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              id="btn-open-nfc-tools"
              onClick={openNfcTools}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 px-4 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 text-cyan-400" />
              <span>Abrir App NFC Tools</span>
            </button>

            <a
              href="https://apps.apple.com/app/nfc-tools/id1252962749"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 hover:border-slate-700 py-2.5 px-3 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Baixar NFC Tools</span>
            </a>
          </div>

          {/* Written Confirmation Toggle */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isWritten ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Tag NFC Física Gravada</p>
                <p className="text-[11px] text-slate-400">
                  {isWritten ? 'Chip gravado e pronto para uso pelo cliente' : 'Pendente de gravação física'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-nfc-written"
                type="checkbox"
                checked={isWritten}
                onChange={(e) => handleToggleWritten(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-900/90 px-6 py-3.5 flex justify-end">
          <button
            id="btn-close-nfc-modal"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Concluir &amp; Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
