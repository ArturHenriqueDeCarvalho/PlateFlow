import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  QrCode,
  MessageCircle,
  Copy,
  Check,
  Radio,
  AlertCircle
} from 'lucide-react';
import { DynamicRedirect, PhysicalPlate } from '../types';
import { Modal, Button, Select } from './ui';

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
  isOpen,
  onClose,
  onRecordScan,
}) => {
  if (!isOpen) return null;

  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialSlug || redirects[0]?.slug || 'mesa-01'
  );
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (initialSlug) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug]);

  useEffect(() => {
    if (selectedSlug) {
      onRecordScan(selectedSlug);
    }
  }, [selectedSlug]);

  const activeRedirect = redirects.find(
    (r) => r.slug.toLowerCase() === selectedSlug.toLowerCase()
  );

  const handleCopyPix = () => {
    if (activeRedirect?.metadata?.pixKey) {
      navigator.clipboard.writeText(activeRedirect.metadata.pixKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador de Leitura"
      description="Experiência do cliente ao ler o QR Code ou aproximar o celular."
      size="sm"
    >
      <div className="space-y-4">
        {/* Quick Slug Switcher */}
        <Select
          id="select-sim-slug"
          label="Placa em Teste"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          options={redirects.map((r) => ({
            value: r.slug,
            label: `${r.slug} — ${r.title}`
          }))}
        />

        {/* Client Device View */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
          {!activeRedirect ? (
            <div className="py-6 space-y-2">
              <AlertCircle className="h-6 w-6 mx-auto text-amber-400" />
              <p className="text-xs text-zinc-400">Placa não encontrada.</p>
            </div>
          ) : activeRedirect.status === 'virgin' || !activeRedirect.destinationUrl ? (
            <div className="py-6 space-y-2.5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">Pronta para Ativação</h3>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                Aguardando configuração de destino pelo painel.
              </p>
            </div>
          ) : activeRedirect.status === 'paused' ? (
            <div className="py-6 space-y-2.5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">Destino Pausado</h3>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                O direcionamento desta placa está temporariamente suspenso.
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {activeRedirect.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono break-all px-1">
                  {activeRedirect.destinationUrl}
                </p>
              </div>

              {activeRedirect.type === 'whatsapp' && (
                <div className="rounded-lg bg-zinc-900 p-2.5 text-xs text-zinc-300">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 font-medium mb-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 italic">
                    "{activeRedirect.metadata?.whatsappMessage || 'Olá!'}"
                  </p>
                </div>
              )}

              {activeRedirect.type === 'pix' && (
                <div className="rounded-lg bg-zinc-900 p-2.5 text-xs text-zinc-300 space-y-2">
                  <p className="font-mono text-zinc-200 text-xs bg-zinc-950 p-2 rounded border border-zinc-800 select-all">
                    {activeRedirect.metadata?.pixKey}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mx-auto"
                    onClick={handleCopyPix}
                    icon={copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  >
                    {copiedKey ? 'Copiado' : 'Copiar Chave'}
                  </Button>
                </div>
              )}

              <a
                href={activeRedirect.destinationUrl}
                target="_blank"
                rel="noreferrer"
                className="block pt-1"
              >
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={<ExternalLink className="h-4 w-4" />}
                >
                  Abrir Destino Real
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
