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
        title="Instalar PWA"
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-zinc-300" />
        <span className="hidden sm:inline">Instalar PWA</span>
      </button>
    );
  }

  // iOS Safari flow or generic fallback helper button
  return (
    <>
      <button
        id="btn-install-pwa-ios"
        onClick={() => setShowIOSGuide(true)}
        title={isIOS ? 'Instalar no iPhone' : 'Instalar App'}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-zinc-300" />
        <span className="hidden sm:inline">{isIOS ? 'Instalar no iPhone' : 'Instalar App'}</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">Instalar no iPhone</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
                aria-label="Fechar guia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-3 rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-200 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Passo 1: Compartilhar</p>
                  <p className="text-zinc-400 mt-0.5">Toque em <strong>Compartilhar</strong> (seta para cima) no Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-zinc-950 p-3 border border-zinc-800">
                <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-200 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Passo 2: Adicionar à Tela</p>
                  <p className="text-zinc-400 mt-0.5">Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</p>
                </div>
              </div>
            </div>

            <button
              id="btn-close-ios-guide"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-lg bg-zinc-100 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
