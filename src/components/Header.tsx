import React from 'react';
import {
  LayoutDashboard,
  Layers,
  QrCode,
  Smartphone,
  Zap,
  RotateCcw,
  Sparkles,
  Database,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AuthUser } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'inventory' | 'templates' | 'simulator';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'templates' | 'simulator') => void;
  onOpenBatchModal: () => void;
  onResetData: () => void;
  user: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenBatchModal,
  onResetData,
  user,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <>
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white sm:text-base">
                  Plate<span className="text-indigo-400">Flow</span>
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PWA</span>
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-800">
                  <Database className="h-2.5 w-2.5 text-emerald-400" />
                  <span>Supabase: yjwlyaaumicsjjspttuc</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Gestão de tags NFC e carimbo automatizado de placas conectado à nuvem
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs for Desktop */}
          <nav className="hidden md:flex items-center rounded-2xl border border-slate-800 bg-slate-900/90 p-1">
            <button
              id="tab-btn-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              id="tab-btn-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Inventário &amp; NFC</span>
            </button>

            <button
              id="tab-btn-templates"
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Templates (X,Y)</span>
            </button>

            <button
              id="tab-btn-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Simulador</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* In-app PWA install button */}
            <PWAInstallButton />

            <button
              id="btn-header-batch"
              onClick={onOpenBatchModal}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Novo Lote</span>
              <span className="xs:hidden">Lote</span>
            </button>

            {/* Auth Button or User Profile */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden lg:inline text-[11px] font-mono max-w-[130px] truncate text-slate-300">
                    {user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors ml-1"
                  title="Sair da conta"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}

            <button
              onClick={onResetData}
              className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Recarregar dados do Supabase"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Navegação Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl px-2 py-1.5 flex justify-around items-center shadow-2xl shadow-black"
        style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-indigo-400 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'text-indigo-400 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="h-4 w-4 mb-0.5" />
          <span>Placas</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'text-indigo-400 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4 mb-0.5" />
          <span>Templates</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'simulator'
              ? 'text-amber-400 bg-amber-500/10 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="h-4 w-4 mb-0.5" />
          <span>Simulador</span>
        </button>
      </nav>
    </>
  );
};
