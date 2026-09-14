import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  Database,
  ArrowRight,
  AlertCircle,
  Loader2,
  QrCode,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AuthUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await StorageService.login(email, password);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res.error || 'Credenciais inválidas. Verifique seu email e senha.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Subtle Background Glow Accent */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-600/30">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Plate<span className="text-indigo-400">Flow</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            Plataforma de Gestão de Placas NFC &amp; QR Codes Dinâmicos
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Acesso Restrito
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Painel Administrativo Protegido
              </p>
            </div>
            {/* Supabase Status Pill */}
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase DB</span>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Erro de Autenticação</span>
                <span className="text-[11px] text-rose-300/90">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email de Acesso
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha do Administrador
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
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Entrar no Painel</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Database Info Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-slate-400" />
              <span>PostgreSQL Nuvem</span>
            </span>
            <span>yjwlyaaumicsjjspttuc</span>
          </div>
        </div>

        {/* Public Notice */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Os links e tags públicas das placas físicas (<code className="text-indigo-400 font-mono">/r/:slug</code>) permanecem acessíveis para os clientes sem login.
          </p>
        </div>
      </div>
    </div>
  );
};
