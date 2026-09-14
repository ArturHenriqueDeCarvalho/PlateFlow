import React, { useState } from 'react';
import {
  Link as LinkIcon,
  MessageCircle,
  QrCode,
  User,
  Instagram,
  Save,
  CheckCircle2,
  PauseCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { DynamicRedirect, PhysicalPlate, RedirectType, RedirectStatus } from '../types';
import { Modal, Button, Input, Badge } from './ui';

interface EditRedirectModalProps {
  redirect?: DynamicRedirect;
  plate?: PhysicalPlate;
  baseUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRedirect: DynamicRedirect, updatedPlate?: PhysicalPlate) => void;
}

export const EditRedirectModal: React.FC<EditRedirectModalProps> = ({
  redirect,
  plate,
  baseUrl,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !redirect) return null;

  const [type, setType] = useState<RedirectType>(redirect.type || 'url');
  const [status, setStatus] = useState<RedirectStatus>(redirect.status || 'active');
  const [title, setTitle] = useState(redirect.title || '');
  const [destinationUrl, setDestinationUrl] = useState(redirect.destinationUrl || '');
  const [customerNotes, setCustomerNotes] = useState(plate?.customerNotes || '');

  // Form states
  const [waPhone, setWaPhone] = useState(redirect.metadata?.whatsappPhone || '55');
  const [waMsg, setWaMsg] = useState(redirect.metadata?.whatsappMessage || '');
  const [pixKey, setPixKey] = useState(redirect.metadata?.pixKey || '');
  const [pixName, setPixName] = useState(redirect.metadata?.pixName || '');
  const [pixCity, setPixCity] = useState(redirect.metadata?.pixCity || 'BRASIL');
  const [vcardName, setVcardName] = useState(redirect.metadata?.vcardName || '');
  const [vcardPhone, setVcardPhone] = useState(redirect.metadata?.vcardPhone || '');
  const [vcardEmail, setVcardEmail] = useState(redirect.metadata?.vcardEmail || '');
  const [vcardOrg, setVcardOrg] = useState(redirect.metadata?.vcardOrg || '');
  const [vcardRole, setVcardRole] = useState(redirect.metadata?.vcardRole || '');
  const [socialUser, setSocialUser] = useState(redirect.metadata?.socialUsername || '');

  const shortUrl = `${baseUrl.replace(/\/$/, '')}/r/${redirect.slug}`;

  const calculateFinalUrl = (): string => {
    if (type === 'whatsapp') {
      const cleanPhone = waPhone.replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(waMsg);
      return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
    }
    if (type === 'pix') {
      return destinationUrl || pixKey;
    }
    if (type === 'vcard') {
      return destinationUrl || vcardPhone || shortUrl;
    }
    if (type === 'social') {
      const cleanHandle = socialUser.replace(/^@/, '');
      return `https://instagram.com/${cleanHandle}`;
    }
    return destinationUrl;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = calculateFinalUrl();

    const updatedRedirect: DynamicRedirect = {
      ...redirect,
      type,
      status,
      title: title.trim() || `Placa ${redirect.slug}`,
      destinationUrl: finalUrl,
      metadata: {
        whatsappPhone: waPhone,
        whatsappMessage: waMsg,
        pixKey,
        pixName,
        pixCity,
        vcardName,
        vcardPhone,
        vcardEmail,
        vcardOrg,
        vcardRole,
        socialUsername: socialUser
      },
      updatedAt: new Date().toISOString()
    };

    const updatedPlate: PhysicalPlate | undefined = plate
      ? { ...plate, customerNotes }
      : undefined;

    onSave(updatedRedirect, updatedPlate);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Editar Destino</span>
          <Badge variant="neutral" size="sm">
            {redirect.slug}
          </Badge>
        </div>
      }
      description="Configure para onde o cliente será direcionado."
      size="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Status selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Status</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium border transition-colors cursor-pointer ${
                status === 'active'
                  ? 'bg-zinc-800 border-zinc-500 text-zinc-100 font-semibold ring-1 ring-zinc-500'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ativo</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('paused')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium border transition-colors cursor-pointer ${
                status === 'paused'
                  ? 'bg-zinc-800 border-zinc-500 text-zinc-100 font-semibold ring-1 ring-zinc-500'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <PauseCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Pausado</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('virgin')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium border transition-colors cursor-pointer ${
                status === 'virgin'
                  ? 'bg-zinc-800 border-zinc-500 text-zinc-100 font-semibold ring-1 ring-zinc-500'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 text-zinc-400" />
              <span>Virgem</span>
            </button>
          </div>
        </div>

        {/* Type tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Tipo</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {[
              { id: 'url', label: 'Link', icon: LinkIcon },
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
              { id: 'pix', label: 'Pix', icon: QrCode },
              { id: 'vcard', label: 'Contato', icon: User },
              { id: 'social', label: 'Instagram', icon: Instagram }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as RedirectType)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-500 text-zinc-100 font-medium'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate max-w-full">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="input-redirect-title"
            label="Título"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Mesa 01"
          />

          <Input
            id="input-customer-notes"
            label="Identificação Física"
            type="text"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Ex: Salão Principal"
          />
        </div>

        {/* Dynamic field details based on Type */}
        {type === 'url' && (
          <Input
            id="input-dest-url"
            label="URL de Destino"
            type="url"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="https://..."
            required
            rightIcon={
              destinationUrl ? (
                <a
                  href={destinationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-zinc-200"
                  title="Testar link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : undefined
            }
          />
        )}

        {type === 'whatsapp' && (
          <div className="space-y-3 rounded-xl bg-zinc-950 p-3.5 border border-zinc-800">
            <Input
              id="input-wa-phone"
              label="Número (com DDD)"
              type="text"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="5511999998888"
              required
            />

            <Input
              id="input-wa-msg"
              label="Mensagem Pré-preenchida (Opcional)"
              type="text"
              value={waMsg}
              onChange={(e) => setWaMsg(e.target.value)}
              placeholder="Olá! Gostaria de fazer um pedido."
            />
          </div>
        )}

        {type === 'pix' && (
          <div className="space-y-3 rounded-xl bg-zinc-950 p-3.5 border border-zinc-800">
            <Input
              id="input-pix-key"
              label="Chave Pix"
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="pix@empresa.com.br"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="input-pix-name"
                label="Beneficiário"
                type="text"
                value={pixName}
                onChange={(e) => setPixName(e.target.value)}
                placeholder="Nome da Empresa"
              />

              <Input
                id="input-pix-city"
                label="Cidade"
                type="text"
                value={pixCity}
                onChange={(e) => setPixCity(e.target.value)}
                placeholder="RECIFE"
              />
            </div>
          </div>
        )}

        {type === 'vcard' && (
          <div className="space-y-3 rounded-xl bg-zinc-950 p-3.5 border border-zinc-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="input-vcard-name"
                label="Nome"
                type="text"
                value={vcardName}
                onChange={(e) => setVcardName(e.target.value)}
                placeholder="Artur Carvalho"
                required
              />
              <Input
                id="input-vcard-phone"
                label="Telefone"
                type="text"
                value={vcardPhone}
                onChange={(e) => setVcardPhone(e.target.value)}
                placeholder="+55 81 99999-8888"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="input-vcard-org"
                label="Empresa"
                type="text"
                value={vcardOrg}
                onChange={(e) => setVcardOrg(e.target.value)}
                placeholder="Minha Empresa"
              />
              <Input
                id="input-vcard-email"
                label="E-mail"
                type="email"
                value={vcardEmail}
                onChange={(e) => setVcardEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
              />
            </div>
          </div>
        )}

        {type === 'social' && (
          <div className="rounded-xl bg-zinc-950 p-3.5 border border-zinc-800">
            <Input
              id="input-social-user"
              label="Usuário do Instagram"
              type="text"
              value={socialUser}
              onChange={(e) => setSocialUser(e.target.value)}
              placeholder="perfil"
              required
            />
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>

          <Button
            id="btn-save-redirect"
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
