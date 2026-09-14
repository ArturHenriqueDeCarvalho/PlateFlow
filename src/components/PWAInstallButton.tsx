import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, don't show button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-install-pwa"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Instalar PWA</span>
      </button>
    );
  }

  // iOS Safari flow or generic fallback helper button
  return (
    <>
      <button
        id="btn-install-pwa-ios"
        onClick={() => setShowIOSGuide(true)}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span>{isIOS ? 'Instalar no iPhone' : 'Instalar App'}</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-white">Instalar no iPhone (iOS)</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm text-slate-300">
              <div className="flex items-start gap-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-white">Passo 1: Compartilhar</p>
                  <p className="text-xs text-slate-400 mt-0.5">Toque no botão de <strong>Compartilhar</strong> (ícone de seta para cima) na barra inferior do Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-white">Passo 2: Tela de Início</p>
                  <p className="text-xs text-slate-400 mt-0.5">Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</p>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300">
                O PWA abrirá em tela cheia como um aplicativo nativo, pronto para uso rápido no balcão ou oficina!
              </div>
            </div>

            <button
              id="btn-close-ios-guide"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
