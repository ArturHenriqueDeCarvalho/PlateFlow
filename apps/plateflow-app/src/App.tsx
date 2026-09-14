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
import { LoginScreen } from './components/LoginScreen';
import { StorageService } from './services/storageService';
import {
  PlateTemplate,
  PhysicalPlate,
  DynamicRedirect,
  AnalyticsLog,
  AuthUser
} from './types';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MessageCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
  Plus,
  Loader2,
  Radio,
  ExternalLink
} from 'lucide-react';
import { Toast, EmptyState, Button, Badge, Card, PageHeader } from './components/ui';

export default function App() {
  // Authentication & Session state
  const [user, setUser] = useState<AuthUser | null>(() => StorageService.getAuthUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // App data state
  const [templates, setTemplates] = useState<PlateTemplate[]>(() => StorageService.getTemplates());
  const [plates, setPlates] = useState<PhysicalPlate[]>(() => StorageService.getPlates());
  const [redirects, setRedirects] = useState<DynamicRedirect[]>(() => StorageService.getRedirects());
  const [analytics, setAnalytics] = useState<AnalyticsLog[]>(() => StorageService.getAnalytics());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'templates' | 'simulator'>('dashboard');

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

  // Selected plate in simulator tab
  const [simTabSlug, setSimTabSlug] = useState<string>('');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nfc-qr.app';

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

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
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/r\/([^/?#]+)/i);
      if (match && match[1]) {
        const slug = decodeURIComponent(match[1]);
        setClientRedirectSlug(slug);
        StorageService.recordClick(slug);
        setIsCheckingAuth(false);
        return;
      }
    }

    StorageService.verifyAuth()
      .then((authUser) => {
        setUser(authUser);
        if (authUser) {
          loadDataFromBackend();
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

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

  const handleSaveTemplate = async (template: PlateTemplate) => {
    const updated = await StorageService.saveTemplate(template);
    setTemplates(updated);
    showToast(`Modelo salvo.`);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Excluir este modelo?')) {
      const updated = await StorageService.deleteTemplate(id);
      setTemplates(updated);
      showToast('Modelo removido.');
    }
  };

  const handleBatchCreated = async (newPlates: PhysicalPlate[], newRedirects: DynamicRedirect[]) => {
    try {
      const token =
        localStorage.getItem('nfc_qr_auth_token_v2') ||
        localStorage.getItem('plateflow_auth_token');
      const res = await fetch('/api/plates/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plates: newPlates, redirects: newRedirects }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro do servidor (${res.status})`);
      }
      await loadDataFromBackend();
      showToast(`Lote de ${newPlates.length} placas gerado.`);
    } catch (err: any) {
      console.error('Erro ao salvar lote:', err);
      showToast(`Erro ao gravar lote.`);
      await loadDataFromBackend();
    }
  };

  const handleSaveRedirect = async (updatedRedirect: DynamicRedirect, updatedPlate?: PhysicalPlate) => {
    await StorageService.saveRedirect(updatedRedirect);
    if (updatedPlate) {
      await StorageService.savePlate(updatedPlate);
    }
    await loadDataFromBackend();
    showToast(`Destino atualizado.`);
  };

  const handleMarkNfcWritten = async (plateId: string, written: boolean) => {
    await StorageService.markNfcWritten(plateId, written);
    await loadDataFromBackend();
    showToast(written ? 'Tag marcada como gravada.' : 'Status NFC alterado.');
  };

  const handleRecordScan = async (slug: string) => {
    await StorageService.recordClick(slug);
    await loadDataFromBackend();
  };

  const handleResetData = async () => {
    await loadDataFromBackend();
    showToast('Dados sincronizados.');
  };

  // =========================================================================
  // 1. PUBLIC ROUTE: Customer scanned a physical plate (/r/:slug)
  // =========================================================================
  if (clientRedirectSlug) {
    const item = StorageService.getRedirectBySlug(clientRedirectSlug);

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Card>
            {!item ? (
              <div className="py-8 text-center space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-zinc-500" />
                <h1 className="text-sm font-semibold text-zinc-200">Placa Não Encontrada</h1>
                <p className="text-xs text-zinc-500">
                  O código <span className="font-mono text-zinc-300">{clientRedirectSlug}</span> não existe.
                </p>
              </div>
            ) : item.status === 'virgin' || !item.destinationUrl ? (
              <div className="py-8 text-center space-y-3">
                <Radio className="h-8 w-8 mx-auto text-zinc-500" />
                <h1 className="text-sm font-semibold text-zinc-200">Placa Disponível</h1>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Aguardando configuração de destino pelo estabelecimento.
                </p>
              </div>
            ) : item.status === 'paused' ? (
              <div className="py-8 text-center space-y-3">
                <ShieldAlert className="h-8 w-8 mx-auto text-amber-500" />
                <h1 className="text-sm font-semibold text-zinc-200">Serviço Temporariamente Pausado</h1>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  O direcionamento deste link foi pausado temporariamente.
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-4 text-center">
                <div>
                  <h1 className="text-base font-semibold text-zinc-100">{item.title}</h1>
                </div>

                {/* URL Countdown */}
                {item.type === 'url' && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-zinc-400">
                      Redirecionando em <strong className="text-zinc-200">{countdown}s</strong>...
                    </p>
                    <a href={item.destinationUrl} className="block">
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="w-full"
                        icon={<ArrowRight className="h-4 w-4" />}
                      >
                        Acessar Agora
                      </Button>
                    </a>
                  </div>
                )}

                {/* WhatsApp */}
                {item.type === 'whatsapp' && (
                  <div className="space-y-3 pt-2">
                    <a href={item.destinationUrl} className="block">
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="w-full"
                        icon={<MessageCircle className="h-4 w-4" />}
                      >
                        Conversar no WhatsApp
                      </Button>
                    </a>
                  </div>
                )}

                {/* Pix */}
                {item.type === 'pix' && (
                  <div className="space-y-3 pt-2">
                    <div className="rounded-lg bg-zinc-900 p-2.5 font-mono text-xs text-zinc-200 break-all border border-zinc-800">
                      {item.metadata?.pixKey}
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => {
                        if (item.metadata?.pixKey) {
                          navigator.clipboard.writeText(item.metadata.pixKey);
                          setCopiedPixKey(true);
                          setTimeout(() => setCopiedPixKey(false), 2000);
                        }
                      }}
                      icon={copiedPixKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    >
                      {copiedPixKey ? 'Chave Copiada!' : 'Copiar Chave Pix'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. LOADING STATE: Checking existing session
  // =========================================================================
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  // =========================================================================
  // 3. AUTHENTICATION GATE: User is NOT logged in -> Require Supabase Login
  // =========================================================================
  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          loadDataFromBackend();
        }}
      />
    );
  }

  // =========================================================================
  // 4. PROTECTED ADMIN PANEL: User is authenticated
  // =========================================================================
  const stats = StorageService.getStats();
  const effectiveSimSlug = simTabSlug || redirects[0]?.slug || plates[0]?.slug || '';
  const currentSimRedirect = redirects.find((r) => r.slug.toLowerCase() === effectiveSimSlug.toLowerCase());

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onResetData={handleResetData}
        user={user}
        onOpenLogin={() => {}}
        onLogout={() => {
          StorageService.logout();
          setUser(null);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 pb-8 sm:pb-12">
        {plates.length === 0 && !isSyncing && (
          <div className="mb-6">
            <EmptyState
              title="Nenhuma placa cadastrada"
              description="Gere seu primeiro lote para carimbar as artes para gráfica e configurar os chips NFC."
              action={
                <Button
                  variant="primary"
                  size="md"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsBatchModalOpen(true)}
                >
                  Criar Primeiro Lote
                </Button>
              }
            />
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
          <div className="space-y-5 max-w-xl mx-auto">
            <PageHeader
              title="Simulador de Leitura"
              description="Teste o comportamento do QR Code e NFC para qualquer placa física."
            />

            <Card>
              {redirects.length === 0 ? (
                <EmptyState
                  title="Nenhuma placa cadastrada"
                  description="Gere um lote para testar o direcionamento."
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Selecionar Placa
                    </label>
                    <select
                      value={effectiveSimSlug}
                      onChange={(e) => {
                        setSimTabSlug(e.target.value);
                        handleRecordScan(e.target.value);
                      }}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none"
                    >
                      {redirects.map((r) => (
                        <option key={r.slug} value={r.slug}>
                          {r.slug} — {r.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Simulated Output Frame */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-center">
                    {!currentSimRedirect ? (
                      <p className="text-xs text-zinc-500 py-4">Placa não encontrada.</p>
                    ) : currentSimRedirect.status === 'virgin' || !currentSimRedirect.destinationUrl ? (
                      <div className="py-6 space-y-2">
                        <Radio className="h-6 w-6 mx-auto text-zinc-500" />
                        <h3 className="text-xs font-semibold text-zinc-200">Pronta para Ativação</h3>
                        <p className="text-xs text-zinc-400">
                          Aguardando configuração de destino pelo painel.
                        </p>
                      </div>
                    ) : currentSimRedirect.status === 'paused' ? (
                      <div className="py-6 space-y-2">
                        <AlertCircle className="h-6 w-6 mx-auto text-amber-500" />
                        <h3 className="text-xs font-semibold text-zinc-200">Destino Pausado</h3>
                        <p className="text-xs text-zinc-400">
                          O direcionamento desta placa está temporariamente suspenso.
                        </p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-3">
                        <h3 className="text-sm font-semibold text-zinc-100">
                          {currentSimRedirect.title}
                        </h3>
                        <p className="text-xs font-mono text-zinc-400 break-all">
                          {currentSimRedirect.destinationUrl}
                        </p>

                        <a
                          href={currentSimRedirect.destinationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block pt-2"
                        >
                          <Button
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
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* Modals */}
      <BatchGeneratorModal
        templates={templates}
        baseUrl={baseUrl}
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchCreated={handleBatchCreated}
      />

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

      {nfcAssistantPlate && (
        <NfcAssistantModal
          plate={nfcAssistantPlate}
          redirect={redirects.find(
            (r) => r.slug.toLowerCase() === nfcAssistantPlate.slug.toLowerCase()
          )}
          baseUrl={baseUrl}
          isOpen={true}
          onClose={() => setNfcAssistantPlate(null)}
          onMarkWritten={handleMarkNfcWritten}
        />
      )}

      {previewPlate && (
        <PlatePreviewModal
          plate={previewPlate}
          template={templates.find((t) => t.id === previewPlate.templateId) || templates[0]}
          redirect={redirects.find(
            (r) => r.slug.toLowerCase() === previewPlate.slug.toLowerCase()
          )}
          baseUrl={baseUrl}
          isOpen={true}
          onClose={() => setPreviewPlate(null)}
          onOpenEditRedirect={() => {
            const redirect = redirects.find(
              (r) => r.slug.toLowerCase() === previewPlate.slug.toLowerCase()
            );
            if (redirect) {
              setEditingRedirect({ redirect, plate: previewPlate });
            }
          }}
        />
      )}

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
    </div>
  );
}
