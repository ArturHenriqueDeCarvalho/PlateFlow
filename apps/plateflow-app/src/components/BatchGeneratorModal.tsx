import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  FileArchive,
  Loader2
} from 'lucide-react';
import { PlateTemplate, PhysicalPlate, DynamicRedirect } from '../types';
import { ImageComposerService } from '../services/imageComposerService';
import { Modal, Button, Input, Select } from './ui';

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
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [batchId, setBatchId] = useState(
    `LOTE-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-A`
  );
  const [slugPrefix, setSlugPrefix] = useState('placa');
  const [customerPrefix, setCustomerPrefix] = useState('Placa');
  const [quantity, setQuantity] = useState(10);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentSlug: '' });
  const [downloadReady, setDownloadReady] = useState<{ url: string; filename: string; count: number } | null>(null);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    if (!template) return;

    setIsProcessing(true);
    setDownloadReady(null);

    const now = new Date().toISOString();
    const newPlates: PhysicalPlate[] = [];
    const newRedirects: DynamicRedirect[] = [];

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
      const zipBlob = await ImageComposerService.generateBatchZip(
        template,
        newPlates,
        baseUrl,
        (current, total, currentSlug) => {
          setProgress({ current, total, currentSlug });
        }
      );

      const downloadUrl = URL.createObjectURL(zipBlob);
      const filename = `${batchId}_artes_${quantity}_unidades.zip`;

      setDownloadReady({
        url: downloadUrl,
        filename,
        count: quantity
      });

      onBatchCreated(newPlates, newRedirects);
    } catch (err: any) {
      console.error('Falha ao gerar lote:', err);
      alert(err.message || 'Ocorreu um erro durante a geração do lote.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalClose = () => {
    if (isProcessing) return;
    setDownloadReady(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={downloadReady ? 'Lote Gerado' : 'Gerar Lote de Placas'}
      description={
        downloadReady
          ? `${downloadReady.count} artes exclusivas com QR Code carimbado prontas para download.`
          : 'Cria as artes individuais em alta resolução e empacota em arquivo ZIP.'
      }
      size="md"
    >
      {downloadReady ? (
        /* Success Screen */
        <div className="space-y-4 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <p className="font-mono text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
            {downloadReady.filename}
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <a
              id="btn-download-zip"
              href={downloadReady.url}
              download={downloadReady.filename}
              className="flex-1"
            >
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                icon={<Download className="h-4 w-4" />}
              >
                Baixar Pacote ZIP
              </Button>
            </a>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleModalClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        /* Form Screen */
        <form onSubmit={handleStartGeneration} className="space-y-4">
          <Select
            id="select-batch-template"
            label="Modelo Visual"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            disabled={isProcessing}
            options={templates.map((t) => ({
              value: t.id,
              label: `${t.name} (${t.backgroundWidth}×${t.backgroundHeight}px)`
            }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="input-batch-id"
              label="Código do Lote"
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              disabled={isProcessing}
              required
            />

            <Input
              id="input-slug-prefix"
              label="Prefixo da URL"
              type="text"
              value={slugPrefix}
              onChange={(e) => setSlugPrefix(e.target.value)}
              disabled={isProcessing}
              required
            />
          </div>

          {/* Quantity Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Quantidade de Placas
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 25, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuantity(num)}
                  disabled={isProcessing}
                  className={`py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    quantity === num
                      ? 'bg-zinc-100 text-zinc-900 border-zinc-100 font-semibold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <Input
            id="input-customer-prefix"
            label="Identificação Inicial"
            type="text"
            value={customerPrefix}
            onChange={(e) => setCustomerPrefix(e.target.value)}
            disabled={isProcessing}
            placeholder="Ex: Mesa"
          />

          {/* Progress indicator */}
          {isProcessing && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                  <span>Gerando placa {progress.current} de {progress.total}...</span>
                </span>
                <span className="font-mono text-zinc-400 text-[11px]">{progress.currentSlug}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-300 transition-all duration-150"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleModalClose}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <Button
              id="btn-confirm-generate-batch"
              type="submit"
              variant="primary"
              size="md"
              disabled={isProcessing}
              isLoading={isProcessing}
              icon={<FileArchive className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {isProcessing ? 'Processando...' : `Gerar ZIP (${quantity} Placas)`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
