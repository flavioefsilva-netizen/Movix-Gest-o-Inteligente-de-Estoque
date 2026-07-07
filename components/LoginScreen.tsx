'use client';

import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const { login } = useApp();
  const [email, setEmail] = useState('exemplo@movix.com.br');
  const [password, setPassword] = useState('12345678');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password reset forced states
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingUserEmail, setPendingUserEmail] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputEmail = email.trim();
    const isMasterUser = inputEmail.toLowerCase() === 'flavio.esteves@movix.com.br' || inputEmail.toLowerCase() === 'jonatan.agostinho@movix.com.br';
    if (isMasterUser && password === '123456789') {
      login(inputEmail);
      setLoading(false);
      return;
    }

    try {
      if (supabase) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password: password,
        });

        if (authError) {
          setError(authError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authError.message);
          setLoading(false);
          return;
        }

        // Check if user has metadata requiring forced password change
        if (data?.user?.user_metadata?.force_password_change === true) {
          setPendingUserEmail(email.trim());
          setMustChangePassword(true);
          setLoading(false);
          return;
        }
      }

      login(email);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem. Por favor, verifique.');
      return;
    }

    setLoading(true);

    try {
      if (supabase) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
          data: { force_password_change: false } // Reset metadata flag
        });

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      // Automatically log the user in after password is set successfully
      login(pendingUserEmail);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao atualizar a senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-radial from-slate-50 to-slate-100 p-4 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <main className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Brand Logo Section */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 animate-bounce duration-1000">
            <span className="material-symbols-outlined text-white text-4xl font-extrabold">local_shipping</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display flex items-center gap-1.5 justify-center">
            M<span className="text-blue-600">o</span>vix
          </h1>
          <p className="text-xs text-sky-600 font-bold tracking-widest uppercase mt-1">GESTÃO INTELIGENTE DE ESTOQUE</p>
        </div>

        {/* Welcome Text */}
        {mustChangePassword ? (
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-rose-600 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined font-bold">lock_reset</span>
              Troca de Senha Obrigatória
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Como este é o seu primeiro acesso ao sistema, por motivos de segurança, você deve definir uma nova senha de acesso.
            </p>
          </div>
        ) : (
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-slate-800">Bem-vindo de volta!</h2>
            <p className="text-xs text-slate-500 mt-1">Insira suas credenciais para gerenciar sua frota e inventário.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4.5 py-3 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-red-500 text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        {mustChangePassword ? (
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2" htmlFor="newPassword">
                <span className="material-symbols-outlined text-slate-400 text-lg">lock</span>
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                  className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2" htmlFor="confirmPassword">
                <span className="material-symbols-outlined text-slate-400 text-lg">check_circle</span>
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha exatamente"
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <>
                  <span>Salvar Senha e Entrar</span>
                  <span className="material-symbols-outlined text-lg font-bold">arrow_forward</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMustChangePassword(false);
                setError(null);
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="w-full h-11 border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl flex items-center justify-center transition-all duration-200"
            >
              Voltar ao Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2" htmlFor="email">
                <span className="material-symbols-outlined text-slate-400 text-lg">mail</span>
                Seu e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@movix.com.br"
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2" htmlFor="password">
                  <span className="material-symbols-outlined text-slate-400 text-lg">lock</span>
                  Sua senha
                </label>
                <a href="#" className="text-xs text-blue-600 hover:underline font-bold">Esqueci minha senha?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center space-x-2.5 py-1">
              <input
                id="remember"
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded text-blue-600 border-slate-200 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 selection:bg-transparent select-none cursor-pointer">
                Mantenha-me conectado
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-md shadow-blue-500/10"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Conectando de forma segura...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <span className="material-symbols-outlined text-lg font-bold">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info inside Card */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Não tem permissão ou acesso? <a href="#" className="font-bold text-blue-600 hover:underline">Fale com o Administrador</a>
        </div>
      </main>

      {/* Meta Footer */}
      <footer className="mt-8 text-center space-y-1.5 opacity-60">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">© 2026 MOVIX Corporation. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-3 text-[10px] text-slate-400 font-semibold uppercase">
          <span>Versão 1.2.0</span>
          <span>•</span>
          <span>Termos de Uso</span>
          <span>•</span>
          <span>Privacidade</span>
        </div>
      </footer>
    </div>
  );
}
