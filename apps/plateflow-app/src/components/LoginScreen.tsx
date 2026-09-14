import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AuthUser } from '../types';
import { Button, Input, Card } from './ui';

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
      setError(res.error || 'Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
            <QrCode className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            PlateFlow
          </h1>
        </div>

        {/* Login Card */}
        <Card
          header={
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Acesso ao Painel
              </h2>
            </div>
          }
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email"
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              id="login-password"
              label="Senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={loading}
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
