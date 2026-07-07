'use client';

import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { createClient } from '@supabase/supabase-js';

export default function DashboardView() {
  const {
    activeDistributor,
    selectDistributor,
    activeDistributorName,
    setActiveView,
    setActiveCadastroTab,
    products,
    clients,
    vehicles,
    employees,
    activeTransports,
    addEmployee,
    distributors,
    createDistributor,
    deleteDistributor,
    getDistributorStats,
    currentUserEmail,
    userRole,
    userDistributorId
  } = useApp();

  // Registration modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCargo, setRegCargo] = useState('Gestor de Estoque');
  const [regPerfil, setRegPerfil] = useState('');
  const [regEnableTelegram, setRegEnableTelegram] = useState(false);
  const [regTelegramChatId, setRegTelegramChatId] = useState('');

  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // New distributor creation states
  const [isCreatingDistributor, setIsCreatingDistributor] = useState(false);
  const [newDistributorName, setNewDistributorName] = useState('');
  const [newDistributorCnpj, setNewDistributorCnpj] = useState('');

  // Distributor deletion states
  const [distributorToDelete, setDistributorToDelete] = useState<string | null>(null);
  const [distributorToDeleteName, setDistributorToDeleteName] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');

  const handleInitDelete = (id: string, name: string) => {
    setDistributorToDelete(id);
    setDistributorToDeleteName(name);
    setDeleteStep('confirm');
  };

  const handleConfirmDeleteDirect = () => {
    if (distributorToDelete) {
      deleteDistributor(distributorToDelete);
    }
    setDeleteStep('idle');
    setDistributorToDelete(null);
    setDistributorToDeleteName(null);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNome || !regEmail || !regPassword || !regCargo || !regPerfil) {
      setRegError('Todos os campos obrigatórios (*) devem ser preenchidos.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setRegLoading(true);
    setRegError(null);
    setRegSuccess(null);

    try {
      // Call our secure server-side auto-confirm registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const resultData = await response.json();

      if (!response.ok || resultData.error) {
        throw new Error(resultData.error || 'Erro ao registrar usuário no Supabase Auth.');
      }

      // 2. Add the employee to the context/database
      const result = addEmployee({
        empresa: activeDistributorName,
        nome: regNome.trim(),
        cargo: regCargo.trim(),
        email: regEmail.trim().toLowerCase(),
        perfilTipo: regPerfil,
        enableTelegram: regEnableTelegram,
        telegramChatId: regEnableTelegram ? regTelegramChatId.trim() : ''
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao sincronizar dados do funcionário.');
      }

      setRegSuccess('Usuário e funcionário cadastrados com sucesso!');
      
      // Clear form
      setRegNome('');
      setRegEmail('');
      setRegPassword('');
      setRegCargo('Gestor de Estoque');
      setRegPerfil('');
      setRegEnableTelegram(false);
      setRegTelegramChatId('');

      // Auto close after success
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegSuccess(null);
      }, 2500);

    } catch (err: any) {
      setRegError(err.message || 'Ocorreu um erro ao realizar o cadastro.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header: Title and Green Button */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Painel Adm
        </h1>
        {userRole !== 'Gerencial' && (
          <button
            type="button"
            onClick={() => setIsCreatingDistributor(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">add_circle</span>
            Criar Novo Distribuidor
          </button>
        )}
      </div>

      {/* Expanded Bento Grid of Distributors / Creation Form */}
      {isCreatingDistributor ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6.5 shadow-xl max-w-lg mx-auto animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2.5 mb-5 border-b border-gray-150 pb-3.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <span className="material-symbols-outlined text-[20px] font-bold">add_business</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">CRIAR NOVO DISTRIBUIDOR</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Defina o nome da nova filial operativa a ser adicionada</p>
            </div>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (newDistributorName.trim() && newDistributorCnpj.trim()) {
              const newId = createDistributor(newDistributorName.trim(), newDistributorCnpj.trim());
              setNewDistributorName('');
              setNewDistributorCnpj('');
              setIsCreatingDistributor(false);
              
              // Switch to the newly created distributor, go to Central de Cadastros, and show Products tab
              selectDistributor(newId);
              setActiveView('cadastros');
              setActiveCadastroTab('produtos');
            }
          }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700" htmlFor="newDistName">
                Nome do Novo Distribuidor
              </label>
              <input
                id="newDistName"
                type="text"
                value={newDistributorName}
                onChange={(e) => setNewDistributorName(e.target.value)}
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700" htmlFor="newDistCnpj">
                CNPJ
              </label>
              <input
                id="newDistCnpj"
                type="text"
                value={newDistributorCnpj}
                onChange={(e) => setNewDistributorCnpj(e.target.value)}
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingDistributor(false);
                  setNewDistributorName('');
                  setNewDistributorCnpj('');
                }}
                className="flex-1 h-11 border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              Selecionar Distribuidor Operativo
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {distributors
              .filter((d) => userRole !== 'Gerencial' || d.id === userDistributorId)
              .map((d) => {
                const dist = d.id;
                const distName = d.name;
                const isActive = activeDistributor === dist;
                const { clientsCount, vehiclesCount, employeesCount, totalStockCount } = getDistributorStats(dist);

                return (
                  <div
                    key={dist}
                    onClick={() => selectDistributor(dist)}
                    className={`text-left p-4.5 rounded-2xl border-2 transition-all flex flex-col justify-between shadow-xs relative group overflow-hidden min-h-[170px] cursor-pointer ${
                      isActive
                        ? 'border-emerald-500 bg-white ring-4 ring-emerald-100/60'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Accent pattern */}
                    {isActive && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                    )}

                    {/* Distributor Name and Icon Aligned - Icon on left, name next to it */}
                    <div className="flex items-start gap-2.5 w-full">
                      <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <span className="material-symbols-outlined text-[18px]">warehouse</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="text-slate-800 font-bold tracking-tight font-sans break-words" style={{ fontSize: '14px' }}>
                          {distName}
                        </div>
                        {d.cnpj && (
                          <div className="text-slate-500 font-medium text-[9px] mt-0.5 tracking-wide">
                            CNPJ: {d.cnpj}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ATIVO label below the icon */}
                    <div className="my-2 flex items-center justify-between w-full">
                      {isActive ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">
                          ATIVO
                        </span>
                      ) : (
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                          INATIVO
                        </span>
                      )}
                    </div>

                    {/* Bottom Stats: Clientes Vinculados, Veículos Ativos, Funcionários Ativos, Total Geral */}
                    <div className="mt-auto pt-2.5 border-t border-gray-100 grid grid-cols-4 gap-1 text-center w-full">
                      {/* Clientes Vinculados */}
                      <div className="flex flex-col items-center justify-center" title="Clientes Vinculados">
                        <span className={`material-symbols-outlined text-[15px] ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>groups</span>
                        <span className={`text-[10px] font-black mt-0.5 ${isActive ? 'text-slate-700' : 'text-gray-400'}`}>{clientsCount}</span>
                      </div>

                      {/* Veículos Ativos */}
                      <div className="flex flex-col items-center justify-center" title="Veículos Ativos">
                        <span className={`material-symbols-outlined text-[15px] ${isActive ? 'text-rose-600' : 'text-gray-400'}`}>local_shipping</span>
                        <span className={`text-[10px] font-black mt-0.5 ${isActive ? 'text-slate-700' : 'text-gray-400'}`}>{vehiclesCount}</span>
                      </div>

                      {/* Funcionários Ativos */}
                      <div className="flex flex-col items-center justify-center" title="Funcionários Ativos">
                        <span className={`material-symbols-outlined text-[15px] ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>badge</span>
                        <span className={`text-[10px] font-black mt-0.5 ${isActive ? 'text-slate-700' : 'text-gray-400'}`}>{employeesCount}</span>
                      </div>

                      {/* Total Geral */}
                      <div className="flex flex-col items-center justify-center" title="Total Geral">
                        <span className={`material-symbols-outlined text-[15px] ${isActive ? 'text-green-600' : 'text-gray-400'}`}>widgets</span>
                        <span className={`text-[10px] font-black mt-0.5 ${isActive ? 'text-slate-700' : 'text-gray-400'}`}>
                          {totalStockCount.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {(userRole !== 'Gerencial' || (userRole === 'Gerencial' && dist === userDistributorId)) && (
                      <div className="mt-3.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectDistributor(dist);
                            setIsRegisterModalOpen(true);
                          }}
                          className="flex-grow bg-emerald-50 hover:bg-emerald-100 border border-emerald-400 text-emerald-700 font-extrabold py-2 rounded-xl text-[9px] uppercase tracking-wider transition-all shadow-sm flex items-center justify-center cursor-pointer z-10"
                        >
                          Cadastrar Usuário
                        </button>
                        {userRole !== 'Gerencial' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitDelete(dist, distName);
                            }}
                            className="p-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-sm z-10"
                            title="Excluir Distribuidor"
                          >
                            <span className="material-symbols-outlined text-[9px]">delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* REGISTRATION MODAL "USUÁRIOS DE (ESTEVES E SILVA LTDA)" */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4.5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-xl font-bold">person_add</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    USUÁRIOS DE ({activeDistributorName})
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Cadastrar credenciais para acesso à aplicação e sincronizar funcionário
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setRegError(null);
                  setRegSuccess(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterUser} className="flex-grow overflow-y-auto p-6 space-y-4">
              
              {/* Notifications */}
              {regSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                  <span>{regSuccess}</span>
                </div>
              )}

              {regError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
                  <span>{regError}</span>
                </div>
              )}

              {/* Fields */}
              <div className="space-y-3 text-xs font-semibold">
                
                {/* Nome Completo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block">Nome do Funcionário *</label>
                  <input
                    type="text"
                    required
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Nome Completo"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cargo */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block">Cargo *</label>
                    <input
                      type="text"
                      required
                      value={regCargo}
                      onChange={(e) => setRegCargo(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Ex: Gestor de Estoque"
                    />
                  </div>

                  {/* Perfil de Acesso */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block">Tipo de Perfil *</label>
                    <select
                      value={regPerfil}
                      onChange={(e) => setRegPerfil(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-xs font-bold focus:bg-white cursor-pointer text-slate-800"
                      required
                    >
                      <option value="" disabled>Selecione...</option>
                      <option value="Gerencial">Gerencial</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Logístico">Logístico</option>
                      <option value="Entregador">Entregador</option>
                      <option value="Conferencia">Conferencia</option>
                      <option value="Comercial">Comercial</option>
                      <option value="TI Admin">TI Admin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-3 mt-1">
                  {/* E-mail (Acesso) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block">E-mail (Login) *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="usuario@estevesesilva.com"
                    />
                  </div>

                  {/* Senha */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block">Senha de Acesso *</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                {/* Telegram notifications configuration block */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                    {/* Left: Checkbox */}
                    <div className="flex items-center gap-2.5 h-6">
                      <input
                        type="checkbox"
                        id="regEnableTelegram"
                        checked={regEnableTelegram}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRegEnableTelegram(checked);
                          if (!checked) {
                            setRegTelegramChatId('');
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="regEnableTelegram" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                        Habilitar Notificações via Telegram
                      </label>
                    </div>

                    {/* Right: Input */}
                    <div className="flex-1 sm:max-w-[200px] space-y-1">
                      <label className={`text-[9px] font-bold uppercase tracking-widest block transition-colors ${regEnableTelegram ? 'text-gray-500' : 'text-gray-300'}`}>
                        Nº Chat ID Telegram {regEnableTelegram && '*'}
                      </label>
                      <input
                        type="text"
                        required={regEnableTelegram}
                        disabled={!regEnableTelegram}
                        value={regTelegramChatId}
                        onChange={(e) => setRegTelegramChatId(e.target.value)}
                        className={`w-full h-9 px-3 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${
                          regEnableTelegram
                            ? 'bg-white border-gray-250 text-slate-800'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        placeholder={regEnableTelegram ? "Ex: 12345678" : "Habilite para preencher"}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-3.5 bg-white">
                <button
                  type="button"
                  disabled={regLoading}
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setRegError(null);
                    setRegSuccess(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-250 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer disabled:bg-blue-500"
                >
                  {regLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px] font-bold">person_add</span>
                      <span>Salvar Cadastro</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE DISTRIBUTOR MODAL */}
      {deleteStep !== 'idle' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {deleteStep === 'confirm' && (
              <div className="p-6.5 text-center">
                <div className="mx-auto w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px] font-bold">warning</span>
                </div>
                
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide mb-2">Excluir Distribuidor</h3>
                <p className="text-sm text-slate-600 font-bold leading-relaxed mb-6">
                  Tem certeza que deseja excluir o distribuidor <strong className="text-rose-600 font-extrabold">{distributorToDeleteName}</strong>? Todos os dados vinculados serão excluídos permanentemente.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep('idle');
                      setDistributorToDelete(null);
                      setDistributorToDeleteName(null);
                    }}
                    className="flex-1 h-11 border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteDirect}
                    className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-500/10 cursor-pointer"
                  >
                    Sim
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

