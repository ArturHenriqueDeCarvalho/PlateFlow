import React, { useState } from 'react';
import {
  Search,
  Radio,
  Eye,
  Plus,
  Copy,
  Check,
  LayoutGrid,
  List,
  Filter
} from 'lucide-react';
import { PhysicalPlate, DynamicRedirect, PlateTemplate } from '../types';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

interface PlatesInventoryProps {
  plates: PhysicalPlate[];
  redirects: DynamicRedirect[];
  templates: PlateTemplate[];
  baseUrl: string;
  onOpenBatchModal: () => void;
  onOpenEditRedirect: (redirect: DynamicRedirect, plate: PhysicalPlate) => void;
  onOpenNfcAssistant: (plate: PhysicalPlate) => void;
  onOpenPlatePreview: (plate: PhysicalPlate) => void;
  onTestRedirect: (slug: string) => void;
}

export const PlatesInventory: React.FC<PlatesInventoryProps> = ({
  plates,
  redirects,
  baseUrl,
  onOpenBatchModal,
  onOpenEditRedirect,
  onOpenNfcAssistant,
  onOpenPlatePreview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'virgin' | 'paused' | 'nfc_pending'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const getRedirectForPlate = (slug: string): DynamicRedirect | undefined => {
    return redirects.find((r) => r.slug.toLowerCase() === slug.toLowerCase());
  };

  const handleCopyLink = (slug: string) => {
    const url = `${baseUrl.replace(/\/$/, '')}/r/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filteredPlates = plates.filter((plate) => {
    const redirect = getRedirectForPlate(plate.slug);
    const matchesSearch =
      plate.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plate.customerNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (redirect?.destinationUrl || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (redirect?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      plate.batchIdentifier.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'nfc_pending') return !plate.nfcWritten;
    if (filterStatus === 'active') return redirect?.status === 'active';
    if (filterStatus === 'virgin') return redirect?.status === 'virgin' || !redirect?.destinationUrl;
    if (filterStatus === 'paused') return redirect?.status === 'paused';

    return true;
  });

  return (
    <div className="space-y-5 text-zinc-100">
      {/* Top Header */}
      <PageHeader
        title="Inventário de Placas"
        description="Gerenciamento de identificadores, destinos e gravação física."
        badge={
          <Badge variant="neutral" size="sm">
            {plates.length} placas
          </Badge>
        }
        actions={
          <Button
            id="btn-open-batch-from-inv"
            onClick={onOpenBatchModal}
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Novo Lote
          </Button>
        }
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            id="input-search-plates"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar placas..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-900 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 sm:flex-none text-center px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`flex-1 sm:flex-none text-center px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === 'active'
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setFilterStatus('virgin')}
              className={`flex-1 sm:flex-none text-center px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === 'virgin'
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Virgens
            </button>
            <button
              onClick={() => setFilterStatus('nfc_pending')}
              className={`flex-1 sm:flex-none text-center px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === 'nfc_pending'
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Pendente NFC
            </button>
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-1 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tabela"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Grade"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredPlates.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-5 w-5" />}
          title="Nenhuma placa encontrada"
          description="Tente ajustar os termos de busca ou filtros selecionados."
          action={
            searchTerm || filterStatus !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                Limpar Filtros
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'table' ? (
        <>
          {/* Mobile Plate Cards (< md) */}
          <div className="md:hidden space-y-3">
            {filteredPlates.map((plate) => {
              const redirect = getRedirectForPlate(plate.slug);
              const isVirgin = redirect?.status === 'virgin' || !redirect?.destinationUrl;
              const isPaused = redirect?.status === 'paused';
              const isActive = redirect?.status === 'active' && !isVirgin;

              return (
                <div
                  key={plate.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3 shadow-xs"
                >
                  {/* Identifier & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-zinc-50 text-sm">
                          {plate.slug}
                        </span>
                        <button
                          onClick={() => handleCopyLink(plate.slug)}
                          title="Copiar Link"
                          className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5"
                        >
                          {copiedSlug === plate.slug ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      {plate.customerNotes && (
                        <p className="text-xs text-zinc-300 mt-0.5 font-medium truncate">
                          {plate.customerNotes}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isActive && <Badge variant="success" size="sm">Ativo</Badge>}
                      {isVirgin && <Badge variant="neutral" size="sm">Virgem</Badge>}
                      {isPaused && <Badge variant="warning" size="sm">Pausado</Badge>}
                    </div>
                  </div>

                  {/* Destination URL */}
                  <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800/80">
                    <p className="text-xs font-mono text-zinc-200 truncate">
                      {redirect?.destinationUrl ? (
                        <span>{redirect.destinationUrl}</span>
                      ) : (
                        <span className="text-zinc-400 italic font-sans">Sem destino</span>
                      )}
                    </p>
                  </div>

                  {/* Info: NFC & Clicks */}
                  <div className="flex items-center justify-between text-xs text-zinc-300 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">NFC:</span>
                      {plate.nfcWritten ? (
                        <span className="text-zinc-200 font-medium">Gravada</span>
                      ) : (
                        <span className="text-zinc-400">Pendente</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-zinc-400 font-sans">Leituras:</span>
                      <span className="font-semibold text-zinc-100">{redirect?.clicks || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => redirect && onOpenEditRedirect(redirect, plate)}
                    >
                      Editar Destino
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenNfcAssistant(plate)}
                      title="Gravar NFC"
                      aria-label="Gravar NFC"
                    >
                      <Radio className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenPlatePreview(plate)}
                      title="Arte da Placa"
                      aria-label="Ver Arte"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* High Contrast Desktop Table View (>= md) */}
          <div className="hidden md:block rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-950 text-zinc-200">
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200">Placa</th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200">Destino</th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200">Status</th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200">NFC</th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200 text-center">Leituras</th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                  {filteredPlates.map((plate) => {
                    const redirect = getRedirectForPlate(plate.slug);
                    const isVirgin = redirect?.status === 'virgin' || !redirect?.destinationUrl;
                    const isPaused = redirect?.status === 'paused';
                    const isActive = redirect?.status === 'active' && !isVirgin;

                    return (
                      <tr key={plate.id} className="hover:bg-zinc-800/40 transition-colors">
                        {/* Plate identifier + note */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-zinc-50 text-xs">
                              {plate.slug}
                            </span>
                            <button
                              onClick={() => handleCopyLink(plate.slug)}
                              title="Copiar Link"
                              className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5"
                            >
                              {copiedSlug === plate.slug ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          {plate.customerNotes && (
                            <p className="text-[11px] text-zinc-300 mt-0.5 font-medium">
                              {plate.customerNotes}
                            </p>
                          )}
                        </td>

                        {/* Destination */}
                        <td className="px-5 py-3.5 max-w-xs truncate font-mono text-xs text-zinc-200">
                          {redirect?.destinationUrl ? (
                            <span>{redirect.destinationUrl}</span>
                          ) : (
                            <span className="text-zinc-400 italic font-sans">Sem destino</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          {isActive && <Badge variant="success" size="sm">Ativo</Badge>}
                          {isVirgin && <Badge variant="neutral" size="sm">Virgem</Badge>}
                          {isPaused && <Badge variant="warning" size="sm">Pausado</Badge>}
                        </td>

                        {/* NFC Status */}
                        <td className="px-5 py-3.5">
                          {plate.nfcWritten ? (
                            <span className="text-xs text-zinc-200 font-medium">Gravada</span>
                          ) : (
                            <span className="text-xs text-zinc-400">Pendente</span>
                          )}
                        </td>

                        {/* Click Count */}
                        <td className="px-5 py-3.5 text-center font-mono text-zinc-100 font-semibold text-xs">
                          {redirect?.clicks || 0}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => redirect && onOpenEditRedirect(redirect, plate)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenNfcAssistant(plate)}
                              title="Gravar NFC"
                            >
                              <Radio className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenPlatePreview(plate)}
                              title="Arte da Placa"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* High Contrast Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlates.map((plate) => {
            const redirect = getRedirectForPlate(plate.slug);
            const isVirgin = redirect?.status === 'virgin' || !redirect?.destinationUrl;
            const isPaused = redirect?.status === 'paused';
            const isActive = redirect?.status === 'active' && !isVirgin;

            return (
              <div
                key={plate.id}
                className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-semibold text-zinc-50">
                          {plate.slug}
                        </span>
                        <button
                          onClick={() => handleCopyLink(plate.slug)}
                          title="Copiar Link"
                          className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          {copiedSlug === plate.slug ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      {plate.customerNotes && (
                        <p className="text-xs text-zinc-300 font-medium mt-0.5">
                          {plate.customerNotes}
                        </p>
                      )}
                    </div>

                    <div>
                      {isActive && <Badge variant="success" size="sm">Ativo</Badge>}
                      {isVirgin && <Badge variant="neutral" size="sm">Virgem</Badge>}
                      {isPaused && <Badge variant="warning" size="sm">Pausado</Badge>}
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="mt-3 py-1">
                    <p className="text-xs text-zinc-200 font-mono truncate">
                      {redirect?.destinationUrl || (
                        <span className="text-zinc-400 italic font-sans">Sem destino configurado</span>
                      )}
                    </p>
                  </div>

                  {/* Info row */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
                    <span>
                      NFC: <strong className="font-medium text-zinc-100">{plate.nfcWritten ? 'Gravada' : 'Pendente'}</strong>
                    </span>
                    <span className="font-mono font-semibold text-zinc-100">
                      {redirect?.clicks || 0} leituras
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => redirect && onOpenEditRedirect(redirect, plate)}
                  >
                    Editar Destino
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenNfcAssistant(plate)}
                    title="Gravar NFC"
                  >
                    <Radio className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenPlatePreview(plate)}
                    title="Arte da Placa"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
