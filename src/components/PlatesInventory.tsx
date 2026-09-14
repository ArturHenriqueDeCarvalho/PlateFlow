import React, { useState } from 'react';
import {
  Search,
  Filter,
  Radio,
  ExternalLink,
  Edit3,
  Eye,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Plus,
  ArrowUpRight,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  LayoutGrid,
  List
} from 'lucide-react';
import { PhysicalPlate, DynamicRedirect, PlateTemplate } from '../types';

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
  templates,
  baseUrl,
  onOpenBatchModal,
  onOpenEditRedirect,
  onOpenNfcAssistant,
  onOpenPlatePreview,
  onTestRedirect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'virgin' | 'paused' | 'nfc_pending'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const getRedirectForPlate = (slug: string): DynamicRedirect | undefined => {
    return redirects.find(r => r.slug.toLowerCase() === slug.toLowerCase());
  };

  const getTemplateForPlate = (templateId: string): PlateTemplate | undefined => {
    return templates.find(t => t.id === templateId) || templates[0];
  };

  const handleCopyLink = (slug: string) => {
    const url = `${baseUrl.replace(/\/$/, '')}/r/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Filtering
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
    <div className="space-y-5">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Inventário de Placas &amp; Rastreamento NFC</span>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 font-mono">
              {plates.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie o destino de cada placa, verifique o status de gravação no chip NFC e visualize as métricas.
          </p>
        </div>

        <button
          id="btn-open-batch-from-inv"
          onClick={onOpenBatchModal}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Lote de Placas</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="input-search-plates"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por slug, mesa, cliente, lote..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills & View Mode Toggle */}
        <div className="flex items-center justify-between gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Todas ({plates.length})
            </button>

            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-emerald-400'
              }`}
            >
              Ativas
            </button>

            <button
              onClick={() => setFilterStatus('virgin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === 'virgin'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Virgens
            </button>

            <button
              onClick={() => setFilterStatus('nfc_pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === 'nfc_pending'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-cyan-400'
              }`}
            >
              Pendente NFC ({plates.filter(p => !p.nfcWritten).length})
            </button>
          </div>

          {/* Grid vs Table Switcher */}
          <div className="hidden sm:flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Grade de Cards"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Tabela Compacta"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content: Empty State, Table View or Grid View */}
      {filteredPlates.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400 space-y-3">
          <Filter className="h-8 w-8 mx-auto text-slate-500 opacity-60" />
          <p className="text-sm font-medium text-slate-300">Nenhuma placa encontrada</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente buscar com outro termo ou gere um novo lote de placas para abastecer o inventário.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Identificador (Slug)</th>
                  <th className="py-3 px-4 font-semibold">Identificação / Mesa</th>
                  <th className="py-3 px-4 font-semibold">Destino Atual</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Tag NFC</th>
                  <th className="py-3 px-4 font-semibold text-center">Leituras</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPlates.map((plate) => {
                  const redirect = getRedirectForPlate(plate.slug);
                  const isVirgin = redirect?.status === 'virgin' || !redirect?.destinationUrl;
                  const isPaused = redirect?.status === 'paused';
                  const isActive = redirect?.status === 'active' && !isVirgin;

                  return (
                    <tr key={plate.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                          <span>{plate.slug}</span>
                          <button
                            onClick={() => handleCopyLink(plate.slug)}
                            title="Copiar link curto"
                            className="text-slate-500 hover:text-white"
                          >
                            {copiedSlug === plate.slug ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {plate.customerNotes || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-mono text-[11px]">
                        {redirect?.destinationUrl || (
                          <span className="text-amber-400/80 italic">Aguardando ativação</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Ativo
                          </span>
                        )}
                        {isVirgin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                            <AlertCircle className="h-3 w-3 text-slate-400" /> Virgem
                          </span>
                        )}
                        {isPaused && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                            <PauseCircle className="h-3 w-3" /> Pausado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {plate.nfcWritten ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> Gravada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-semibold">
                            <Radio className="h-3 w-3 animate-pulse" /> Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">
                        {redirect?.clicks || 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => redirect && onOpenEditRedirect(redirect, plate)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onOpenNfcAssistant(plate)}
                            className="p-1.5 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900/40"
                            title="Gravação NFC no iPhone"
                          >
                            <Radio className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenPlatePreview(plate)}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                            title="Ver arte"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onTestRedirect(plate.slug)}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-cyan-400 hover:text-white"
                            title="Testar scan"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlates.map((plate) => {
            const redirect = getRedirectForPlate(plate.slug);
            const isVirgin = redirect?.status === 'virgin' || !redirect?.destinationUrl;
            const isPaused = redirect?.status === 'paused';
            const isActive = redirect?.status === 'active' && !isVirgin;

            return (
              <div
                key={plate.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 hover:border-slate-700 transition-all shadow-md group"
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {plate.slug}
                        </span>
                        <button
                          onClick={() => handleCopyLink(plate.slug)}
                          title="Copiar URL Curta"
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                        >
                          {copiedSlug === plate.slug ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] mt-0.5">
                        {plate.customerNotes || 'Sem anotação'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Ativo
                        </span>
                      )}
                      {isVirgin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                          <AlertCircle className="h-3 w-3 text-slate-400" /> Virgem
                        </span>
                      )}
                      {isPaused && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          <PauseCircle className="h-3 w-3" /> Pausado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Destination Preview Box */}
                  <div className="mt-3 rounded-xl bg-slate-950 p-2.5 border border-slate-800/80 text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                      Destino Atual:
                    </span>
                    {redirect?.destinationUrl ? (
                      <p className="text-slate-300 font-mono text-[11px] truncate mt-0.5 flex items-center gap-1">
                        <span className="truncate">{redirect.destinationUrl}</span>
                      </p>
                    ) : (
                      <p className="text-amber-400/80 text-[11px] italic mt-0.5">
                        Não configurado (Aguardando cliente)
                      </p>
                    )}
                  </div>

                  {/* Sub-info: Batch, Template & NFC */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Lote:</span>
                      <span className="font-mono text-slate-300">{plate.batchIdentifier}</span>
                    </div>

                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-slate-500">Leituras:</span>
                      <span className="font-bold text-cyan-400">{redirect?.clicks || 0}</span>
                    </div>
                  </div>

                  {/* NFC Chip Status */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Tag NFC Física:</span>
                    </span>
                    {plate.nfcWritten ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Gravada
                      </span>
                    ) : (
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        <Radio className="h-3.5 w-3.5 animate-pulse" /> Pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    id={`btn-edit-dest-${plate.slug}`}
                    onClick={() => redirect && onOpenEditRedirect(redirect, plate)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 py-2 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Destino</span>
                  </button>

                  <button
                    id={`btn-nfc-modal-${plate.slug}`}
                    onClick={() => onOpenNfcAssistant(plate)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800/40 px-3 py-2 text-xs font-semibold transition-all cursor-pointer"
                    title="Assistente de Gravação NFC no iPhone"
                  >
                    <Radio className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">NFC</span>
                  </button>

                  <button
                    onClick={() => onOpenPlatePreview(plate)}
                    className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Ver arte composta"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onTestRedirect(plate.slug)}
                    className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-cyan-400 hover:bg-slate-700 transition-colors"
                    title="Testar Redirecionamento"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
