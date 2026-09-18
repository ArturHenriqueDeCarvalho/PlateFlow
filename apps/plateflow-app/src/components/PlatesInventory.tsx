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
  Filter,
  Trash2,
  Download,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';
import { PhysicalPlate, DynamicRedirect, PlateTemplate } from '../types';
import { ImageComposerService } from '../services/imageComposerService';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';

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
  onDeletePlate: (id: string) => Promise<void>;
  onBulkDeletePlates: (ids: string[]) => Promise<void>;
}

export const PlatesInventory: React.FC<PlatesInventoryProps> = ({
  plates,
  redirects,
  templates,
  baseUrl,
  onOpenBatchModal,
  onOpenEditRedirect,
  onOpenNfcAssistant,
  onOpenPlatePreview,
  onDeletePlate,
  onBulkDeletePlates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'virgin' | 'paused' | 'nfc_pending'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Selection & bulk actions
  const [selectedPlateIds, setSelectedPlateIds] = useState<Set<string>>(new Set());
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; currentSlug: string } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<
    { type: 'single'; plate: PhysicalPlate } | { type: 'bulk'; count: number } | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getRedirectForPlate = (slug: string): DynamicRedirect | undefined => {
    return redirects.find((r) => r.slug.toLowerCase() === slug.toLowerCase());
  };

  const handleCopyLink = (slug: string) => {
    const url = `${baseUrl.replace(/\/$/, '')}/r/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const toggleSelect = (id: string) => {
    setSelectedPlateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedPlateIds(new Set());
  };

  const handleDownloadSelectedZip = async () => {
    const selected = plates.filter((p) => selectedPlateIds.has(p.id));
    if (!selected.length) return;
    setIsExportingZip(true);
    setExportProgress({ current: 0, total: selected.length, currentSlug: '' });

    try {
      const zipBlob = await ImageComposerService.generateZipForSelectedPlates(
        selected,
        templates,
        baseUrl,
        (current, total, currentSlug) => {
          setExportProgress({ current, total, currentSlug });
        }
      );
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placas_selecionadas_${selected.length}_unidades.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Falha ao exportar ZIP das selecionadas:', err);
      alert(err.message || 'Erro ao gerar arquivo ZIP.');
    } finally {
      setIsExportingZip(false);
      setExportProgress(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmTarget.type === 'single') {
        await onDeletePlate(deleteConfirmTarget.plate.id);
        setSelectedPlateIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteConfirmTarget.plate.id);
          return next;
        });
      } else {
        await onBulkDeletePlates(Array.from(selectedPlateIds));
        setSelectedPlateIds(new Set());
      }
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      alert(err.message || 'Erro ao excluir placa(s).');
    } finally {
      setIsDeleting(false);
    }
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

      {/* Selection Action Bar */}
      {selectedPlateIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-950">
              {selectedPlateIds.size}
            </span>
            <span className="text-xs font-semibold text-zinc-100">
              {selectedPlateIds.size === 1 ? '1 placa selecionada' : `${selectedPlateIds.size} placas selecionadas`}
            </span>
            <span className="text-zinc-600">|</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              Desmarcar todas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={handleDownloadSelectedZip}
              disabled={isExportingZip}
            >
              {isExportingZip ? 'Gerando ZIP...' : `Baixar ZIP (${selectedPlateIds.size})`}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setDeleteConfirmTarget({ type: 'bulk', count: selectedPlateIds.size })}
              disabled={isExportingZip}
            >
              Excluir Selecionadas
            </Button>
          </div>
        </div>
      )}

      {/* Export Progress Bar */}
      {isExportingZip && exportProgress && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
              <span>Gerando pacote ZIP ({exportProgress.current} de {exportProgress.total})...</span>
            </span>
            <span className="font-mono text-zinc-400 text-[11px]">{exportProgress.currentSlug}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-zinc-300 transition-all duration-150"
              style={{
                width: `${exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      )}

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
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedPlateIds.has(plate.id)}
                        onChange={() => toggleSelect(plate.id)}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-zinc-100 accent-zinc-100 cursor-pointer shrink-0"
                        aria-label={`Selecionar placa ${plate.slug}`}
                      />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                      onClick={() => setDeleteConfirmTarget({ type: 'single', plate })}
                      title="Excluir Placa"
                      aria-label="Excluir Placa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
                    <th className="w-10 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={filteredPlates.length > 0 && filteredPlates.every((p) => selectedPlateIds.has(p.id))}
                        onChange={() => {
                          const allSelected = filteredPlates.length > 0 && filteredPlates.every((p) => selectedPlateIds.has(p.id));
                          if (allSelected) {
                            setSelectedPlateIds((prev) => {
                              const next = new Set(prev);
                              filteredPlates.forEach((p) => next.delete(p.id));
                              return next;
                            });
                          } else {
                            setSelectedPlateIds((prev) => {
                              const next = new Set(prev);
                              filteredPlates.forEach((p) => next.add(p.id));
                              return next;
                            });
                          }
                        }}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-zinc-100 accent-zinc-100 cursor-pointer"
                        aria-label="Selecionar todas as placas"
                      />
                    </th>
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
                        <td className="w-10 px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedPlateIds.has(plate.id)}
                            onChange={() => toggleSelect(plate.id)}
                            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-zinc-100 accent-zinc-100 cursor-pointer"
                            aria-label={`Selecionar placa ${plate.slug}`}
                          />
                        </td>

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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                              onClick={() => setDeleteConfirmTarget({ type: 'single', plate })}
                              title="Excluir Placa"
                              aria-label="Excluir Placa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedPlateIds.has(plate.id)}
                        onChange={() => toggleSelect(plate.id)}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-zinc-100 accent-zinc-100 cursor-pointer shrink-0"
                        aria-label={`Selecionar placa ${plate.slug}`}
                      />
                      <div className="min-w-0 flex-1">
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

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                    onClick={() => setDeleteConfirmTarget({ type: 'single', plate })}
                    title="Excluir Placa"
                    aria-label="Excluir Placa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <Modal
          isOpen={true}
          onClose={() => !isDeleting && setDeleteConfirmTarget(null)}
          title={
            deleteConfirmTarget.type === 'single'
              ? `Excluir Placa "${deleteConfirmTarget.plate.slug}"`
              : `Excluir ${deleteConfirmTarget.count} Placas Selecionadas`
          }
          description="Esta ação removerá permanentemente as placas físicas e seus links de redirecionamento correspondentes."
          size="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-zinc-300">
              {deleteConfirmTarget.type === 'single' ? (
                <>
                  Deseja realmente excluir a placa <strong className="text-white font-mono">{deleteConfirmTarget.plate.slug}</strong>? Leituras QR Code e NFC para este endereço deixarão de funcionar.
                </>
              ) : (
                <>
                  Deseja realmente excluir as <strong className="text-white font-semibold">{deleteConfirmTarget.count}</strong> placas selecionadas? Seus links de redirecionamento e dados físicos serão excluídos.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                className="bg-rose-600 hover:bg-rose-500 text-white border-rose-600 cursor-pointer"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
                icon={<Trash2 className="h-4 w-4" />}
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
