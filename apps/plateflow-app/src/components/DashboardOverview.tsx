import React from 'react';
import {
  TrendingUp,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { PlateTemplate, PhysicalPlate, DynamicRedirect, AnalyticsLog } from '../types';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

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
  analytics,
  onOpenBatchModal,
}) => {
  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Header */}
      <PageHeader
        title="Visão Geral"
        description="Métricas operacionais e leituras em tempo real."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={onOpenBatchModal}
          >
            Novo Lote
          </Button>
        }
      />

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Total de Leituras</span>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-zinc-50">
              {stats.totalClicks}
            </span>
          </div>
        </div>

        {/* Active Plates */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Placas Ativas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-zinc-50">
              {stats.activeRedirects}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              / {stats.totalPlates}
            </span>
          </div>
        </div>

        {/* Virgin Plates */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Placas Disponíveis</span>
            <AlertCircle className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-zinc-50">
              {stats.virginRedirects}
            </span>
          </div>
        </div>

        {/* NFC Rate */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Gravação NFC</span>
            <Smartphone className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-zinc-50">
              {stats.nfcRate}%
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({stats.nfcWrittenCount}/{stats.totalPlates})
            </span>
          </div>
        </div>
      </div>

      {/* Recent Telemetry Activity */}
      <Card
        title="Últimas Leituras"
        description="Acessos registrados via QR Code e NFC em tempo real"
      >
        {analytics.length === 0 ? (
          <EmptyState
            title="Nenhuma leitura registrada"
            description="Os acessos dos clientes aparecerão aqui conforme as placas forem escaneadas."
          />
        ) : (
          <>
            {/* Mobile Activity List (< sm) */}
            <div className="sm:hidden divide-y divide-zinc-800 -mx-4 -my-4">
              {analytics.slice(0, 8).map((log) => {
                const date = new Date(log.timestamp);
                const timeStr = date.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateStr = date.toLocaleDateString('pt-BR');

                const isIos = (log.device || log.deviceType || '').includes('iOS');
                const isAndroid = (log.device || log.deviceType || '').includes('Android');

                return (
                  <div key={log.id} className="p-3.5 flex items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-semibold text-zinc-100 text-xs truncate">
                        {log.slug || log.redirectSlug}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {dateStr} às {timeStr}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Badge
                        variant={isIos ? 'info' : isAndroid ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {log.device || log.deviceType || 'Navegador'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Activity Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto -mx-5 -my-5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-950 text-zinc-200">
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200">Placa</th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200">Dispositivo</th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-zinc-200 text-right">Data e Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                  {analytics.slice(0, 8).map((log) => {
                    const date = new Date(log.timestamp);
                    const timeStr = date.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const dateStr = date.toLocaleDateString('pt-BR');

                    const isIos = (log.device || log.deviceType || '').includes('iOS');
                    const isAndroid = (log.device || log.deviceType || '').includes('Android');

                    return (
                      <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-semibold text-zinc-100 text-xs">
                          {log.slug || log.redirectSlug}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={isIos ? 'info' : isAndroid ? 'success' : 'neutral'}
                            size="sm"
                          >
                            {log.device || log.deviceType || 'Navegador'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300 font-mono text-xs text-right">
                          {dateStr} às {timeStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
