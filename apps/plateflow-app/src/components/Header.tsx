import React from 'react';
import {
  LayoutDashboard,
  Layers,
  QrCode,
  Smartphone,
  Zap,
  LogOut,
  LogIn,
  Plus
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AuthUser } from '../types';
import { Button } from './ui/Button';

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
  user,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-xs shrink-0">
            <QrCode className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-50">
            PlateFlow
          </span>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav
          aria-label="Navegação Principal"
          className="hidden md:flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1"
        >
          <button
            id="tab-btn-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Visão Geral</span>
          </button>

          <button
            id="tab-btn-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Placas</span>
          </button>

          <button
            id="tab-btn-templates"
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Modelos</span>
          </button>

          <button
            id="tab-btn-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Simulador</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <PWAInstallButton />

          <Button
            id="btn-header-batch"
            onClick={onOpenBatchModal}
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Novo Lote</span>
            <span className="sm:hidden">Lote</span>
          </Button>

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 border border-zinc-700 bg-zinc-900 rounded-lg px-2 sm:px-2.5 py-1 text-xs text-zinc-200">
              <span className="hidden md:inline font-mono text-zinc-300 font-medium max-w-[100px] truncate">
                {user.email.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                className="text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer p-0.5"
                title="Encerrar sessão"
                aria-label="Sair da conta"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              onClick={onOpenLogin}
              variant="outline"
              size="sm"
              icon={<LogIn className="h-3.5 w-3.5" />}
            >
              Entrar
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Integrated Navigation (< md) */}
      <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-2.5 py-1.5">
        <nav
          aria-label="Navegação Mobile"
          className="grid grid-cols-4 gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-0.5"
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Placas</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Modelos</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Simulador</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
