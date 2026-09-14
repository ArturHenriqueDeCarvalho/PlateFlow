import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, Database, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AuthUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  isEnforced?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isEnforced = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await StorageService.login(email, password);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
      if (onClose) onClose();
    } else {
      setError(res.error || 'Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
        {!isEnforced && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-mono p-1 rounded-lg"
          >
            ✕
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/30">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Painel Administrativo</h2>
          <p className="text-xs text-slate-400 mt-1">
            Autenticação segura conectada ao <span className="text-emerald-400 font-semibold">Supabase PostgreSQL</span>
          </p>
        </div>

        {/* Supabase Host Status Pill */}
        <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-[11px] text-slate-300">yjwlyaaumicsjjspttuc</span>
          </div>
          <span className="flex items-center gap-1 font-semibold text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email do Administrador
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando credenciais...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Entrar no Painel</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Proteção de rotas ativada. Apenas administradores autenticados podem alterar URLs de destino e gerar lotes.
          </p>
        </div>
      </div>
    </div>
  );
};
