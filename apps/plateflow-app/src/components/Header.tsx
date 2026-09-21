import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  QrCode,
  Smartphone,
  Zap,
  LogOut,
  LogIn,
  Plus,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AuthUser } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { StorageService } from '../services/storageService';

interface HeaderProps {
  activeTab: 'dashboard' | 'inventory' | 'templates' | 'simulator';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'templates' | 'simulator') => void;
  onOpenBatchModal: () => void;
  onResetData: () => void;
  user: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onPasswordChanged: () => void;
  onSessionExpired: () => void;
}

const MISMATCH = 'A nova senha e a confirmação não conferem.';

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenBatchModal,
  user,
  onOpenLogin,
  onLogout,
  onPasswordChanged,
  onSessionExpired,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setConfirmError(undefined);
    setFormError(null);
    setSubmitting(false);
  };

  const openPasswordModal = () => {
    setMenuOpen(false);
    resetPasswordForm();
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (submitting) return;
    setPasswordModalOpen(false);
    resetPasswordForm();
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setConfirmError(undefined);

    if (newPassword !== confirmPassword) {
      setConfirmError(MISMATCH);
      return;
    }

    setSubmitting(true);
    const result = await StorageService.changePassword(currentPassword, newPassword);
    if (result.status === 401) {
      setSubmitting(false);
      setPasswordModalOpen(false);
      resetPasswordForm();
      onSessionExpired();
      return;
    }

    if (!result.success) {
      setFormError(result.error || 'Senha atual incorreta.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setPasswordModalOpen(false);
    resetPasswordForm();
    onPasswordChanged();
  };

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

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 sm:gap-2 border border-zinc-700 bg-zinc-900 rounded-lg px-2 sm:px-2.5 py-1 text-xs text-zinc-200 cursor-pointer hover:bg-zinc-800/80 transition-colors"
              >
                <span className="hidden md:inline font-mono text-zinc-300 font-normal max-w-[100px] truncate">
                  {user.email.split('@')[0]}
                </span>
                <Lock className="h-3.5 w-3.5 text-zinc-400 md:hidden" aria-hidden />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 z-50 min-w-[180px] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openPasswordModal}
                    className="flex w-full items-center gap-1 min-h-[44px] md:min-h-[32px] px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 cursor-pointer whitespace-normal text-left"
                  >
                    <Lock className="h-3.5 w-3.5 text-zinc-400 shrink-0" aria-hidden />
                    <span>Alterar senha</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-1 min-h-[44px] md:min-h-[32px] px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-rose-400 cursor-pointer whitespace-normal text-left"
                    aria-label="Sair da conta"
                    title="Encerrar sessão"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>Sair</span>
                  </button>
                </div>
              )}
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

      <Modal
        isOpen={passwordModalOpen}
        onClose={closePasswordModal}
        size="sm"
        title="Alterar senha"
        description="Informe a senha atual e escolha uma nova."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={submitting}
              onClick={closePasswordModal}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="change-password-form"
              variant="primary"
              size="md"
              isLoading={submitting}
              disabled={submitting}
            >
              Alterar senha
            </Button>
          </div>
        }
      >
        {formError && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span className="min-w-0 whitespace-normal break-words">{formError}</span>
          </div>
        )}

        <form id="change-password-form" onSubmit={handleChangePassword} className="space-y-4">
          <Input
            id="change-password-current"
            label="Senha atual"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            disabled={submitting}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            id="change-password-new"
            label="Nova senha"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            disabled={submitting}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (confirmError) setConfirmError(undefined);
            }}
            placeholder="••••••••"
          />
          <Input
            id="change-password-confirm"
            label="Confirmar nova senha"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            disabled={submitting}
            error={confirmError}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmError) setConfirmError(undefined);
            }}
            placeholder="••••••••"
          />
        </form>
      </Modal>
    </header>
  );
};
