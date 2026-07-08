'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../lib/AppContext';
import { supabase } from '../lib/supabase';

export default function Header() {
  const { activeDistributor, activeDistributorName, activeView, isLoading, employees, currentUserEmail, getLoggedInUserName, userRole, setUserRole, logout, dbStatus, dbErrorMessage, retryDbConnection } = useApp();

  const viewNames = {
    dashboard: 'Painel do Administrador',
    movements: 'Movimentações de Estoque',
    cadastros: 'Central de Cadastros',
    reports: 'Central de Relatórios',
    logistic_dashboard: 'Dashboard de Logística',
    suporte: 'Suporte & Manuais'
  };

  const userName = getLoggedInUserName ? getLoggedInUserName() : 'Douglas Santos';
  const userEmail = currentUserEmail || '';
  const matchedEmployee = employees?.find(e => e.email.toLowerCase() === userEmail.toLowerCase());
  const isMaster = userEmail.toLowerCase() === 'flavio.esteves@movix.com.br' || userEmail.toLowerCase() === 'jonatan.agostinho@movix.com.br';
  const userCargo = isMaster ? 'ADM Master' : (matchedEmployee?.cargo || 'Gestor de Estoque');

  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(userName);

  // Profile image and settings state
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPhotoSectionOpen, setIsPhotoSectionOpen] = useState(false);
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (userEmail) {
      const saved = localStorage.getItem(`movix_avatar_${userEmail.toLowerCase()}`);
      if (saved) {
        setTimeout(() => {
          setProfileAvatar(saved);
        }, 0);
      } else {
        setTimeout(() => {
          setProfileAvatar(null);
        }, 0);
      }
    }
  }, [userEmail]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setProfileAvatar(base64String);
      if (userEmail) {
        localStorage.setItem(`movix_avatar_${userEmail.toLowerCase()}`, base64String);
      }

      // Sync to Supabase Auth metadata
      if (supabase) {
        try {
          const { error } = await supabase.auth.updateUser({
            data: { avatar_url: base64String }
          });
          if (error) {
            console.warn('Error saving avatar to Supabase:', error.message);
          }
        } catch (err) {
          console.error('Error updating Supabase user metadata:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'A nova senha deve conter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'As senhas não coincidem. Por favor, verifique.', type: 'error' });
      return;
    }

    setPasswordLoading(true);

    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          throw new Error(error.message);
        }

        setPasswordMessage({ text: 'Senha alterada com sucesso no Supabase Authentication!', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ text: 'Senha atualizada localmente (Supabase desconectado).', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMessage({ text: err.message || 'Erro ao alterar senha no Supabase.', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center space-x-4">
        {/* Mobile Header Menu trigger or Title */}
        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex flex-wrap items-center gap-2">
          {viewNames[activeView] || 'MOVIX Enterprise'}
          <span className="hidden sm:inline px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[13px] font-bold border border-blue-100">
            {activeDistributorName}
          </span>
          
          {/* Supabase Connection Status Badge */}
          {dbStatus === 'checking' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-100 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Verificando Banco...
            </span>
          )}
          {dbStatus === 'connected' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100 relative">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative" />
              Nuvem Ativa
            </span>
          )}
          {dbStatus === 'disconnected' && (
            <button
              type="button"
              onClick={() => retryDbConnection && retryDbConnection()}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[11px] font-semibold border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all"
              title="Sem conexão com o Supabase. Clique para tentar reconectar e ler as tabelas da nuvem."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Offline (Local)
            </button>
          )}
          {dbStatus === 'error' && (
            <button
              type="button"
              onClick={() => retryDbConnection && retryDbConnection()}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-100 animate-pulse cursor-pointer hover:bg-rose-100 transition-all"
              title={`Erro de sincronização. Passe o mouse ou clique para tentar carregar as tabelas novamente.\n\nDetalhe do erro: ${dbErrorMessage || 'Tabelas do banco de dados não encontradas ou credenciais incorretas.'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Erro de Sincronia
            </button>
          )}
        </h2>
      </div>

      <div className="flex items-center space-x-3">
        {/* User profile block */}
        <div className="flex items-center space-x-3 border-l border-gray-150 pl-4 relative">
          <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-extrabold text-xs shrink-0 overflow-hidden border border-gray-200">
            {profileAvatar ? (
              <img src={profileAvatar} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="hidden md:block shrink-0">
            <div className="flex items-center gap-2.5">
              <div>
                <p className="text-xs font-bold text-gray-800 leading-none">{userName}</p>
                <p className="text-[10px] text-gray-500 leading-none mt-1">{userCargo}</p>
              </div>
              
              {/* Vertical Stack of settings gear & profile arrow */}
              <div className="flex flex-col items-center gap-0.5 pl-2 border-l border-gray-200">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer inline-flex items-center"
                  title="Configurações de Perfil"
                >
                  <span className="material-symbols-outlined text-[15px] leading-none font-bold">settings</span>
                </button>
                
                <div className="relative inline-flex items-center justify-center w-4 h-3 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] leading-none select-none">arrow_drop_down</span>
                  <select
                    id="user-profile-select"
                    value={userRole || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserRole(val || null);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Mudar Tipo de Perfil"
                  >
                    <option value="TI Admin">TI Admin</option>
                    <option value="Gerencial">Gerencial</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Logístico">Logístico</option>
                    <option value="Entregador">Entregador</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Conferencia">Conferência</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Profile Floating Popover */}
          {isSettingsOpen && (
            <>
              {/* Transparent click-away layer to close the popover without blurring the screen */}
              <div 
                className="fixed inset-0 z-30 bg-transparent cursor-default"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setPasswordMessage(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              />
              <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl w-56 md:w-[268px] p-5 shadow-2xl z-40 space-y-4 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setPasswordMessage(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-blue-600 text-xl font-bold">settings</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-none">Configurações de Perfil</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Gerencie sua senha e foto de perfil</p>
                  </div>
                </div>

                {/* Profile Photo Upload Section */}
                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <button 
                    type="button"
                    onClick={() => setIsPhotoSectionOpen(!isPhotoSectionOpen)}
                    className="w-full flex items-center justify-between text-left focus:outline-none py-1 group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                      Foto de Perfil
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-blue-600 transition-colors">
                      {isPhotoSectionOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isPhotoSectionOpen && (
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 animate-in fade-in duration-150">
                      <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-extrabold text-sm shrink-0 overflow-hidden border border-slate-200 shadow-sm">
                        {profileAvatar ? (
                          <img src={profileAvatar} alt="Foto de Perfil" className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-bold text-slate-800 leading-none">Selecione uma imagem</p>
                        <label className="inline-flex items-center justify-center p-1.5 rounded-lg bg-white border border-slate-250 text-slate-700 hover:bg-slate-100 font-semibold transition-all shadow-3xs cursor-pointer" title="Carregar Foto">
                          <span className="material-symbols-outlined text-sm">upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Change Password Form Section */}
                <div className="space-y-2 pb-1">
                  <button 
                    type="button"
                    onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
                    className="w-full flex items-center justify-between text-left focus:outline-none py-1 group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                      Alterar Senha de Acesso
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-blue-600 transition-colors">
                      {isPasswordSectionOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isPasswordSectionOpen && (
                    <form onSubmit={handlePasswordChange} className="space-y-3 pt-2 animate-in fade-in duration-150">
                      {passwordMessage && (
                        <div className={`p-2 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border ${
                          passwordMessage.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                        }`}>
                          <span className="material-symbols-outlined text-xs">
                            {passwordMessage.type === 'success' ? 'check_circle' : 'error'}
                          </span>
                          <span>{passwordMessage.text}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5" htmlFor="settings-new-password">
                            <span className="material-symbols-outlined text-xs text-slate-400">lock</span>
                            Nova Senha
                          </label>
                          <input
                            id="settings-new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo de 6 caracteres"
                            required
                            className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-100 transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5" htmlFor="settings-confirm-password">
                            <span className="material-symbols-outlined text-xs text-slate-400">check_circle</span>
                            Confirmar Nova Senha
                          </label>
                          <input
                            id="settings-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha exatamente"
                            required
                            className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-100 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPasswordSectionOpen(false);
                            setPasswordMessage(null);
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="flex-1 h-9 border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold text-[10px] rounded-xl flex items-center justify-center transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                        >
                          {passwordLoading ? 'Alterando...' : 'Salvar'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Logout Button */}
                <div className="border-t border-slate-100 pt-3 mt-1">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      if (logout) logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] uppercase tracking-wider transition-all border border-red-200 cursor-pointer shadow-3xs"
                    title="Sair do Sistema"
                  >
                    <span className="material-symbols-outlined text-xs">logout</span>
                    <span>Sair da Aplicação</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
