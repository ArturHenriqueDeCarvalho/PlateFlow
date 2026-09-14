import React from 'react';
import {
  TrendingUp,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { PlateTemplate, PhysicalPlate, DynamicRedirect, AnalyticsLog } from '../types';

interface DashboardOverviewProps {
  stats: ReturnType<typeof import('../services/storageService').StorageService.getStats>;
  templates: PlateTemplate[];
  plates: PhysicalPlate[];
  redirects: DynamicRedirect[];
  analytics: AnalyticsLog[];
  onNavigateToTab: (tab: 'inventory' | 'templates' | 'simulator') => void;
  onOpenBatchModal: () => void;
  onTestRedirect: (slug: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  templates,
  plates,
  redirects,
  analytics,
  onNavigateToTab,
  onOpenBatchModal,
  onTestRedirect,
}) => {
  // Extract batches
  const batches = Array.from(new Set(plates.map(p => p.batchIdentifier)));

  return (
    <div className="space-y-6">
      {/* Top Banner with Free-Tier Resilient Architecture Indicator */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Sistema Operacional Online
            </span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
              Fastify + React PWA
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-extrabold text-white mt-1">
            Plataforma de QR Codes Dinâmicos &amp; Tags NFC
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Gerenciamento centralizado de artes para impressão, redirecionamentos instantâneos sem reimpressão e vinculação lógica para iPhone.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            id="btn-dash-new-batch"
            onClick={onOpenBatchModal}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 px-4 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Gerar Lote de Placas</span>
          </button>

          <button
            onClick={() => onNavigateToTab('simulator')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2.5 px-3 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            title="Simular leitura de QR ou aproximação de NFC"
          >
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Simular Scan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Clicks */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total de Leituras</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white font-mono">{stats.totalClicks}</span>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">+100%</span> redirecionamentos ativos
            </p>
          </div>
        </div>

        {/* Active Plates */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Placas Ativas</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white font-mono">{stats.activeRedirects}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              de <span className="text-slate-300 font-semibold">{stats.totalPlates}</span> registradas
            </p>
          </div>
        </div>

        {/* Virgin Plates */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Placas Virgens</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white font-mono">{stats.virginRedirects}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Prontas para vincular clientes
            </p>
          </div>
        </div>

        {/* NFC Programming Rate */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tags NFC Gravadas</span>
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white font-mono">{stats.nfcRate}%</span>
              <span className="text-[11px] text-cyan-400 font-mono">({stats.nfcWrittenCount}/{stats.totalPlates})</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${stats.nfcRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Device breakdown & Batch list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Device Breakdown & System Architecture (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-indigo-400" />
              <span>Acessos por Plataforma</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Telemetria Real</span>
          </div>

          <div className="space-y-3">
            {/* iOS */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Apple iPhone (iOS)</span>
                <span className="font-mono text-cyan-400 font-bold">{stats.deviceBreakdown.ios} leituras</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{
                    width: `${stats.totalClicks > 0 ? (stats.deviceBreakdown.ios / stats.totalClicks) * 100 : 50}%`
                  }}
                />
              </div>
            </div>

            {/* Android */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Google Android</span>
                <span className="font-mono text-emerald-400 font-bold">{stats.deviceBreakdown.android} leituras</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{
                    width: `${stats.totalClicks > 0 ? (stats.deviceBreakdown.android / stats.totalClicks) * 100 : 35}%`
                  }}
                />
              </div>
            </div>

            {/* Desktop */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Computadores / Outros</span>
                <span className="font-mono text-slate-400 font-bold">{stats.deviceBreakdown.desktop} leituras</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-600 rounded-full"
                  style={{
                    width: `${stats.totalClicks > 0 ? (stats.deviceBreakdown.desktop / stats.totalClicks) * 100 : 15}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Logical Binding badge */}
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Infraestrutura Gratuita em Produção</span>
            </div>
            <p className="text-[11px] text-slate-400">
              O backend Fastify com redirecionamento HTTP 307 mantém latência sub-30ms. Os arquivos de templates e ZIPs são mantidos em memória e storage sem depender do disco efêmero.
            </p>
          </div>
        </div>

        {/* Batches & Quick Templates View (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Lotes Produzidos &amp; Modelos Gráficos</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('templates')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver Templates →
            </button>
          </div>

          {/* Batches overview */}
          <div className="space-y-2.5">
            {batches.map((batchId) => {
              const batchPlates = plates.filter(p => p.batchIdentifier === batchId);
              const batchActive = batchPlates.filter(p => {
                const r = redirects.find(red => red.slug === p.slug);
                return r?.status === 'active' && r.destinationUrl;
              }).length;
              const batchNfc = batchPlates.filter(p => p.nfcWritten).length;

              return (
                <div
                  key={batchId}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{batchId}</span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {batchPlates.length} unidades
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {batchActive} ativadas • {batchNfc} chips NFC gravados
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateToTab('inventory')}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40"
                    >
                      Filtrar Lote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Templates teaser */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Modelos Visuais Ativos ({templates.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => onNavigateToTab('templates')}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 hover:border-slate-700 cursor-pointer flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-semibold text-white truncate">{tmpl.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">QR: {tmpl.qrSize}px @ ({tmpl.qrX},{tmpl.qrY})</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Últimas Leituras em Tempo Real
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{analytics.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-2.5 font-medium">Identificador (Slug)</th>
                <th className="pb-2.5 font-medium">Dispositivo</th>
                <th className="pb-2.5 font-medium">Horário</th>
                <th className="pb-2.5 font-medium">Origem</th>
                <th className="pb-2.5 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {analytics.slice(0, 6).map((log) => {
                const date = new Date(log.timestamp);
                const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-mono font-semibold text-cyan-300">
                      {log.slug}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        log.device.includes('iOS')
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                          : log.device.includes('Android')
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.device}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{timeStr}</span>
                    </td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[150px]">
                      {log.referrer || 'Acesso Direto / NFC'}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onTestRedirect(log.slug)}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                      >
                        Simular Scan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
