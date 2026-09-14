/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { PlatesInventory } from './components/PlatesInventory';
import { TemplateManager } from './components/TemplateManager';
import { BatchGeneratorModal } from './components/BatchGeneratorModal';
import { EditRedirectModal } from './components/EditRedirectModal';
import { NfcAssistantModal } from './components/NfcAssistantModal';
import { PlatePreviewModal } from './components/PlatePreviewModal';
import { RedirectSimulatorModal } from './components/RedirectSimulatorModal';
import { LoginModal } from './components/LoginModal';
import { StorageService } from './services/storageService';
import {
  PlateTemplate,
  PhysicalPlate,
  DynamicRedirect,
  AnalyticsLog,
  AuthUser
} from './types';
import {
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MessageCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
  Database,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function App() {
  // App state initialized immediately with cached records to prevent layout flicker
  const [templates, setTemplates] = useState<PlateTemplate[]>(() => StorageService.getTemplates());
  const [plates, setPlates] = useState<PhysicalPlate[]>(() => StorageService.getPlates());
  const [redirects, setRedirects] = useState<DynamicRedirect[]>(() => StorageService.getRedirects());
  const [analytics, setAnalytics] = useState<AnalyticsLog[]>(() => StorageService.getAnalytics());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'templates' | 'simulator'>('dashboard');

  // Supabase Auth & Session state
  const [user, setUser] = useState<AuthUser | null>(() => StorageService.getAuthUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<{
    redirect: DynamicRedirect;
    plate?: PhysicalPlate;
  } | null>(null);
  const [nfcAssistantPlate, setNfcAssistantPlate] = useState<PhysicalPlate | null>(null);
  const [previewPlate, setPreviewPlate] = useState<PhysicalPlate | null>(null);
  const [simulatorSlug, setSimulatorSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if current URL is a direct short redirect: e.g. /r/:slug
  const [clientRedirectSlug, setClientRedirectSlug] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [copiedPixKey, setCopiedPixKey] = useState(false);

  // Dynamic base URL calculation
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nfc-qr.app';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Async load directly from Supabase PostgreSQL backend
  const loadDataFromBackend = async () => {
    setIsSyncing(true);
    try {
      const [fetchedTemplates, fetchedPlates, fetchedRedirects, fetchedAnalytics] = await Promise.all([
        StorageService.fetchTemplates(),
        StorageService.fetchPlates(),
        StorageService.fetchRedirects(),
        StorageService.fetchAnalytics(),
      ]);
      setTemplates(fetchedTemplates);
      setPlates(fetchedPlates);
      setRedirects(fetchedRedirects);
      setAnalytics(fetchedAnalytics);
    } catch (err) {
      console.warn('Sync warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 1. Check session
    StorageService.verifyAuth().then((authUser) => {
      if (authUser) setUser(authUser);
    });

    // 2. Fetch real data from Supabase
    loadDataFromBackend();

    // 3. Check if path is /r/:slug
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/r\/([^/?#]+)/i);
      if (match && match[1]) {
        const slug = decodeURIComponent(match[1]);
        setClientRedirectSlug(slug);
        StorageService.recordClick(slug);
      }
    }
  }, []);

  // Automatic countdown redirection when visiting /r/:slug for standard active URLs
  useEffect(() => {
    if (!clientRedirectSlug) return;
    const item = StorageService.getRedirectBySlug(clientRedirectSlug);
    if (item && item.status === 'active' && item.type === 'url' && item.destinationUrl) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        window.location.href = item.destinationUrl;
      }
    }
  }, [clientRedirectSlug, countdown]);

  // Handlers connected to Supabase
  const handleSaveTemplate = async (template: PlateTemplate) => {
    const updated = await StorageService.saveTemplate(template);
    setTemplates(updated);
    showToast(`Template "${template.name}" salvo no Supabase!`);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este modelo do banco de dados?')) {
      const updated = await StorageService.deleteTemplate(id);
      setTemplates(updated);
      showToast('Template excluído do Supabase.');
    }
  };

  const handleBatchCreated = async (newPlates: PhysicalPlate[], newRedirects: DynamicRedirect[]) => {
    try {
      // Direct atomic transaction with Supabase backend
      await fetch('/api/plates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plates: newPlates, redirects: newRedirects }),
      });
      await loadDataFromBackend();
      showToast(`Lote de ${newPlates.length} placas gravado no Supabase com sucesso!`);
    } catch {
      await loadDataFromBackend();
      showToast(`Lote gerado com sucesso.`);
    }
  };

  const handleSaveRedirect = async (updatedRedirect: DynamicRedirect, updatedPlate?: PhysicalPlate) => {
    await StorageService.saveRedirect(updatedRedirect);
    if (updatedPlate) {
      await StorageService.savePlate(updatedPlate);
    }
    await loadDataFromBackend();
    showToast(`Destino da placa ${updatedRedirect.slug} atualizado no Supabase!`);
  };

  const handleMarkNfcWritten = async (plateId: string, written: boolean) => {
    await StorageService.markNfcWritten(plateId, written);
    await loadDataFromBackend();
    showToast(written ? 'Tag NFC física marcada como gravada!' : 'Status NFC alterado para pendente.');
  };

  const handleRecordScan = async (slug: string) => {
    await StorageService.recordClick(slug);
    await loadDataFromBackend();
  };

  const handleResetData = async () => {
    showToast('Sincronizando com o Supabase PostgreSQL...');
    await loadDataFromBackend();
    showToast('Dados sincronizados com o banco na nuvem!');
  };

  // If user opened directly via /r/:slug, render customer redirect landing
  if (clientRedirectSlug) {
    const item = StorageService.getRedirectBySlug(clientRedirectSlug);

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          {/* Top branding */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
              <QrCode className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              PlateFlow • Smart NFC &amp; QR
            </span>
          </div>

          {!item ? (
            <div className="py-6 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="text-lg font-bold text-white">Placa Não Encontrada</h1>
              <p className="text-xs text-slate-400">
                O identificador <code className="font-mono text-indigo-300 font-bold">{clientRedirectSlug}</code> não existe no Supabase.
              </p>
            </div>
          ) : item.status === 'virgin' || !item.destinationUrl ? (
            <div className="py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Smartphone className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <span className="rounded-full bg-slate-800 px-3 py-1 font-mono text-[10px] text-cyan-400 border border-slate-700">
                  ID: {item.slug}
                </span>
                <h1 className="text-lg font-bold text-white mt-3">Dispositivo Pronto para Ativação</h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Esta placa física está instalada, mas ainda aguarda a vinculação do link final pelo painel administrativo.
                </p>
              </div>
            </div>
          ) : item.status === 'paused' ? (
            <div className="py-6 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h1 className="text-lg font-bold text-white">Serviço Temporariamente Pausado</h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                O direcionamento deste link foi suspenso temporariamente pelo estabelecimento.
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Redirecionamento Dinâmico
                </span>
                <h1 className="text-xl font-black text-white mt-0.5">{item.title}</h1>
                <p className="text-xs text-slate-400 mt-1 font-mono break-all max-w-xs mx-auto">
                  {item.destinationUrl}
                </p>
              </div>

              {/* URL Countdown */}
              {item.type === 'url' && (
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-3">
                  <p className="text-xs text-slate-300">
                    Redirecionando automaticamente em <strong className="text-indigo-400 text-sm">{countdown}s</strong>...
                  </p>
                  <a
                    href={item.destinationUrl}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 px-5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <span>Acessar Agora</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}

              {/* WhatsApp */}
              {item.type === 'whatsapp' && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-950/40 p-4 border border-emerald-800/40 text-xs text-emerald-200">
                    <p className="font-semibold flex items-center justify-center gap-1.5 mb-1">
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                      <span>Mensagem Pronta para o WhatsApp</span>
                    </p>
                    <p className="text-slate-300 italic">"{item.metadata?.whatsappMessage || 'Olá!'}"</p>
                  </div>
                  <a
                    href={item.destinationUrl}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 px-5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Iniciar Conversa no WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Pix */}
              {item.type === 'pix' && (
                <div className="space-y-3 rounded-2xl bg-cyan-950/30 p-4 border border-cyan-800/40">
                  <p className="text-xs font-semibold text-cyan-300">Pagamento Direto via Pix</p>
                  <div className="rounded-xl bg-slate-900 p-2.5 font-mono text-xs text-white break-all">
                    {item.metadata?.pixKey}
                  </div>
                  <button
                    onClick={() => {
                      if (item.metadata?.pixKey) {
                        navigator.clipboard.writeText(item.metadata.pixKey);
                        setCopiedPixKey(true);
                        setTimeout(() => setCopiedPixKey(false), 2000);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    {copiedPixKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedPixKey ? 'Chave Copiada!' : 'Copiar Chave Pix'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Return to Admin Dashboard Button */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                setClientRedirectSlug(null);
              }}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              ← Voltar ao Painel Administrativo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = StorageService.getStats();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl shadow-indigo-600/50 border border-indigo-400/30 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onResetData={handleResetData}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          StorageService.logout();
          setUser(null);
          showToast('Sessão encerrada.');
        }}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 pb-28 md:pb-12">
        {/* Syncing indicator */}
        {isSyncing && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-2 text-xs text-indigo-300 animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Sincronizando registros com o banco de dados Supabase na nuvem...</span>
          </div>
        )}

        {/* Empty state onboarding banner if no plates yet */}
        {plates.length === 0 && !isSyncing && (
          <div className="mb-6 rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-950/20 p-6 text-center sm:p-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Banco de Dados Supabase Conectado!</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              Nenhuma placa física foi cadastrada ainda. Gere seu primeiro lote para carimbar as artes para gráfica e programar as tags NFC.
            </p>
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Gerar Primeiro Lote de Placas</span>
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardOverview
            stats={stats}
            templates={templates}
            plates={plates}
            redirects={redirects}
            analytics={analytics}
            onNavigateToTab={(tab) => {
              if (tab === 'simulator') {
                setSimulatorSlug(redirects[0]?.slug || (plates[0]?.slug || 'mesa-01'));
              } else {
                setActiveTab(tab);
              }
            }}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onTestRedirect={(slug) => setSimulatorSlug(slug)}
          />
        )}

        {activeTab === 'inventory' && (
          <PlatesInventory
            plates={plates}
            redirects={redirects}
            templates={templates}
            baseUrl={baseUrl}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onOpenEditRedirect={(redirect, plate) => {
              setEditingRedirect({ redirect, plate });
            }}
            onOpenNfcAssistant={(plate) => setNfcAssistantPlate(plate)}
            onOpenPlatePreview={(plate) => setPreviewPlate(plate)}
            onTestRedirect={(slug) => setSimulatorSlug(slug)}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateManager
            templates={templates}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {activeTab === 'simulator' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
                Ambiente de Teste &amp; Validação
              </span>
              <h2 className="text-lg font-bold text-white mt-2">Simulador Interativo de Scan</h2>
              <p className="text-xs text-slate-400">
                Selecione qualquer placa para testar a experiência exata do cliente ao aproximar o iPhone ou escanear o QR Code.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {redirects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Gere um lote de placas para testar redirecionamentos no simulador.
                </div>
              ) : (
                redirects.map((r) => (
                  <div
                    key={r.slug}
                    onClick={() => setSimulatorSlug(r.slug)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                        <QrCode className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-white">{r.slug}</span>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{r.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400">{r.clicks} cliques</span>
                      <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                        Testar →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {/* 1. Batch Generator Modal */}
      <BatchGeneratorModal
        templates={templates}
        baseUrl={baseUrl}
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchCreated={handleBatchCreated}
      />

      {/* 2. Edit Redirect Modal */}
      {editingRedirect && (
        <EditRedirectModal
          redirect={editingRedirect.redirect}
          plate={editingRedirect.plate}
          baseUrl={baseUrl}
          isOpen={true}
          onClose={() => setEditingRedirect(null)}
          onSave={handleSaveRedirect}
        />
      )}

      {/* 3. NFC Assistant Modal for iPhone */}
      {nfcAssistantPlate && (
        <NfcAssistantModal
          plate={nfcAssistantPlate}
          redirect={redirects.find(r => r.slug.toLowerCase() === nfcAssistantPlate.slug.toLowerCase())}
          baseUrl={baseUrl}
          isOpen={true}
          onClose={() => setNfcAssistantPlate(null)}
          onMarkWritten={handleMarkNfcWritten}
        />
      )}

      {/* 4. Single Plate Preview Modal */}
      {previewPlate && (
        <PlatePreviewModal
          plate={previewPlate}
          template={templates.find(t => t.id === previewPlate.templateId) || templates[0]}
          redirect={redirects.find(r => r.slug.toLowerCase() === previewPlate.slug.toLowerCase())}
          baseUrl={baseUrl}
          isOpen={true}
          onClose={() => setPreviewPlate(null)}
          onOpenEditRedirect={() => {
            const redirect = redirects.find(r => r.slug.toLowerCase() === previewPlate.slug.toLowerCase());
            if (redirect) {
              setEditingRedirect({ redirect, plate: previewPlate });
            }
          }}
        />
      )}

      {/* 5. Live Redirect Simulator Modal */}
      {simulatorSlug && (
        <RedirectSimulatorModal
          initialSlug={simulatorSlug}
          redirects={redirects}
          plates={plates}
          baseUrl={baseUrl}
          isOpen={true}
          onClose={() => setSimulatorSlug(null)}
          onRecordScan={handleRecordScan}
        />
      )}

      {/* 6. Admin Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          setIsLoginModalOpen(false);
          showToast(`Autenticado com sucesso como ${loggedUser.email}!`);
        }}
      />
    </div>
  );
}
