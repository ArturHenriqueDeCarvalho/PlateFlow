import React, { useState, useEffect } from 'react';
import { Download, X, Eye, ExternalLink, QrCode } from 'lucide-react';
import { PhysicalPlate, PlateTemplate, DynamicRedirect } from '../types';
import { ImageComposerService } from '../services/imageComposerService';

interface PlatePreviewModalProps {
  plate: PhysicalPlate;
  template?: PlateTemplate;
  redirect?: DynamicRedirect;
  baseUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditRedirect: () => void;
}

export const PlatePreviewModal: React.FC<PlatePreviewModalProps> = ({
  plate,
  template,
  redirect,
  baseUrl,
  isOpen,
  onClose,
  onOpenEditRedirect,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const shortUrl = `${baseUrl.replace(/\/$/, '')}/r/${plate.slug}`;

  useEffect(() => {
    if (!isOpen || !template) return;
    let active = true;
    setLoading(true);

    ImageComposerService.composePlate(template, shortUrl, plate.slug, { showSlugLabel: true })
      .then((res) => {
        if (active) {
          setDataUrl(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error rendering plate preview', err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, plate, template, shortUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-400" />
              <span>Arte Composta da Placa</span>
              <span className="font-mono text-xs text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {plate.slug}
              </span>
            </h2>
            <p className="text-xs text-slate-400">{template?.name || 'Modelo Padrão'}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-center">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
              <p className="text-xs">Compondo imagem em alta resolução...</p>
            </div>
          ) : dataUrl ? (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-xs rounded-xl overflow-hidden shadow-2xl border border-slate-700">
                <img
                  src={dataUrl}
                  alt={`Arte ${plate.slug}`}
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300 flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-2 text-left">
                  <QrCode className="h-4 w-4 text-indigo-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Redirecionamento Dinâmico</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[240px]">
                      {redirect?.destinationUrl || 'Ainda não ativado (Virgem)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenEditRedirect();
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Editar
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <a
                  href={dataUrl}
                  download={`arte_${plate.slug}.png`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar PNG Individual</span>
                </a>

                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-400 py-10">Não foi possível gerar a arte.</p>
          )}
        </div>
      </div>
    </div>
  );
};
