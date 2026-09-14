import React, { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { PhysicalPlate, PlateTemplate, DynamicRedirect } from '../types';
import { ImageComposerService } from '../services/imageComposerService';
import { Modal, Button, Badge } from './ui';

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
  baseUrl,
  isOpen,
  onClose,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Arte da Placa</span>
          <Badge variant="neutral" size="sm">
            {plate.slug}
          </Badge>
        </div>
      }
      description={template?.name}
      size="sm"
    >
      <div className="space-y-4 text-center">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin mb-2 text-zinc-400" />
            <p className="text-xs">Gerando imagem...</p>
          </div>
        ) : dataUrl ? (
          <div className="space-y-4">
            <div className="relative mx-auto max-w-[240px] rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 shadow-sm">
              <img
                src={dataUrl}
                alt={`Arte ${plate.slug}`}
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>

              <a
                href={dataUrl}
                download={`arte_${plate.slug}.png`}
                className="flex-1"
              >
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={<Download className="h-4 w-4" />}
                >
                  Baixar PNG
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <p className="text-xs text-rose-400 py-6">Erro ao gerar pré-visualização.</p>
        )}
      </div>
    </Modal>
  );
};
