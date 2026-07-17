'use client';

import React from 'react';
import { AppProvider, useApp } from '../lib/AppContext';
import LoginScreen from '../components/LoginScreen';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import MovementsView from '../components/MovementsView';
import CadastrosView from '../components/CadastrosView';
import ReportsView from '../components/ReportsView';
import LogisticDashboardView from '../components/LogisticDashboardView';
import SuporteView from '../components/SuporteView';
import CreateTransportModal from '../components/CreateTransportModal';
import VeiculoEntregaModal from '../components/VeiculoEntregaModal';
import LancarSaidaModal from '../components/LancarSaidaModal';
import ConferenciaModal from '../components/ConferenciaModal';
import ContagemClienteModal from '../components/ContagemClienteModal';
import ConfigSupabaseModal from '../components/ConfigSupabaseModal';

function AppShellContent() {
  const { authenticated, activeView, activeDistributor, setActiveView, selectedAction, setSelectedAction, userRole } = useApp();
  const prevRoleRef = React.useRef<string | null>(null);
  const prevAuthRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (authenticated) {
      if (userRole === 'Entregador') {
        if (selectedAction !== 'veiculo_entrega') {
          setSelectedAction('veiculo_entrega');
        }
      } else if (userRole === 'Comercial') {
        if (selectedAction !== 'contagem_cliente') {
          setSelectedAction('contagem_cliente');
        }
      }

      const roleChanged = userRole !== prevRoleRef.current;
      const authChanged = !prevAuthRef.current;
      if (roleChanged || authChanged) {
        if (['Conferencia', 'Logístico', 'Administrativo'].includes(userRole || '')) {
          setActiveView('movements');
        }
      }
    }
    prevRoleRef.current = userRole;
    prevAuthRef.current = authenticated;
  }, [authenticated, userRole, selectedAction, setSelectedAction, setActiveView]);

  // Route guard: If not logged-in, show login form
  if (!authenticated) {
    return <LoginScreen />;
  }

  // Dashboard Scaffolding layout once authenticated
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      
      {/* Sidebar (Tablet & Desktop size) */}
      <Sidebar />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top universal action header */}
        <Header />

        {/* Dynamic page container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto space-y-6">
          
          {/* Mobile navigation tab-bar helper (visible only on phone widths) */}
          <div className="md:hidden flex items-center justify-between bg-white border border-gray-200 rounded-xl p-2 shadow-3xs mb-4">
            {userRole !== 'Administrativo' && userRole !== 'Logístico' && userRole !== 'Conferencia' && (
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex-1 py-2 text-center rounded-lg font-bold text-[10px] uppercase transition-all flex flex-col items-center gap-0.5 ${
                  activeView === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                }`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
                <span>Home</span>
              </button>
            )}
            <button
              onClick={() => setActiveView('movements')}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-[10px] uppercase transition-all flex flex-col items-center gap-0.5 ${
                activeView === 'movements' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
              }`}
            >
              <span className="material-symbols-outlined text-lg">swap_horiz</span>
              <span>Movements</span>
            </button>
            {userRole !== 'Logístico' && userRole !== 'Conferencia' && (
              <button
                onClick={() => setActiveView('cadastros')}
                className={`flex-1 py-1.5 text-center rounded-lg font-bold text-[10px] uppercase transition-all flex flex-col items-center gap-0.5 ${
                  activeView === 'cadastros' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500'
                }`}
              >
                <span className="material-symbols-outlined text-lg">database</span>
                <span>Cadastros</span>
              </button>
            )}
            <button
              onClick={() => setActiveView('reports')}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-[10px] uppercase transition-all flex flex-col items-center gap-0.5 ${
                activeView === 'reports' ? 'bg-orange-50 text-orange-700' : 'text-gray-500'
              }`}
            >
              <span className="material-symbols-outlined text-lg">bar_chart</span>
              <span>Reports</span>
            </button>
          </div>

          {/* Conditional page viewers */}
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'movements' && <MovementsView />}
          {activeView === 'cadastros' && <CadastrosView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'logistic_dashboard' && <LogisticDashboardView />}
          {activeView === 'suporte' && <SuporteView />}

        </main>
      </div>

      {selectedAction === 'criar_transporte' && <CreateTransportModal />}
      {selectedAction === 'lancar_saida' && <LancarSaidaModal />}
      {selectedAction === 'veiculo_entrega' && <VeiculoEntregaModal />}
      {selectedAction === 'conferencia' && <ConferenciaModal />}
      {selectedAction === 'contagem_cliente' && <ContagemClienteModal />}
      <ConfigSupabaseModal />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppShellContent />
    </AppProvider>
  );
}
