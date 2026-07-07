'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../lib/AppContext';

export default function Sidebar() {
  const {
    activeView,
    setActiveView,
    activeDistributor,
    activeDistributorName,
    activeCadastroTab,
    setActiveCadastroTab,
    logout,
    selectedAction,
    setSelectedAction,
    isInventoryLocked,
    reportsTab,
    setReportsTab,
    userRole,
    isLoading
  } = useApp();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const actionsRef = useRef<HTMLDivElement>(null);
  const cadastrosRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActionsOpen) {
      const timer = setTimeout(() => {
        actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActionsOpen]);

  useEffect(() => {
    if (isCadastrosOpen) {
      // Delay slightly to allow the transition and DOM expansion to complete
      const timer = setTimeout(() => {
        cadastrosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCadastrosOpen]);

  useEffect(() => {
    if (isReportsOpen) {
      const timer = setTimeout(() => {
        reportsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReportsOpen]);

  if (userRole === 'Entregador' || userRole === 'Comercial') {
    return (
      <aside className="hidden md:flex flex-col w-72 bg-gray-100 text-gray-800 sticky top-0 h-screen overflow-y-auto shrink-0 border-r border-gray-250">
        {/* Brand Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3 w-full">
          <div className="p-1.5 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 w-11 h-11 border border-gray-200 shadow-3xs">
            <svg viewBox="0 0 120 100" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 12 35 C 12 28, 28 28, 28 35 L 28 85 C 28 85, 12 85, 12 85 Z" fill="#0c1e45" />
              <path d="M 92 50 C 92 45, 108 45, 108 50 L 108 85 Z" fill="#0c1e45" />
              <path d="M 20 40 L 58 80 L 105 25" stroke="#1e62ec" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 85 24 L 110 20 L 105 45" stroke="#1e62ec" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-wider text-slate-800 leading-none">MOVIX</h1>
              <span className="text-[9px] font-extrabold text-slate-700 bg-slate-200/50 px-1 rounded-sm leading-none py-0.5">V 1.2</span>
            </div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">LOGISTICS SYSTEM</span>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <span className="material-symbols-outlined text-gray-400 text-5xl">lock_person</span>
          <div>
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Acesso Restrito</h4>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[180px] mx-auto uppercase font-bold leading-relaxed">
              Seu perfil de {userRole} possui acesso exclusivo ao painel operativo ativo.
            </p>
          </div>
        </div>

        {/* User Footer block */}
        <div className="p-4 border-t border-gray-400 bg-gray-200">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-extrabold text-sm border border-gray-300">
                {userRole === 'Entregador' ? 'ET' : 'CO'}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{userRole}</p>
                <p className="text-[9px] text-gray-600 uppercase tracking-widest leading-none">{activeDistributorName}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-red-100/80 hover:bg-red-200 text-red-700 font-bold text-[11px] uppercase tracking-wider transition-all border border-red-300/40 cursor-pointer"
              title="Sair do Sistema"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Sair da Aplicação</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-72 bg-gray-100 text-gray-800 sticky top-0 h-screen overflow-y-auto shrink-0 border-r border-gray-250">
      {/* Brand Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3 w-full">
        {/* Gray background icon on the left representing the M and arrow logo */}
        <div className="p-1.5 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 w-11 h-11 border border-gray-200 shadow-3xs">
          <svg viewBox="0 0 120 100" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left dark column */}
            <path d="M 12 35 C 12 28, 28 28, 28 35 L 28 85 C 28 85, 12 85, 12 85 Z" fill="#0c1e45" />
            {/* Right dark column */}
            <path d="M 92 50 C 92 45, 108 45, 108 50 L 108 85 Z" fill="#0c1e45" />
            {/* Bright blue arrow that forms the V-connection and points to top right */}
            <path
              d="M 20 40 L 58 80 L 105 25"
              stroke="#1e62ec"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Arrow Head */}
            <path
              d="M 85 24 L 110 20 L 105 45"
              stroke="#1e62ec"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        {/* Texts on the right */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[18px] font-black tracking-wider text-blue-600 leading-none">MOVIX</span>
            <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1 rounded-sm leading-none py-0.5">V 1.2</span>
          </div>
          <span className="text-[9px] font-bold text-gray-700 tracking-tight mt-1 leading-tight">
            Gestão Inteligente de Estoque
          </span>
          <div className="flex items-center gap-1 bg-sky-50 border border-sky-500 text-sky-800 font-bold text-[9px] tracking-wider px-2 py-0.5 rounded mt-1.5 w-fit">
            <span className={`w-1.5 h-1.5 rounded-full bg-sky-500 ${isLoading ? 'animate-ping' : ''}`} />
            {isLoading ? 'SINCRONIZANDO' : 'SUPABASE CONECTADO'}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6">
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-slate-800">
          <div className="bg-yellow-100 rounded-lg px-2.5 py-1.5 flex items-center gap-2 mb-2.5">
            <span className="material-symbols-outlined text-yellow-700 text-sm font-bold">visibility</span>
            <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">Visão Geral</p>
          </div>
          <div className="space-y-1">
            {userRole !== 'Administrativo' && userRole !== 'Logístico' && userRole !== 'Conferencia' && (
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  setSelectedAction(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeView === 'dashboard' && !selectedAction
                    ? 'bg-yellow-400 text-slate-950 font-extrabold shadow-sm border border-yellow-500'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span>Painel Adm</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveView('movements');
                setSelectedAction(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'movements' && !selectedAction
                  ? 'bg-yellow-400 text-slate-950 font-extrabold shadow-sm border border-yellow-500'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
              <span>Movimentações</span>
            </button>

            <button
              onClick={() => {
                setActiveView('logistic_dashboard');
                setSelectedAction(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'logistic_dashboard' && !selectedAction
                  ? 'bg-yellow-400 text-slate-950 font-extrabold shadow-sm border border-yellow-500'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveView('suporte');
                setSelectedAction(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeView === 'suporte' && !selectedAction
                  ? 'bg-yellow-400 text-slate-950 font-extrabold shadow-sm border border-yellow-500'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
              <span>Suporte</span>
            </button>
          </div>
        </div>

        {/* AÇÕES */}
        <div ref={actionsRef} className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-slate-800">
          <div 
            onClick={() => {
              const nextVal = !isActionsOpen;
              setIsActionsOpen(nextVal);
              if (nextVal) {
                setIsCadastrosOpen(false);
                setIsReportsOpen(false);
              }
            }}
            className="bg-blue-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between cursor-pointer select-none hover:bg-blue-200/80 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700 text-sm font-bold">bolt</span>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Ações</p>
            </div>
            <span className="material-symbols-outlined text-blue-700 text-[16px] font-bold">
              {isActionsOpen ? 'expand_less' : 'expand_more'}
            </span>
          </div>
          {isActionsOpen && (
            <div className="space-y-1 mt-2.5">
              {[
                { id: 'criar_transporte', label: 'Criar Transporte', icon: 'add_road' },
                { id: 'veiculo_entrega', label: 'Veículo em Entrega', icon: 'local_shipping' },
                { id: 'conferencia', label: 'Conferência', icon: 'fact_check' },
                { id: 'contagem_cliente', label: 'Contagem em Cliente', icon: 'calculate' },
              ].filter(act => {
                if (userRole === 'Administrativo' && act.id === 'contagem_cliente') return false;
                if (userRole === 'Logístico' && (act.id === 'conferencia' || act.id === 'contagem_cliente')) return false;
                if (userRole === 'Conferencia' && act.id !== 'conferencia') return false;
                return true;
              }).map(act => {
                const isActive = selectedAction === act.id;
                const isLocked = isInventoryLocked && (act.id === 'criar_transporte' || act.id === 'conferencia');
                return (
                  <button
                    key={act.id}
                    disabled={isLocked}
                    onClick={() => {
                      if (isLocked) {
                        alert("Aviso de Bloqueio Sistêmico Ativo: Não é possível acessar as ações de movimentação de estoque ou transporte enquanto houver um inventário ativo.");
                      } else {
                        setSelectedAction(act.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      isLocked
                        ? 'text-gray-400 bg-gray-50/50 cursor-not-allowed opacity-60'
                        : isActive
                        ? 'text-white bg-blue-600 font-bold shadow-sm shadow-blue-500/10'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{act.icon}</span>
                    <span className="flex-1 text-left">{act.label}</span>
                    {isLocked && <span className="text-[10px]">🔒</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CADASTROS */}
        {userRole !== 'Logístico' && userRole !== 'Conferencia' && (
          <div ref={cadastrosRef} className={`bg-gray-100 border border-gray-200 rounded-xl p-3 text-slate-800 ${isInventoryLocked ? 'opacity-60' : ''}`}>
            <div 
              onClick={() => {
                if (isInventoryLocked) {
                  alert("Aviso de Bloqueio Sistêmico Ativo: Não é possível acessar as ações de cadastro enquanto houver um inventário ativo.");
                  return;
                }
                const nextVal = !isCadastrosOpen;
                setIsCadastrosOpen(nextVal);
                if (nextVal) {
                  setIsActionsOpen(false);
                  setIsReportsOpen(false);
                  setActiveView('cadastros');
                  setActiveCadastroTab('produtos');
                  setSelectedAction(null);
                }
              }}
              className={`bg-emerald-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between cursor-pointer select-none hover:bg-emerald-200/80 transition-all ${isInventoryLocked ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-sm font-bold">database</span>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                  Cadastros
                  {isInventoryLocked && <span className="text-[10px]">🔒</span>}
                </p>
              </div>
              <span className="material-symbols-outlined text-emerald-700 text-[16px] font-bold">
                {isInventoryLocked ? 'lock' : (isCadastrosOpen ? 'expand_less' : 'expand_more')}
              </span>
            </div>
            {!isInventoryLocked && isCadastrosOpen && (
              <div className="space-y-1 mt-2.5">
                {[
                  { id: 'produtos' as const, label: 'Produtos', icon: 'inventory_2' },
                  { id: 'clientes' as const, label: 'Clientes', icon: 'groups' },
                  { id: 'fornecedores' as const, label: 'Fornecedores', icon: 'store' },
                  { id: 'funcionarios' as const, label: 'Funcionários', icon: 'badge' },
                  { id: 'veiculos' as const, label: 'Veículos', icon: 'local_shipping' },
                  { id: 'rotas_entrega' as const, label: 'Rota de Entrega', icon: 'route' },
                  { id: 'rotas_contagem' as const, label: 'Rota de Contagem', icon: 'pin_drop' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveView('cadastros');
                      setActiveCadastroTab(tab.id);
                      setSelectedAction(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      activeView === 'cadastros' && activeCadastroTab === tab.id
                        ? 'text-white bg-emerald-600 font-bold shadow-sm shadow-emerald-500/10'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RELATÓRIOS */}
        <div ref={reportsRef} className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-slate-800">
          <div 
            onClick={() => {
              const nextVal = !isReportsOpen;
              setIsReportsOpen(nextVal);
              if (nextVal) {
                setIsActionsOpen(false);
                setIsCadastrosOpen(false);
                setActiveView('reports');
                setReportsTab('transports');
                setSelectedAction(null);
              }
            }}
            className="bg-orange-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between cursor-pointer select-none hover:bg-orange-200/80 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-700 text-sm font-bold">bar_chart</span>
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Relatórios</p>
            </div>
            <span className="material-symbols-outlined text-orange-700 text-[16px] font-bold">
              {isReportsOpen ? 'expand_less' : 'expand_more'}
            </span>
          </div>
          {isReportsOpen && (
            <div className="space-y-1 mt-2.5">
              <button
                onClick={() => {
                  setActiveView('reports');
                  setReportsTab('transports');
                  setSelectedAction(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'reports' && reportsTab === 'transports'
                    ? 'text-white bg-orange-500 font-bold shadow-sm shadow-orange-500/10'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">list_alt</span>
                <span>Transportes Liquidados</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('reports');
                  setReportsTab('movements');
                  setSelectedAction(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'reports' && reportsTab === 'movements'
                    ? 'text-white bg-orange-500 font-bold shadow-sm shadow-orange-500/10'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>Movimentações</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('reports');
                  setReportsTab('sobra_clientes');
                  setSelectedAction(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'reports' && reportsTab === 'sobra_clientes'
                    ? 'text-white bg-orange-500 font-bold shadow-sm shadow-orange-500/10'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">report_problem</span>
                <span>Sobra em Clientes</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('reports');
                  setReportsTab('saldo_loja');
                  setSelectedAction(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'reports' && reportsTab === 'saldo_loja'
                    ? 'text-white bg-orange-500 font-bold shadow-sm shadow-orange-500/10'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">storefront</span>
                <span>Saldo em Loja</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('reports');
                  setReportsTab('contagem_loja');
                  setSelectedAction(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'reports' && reportsTab === 'contagem_loja'
                    ? 'text-white bg-orange-500 font-bold shadow-sm shadow-orange-500/10'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">calculate</span>
                <span>Contagem em Loja</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('reports');
                  setReportsTab('contagem_doc');
                  setSelectedAction(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'reports' && reportsTab === 'contagem_doc'
                    ? 'text-white bg-orange-500 font-bold shadow-sm shadow-orange-500/10'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                <span>Doc. Contagem</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('reports');
                  setReportsTab('saldo_vs_contagem');
                  setSelectedAction(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'reports' && reportsTab === 'saldo_vs_contagem'
                    ? 'text-white bg-orange-500 font-bold shadow-sm shadow-orange-500/10'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
                <span>Saldo vs Contagem</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* User Footer block */}
      <div className="p-4 border-t border-gray-400 bg-gray-200 mt-auto">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-extrabold text-sm border border-gray-300">
              MV
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Admin Central</p>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest leading-none">{activeDistributorName}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
