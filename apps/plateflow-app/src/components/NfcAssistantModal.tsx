import React, { useState } from 'react';
import {
  Copy,
  Check,
  Radio,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PhysicalPlate, DynamicRedirect } from '../types';
import { Modal, Button, Badge } from './ui';

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
  baseUrl,
  isOpen,
  onClose,
  onMarkWritten,
}) => {
  const [copied, setCopied] = useState(false);
  const [isWritten, setIsWritten] = useState(plate.nfcWritten);
  const [webNfcStatus, setWebNfcStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
  const [webNfcMsg, setWebNfcMsg] = useState<string>('');

  if (!isOpen) return null;

  const hasWebNfc = typeof window !== 'undefined' && 'NDEFReader' in window;
  const shortUrl = `${baseUrl.replace(/\/$/, '')}/r/${plate.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shortUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleWritten = (checked: boolean) => {
    setIsWritten(checked);
    onMarkWritten(plate.id, checked);
  };

  const handleWebNfcWrite = async () => {
    if (!hasWebNfc) return;

    setWebNfcStatus('writing');
    setWebNfcMsg('Aproxime a tag NFC da traseira do aparelho...');

    try {
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.write({
        records: [{ recordType: 'url', data: shortUrl }],
      });

      setWebNfcStatus('success');
      setWebNfcMsg('Tag gravada com sucesso!');
      setIsWritten(true);
      onMarkWritten(plate.id, true);

      setTimeout(() => {
        setWebNfcStatus('idle');
      }, 3000);
    } catch (err: any) {
      console.error('Web NFC write error:', err);
      setWebNfcStatus('error');
      setWebNfcMsg(err?.message || 'Falha na gravação NFC.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Gravação NFC</span>
          <Badge variant="neutral" size="sm">
            {plate.slug}
          </Badge>
        </div>
      }
      description="Grave a URL da placa no chip físico."
      size="md"
    >
      <div className="space-y-4">
        {/* Web NFC 1-Touch Button for Android / Chrome */}
        {hasWebNfc && (
          <div className="space-y-2">
            <Button
              id="btn-web-nfc-write"
              type="button"
              variant="primary"
              size="md"
              className="w-full"
              disabled={webNfcStatus === 'writing'}
              onClick={handleWebNfcWrite}
              icon={
                webNfcStatus === 'writing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : webNfcStatus === 'success' ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Radio className="h-4 w-4" />
                )
              }
            >
              {webNfcStatus === 'writing'
                ? 'Aproxime a tag...'
                : webNfcStatus === 'success'
                ? 'Gravada com Sucesso!'
                : 'Gravar Tag NFC (1 Toque)'}
            </Button>

            {webNfcMsg && (
              <p
                className={`text-xs text-center font-medium ${
                  webNfcStatus === 'error'
                    ? 'text-rose-400'
                    : webNfcStatus === 'success'
                    ? 'text-emerald-400'
                    : 'text-zinc-400'
                }`}
              >
                {webNfcMsg}
              </p>
            )}
          </div>
        )}

        {/* Copy Short URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">
            URL Fixa para o Chip
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 p-1.5">
            <span className="flex-1 min-w-0 font-mono text-xs text-zinc-200 truncate px-2 select-all">
              {shortUrl}
            </span>
            <Button
              id="btn-copy-short-url"
              type="button"
              variant={copied ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
              icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            >
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </div>

        {/* Written Confirmation Toggle */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className={`h-4 w-4 ${isWritten ? 'text-emerald-400' : 'text-zinc-600'}`}
            />
            <span className="text-xs text-zinc-300">
              {isWritten ? 'Tag física gravada' : 'Aguardando gravação física'}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="toggle-nfc-written"
              type="checkbox"
              checked={isWritten}
              onChange={(e) => handleToggleWritten(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-100 peer-checked:after:bg-zinc-900"></div>
          </label>
        </div>

        {/* Footer */}
        <div className="pt-2 flex flex-col sm:flex-row sm:justify-end">
          <Button
            id="btn-close-nfc-modal"
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
