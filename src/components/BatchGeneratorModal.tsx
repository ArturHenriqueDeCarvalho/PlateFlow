import React, { useState } from 'react';
import {
  Package,
  Layers,
  Download,
  CheckCircle2,
  X,
  FileArchive,
  Printer,
  Sparkles
} from 'lucide-react';
import { PlateTemplate, PhysicalPlate, DynamicRedirect } from '../types';
import { ImageComposerService } from '../services/imageComposerService';

interface BatchGeneratorModalProps {
  templates: PlateTemplate[];
  baseUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onBatchCreated: (plates: PhysicalPlate[], redirects: DynamicRedirect[]) => void;
}

export const BatchGeneratorModal: React.FC<BatchGeneratorModalProps> = ({
  templates,
  baseUrl,
  isOpen,
  onClose,
  onBatchCreated,
}) => {
  if (!isOpen) return null;

  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [batchId, setBatchId] = useState(`LOTE-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-A`);
  const [slugPrefix, setSlugPrefix] = useState('placa');
  const [customerPrefix, setCustomerPrefix] = useState('Placa');
  const [quantity, setQuantity] = useState(10);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentSlug: '' });
  const [downloadReady, setDownloadReady] = useState<{ url: string; filename: string; count: number } | null>(null);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (!template) return;

    setIsProcessing(true);
    setDownloadReady(null);

    const now = new Date().toISOString();
    const newPlates: PhysicalPlate[] = [];
    const newRedirects: DynamicRedirect[] = [];

    // 1. Create data records
    for (let i = 1; i <= quantity; i++) {
      const padded = i.toString().padStart(2, '0');
      const cleanPrefix = slugPrefix.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      const slug = `${cleanPrefix}-${padded}`;

      const redirect: DynamicRedirect = {
        slug,
        type: 'url',
        title: `${customerPrefix} #${padded}`,
        destinationUrl: '',
        status: 'virgin',
        clicks: 0,
        createdAt: now,
        updatedAt: now
      };

      const plate: PhysicalPlate = {
        id: `plate-${batchId}-${padded}-${Math.random().toString(36).slice(2, 6)}`,
        slug,
        templateId: template.id,
        batchIdentifier: batchId,
        plateNumber: i,
        customerNotes: `${customerPrefix} #${padded}`,
        nfcWritten: false,
        createdAt: now
      };

      newRedirects.push(redirect);
      newPlates.push(plate);
    }

    try {
      // 2. Process image stamping and ZIP packaging
      const zipBlob = await ImageComposerService.generateBatchZip(
        template,
        newPlates,
        baseUrl,
        (current, total, currentSlug) => {
          setProgress({ current, total, currentSlug });
        }
      );

      const downloadUrl = URL.createObjectURL(zipBlob);
      const filename = `${batchId}_artes_grafica_${quantity}_unidades.zip`;

      setDownloadReady({
        url: downloadUrl,
        filename,
        count: quantity
      });

      // Notify parent to store new plates and redirects
      onBatchCreated(newPlates, newRedirects);
    } catch (err) {
      console.error('Falha ao gerar lote:', err);
      alert('Ocorreu um erro durante a geração do lote. Verifique o console.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gerar Lote de Artes para a Gráfica</h2>
              <p className="text-xs text-slate-400">Exportação automatizada com carimbo do QR Code e ZIP para impressão.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {downloadReady ? (
          /* Success Screen */
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Lote Processado com Sucesso!</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                Foram geradas <strong>{downloadReady.count} artes exclusivas</strong> em alta resolução, cada uma com seu respectivo QR Code dinâmico carimbado na posição milimétrica.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 space-y-1.5 text-left">
              <div className="flex justify-between">
                <span>Arquivo Gerado:</span>
                <strong className="text-white font-mono">{downloadReady.filename}</strong>
              </div>
              <div className="flex justify-between">
                <span>Instruções Gráfica:</span>
                <span className="text-indigo-400 font-semibold">Inclui LEIAME_GRAFICA.txt</span>
              </div>
              <div className="flex justify-between">
                <span>Status no Sistema:</span>
                <span className="text-amber-400 font-semibold">Cadastradas como "Virgens"</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                id="btn-download-zip"
                href={downloadReady.url}
                download={downloadReady.filename}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Baixar Pacote ZIP para Gráfica</span>
              </a>

              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 py-3 px-5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleStartGeneration} className="p-6 space-y-4">
            {/* Template Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Modelo Visual Base</span>
              </label>
              <select
                id="select-batch-template"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={isProcessing}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.backgroundWidth}x{t.backgroundHeight}px)
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Posicionamento do QR: X={selectedTemplate.qrX}px, Y={selectedTemplate.qrY}px, Tamanho={selectedTemplate.qrSize}px
                </p>
              )}
            </div>

            {/* Batch Identifier & Prefix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Identificador do Lote
                </label>
                <input
                  id="input-batch-id"
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  disabled={isProcessing}
                  required
                  placeholder="Ex: LOTE-2026-03-A"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Prefixo dos Slugs (URL Curta)
                </label>
                <input
                  id="input-slug-prefix"
                  type="text"
                  value={slugPrefix}
                  onChange={(e) => setSlugPrefix(e.target.value)}
                  disabled={isProcessing}
                  required
                  placeholder="Ex: mesa, totem, placa"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Quantidade de Unidades no Lote</span>
                <span className="font-bold text-indigo-400 text-xs">{quantity} artes exclusivas</span>
              </label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    disabled={isProcessing}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      quantity === num
                        ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {num} placas
                  </button>
                ))}
              </div>
            </div>

            {/* Customer note prefix */}
            <div>
              <label className="text-xs font-medium text-slate-300">
                Anotação / Rótulo Padrão
              </label>
              <input
                id="input-customer-prefix"
                type="text"
                value={customerPrefix}
                onChange={(e) => setCustomerPrefix(e.target.value)}
                disabled={isProcessing}
                placeholder="Ex: Mesa Salão Principal"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Progress indicator during processing */}
            {isProcessing && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>Renderizando placa {progress.current} de {progress.total}...</span>
                  </span>
                  <span className="font-mono text-cyan-400">{progress.currentSlug}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150"
                    style={{
                      width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Compondo imagem em alta resolução e empacotando ZIP...
                </p>
              </div>
            )}

            {/* Print Shop advice */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-400 flex items-start gap-2.5">
              <Printer className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">Pronto para a Gráfica:</span>
                <p className="mt-0.5 text-[11px]">
                  O arquivo ZIP conterá as {quantity} artes nomeadas como <code className="text-cyan-300">placa_01.png</code> até <code className="text-cyan-300">placa_{quantity.toString().padStart(2, '0')}.png</code> em resolução original com o QR Code nítido, dispensando qualquer edição manual pelo designer.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                id="btn-confirm-generate-batch"
                type="submit"
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
              >
                <FileArchive className="h-4 w-4" />
                <span>{isProcessing ? 'Processando Lote...' : `Processar & Gerar ZIP (${quantity} Unidades)`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
