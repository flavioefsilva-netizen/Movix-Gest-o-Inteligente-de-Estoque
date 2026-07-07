'use client';

import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { CountDocument, Client, Product } from '../lib/types';

export default function ContagemClienteModal() {
  const {
    getLoggedInUserName,
    deliveryRoutes,
    clients,
    products,
    addCountDocument,
    updateCountDocument,
    countDocuments,
    updateClient,
    setSelectedAction,
    countingRoutes,
    updateCountingRoute,
    userRole,
    setUserRole
  } = useApp();

  const loggedInUser = getLoggedInUserName() || 'Marta TI';

  // Modal Views: 'SELECT_ROUTE' | 'CONTAGEM_ABERTO' | 'LANCAR_CLIENTE' | 'SUMMARY'
  const [step, setStep] = useState<'SELECT_ROUTE' | 'CONTAGEM_ABERTO' | 'LANCAR_CLIENTE' | 'SUMMARY'>('SELECT_ROUTE');

  // Selected state
  const [selectedRouteNum, setSelectedRouteNum] = useState<string>('');
  const [activeDoc, setActiveDoc] = useState<CountDocument | null>(null);
  
  // Current client being launched
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientClosed, setClientClosed] = useState<boolean>(false);
  const [registerZero, setRegisterZero] = useState<boolean>(false);
  const [contagemTiming, setContagemTiming] = useState<string>('');
  
  // Map of client counts for the active session: { [productId]: { cheio: number, vazio: number } }
  const [localProductCounts, setLocalProductCounts] = useState<{
    [productId: string]: { cheio: number; vazio: number };
  }>({});

  // Confirmation state
  const [showConfirmFinish, setShowConfirmFinish] = useState<boolean>(false);

  // Validation Error Message for LANCAR_CLIENTE with 4 seconds duration
  const [saveError, setSaveError] = useState<string | null>(null);

  // Helper: Get formatted date DD/MM/YYYY
  const getFormattedDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // 1. SELECT_ROUTE: Handles selecting route and starting/resuming document
  const handleConfirmRoute = () => {
    if (!selectedRouteNum) return;

    const formattedDate = getFormattedDate();
    const docId = `${formattedDate.replace(/\//g, '')}-${selectedRouteNum}`;

    // Filter clients belonging to this route
    const matchedClients = clients.filter(
      (c) => String(c.rotaContagem) === String(selectedRouteNum)
    );

    // Look for existing document in state
    const existingDoc = countDocuments.find((d) => d.id === docId);

    if (existingDoc) {
      setActiveDoc(existingDoc);
    } else {
      // Create new document
      const initialStatuses: { [clientId: string]: 'NÃO CONTADO' | 'CONTADO' | 'FECHADO' } = {};
      const initialCounts: { [clientId: string]: { [productId: string]: { cheio: number; vazio: number } } } = {};
      const initialClosedFlags: { [clientId: string]: boolean } = {};
      const initialContagemTiming: { [clientId: string]: string } = {};

      matchedClients.forEach((c) => {
        initialStatuses[c.id] = 'NÃO CONTADO';
        initialClosedFlags[c.id] = false;
        initialContagemTiming[c.id] = '';
        initialCounts[c.id] = {};
        
        // Initialize all products to 0 or check if they have existing contagemEstoque
        products.forEach((p) => {
          const existingCheio = c.contagemEstoque?.[p.id]?.cheio ?? 0;
          const existingVazio = c.contagemEstoque?.[p.id]?.vazio ?? 0;
          initialCounts[c.id][p.id] = { cheio: existingCheio, vazio: existingVazio };
        });
      });

      const newDoc: CountDocument = {
        id: docId,
        date: formattedDate,
        employeeName: loggedInUser,
        route: selectedRouteNum,
        totalClients: matchedClients.length,
        status: 'Aberto',
        clientStatuses: initialStatuses,
        clientCounts: initialCounts,
        clientClosedFlags: initialClosedFlags,
        clientContagemTiming: initialContagemTiming
      };

      setActiveDoc(newDoc);
    }

    // Modify selected counting route status to 'Em contagem'
    const routeObj = countingRoutes.find((r) => String(r.numeroRota) === String(selectedRouteNum));
    if (routeObj) {
      updateCountingRoute({
        ...routeObj,
        statusRotaContagem: 'Em contagem'
      });
    }

    setStep('CONTAGEM_ABERTO');
  };

  // 2. CONTAGEM_ABERTO: Click "LANÇAR" on a client
  const handleLaunchClient = (client: Client) => {
    if (!activeDoc) return;
    setCurrentClient(client);
    
    const closedFlag = activeDoc.clientClosedFlags[client.id] || false;
    setClientClosed(closedFlag);
    setRegisterZero(false);

    const savedTiming = activeDoc.clientContagemTiming?.[client.id] || '';
    setContagemTiming(savedTiming);

    const counts: typeof localProductCounts = {};
    products.forEach((p) => {
      const savedCount = activeDoc.clientCounts[client.id]?.[p.id] || { cheio: 0, vazio: 0 };
      counts[p.id] = { ...savedCount };
    });

    setLocalProductCounts(counts);
    setStep('LANCAR_CLIENTE');
  };

  // 3. LANCAR_CLIENTE: Click "Salvar" inside launch client
  const handleSaveClientCounts = () => {
    if (!activeDoc || !currentClient) return;

    if (!contagemTiming) {
      setSaveError("Por favor, preencha o campo obrigatório: 'Quando foi feita a contagem'");
      setTimeout(() => {
        setSaveError(null);
      }, 4000);
      return;
    }

    const updatedStatuses = { ...activeDoc.clientStatuses };
    const updatedCounts = { ...activeDoc.clientCounts };
    const updatedClosedFlags = { ...activeDoc.clientClosedFlags };
    const updatedContagemTiming = { ...(activeDoc.clientContagemTiming || {}) };

    updatedClosedFlags[currentClient.id] = clientClosed;
    updatedContagemTiming[currentClient.id] = contagemTiming;
    
    if (clientClosed) {
      updatedStatuses[currentClient.id] = 'FECHADO';
      // Reset count entries if client is closed
      updatedCounts[currentClient.id] = {};
      products.forEach((p) => {
        updatedCounts[currentClient.id][p.id] = { cheio: 0, vazio: 0 };
      });
    } else {
      updatedStatuses[currentClient.id] = 'CONTADO';
      if (registerZero) {
        updatedCounts[currentClient.id] = {};
        products.forEach((p) => {
          updatedCounts[currentClient.id][p.id] = { cheio: 0, vazio: 0 };
        });
      } else {
        updatedCounts[currentClient.id] = { ...localProductCounts };
      }
    }

    const updatedDoc: CountDocument = {
      ...activeDoc,
      clientStatuses: updatedStatuses,
      clientCounts: updatedCounts,
      clientClosedFlags: updatedClosedFlags,
      clientContagemTiming: updatedContagemTiming
    };

    setActiveDoc(updatedDoc);
    setStep('CONTAGEM_ABERTO');
    setCurrentClient(null);
  };

  // 4. CONTAGEM_ABERTO: Click "Salvar Alterações"
  const handleSaveDocumentDraft = () => {
    if (!activeDoc) return;

    // Persist doc in context (either add or update)
    const exists = countDocuments.some((d) => d.id === activeDoc.id);
    if (exists) {
      updateCountDocument(activeDoc);
    } else {
      addCountDocument(activeDoc);
    }

    // Apply client changes to the global clients state
    const formattedDate = getFormattedDate();
    Object.keys(activeDoc.clientStatuses).forEach((clientId) => {
      const clientObj = clients.find((c) => c.id === clientId);
      if (clientObj) {
        const isClosed = activeDoc.clientClosedFlags[clientId] || false;
        const statusStr = activeDoc.clientStatuses[clientId];

        // Sum of all full + empty units
        let totalCount = 0;
        const contagemEstoqueUpdate: NonNullable<Client['contagemEstoque']> = {};

        products.forEach((p) => {
          const counts = activeDoc.clientCounts[clientId]?.[p.id] || { cheio: 0, vazio: 0 };
          contagemEstoqueUpdate[p.id] = {
            cheio: counts.cheio,
            vazio: counts.vazio,
            dataContagem: formattedDate
          };
          totalCount += (counts.cheio + counts.vazio);
        });

        const updatedClientData: Client = {
          ...clientObj,
          statusDuranteContagem: statusStr,
          statusFinalContagem: statusStr,
          saldoContagem: totalCount,
          contagemEstoque: contagemEstoqueUpdate
        };

        updateClient(updatedClientData);
      }
    });

    // Return to SELECT_ROUTE screen
    setStep('SELECT_ROUTE');
  };

  // 5. CONTAGEM_ABERTO: Click "Finalizar Contagem" -> opens summary calculation screen
  const handleOpenSummary = () => {
    if (!activeDoc) return;
    setStep('SUMMARY');
  };

  // 6. SUMMARY: Click "Confirmar" to finish document
  const handleFinalizeDocument = () => {
    if (!activeDoc) return;

    const total = activeDoc.totalClients;
    let counted = 0;
    let closed = 0;
    let uncounted = 0;

    Object.values(activeDoc.clientStatuses).forEach((status) => {
      if (status === 'CONTADO') counted++;
      else if (status === 'FECHADO') closed++;
      else uncounted++;
    });

    const aderencia = total > 0 ? (counted / total) * 100 : 0;
    const fechadosPerc = total > 0 ? (closed / total) * 100 : 0;

    const finalizedDoc: CountDocument = {
      ...activeDoc,
      status: 'Finalizado',
      countsSummary: {
        totalClients: total,
        contados: counted,
        naoContados: uncounted,
        fechados: closed,
        aderencia,
        fechadosPerc
      }
    };

    // Update state & save finalized
    const exists = countDocuments.some((d) => d.id === finalizedDoc.id);
    if (exists) {
      updateCountDocument(finalizedDoc);
    } else {
      addCountDocument(finalizedDoc);
    }

    // Apply finalized client status changes to global clients state
    const formattedDate = getFormattedDate();
    Object.keys(activeDoc.clientStatuses).forEach((clientId) => {
      const clientObj = clients.find((c) => c.id === clientId);
      if (clientObj) {
        const isClosed = activeDoc.clientClosedFlags[clientId] || false;
        const statusStr = activeDoc.clientStatuses[clientId];

        let totalCount = 0;
        const contagemEstoqueUpdate: NonNullable<Client['contagemEstoque']> = {};

        products.forEach((p) => {
          const counts = activeDoc.clientCounts[clientId]?.[p.id] || { cheio: 0, vazio: 0 };
          contagemEstoqueUpdate[p.id] = {
            cheio: counts.cheio,
            vazio: counts.vazio,
            dataContagem: formattedDate
          };
          totalCount += (counts.cheio + counts.vazio);
        });

        const updatedClientData: Client = {
          ...clientObj,
          statusDuranteContagem: statusStr,
          statusFinalContagem: statusStr,
          saldoContagem: totalCount,
          contagemEstoque: contagemEstoqueUpdate
        };

        updateClient(updatedClientData);
      }
    });

    // Modify counting route status to 'Finalizada'
    const routeObj = countingRoutes.find((r) => String(r.numeroRota) === String(activeDoc.route));
    if (routeObj) {
      updateCountingRoute({
        ...routeObj,
        statusRotaContagem: 'Finalizada'
      });
    }

    if (userRole === 'Comercial') {
      setStep('SELECT_ROUTE');
      setSelectedRouteNum('');
      setActiveDoc(null);
    } else {
      setSelectedAction(null);
    }
  };

  // Helper: check if a route has suffered any client status changes
  const isRouteModified = (routeNum: number) => {
    // 1. Check if any client belonging to this route has a status other than "NÃO CONTADO"
    const routeClients = clients.filter((c) => String(c.rotaContagem) === String(routeNum));
    const hasModifiedClient = routeClients.some((c) => c.statusDuranteContagem && c.statusDuranteContagem !== 'NÃO CONTADO');
    if (hasModifiedClient) return true;

    // 2. Check in countDocuments list
    const doc = countDocuments.find((d) => String(d.route) === String(routeNum));
    if (doc) {
      const hasModifiedInDoc = Object.values(doc.clientStatuses).some((st) => st !== 'NÃO CONTADO');
      if (hasModifiedInDoc) return true;
    }
    return false;
  };

  // Helper: render a beautiful circular progress indicator for final statistics
  const renderCircleProgress = (percentage: number, label: string, strokeColor: string, textColorClass: string) => {
    const radius = 36;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-gray-200 shadow-3xs min-w-[120px] w-full h-full">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-gray-200 fill-none"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="fill-none transition-all duration-500 ease-out"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute text-xs font-black tracking-tight ${textColorClass}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center mt-2.5 block">
          {label}
        </span>
      </div>
    );
  };

  // Filter clients belonging to the active route
  const activeRouteClients = activeDoc
    ? clients.filter((c) => String(c.rotaContagem) === String(activeDoc.route))
    : [];

  // Sort: NÃO CONTADO (first) -> FECHADO (second) -> CONTADO (last)
  const getSortedClients = (list: Client[]) => {
    if (!activeDoc) return list;
    return [...list].sort((a, b) => {
      const statusA = activeDoc.clientStatuses[a.id] || 'NÃO CONTADO';
      const statusB = activeDoc.clientStatuses[b.id] || 'NÃO CONTADO';

      const rank = {
        'NÃO CONTADO': 1,
        'FECHADO': 2,
        'CONTADO': 3
      };

      return rank[statusA] - rank[statusB];
    });
  };

  const sortedClients = getSortedClients(activeRouteClients);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl overflow-hidden border border-orange-200 shadow-2xl flex flex-col h-[90vh] my-4">
        
        {/* ========================================================= */}
        {/* VIEW 1: SELECT_ROUTE ("INICIAR CONTAGEM DE ROTA")         */}
        {/* ========================================================= */}
        {step === 'SELECT_ROUTE' && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-yellow-400 px-6 py-4 flex items-center justify-between text-slate-950 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-slate-950 text-2xl">route</span>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-950">Iniciar Contagem de Rota</h3>
                  <p className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wider">
                    Selecione uma rota de entrega para iniciar a contagem física nos clientes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Profile type selector */}
                <div className="flex items-center gap-1.5">
                  <label htmlFor="user-profile-select-contagem" className="text-[9px] font-extrabold uppercase tracking-widest text-slate-850 hidden sm:inline">Perfil:</label>
                  <select
                    id="user-profile-select-contagem"
                    value={userRole || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserRole(val || null);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 border border-yellow-600 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-yellow-700 outline-none cursor-pointer shadow-3xs"
                    title="Mudar Tipo de Perfil"
                  >
                    <option value="Gerencial">Gerencial</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Logístico">Logístico</option>
                    <option value="Entregador">Entregador</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Conferencia">Conferência</option>
                  </select>
                </div>
                {userRole !== 'Comercial' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAction(null)}
                    className="text-slate-950 hover:text-black/70 transition-colors p-1.5 rounded-full hover:bg-black/10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined font-bold text-xl">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-yellow-50/50">
              <div className="max-w-xl mx-auto bg-yellow-50 border border-yellow-200 p-6 rounded-2xl shadow-sm space-y-6">
                
                {/* Logged in employee */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-yellow-800 uppercase tracking-widest block">
                    Funcionário Responsável
                  </label>
                  <input
                    type="text"
                    value={loggedInUser}
                    disabled
                    readOnly
                    className="w-full bg-yellow-100/50 border border-yellow-200 text-yellow-950 font-bold text-xs py-2 px-3 rounded-lg cursor-not-allowed"
                  />
                </div>

                {/* Squares Grid selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-yellow-800 uppercase tracking-widest block">
                    Selecione no Quadrante de Rotas
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {countingRoutes
                      .filter((route) => {
                        const status = (route.statusRotaContagem || '').trim().toLowerCase();
                        return status === 'em contagem' || status === 'disponível' || status === 'disponivel';
                      })
                      .sort((a, b) => Number(a.numeroRota) - Number(b.numeroRota))
                      .map((route) => {
                        const rNumStr = String(route.numeroRota);
                        const isSelected = selectedRouteNum === rNumStr;
                        const isModified = isRouteModified(route.numeroRota);
                        
                        return (
                          <div key={route.id} className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setSelectedRouteNum(rNumStr)}
                              style={{ width: '69px', height: '59px' }}
                              className={`flex flex-col items-center justify-center rounded-xl border-2 transition-all p-1.5 ${
                                isSelected
                                  ? 'border-yellow-400 bg-yellow-400 text-slate-950 font-black shadow-xs'
                                  : 'border-yellow-400 bg-white text-slate-900 hover:bg-yellow-50'
                              }`}
                            >
                              <span className={`text-[9px] uppercase font-bold block mb-0.5 ${isSelected ? 'text-slate-950/70' : 'text-yellow-600'}`}>Rota</span>
                              <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-slate-950' : 'text-slate-900'}`}>{route.numeroRota}</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0">
              {userRole !== 'Comercial' && (
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirmRoute}
                disabled={!selectedRouteNum}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  selectedRouteNum
                    ? 'bg-yellow-400 text-slate-950 hover:bg-yellow-500 shadow-sm'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CONTAGEM_ABERTO ("CONTAGEM EM ABERTO")            */}
        {/* ========================================================= */}
        {step === 'CONTAGEM_ABERTO' && activeDoc && (() => {
          const totalClientsCount = activeDoc.totalClients;
          let countedClientsCount = 0;
          Object.values(activeDoc.clientStatuses).forEach((status) => {
            if (status === 'CONTADO') {
              countedClientsCount++;
            }
          });
          const adherencePercent = totalClientsCount > 0 ? (countedClientsCount / totalClientsCount) * 100 : 0;

          return (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-yellow-400 px-6 py-4 flex items-center justify-between text-slate-950 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-slate-950 text-2xl">pending_actions</span>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-slate-950">CONTAGEM EM ABERTO</h3>
                    <p className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wider">
                      Lançamento de contagens físicas por cliente
                    </p>
                  </div>
                </div>
                {userRole !== 'Comercial' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAction(null)}
                    className="text-slate-950 hover:text-black/70 transition-colors p-1.5 rounded-full hover:bg-black/10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined font-bold text-xl">close</span>
                  </button>
                )}
              </div>

              {/* Document Header Metadata info */}
              <div className="bg-yellow-50/75 border-b border-yellow-200 px-6 py-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-yellow-800">Funcionário</p>
                  <p className="font-extrabold text-slate-800">{activeDoc.employeeName}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-yellow-800">Nº do Documento</p>
                  <p className="font-extrabold text-slate-800 font-mono">{activeDoc.id}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-yellow-800">Rota de Contagem</p>
                  <p className="font-extrabold text-slate-800 font-bold">Rota {activeDoc.route}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-yellow-800">Total de Clientes</p>
                  <p className="font-extrabold text-slate-800">{activeDoc.totalClients}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-yellow-800">Aderência</p>
                  <p className="font-extrabold text-slate-800">{adherencePercent.toFixed(1)}%</p>
                </div>
              </div>

              {/* Table Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  {sortedClients.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 italic text-xs">
                      Nenhum cliente cadastrado nesta rota para contagem.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] bg-gray-50/50">
                          <th className="py-2.5 px-4 text-center">Status Contagem</th>
                          <th className="py-2.5 px-4">Matrícula</th>
                          <th className="py-2.5 px-4">Razão Social</th>
                          <th className="py-2.5 px-4">CNPJ</th>
                          <th className="py-2.5 px-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedClients.map((c) => {
                          const status = activeDoc.clientStatuses[c.id] || 'NÃO CONTADO';
                          
                          // Status styling helper
                          let statusBadgeClass = 'text-amber-600 bg-amber-50 border-amber-200';
                          let lancarBtnClass = 'bg-amber-500 hover:bg-amber-600 text-slate-950';
                          
                          if (status === 'CONTADO') {
                            statusBadgeClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                            lancarBtnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
                          } else if (status === 'FECHADO') {
                            statusBadgeClass = 'text-rose-600 bg-rose-50 border-rose-200';
                            lancarBtnClass = 'bg-red-600 hover:bg-red-700 text-white';
                          }

                          return (
                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors font-bold text-[11px] text-slate-800">
                              <td className="py-2 px-4 text-center whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase ${statusBadgeClass}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="py-2 px-4 font-mono font-bold text-black">{c.matricula}</td>
                              <td className="py-2 px-4 uppercase font-bold text-slate-900">{c.razaoSocial}</td>
                              <td className="py-2 px-4 font-mono font-bold text-black">{c.cnpj}</td>
                              <td className="py-2 px-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleLaunchClient(c)}
                                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${lancarBtnClass}`}
                                >
                                  Lançar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="bg-gray-100 border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={handleOpenSummary}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  Finalizar Contagem
                </button>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('SELECT_ROUTE');
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-bold transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDocumentDraft}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================= */}
        {/* VIEW 3: LANCAR_CLIENTE ("LANÇAR CONTAGEM EM CLIENTE")    */}
        {/* ========================================================= */}
        {step === 'LANCAR_CLIENTE' && currentClient && activeDoc && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-yellow-400 px-6 py-4 flex items-center justify-between text-slate-950 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-slate-950 text-2xl">edit_document</span>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-950">LANÇAR CONTAGEM EM CLIENTE</h3>
                  <p className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wider">
                    {currentClient.matricula} - {currentClient.razaoSocial}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('CONTAGEM_ABERTO')}
                className="text-slate-950 hover:text-black/70 transition-colors p-1.5 rounded-full hover:bg-black/10 flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Validation Error Message for LANCAR_CLIENTE */}
            {saveError && (
              <div className="mx-6 mt-4 mb-0 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black p-3.5 rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-rose-600 text-base font-bold">warning</span>
                <span>{saveError}</span>
              </div>
            )}

            {/* Content with Products listing and Side Actions */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                
                {/* Left: Materials Table */}
                <div className={`lg:col-span-3 transition-opacity duration-200 ${clientClosed || registerZero ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px] bg-gray-50/50">
                          <th className="py-2.5 px-4">Descrição do Material</th>
                          <th className="py-2.5 px-4 text-center">Unidade</th>
                          <th className="py-2.5 px-4 text-center w-28 text-orange-600">Contagem Cheio</th>
                          <th className="py-2.5 px-4 text-center w-28 text-blue-600">Contagem Vazio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((p) => {
                          const counts = localProductCounts[p.id] || { cheio: 0, vazio: 0 };
                          
                          return (
                            <tr key={p.id} className="transition-colors font-bold text-[11px] text-slate-800 hover:bg-gray-50/20">
                              <td className="py-2.5 px-4 uppercase">{p.description}</td>
                              <td className="py-2.5 px-4 text-center">{p.unit}</td>
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={clientClosed || registerZero}
                                  value={clientClosed || registerZero ? 0 : counts.cheio}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setLocalProductCounts((prev) => ({
                                      ...prev,
                                      [p.id]: { ...prev[p.id], cheio: val }
                                    }));
                                  }}
                                  className={`w-20 text-center font-bold text-xs py-1 px-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                    clientClosed || registerZero
                                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-orange-50/70 border-orange-200 text-orange-950 font-black'
                                  }`}
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={clientClosed || registerZero}
                                  value={clientClosed || registerZero ? 0 : counts.vazio}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setLocalProductCounts((prev) => ({
                                      ...prev,
                                      [p.id]: { ...prev[p.id], vazio: val }
                                    }));
                                  }}
                                  className={`w-20 text-center font-bold text-xs py-1 px-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    clientClosed || registerZero
                                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-blue-50/70 border-blue-200 text-blue-950 font-black'
                                  }`}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Side actions (Cliente Fechado & Registrar contagem Zero) */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Cliente Fechado */}
                  <div 
                    className={`border-2 rounded-xl p-4 transition-all ${
                      clientClosed 
                        ? 'bg-red-600 border-red-600 text-white' 
                        : 'bg-red-50 border-red-500 text-red-900'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={clientClosed}
                        onChange={(e) => {
                           const isChecked = e.target.checked;
                           setClientClosed(isChecked);
                           if (isChecked) {
                             setRegisterZero(false);
                           }
                        }}
                        className={`mt-1 h-5 w-5 rounded border-gray-300 ${
                          clientClosed 
                            ? 'text-red-600 bg-white border-white focus:ring-0 focus:ring-offset-0' 
                            : 'text-red-600 focus:ring-red-500'
                        }`}
                      />
                      <div>
                        <span className="text-[10px] font-black uppercase block tracking-wider">
                          Cliente Fechado
                        </span>
                        <p className={`text-[10px] mt-1 leading-snug font-medium ${clientClosed ? 'text-red-100' : 'text-red-700'}`}>
                          Cliente fechado ou não acessível
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Registrar contagem Zero */}
                  <div 
                    className={`border-2 rounded-xl p-4 transition-all ${
                      registerZero 
                        ? 'bg-yellow-400 border-orange-500 text-yellow-950' 
                        : 'bg-yellow-50 border-yellow-400 text-yellow-950'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={registerZero}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setRegisterZero(isChecked);
                          if (isChecked) {
                            setClientClosed(false);
                            // Zero counts immediately
                            const cleared: typeof localProductCounts = {};
                            products.forEach((p) => {
                              cleared[p.id] = { cheio: 0, vazio: 0 };
                            });
                            setLocalProductCounts(cleared);
                          }
                        }}
                        className={`mt-1 h-5 w-5 rounded border-gray-300 ${
                          registerZero 
                            ? 'text-yellow-600 bg-white border-orange-500 focus:ring-0 focus:ring-offset-0' 
                            : 'text-yellow-600 focus:ring-yellow-400'
                        }`}
                      />
                      <div>
                        <span className="text-[10px] font-black uppercase block tracking-wider">
                          Registrar contagem Zero
                        </span>
                        <p className={`text-[10px] mt-1 leading-snug font-medium ${registerZero ? 'text-yellow-900' : 'text-yellow-700'}`}>
                          Informar cliente sem nenhum product
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Quando foi feita a contagem - Campo Obrigatório */}
                  <div className="bg-slate-100 border-2 border-slate-200 rounded-xl p-4 space-y-2.5 shadow-3xs">
                    <label className="text-xs font-black uppercase block tracking-wider text-slate-800">
                      Quando foi feita a contagem? <span className="text-red-500 font-black">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setContagemTiming('Antes da Entrega')}
                        className={`py-2 px-3 text-xs font-black rounded-lg border-2 transition-all cursor-pointer ${
                          contagemTiming === 'Antes da Entrega'
                            ? 'bg-green-600 border-green-700 text-white shadow-xs font-black'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Antes da Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setContagemTiming('Depois da Entrega')}
                        className={`py-2 px-3 text-xs font-black rounded-lg border-2 transition-all cursor-pointer ${
                          contagemTiming === 'Depois da Entrega'
                            ? 'bg-green-600 border-green-700 text-white shadow-xs font-black'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Depois da Entrega
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-gray-100 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStep('CONTAGEM_ABERTO');
                  setCurrentClient(null);
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-bold transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleSaveClientCounts}
                className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-lg text-xs font-black uppercase transition-all shadow-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: SUMMARY ("Finalizar Contagem" Summary Window)      */}
        {/* ========================================================= */}
        {step === 'SUMMARY' && activeDoc && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-yellow-400 px-6 py-4 flex items-center justify-between text-slate-950 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-slate-950 text-2xl">check_circle</span>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-950">Resumo de Encerramento de Contagem</h3>
                  <p className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wider">
                    Revise as estatísticas e confirme o encerramento do Documento de Contagem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('CONTAGEM_ABERTO')}
                className="text-slate-950 hover:text-black/70 transition-colors p-1.5 rounded-full hover:bg-black/10 flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Calculations & Metrics Summary */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
              {(() => {
                const total = activeDoc.totalClients;
                let counted = 0;
                let closed = 0;
                let uncounted = 0;

                Object.values(activeDoc.clientStatuses).forEach((status) => {
                  if (status === 'CONTADO') counted++;
                  else if (status === 'FECHADO') closed++;
                  else uncounted++;
                });

                const aderencia = total > 0 ? (counted / total) * 100 : 0;
                const fechadosPerc = total > 0 ? (closed / total) * 100 : 0;

                return (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-2 text-center">
                        Estatísticas Finais da Rota {activeDoc.route}
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Responsável</p>
                          <p className="text-xs font-black text-slate-800 mt-1">{activeDoc.employeeName}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Documento de Contagem</p>
                          <p className="text-xs font-mono font-black text-slate-800 mt-1">{activeDoc.id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center items-center">
                        <div className="bg-orange-50/50 p-3.5 rounded-xl border border-orange-200 h-28 flex flex-col justify-center">
                          <span className="text-base font-black text-orange-600 block">{total}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mt-1">Total Clientes</span>
                        </div>
                        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 h-28 flex flex-col justify-center">
                          <span className="text-base font-black text-emerald-600 block">{counted}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mt-1">Contados</span>
                        </div>
                        <div className="bg-red-50/50 p-3.5 rounded-xl border border-red-200 h-28 flex flex-col justify-center">
                          <span className="text-base font-black text-red-600 block">{closed}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mt-1">Fechados</span>
                        </div>
                        <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 h-28 flex flex-col justify-center">
                          <span className="text-base font-black text-amber-600 block">{uncounted}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mt-1">Não Contados</span>
                        </div>
                        <div className="h-28 flex items-center justify-center">
                          {renderCircleProgress(aderencia, 'Aderência', '#10b981', 'text-emerald-600')}
                        </div>
                        <div className="h-28 flex items-center justify-center">
                          {renderCircleProgress(fechadosPerc, 'Fechados %', '#ef4444', 'text-red-600')}
                        </div>
                      </div>
                    </div>

                    {/* Final Dialog Confirmation Warning */}
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs font-bold flex gap-3 items-start">
                      <span className="material-symbols-outlined text-amber-600 flex-shrink-0">warning</span>
                      <p>
                        Atenção: Ao confirmar o encerramento, as alterações serão salvas definitivamente. 
                        Este documento de contagem mudará para o status <strong>FINALIZADO</strong>, 
                        bloqueando novas edições, e as estatísticas serão direcionadas para o Relatório de Contagem.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Buttons */}
            <div className="bg-gray-100 border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => setStep('CONTAGEM_ABERTO')}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-bold transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinalizeDocument}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Confirmar e Encerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
