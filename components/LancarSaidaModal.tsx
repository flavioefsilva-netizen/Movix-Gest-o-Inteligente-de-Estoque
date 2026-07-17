'use client';

import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { Transport, Client } from '../lib/types';

export default function LancarSaidaModal() {
  const {
    activeTransports,
    transports,
    products,
    clients,
    deliveryRoutes,
    setSelectedAction,
    updateActiveTransport,
    updateClient,
    updateProduct,
    userRole,
    getLoggedInUserName,
    setUserRole
  } = useApp();

  // State to track if we are viewing details of a specific transport
  const [viewingTrpDetail, setViewingTrpDetail] = useState<Transport | null>(null);
  const [lancarSaidaQuantities, setLancarSaidaQuantities] = useState<{ [productId: string]: string }>({});

  // Selected transport ID state for selectability
  const [selectedTrpId, setSelectedTrpId] = useState<string | null>(null);
  const [showLancarSaidaZeroQtyConfirm, setShowLancarSaidaZeroQtyConfirm] = useState(false);

  // Retirada States
  const [isCreatingRetirada, setIsCreatingRetirada] = useState(false);
  const [isLancingRetiradaQty, setIsLancingRetiradaQty] = useState(false);
  const [checkedRetiradaClientId, setCheckedRetiradaClientId] = useState<string | null>(null);
  const [retiradaSearchField, setRetiradaSearchField] = useState<'matricula' | 'razaoSocial' | 'cnpj' | 'rotaEntrega'>('matricula');
  const [retiradaSearchQuery, setRetiradaSearchQuery] = useState('');
  const [retiradaQuantities, setRetiradaQuantities] = useState<{ [productId: string]: string }>({});

  // Lancing Client state and fields
  const [lancingClient, setLancingClient] = useState<Client | null>(null);
  const [deliveryQuantities, setDeliveryQuantities] = useState<{ [productId: string]: number | '' }>({});
  const [pickupQuantities, setPickupQuantities] = useState<{ [productId: string]: number | '' }>({});
  const [isEntregaOkSemMov, setIsEntregaOkSemMov] = useState(false);
  const [isNaoRealizadaEntrega, setIsNaoRealizadaEntrega] = useState(false);

  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showSobrasModal, setShowSobrasModal] = useState(false);
  const [showSalvarESairWarning, setShowSalvarESairWarning] = useState(false);
  const [showFinalizeSummary, setShowFinalizeSummary] = useState(false);
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tempAlert, setTempAlert] = useState<string | null>(null);

  // Combine activeTransports and liquidated transports
  const displayTransports = [
    ...(activeTransports || []).filter(t => t.statusTransporte !== 'EXCLUIDO').map(t => ({
      id: t.id,
      number: t.number,
      vehicle: t.placa,
      driver: t.driver,
      status: t.statusTransporte || 'CRIADO',
      raw: t
    })),
    ...(transports || []).map(t => ({
      id: t.id,
      number: t.number,
      vehicle: t.placa,
      driver: t.driver,
      status: 'CONCLUIDO' as const,
      raw: {
        id: t.id,
        number: t.number,
        placa: t.placa,
        driver: t.driver,
        statusTransporte: 'LIQUIDADO' as const,
        selectedClientIds: t.clientsCount ? [] : [], // default
        stock: {},
        clienteTotal: t.clientsCount,
        clienteEntregue: t.delivered,
        clienteNaoEntregue: t.notDelivered,
        clienteEmEntrega: 0,
      } as any
    }))
  ];

  // Filter ONLY transports with status "CRIADO" as requested
  let filteredTransports = displayTransports.filter(t => {
    const s = t.status.toString().toUpperCase().replace('_', ' ');
    return s === 'CRIADO';
  });

  // If viewing details of a specific transport, render the detailed view with blue highlights
  if (viewingTrpDetail) {
    const handleConfirmLancarSaida = (bypassQtyCheck = false) => {
      if (!bypassQtyCheck) {
        const totalQty = products.reduce((sum, p) => sum + (parseInt(lancarSaidaQuantities[p.id] || '0', 10) || 0), 0);
        if (totalQty === 0) {
          setShowLancarSaidaZeroQtyConfirm(true);
          return;
        }
      }

      // 1. Calculate stock updates for products and update them
      products.forEach(p => {
        const oldQty = viewingTrpDetail.stock?.[p.id]?.veiculo || 0;
        const newQty = parseInt(lancarSaidaQuantities[p.id] || '0', 10) || 0;
        const diff = newQty - oldQty;

        if (diff !== 0) {
          const updatedProd = {
            ...p,
            initialStock: Math.max(0, p.initialStock - diff)
          };
          updateProduct(updatedProd);
        }
      });

      // 2. Build the updated stock object for the transport
      const updatedTransportStock: {
        [productId: string]: {
          veiculo: number;
          entrega: number;
          coleta: number;
          cliente: number;
          saidaEntrega?: number;
        };
      } = {};

      products.forEach(p => {
        const qtyOut = parseInt(lancarSaidaQuantities[p.id] || '0', 10) || 0;
        updatedTransportStock[p.id] = {
          veiculo: qtyOut,
          entrega: qtyOut,
          coleta: 0,
          cliente: 0,
          saidaEntrega: qtyOut
        };
      });

      // 3. Mark the transport status as 'SAIDA', update clients to 'Em Entrega'
      const clientIds = viewingTrpDetail.selectedClientIds || [];
      clientIds.forEach(cid => {
        const clientObj = clients.find(c => c.id === cid);
        if (clientObj) {
          updateClient({
            ...clientObj,
            statusEntrega: 'Em Entrega'
          });
        }
      });

      const updatedTransport: Transport = {
        ...viewingTrpDetail,
        statusTransporte: 'SAIDA' as any,
        stock: updatedTransportStock,
        observation: `Lançada Saída para Transporte. Quantidades confirmadas. Rota: ${viewingTrpDetail.route}`,
      };

      // 4. Update the active transport state
      updateActiveTransport(updatedTransport);

      // 5. Success feedback and close details
      setSuccessMessage(`Saída do Transporte ${viewingTrpDetail.number} lançada com sucesso!`);
      setViewingTrpDetail(null);
      setSelectedTrpId(null);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-[#f3f4f6] w-full max-w-4xl rounded-2xl overflow-hidden border border-blue-600/30 shadow-2xl flex flex-col h-[90vh] my-4">
          
          {/* Header Bar: Vibrant Blue */}
          <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0 relative">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-3xl font-bold">local_shipping</span>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider font-sans">Lançar Saída (Confirmar Carga)</h3>
                <p className="text-xs font-bold text-blue-100 mt-0.5">
                  Transporte Nº {viewingTrpDetail.number} | Placa: {viewingTrpDetail.placa} | Motorista: {viewingTrpDetail.driver}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => {
                setViewingTrpDetail(null);
                setSelectedTrpId(null);
              }}
              className="text-white hover:text-black/75 transition-colors p-1.5 rounded-full hover:bg-white/20 flex items-center justify-center"
            >
              <span className="material-symbols-outlined font-bold text-xl">close</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f3f4f6] flex flex-col justify-between">
            
            <div className="grid grid-cols-1 gap-6 items-stretch flex-1">
              {/* Column: "Produtos que Compõe esse Transporte" */}
              <div className="bg-white border border-blue-500 rounded-xl shadow-xs overflow-hidden flex flex-col self-stretch text-black text-[12px] font-bold">
                <div className="bg-gray-100 px-4 py-3 border-b border-blue-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">inventory_2</span>
                  <span className="text-[12px] font-black text-black uppercase tracking-widest">Produtos que Compõe esse Transporte</span>
                </div>
                
                <div className="overflow-x-auto flex-1 max-h-[50vh]">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-slate-50 text-black font-black uppercase text-[12px] border-b border-blue-150 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-4 w-[50%]">Descrição do Material</th>
                        <th className="py-2.5 px-4 text-center w-[25%]">Estoque Disponível</th>
                        <th className="py-2.5 px-3 text-center w-[25%]">Quantidade Saída</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...products].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })).map(p => {
                        const currentQtyOnTrp = viewingTrpDetail.stock?.[p.id]?.veiculo || 0;
                        const maxAvailable = p.initialStock + currentQtyOnTrp;
                        const val = lancarSaidaQuantities[p.id] || '';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            {/* Descrição do Material */}
                            <td className="py-2.5 px-4">
                              <p className="font-black text-black uppercase text-[12px]">{p.description}</p>
                            </td>

                            {/* Estoque Disponível */}
                            <td className="py-2.5 px-4 text-center font-bold text-slate-600">
                              {maxAvailable} {p.unit || 'UN'}
                            </td>
                            
                            {/* Quantidade Saída Input Field */}
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={val}
                                onChange={(e) => {
                                  const inputVal = e.target.value;
                                  const num = parseInt(inputVal, 10) || 0;
                                  if (num > maxAvailable) {
                                    setLancarSaidaQuantities(prev => ({
                                      ...prev,
                                      [p.id]: String(maxAvailable)
                                    }));
                                  } else {
                                    setLancarSaidaQuantities(prev => ({
                                      ...prev,
                                      [p.id]: inputVal
                                    }));
                                  }
                                }}
                                className="w-24 h-8 px-2 text-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-300 rounded-lg outline-hidden focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-gray-400 italic">Nenhum produto cadastrado no estoque de armazém.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setViewingTrpDetail(null);
                  setSelectedTrpId(null);
                }}
                className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-extrabold text-[12px] uppercase rounded-xl transition-all shadow-md active:scale-95"
              >
                Voltar
              </button>
              
              <button
                type="button"
                onClick={() => handleConfirmLancarSaida()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[12px] uppercase rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                <span>Confirmar Quantidade</span>
              </button>
            </div>

            {/* Confirmation Modal for Zero Qty */}
            {showLancarSaidaZeroQtyConfirm && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 text-black">
                <div className="bg-white w-full max-w-md rounded-2xl border border-red-200 shadow-2xl p-6 text-center space-y-4">
                  <div className="flex flex-col items-center gap-2 text-amber-500">
                    <span className="material-symbols-outlined text-5xl">warning</span>
                    <h3 className="text-base font-black uppercase tracking-wider mt-2">Atenção</h3>
                  </div>
                  <p className="text-slate-800 text-sm font-bold leading-relaxed">
                    Atenção! Nenhuma quantidade de Produtos informada, deseja realmente continuar?
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLancarSaidaZeroQtyConfirm(false)}
                      className="px-5 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLancarSaidaZeroQtyConfirm(false);
                        handleConfirmLancarSaida(true);
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      Sim
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // If viewing details of a specific transport (old, skipped)
  if (false) {
    const viewingTrpDetail: any = null;
    const lancingClient: any = null;
    const transportProducts = products.filter(p => {
      const s = viewingTrpDetail.stock?.[p.id];
      return s && (s.veiculo > 0 || s.coleta > 0 || s.cliente > 0);
    });

    const transportClients = clients.filter(c => 
      viewingTrpDetail.selectedClientIds?.includes(c.id)
    );

    if (isLancingRetiradaQty) {
      const currentClient: any = clients.find(c => c.id === checkedRetiradaClientId) || {};

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden border border-blue-600/30 shadow-2xl flex flex-col h-[90vh] my-4">
            
            {/* Header */}
            <div className="bg-sky-400 px-6 py-4 flex items-center justify-between text-slate-900 flex-shrink-0 border-b border-sky-300">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-900 text-3xl font-bold">edit_note</span>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider font-sans text-slate-900">Lançar Quantidades de Retirada</h3>
                  {currentClient && (
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      Cliente: {currentClient.razaoSocial} | Matrícula: {currentClient.matricula}
                    </p>
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsLancingRetiradaQty(false)}
                className="text-slate-900 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-black/10 flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 bg-[#f8fafc] flex-1 flex flex-col overflow-hidden gap-4">
              
              {/* Table of Products */}
              <div className="flex-1 border-2 border-slate-200 rounded-xl bg-white overflow-hidden flex flex-col shadow-xs">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 text-xs font-black text-slate-700 uppercase tracking-wider border-r border-slate-100">Código do Produto</th>
                        <th className="py-3 px-4 text-xs font-black text-slate-700 uppercase tracking-wider border-r border-slate-100">Descrição do Produto</th>
                        <th className="py-3 px-4 text-xs font-black text-slate-700 uppercase tracking-wider text-center border-r border-slate-100">Saldo em Loja</th>
                        <th className="py-3 px-4 text-xs font-black text-slate-700 uppercase tracking-wider text-center border-r border-slate-100">Qtde a ser Retirada</th>
                        <th className="py-3 px-4 text-xs font-black text-slate-700 uppercase tracking-wider text-center">Saldo Negativo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => {
                        const val = retiradaQuantities[p.id] || '';

                        const clientProdBalance = currentClient ? (
                          (currentClient.productBalances && currentClient.productBalances[p.id] !== undefined)
                            ? (currentClient.productBalances[p.id] || 0)
                            : (() => {
                                const pIdx = products.findIndex(prod => prod.id === p.id);
                                const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                                return Math.floor((currentClient.saldoLoja || 0) * pct);
                              })()
                        ) : 0;

                        const qtyRetirar = val === '' ? 0 : Number(val);
                        const diff = qtyRetirar - clientProdBalance;
                        const saldoNegativoValue = diff > 0 ? diff : '';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 border-r border-slate-100 text-xs font-bold text-slate-800 font-mono">{p.code}</td>
                            <td className="py-2.5 px-4 border-r border-slate-100 text-xs font-bold text-slate-800 uppercase">{p.description}</td>
                            <td className="py-2.5 px-4 border-r border-slate-100 text-xs font-bold text-slate-600 text-center">{clientProdBalance}</td>
                            <td className="py-1.5 px-4 text-center whitespace-nowrap border-r border-slate-100">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={val}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setRetiradaQuantities(prev => ({
                                    ...prev,
                                    [p.id]: v
                                  }));
                                }}
                                className="w-32 bg-white border border-slate-300 rounded-lg px-3 py-1 text-center text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-xs font-extrabold text-red-600 text-center font-mono">{saldoNegativoValue}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsLancingRetiradaQty(false)}
                className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white font-extrabold text-[12px] uppercase rounded-xl transition-all shadow-md active:scale-95"
              >
                Voltar
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!checkedRetiradaClientId) return;

                  const clientObj = clients.find(c => c.id === checkedRetiradaClientId);
                  if (!clientObj) return;

                  const previousWithdrawal = viewingTrpDetail.clientWithdrawals?.[checkedRetiradaClientId] || {};
                  const updatedStock = { ...viewingTrpDetail.stock };
                  const currentWithdrawal: { [productId: string]: number } = {};

                  products.forEach(p => {
                    const rawVal = retiradaQuantities[p.id];
                    const qty = rawVal === '' ? 0 : Number(rawVal);
                    currentWithdrawal[p.id] = qty;

                    const prevQty = previousWithdrawal[p.id] || 0;
                    const diff = qty - prevQty;

                    if (!updatedStock[p.id]) {
                      updatedStock[p.id] = { veiculo: 0, coleta: 0, cliente: 0 };
                    }
                    
                    updatedStock[p.id] = {
                      ...updatedStock[p.id],
                      coleta: (updatedStock[p.id].coleta || 0) + diff,
                    };
                  });

                  const updatedClient: Client = {
                    ...clientObj,
                    statusEntrega: 'Retirada'
                  };
                  updateClient(updatedClient);

                  const otherSobras = (viewingTrpDetail.sobras || []).filter(
                    (s: any) => s.matricula !== clientObj.matricula
                  );

                  const currentSobras = [...otherSobras];
                  products.forEach(p => {
                    const rawVal = retiradaQuantities[p.id];
                    const qty = rawVal === '' ? 0 : Number(rawVal);
                    if (qty > 0) {
                      const clientProdBalance = (clientObj.productBalances && clientObj.productBalances[p.id] !== undefined)
                        ? (clientObj.productBalances[p.id] || 0)
                        : (() => {
                            const pIdx = products.findIndex(prod => prod.id === p.id);
                            const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                            return Math.floor((clientObj.saldoLoja || 0) * pct);
                          })();

                      const diff = clientProdBalance - qty;
                      if (diff < 0) {
                        currentSobras.push({
                          matricula: clientObj.matricula,
                          razaoSocial: clientObj.razaoSocial,
                          codigoProduto: p.code,
                          descricaoProduto: p.description,
                          quantidadeSobra: Math.abs(diff)
                        });
                      }
                    }
                  });

                  const currentSelectedClientIds = [...(viewingTrpDetail.selectedClientIds || [])];
                  if (!currentSelectedClientIds.includes(checkedRetiradaClientId)) {
                    currentSelectedClientIds.push(checkedRetiradaClientId);
                  }

                  const updatedClientWithdrawals = {
                    ...(viewingTrpDetail.clientWithdrawals || {}),
                    [checkedRetiradaClientId]: currentWithdrawal
                  };

                  // Calculate total excluding clients with status "Retirada"
                  const finalClientsList = clients.filter(c => currentSelectedClientIds.includes(c.id));
                  const totalCountWithoutRetirada = finalClientsList.filter(c => {
                    const status = c.id === checkedRetiradaClientId ? 'retirada' : (c.statusEntrega || '');
                    return status.toLowerCase() !== 'retirada';
                  }).length;

                  const updatedTransport: Transport = {
                    ...viewingTrpDetail,
                    selectedClientIds: currentSelectedClientIds,
                    stock: updatedStock,
                    clientWithdrawals: updatedClientWithdrawals,
                    clienteTotal: totalCountWithoutRetirada,
                    sobras: currentSobras
                  };

                  updateActiveTransport(updatedTransport);
                  setViewingTrpDetail(updatedTransport);

                  setIsLancingRetiradaQty(false);
                  setIsCreatingRetirada(false);
                  setCheckedRetiradaClientId(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[12px] uppercase rounded-xl transition-all shadow-md active:scale-95"
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      );
    }

    if (isCreatingRetirada) {
      const availableClients = clients.filter(c => !viewingTrpDetail.selectedClientIds?.includes(c.id));
      
      const sortedAvailableClients = [...availableClients].sort((a, b) => {
        const numA = Number(a.matricula || 0);
        const numB = Number(b.matricula || 0);
        return numA - numB;
      });

      const filteredAvailableClients = sortedAvailableClients.filter(c => {
        if (!retiradaSearchQuery) return true;
        const query = retiradaSearchQuery.toLowerCase();
        if (retiradaSearchField === 'matricula') {
          return (c.matricula || '').toLowerCase().includes(query);
        }
        if (retiradaSearchField === 'razaoSocial') {
          return (c.razaoSocial || '').toLowerCase().includes(query);
        }
        if (retiradaSearchField === 'cnpj') {
          return (c.cnpj || '').toLowerCase().includes(query);
        }
        if (retiradaSearchField === 'rotaEntrega') {
          return (c.rotaEntrega || '').toLowerCase().includes(query);
        }
        return true;
      });

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-100/95 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-blue-50 w-full max-w-5xl rounded-2xl overflow-hidden border border-sky-300 shadow-2xl flex flex-col h-[92vh] my-4">
            
            {/* Header Bar: Sky Blue */}
            <div className="bg-sky-400 px-6 py-4 flex items-center justify-between text-slate-900 flex-shrink-0 relative border-b border-sky-300">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-900 text-3xl font-bold">add_shopping_cart</span>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider font-sans text-slate-900">Criar Retirada em Cliente</h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreatingRetirada(false)}
                className="text-slate-900 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-black/10 flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Main Content Area: Padding is Light Blue */}
            <div className="p-6 md:p-8 bg-blue-50/75 flex-1 flex flex-col overflow-hidden gap-4">
              
              {/* Search Bar & Continue Button Container */}
              <div className="bg-white/85 border border-sky-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                  
                  {/* Pesquisar Por */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black text-slate-700 uppercase whitespace-nowrap">Pesquisar por:</label>
                    <select
                      value={retiradaSearchField}
                      onChange={(e) => {
                        setRetiradaSearchField(e.target.value as any);
                        setRetiradaSearchQuery('');
                      }}
                      className="bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                      <option value="matricula">Matricula</option>
                      <option value="razaoSocial">Razão Social</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="rotaEntrega">Rota de Entrega</option>
                    </select>
                  </div>

                  {/* Pesquise Aqui */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <label className="text-xs font-black text-slate-700 uppercase whitespace-nowrap">Pesquise aqui:</label>
                    <input
                      type="text"
                      value={retiradaSearchQuery}
                      onChange={(e) => setRetiradaSearchQuery(e.target.value)}
                      className="bg-white border border-sky-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 w-full sm:w-64"
                    />
                  </div>

                </div>

                {/* Continue Button: vivid blue, disabled when no client checked */}
                <button
                  type="button"
                  disabled={!checkedRetiradaClientId}
                  onClick={() => {
                    const existing = viewingTrpDetail.clientWithdrawals?.[checkedRetiradaClientId!];
                    const initialQtys: { [productId: string]: string } = {};
                    products.forEach(p => {
                      if (existing && existing[p.id] !== undefined) {
                        initialQtys[p.id] = String(existing[p.id]);
                      } else {
                        initialQtys[p.id] = '';
                      }
                    });
                    setRetiradaQuantities(initialQtys);
                    setIsLancingRetiradaQty(true);
                  }}
                  className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    checkedRetiradaClientId
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  Continuar
                </button>
              </div>

              {/* Table Container */}
              <div className="flex-1 border-2 border-sky-200 rounded-xl bg-white overflow-hidden flex flex-col shadow-xs">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-sky-100 sticky top-0 z-10 border-b border-sky-200">
                      <tr>
                        <th className="py-2.5 px-4 text-[10px] font-black text-slate-700 uppercase tracking-wider border-r border-sky-100">Matrícula</th>
                        <th className="py-2.5 px-4 text-[10px] font-black text-slate-700 uppercase tracking-wider border-r border-sky-100">Razão Social</th>
                        <th className="py-2.5 px-4 text-[10px] font-black text-slate-700 uppercase tracking-wider border-r border-sky-100">CNPJ</th>
                        <th className="py-2.5 px-4 text-[10px] font-black text-slate-700 uppercase tracking-wider border-r border-sky-100">Rota de Entrega</th>
                        <th className="py-2.5 px-4 text-[10px] font-black text-slate-700 uppercase tracking-wider border-r border-sky-100">Cidade da Rota</th>
                        <th className="py-2.5 px-4 text-[10px] font-black text-slate-700 uppercase tracking-wider border-r border-sky-100">Região da Rota</th>
                        <th className="py-2.5 px-4 text-[10px] font-black text-slate-700 uppercase tracking-wider text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-100">
                      {filteredAvailableClients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-slate-500 italic font-bold">
                            Nenhum cliente disponível para retirada ou localizado na pesquisa.
                          </td>
                        </tr>
                      ) : (
                        filteredAvailableClients.map((c) => {
                          const r = deliveryRoutes.find(route => String(route.numeroRota) === String(c.rotaEntrega));
                          const routeNum = c.rotaEntrega || 'N/A';
                          const city = r?.cidade || c.cidade || 'N/A';
                          const region = r?.bairroRegiao || c.bairro || 'N/A';
                          const isChecked = checkedRetiradaClientId === c.id;

                          return (
                            <tr 
                              key={c.id} 
                              onClick={() => {
                                setCheckedRetiradaClientId(isChecked ? null : c.id);
                              }}
                              className={`hover:bg-blue-50 transition-colors cursor-pointer ${
                                isChecked ? 'bg-blue-100/80' : ''
                              }`}
                            >
                              <td className="py-2 px-4 border-r border-sky-100 text-[10px] text-black font-bold whitespace-nowrap">{c.matricula || 'N/A'}</td>
                              <td className="py-2 px-4 border-r border-sky-100 text-[10px] text-black font-bold truncate max-w-[220px]" title={c.razaoSocial}>{c.razaoSocial}</td>
                              <td className="py-2 px-4 border-r border-sky-100 text-[10px] text-black font-bold whitespace-nowrap">{c.cnpj || 'N/A'}</td>
                              <td className="py-2 px-4 border-r border-sky-100 text-[10px] text-black font-bold whitespace-nowrap">{routeNum}</td>
                              <td className="py-2 px-4 border-r border-sky-100 text-[10px] text-black font-bold whitespace-nowrap truncate max-w-[150px]" title={city}>{city}</td>
                              <td className="py-2 px-4 border-r border-sky-100 text-[10px] text-black font-bold whitespace-nowrap truncate max-w-[150px]" title={region}>{region}</td>
                              <td className="py-2 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setCheckedRetiradaClientId(isChecked ? null : c.id);
                                  }}
                                  className="w-4 h-4 rounded border-sky-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer Bar */}
            <div className="bg-sky-100 px-6 py-4 border-t border-sky-200 flex items-center justify-start gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCreatingRetirada(false)}
                className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white font-extrabold text-[12px] uppercase rounded-xl transition-all shadow-md active:scale-95"
              >
                Voltar
              </button>
            </div>

          </div>
        </div>
      );
    }

    const getStatusRank = (statusEntrega?: string) => {
      const s = (statusEntrega || 'Em Entrega').toLowerCase();
      if (s === 'em entrega' || s === 'não entregue' || s === 'vazio') return 1;
      if (s === 'retornado') return 2;
      if (s === 'coletado' || s === 'retirada') return 3;
      if (s === 'entregue') return 4;
      return 5;
    };

    const sortedClients = [...transportClients].sort((a, b) => {
      return getStatusRank(a.statusEntrega) - getStatusRank(b.statusEntrega);
    });

    const getRowStyles = (statusEntrega?: string) => {
      const s = (statusEntrega || 'Em Entrega').toLowerCase();
      if (s === 'entregue') {
        return {
          text: 'text-green-600 font-bold text-[10px]',
          badgeBg: 'bg-green-50 border border-green-500/30 text-green-600 font-bold text-[10px]',
          badgeDot: 'bg-green-500',
          btnBorder: 'border-green-500/40 text-green-600 hover:bg-green-50 font-bold text-[10px]',
          statusText: 'ENTREGUE',
          actionBtnText: 'JÁ ENTREGUE'
        };
      } else if (s === 'retornado') {
        return {
          text: 'text-red-600 font-bold text-[10px]',
          badgeBg: 'bg-red-50 border border-red-500/30 text-red-600 font-bold text-[10px]',
          badgeDot: 'bg-red-500',
          btnBorder: 'border-red-500/40 text-red-600 hover:bg-red-50 font-bold text-[10px]',
          statusText: 'RETORNADO',
          actionBtnText: 'LANÇAR'
        };
      } else if (s === 'coletado') {
        return {
          text: 'text-blue-600 font-bold text-[10px]',
          badgeBg: 'bg-blue-50 border border-blue-500/30 text-blue-600 font-bold text-[10px]',
          badgeDot: 'bg-blue-500',
          btnBorder: 'border-blue-500/40 text-blue-600 hover:bg-blue-50 font-bold text-[10px]',
          statusText: 'COLETADO',
          actionBtnText: 'LANÇAR'
        };
      } else if (s === 'retirada') {
        return {
          text: 'text-blue-600 font-bold text-[10px]',
          badgeBg: 'bg-blue-50 border border-blue-500/30 text-blue-600 font-bold text-[10px]',
          badgeDot: 'bg-blue-500',
          btnBorder: 'border-blue-500/40 text-blue-600 hover:bg-blue-50 font-bold text-[10px]',
          statusText: 'RETIRADA',
          actionBtnText: 'EDITAR'
        };
      } else {
        return {
          text: 'text-yellow-600 font-bold text-[10px]',
          badgeBg: 'bg-yellow-50 border border-yellow-500/30 text-yellow-600 font-bold text-[10px]',
          badgeDot: 'bg-yellow-500',
          btnBorder: 'border-yellow-500/40 text-yellow-600 hover:bg-yellow-50 font-bold text-[10px]',
          statusText: 'EM ENTREGA',
          actionBtnText: 'LANÇAR'
        };
      }
    };

    const handleSalvarESair = () => {
      const hasEmEntrega = transportClients.some(c => !c.statusEntrega || c.statusEntrega.toLowerCase() === 'em entrega');
      if (hasEmEntrega) {
        updateActiveTransport(viewingTrpDetail);
        setViewingTrpDetail(null);
      } else {
        setShowSalvarESairWarning(true);
      }
    };

    const handleFinalizarEntrega = () => {
      const hasEmEntrega = transportClients.some(c => !c.statusEntrega || c.statusEntrega.toLowerCase() === 'em entrega');
      if (hasEmEntrega) {
        setShowPendingWarning(true);
        setTimeout(() => {
          setShowPendingWarning(false);
        }, 3000);
        return;
      }
      setShowFinalizeConfirm(true);
    };

    const handleConfirmFinalize = () => {
      const totalCount = transportClients.filter(c => (c.statusEntrega || '').toLowerCase() !== 'retirada').length;
      const emEntregaCount = transportClients.filter(c => !c.statusEntrega || c.statusEntrega.toLowerCase() === 'em entrega').length;
      const retiradaCount = transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'retirada').length;
      const entregueCount = transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'entregue').length;
      const naoEntregueCount = transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'retornado' || (c.statusEntrega || '').toLowerCase() === 'não entregue').length;

      const finalizedTransport: Transport = {
        ...viewingTrpDetail,
        statusTransporte: 'EM_LIQUIDACAO',
        clienteTotal: totalCount,
        clienteEmEntrega: emEntregaCount,
        clienteEntregue: entregueCount,
        clienteNaoEntregue: naoEntregueCount,
        clientesRetirados: retiradaCount,
      };

      transportClients.forEach(c => {
        updateClient({
          ...c,
          statusEntrega: 'Em Liquidação'
        });
      });

      updateActiveTransport(finalizedTransport);
      setShowFinalizeSummary(false);

      setSuccessMessage(`Entregas do Transporte ${viewingTrpDetail.number} finalizadas com sucesso!`);

      setTimeout(() => {
        setSuccessMessage(null);
        setViewingTrpDetail(null);
        if (userRole !== 'Entregador') {
          setSelectedAction(null); // Voltar para a tela inicial da aplicação
        }
      }, 3000);
    };

    const startLancing = (client: Client) => {
      if ((client.statusEntrega || '').toLowerCase() === 'retirada') {
        setCheckedRetiradaClientId(client.id);
        const existing = viewingTrpDetail.clientWithdrawals?.[client.id] || {};
        const initialQtys: { [productId: string]: string } = {};
        products.forEach(p => {
          if (existing[p.id] !== undefined) {
            initialQtys[p.id] = String(existing[p.id]);
          } else {
            initialQtys[p.id] = '';
          }
        });
        setRetiradaQuantities(initialQtys);
        setIsLancingRetiradaQty(true);
        return;
      }

      setLancingClient(client);
      const initialDeliveries: { [productId: string]: number | '' } = {};
      const initialPickups: { [productId: string]: number | '' } = {};
      transportProducts.forEach(p => {
        initialDeliveries[p.id] = client.deliveryQuantities?.[p.id] !== undefined ? client.deliveryQuantities[p.id] : '';
        initialPickups[p.id] = client.pickupQuantities?.[p.id] !== undefined ? client.pickupQuantities[p.id] : '';
      });
      setDeliveryQuantities(initialDeliveries);
      setPickupQuantities(initialPickups);
      setIsEntregaOkSemMov(false);
      setIsNaoRealizadaEntrega(false);
    };

    const hasInsufficientStock = transportProducts.some(p => {
      const s = viewingTrpDetail.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
      const previousDeliveryQty = lancingClient?.deliveryQuantities?.[p.id] || 0;
      const currentEntrega = s.entrega !== undefined ? s.entrega : s.veiculo;
      const maxAllowed = currentEntrega + previousDeliveryQty;
      const currentVal = deliveryQuantities[p.id];
      const numVal = currentVal === '' ? 0 : Number(currentVal);
      return numVal > maxAllowed;
    });

    const hasDeliveryInput = Object.values(deliveryQuantities).some(val => typeof val === 'number' && val > 0);
    const hasPickupInput = Object.values(pickupQuantities).some(val => typeof val === 'number' && val > 0);
    const isSaveEnabled = (isEntregaOkSemMov || isNaoRealizadaEntrega || hasDeliveryInput || hasPickupInput) && !hasInsufficientStock;

    const isEntregaDisabled = isEntregaOkSemMov || isNaoRealizadaEntrega;
    const isRetiradaDisabled = isEntregaOkSemMov || isNaoRealizadaEntrega;
    const isEntregaOkDisabled = isNaoRealizadaEntrega;
    const isNaoRealizadaDisabled = isEntregaOkSemMov;

    const handleSaveLancing = () => {
      if (!lancingClient) return;

      let newStatus = lancingClient.statusEntrega || 'Em Entrega';

      if (isNaoRealizadaEntrega) {
        newStatus = 'Retornado';
      } else if (isEntregaOkSemMov) {
        newStatus = 'Entregue';
      } else if (hasDeliveryInput || hasPickupInput) {
        newStatus = 'Entregue';
      }

      const updatedStock = { ...viewingTrpDetail.stock };
      const clientPickupQtys: { [productId: string]: number } = { ...(lancingClient.pickupQuantities || {}) };
      const clientDeliveryQtys: { [productId: string]: number } = { ...(lancingClient.deliveryQuantities || {}) };
      
      transportProducts.forEach(p => {
        const dQty = typeof deliveryQuantities[p.id] === 'number' ? (deliveryQuantities[p.id] as number) : 0;
        const pQty = typeof pickupQuantities[p.id] === 'number' ? (pickupQuantities[p.id] as number) : 0;
        
        clientPickupQtys[p.id] = pQty;
        clientDeliveryQtys[p.id] = dQty;

        const previousDeliveryQty = lancingClient.deliveryQuantities?.[p.id] || 0;
        const diffDelivery = dQty - previousDeliveryQty;

        const previousPickupQty = lancingClient.pickupQuantities?.[p.id] || 0;
        const diffPickup = pQty - previousPickupQty;
        
        const currentProdStock = updatedStock[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
        const previousEntrega = currentProdStock.entrega !== undefined 
          ? currentProdStock.entrega 
          : (currentProdStock.saidaEntrega !== undefined ? currentProdStock.saidaEntrega : currentProdStock.veiculo);
        
        updatedStock[p.id] = {
          ...currentProdStock,
          cliente: (currentProdStock.cliente || 0) + diffDelivery,
          coleta: (currentProdStock.coleta || 0) + diffPickup,
          entrega: previousEntrega - diffDelivery,
          saidaEntrega: previousEntrega - diffDelivery, // keep in sync
        };
      });

      const updatedClient: Client = {
        ...lancingClient,
        statusEntrega: newStatus,
        pickupQuantities: clientPickupQtys,
        deliveryQuantities: clientDeliveryQtys,
      };
      updateClient(updatedClient);

      const otherSobras = (viewingTrpDetail.sobras || []).filter(
        (s: any) => s.matricula !== lancingClient.matricula
      );

      const currentSobras = [...otherSobras];
      transportProducts.forEach(p => {
        const pQty = typeof pickupQuantities[p.id] === 'number' ? (pickupQuantities[p.id] as number) : 0;
        if (pQty > 0) {
          const clientProdBalance = (lancingClient.productBalances && lancingClient.productBalances[p.id] !== undefined)
            ? (lancingClient.productBalances[p.id] || 0)
            : (() => {
                const pIdx = products.findIndex(prod => prod.id === p.id);
                const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                return Math.floor((lancingClient.saldoLoja || 0) * pct);
              })();

          const diff = clientProdBalance - pQty;
          if (diff < 0) {
            currentSobras.push({
              matricula: lancingClient.matricula,
              razaoSocial: lancingClient.razaoSocial,
              codigoProduto: p.code,
              descricaoProduto: p.description,
              quantidadeSobra: Math.abs(diff)
            });
          }
        }
      });

      const updatedTransport: Transport = {
        ...viewingTrpDetail,
        statusTransporte: 'EM_ENTREGA',
        stock: updatedStock,
        sobras: currentSobras
      };
      
      let addEntregue = 0;
      let addNaoEntregue = 0;
      
      const oldStatus = (lancingClient.statusEntrega || 'Em Entrega').toLowerCase();
      const lowerNewStatus = newStatus.toLowerCase();
      
      if (oldStatus !== lowerNewStatus) {
        if (lowerNewStatus === 'entregue') {
          addEntregue = 1;
          if (oldStatus === 'retornado') {
            addNaoEntregue = -1;
          }
        } else if (lowerNewStatus === 'retornado') {
          addNaoEntregue = 1;
          if (oldStatus === 'entregue') {
            addEntregue = -1;
          }
        }
      }

      const finalTransport: Transport = {
        ...updatedTransport,
        clienteEntregue: (viewingTrpDetail.clienteEntregue || 0) + addEntregue,
        clienteNaoEntregue: (viewingTrpDetail.clienteNaoEntregue || 0) + addNaoEntregue,
      };

      updateActiveTransport(finalTransport);
      setViewingTrpDetail(finalTransport);
      setLancingClient(null);
    };

    // Sub-modal for Lancing (Lançamento) with blue accents
    if (lancingClient) {
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-gray-100 w-full max-w-5xl rounded-2xl overflow-hidden border border-blue-200 shadow-2xl flex flex-col h-[92vh] my-4">
            
            {/* Header: Blue matching theme */}
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0 relative">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white text-3xl">local_shipping</span>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider">Dados do Transporte</h3>
                  <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Lançamento e controle de cargas e coletas em rota</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setLancingClient(null)}
                className="text-white hover:text-black/75 transition-colors p-1.5 rounded-full hover:bg-white/20 flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-100">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Quadrant: Lançar entrega de produto */}
                <div className={`border-2 border-orange-500 rounded-xl bg-orange-50 p-4 shadow-xs flex flex-col space-y-3 transition-all ${isEntregaDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <h4 className="text-xs font-black text-orange-600 uppercase flex items-center gap-2">
                    <span className="text-[10px]">●</span> Lançar entrega de produto
                  </h4>
                  <div className="bg-orange-100 text-orange-950 p-2 border border-orange-300 rounded-lg overflow-hidden flex-1 flex flex-col">
                    <div className="grid grid-cols-3 text-[9px] font-extrabold uppercase tracking-wider text-orange-800 mb-1.5 pb-1 border-b border-orange-200 text-center">
                      <div className="text-left">ITEM</div>
                      <div>SALDO VEÍCULO</div>
                      <div>QTD ENTREGAR</div>
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[130px]">
                      {transportProducts.map(p => {
                        const s = viewingTrpDetail.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                        const saldoVeiculo = s.veiculo - s.cliente;
                        const currentVal = deliveryQuantities[p.id];
                        const numVal = currentVal === '' ? 0 : Number(currentVal);
                        const isInsufficient = numVal > saldoVeiculo;

                        return (
                          <div key={p.id} className="grid grid-cols-3 items-center text-xs py-0.5 text-center">
                            <div className="text-left font-bold uppercase text-[9px] text-orange-900 truncate pr-1" title={p.description}>
                              {p.description}
                            </div>
                            <div className="font-bold text-[10px] text-orange-700">
                              {saldoVeiculo} {p.unit}
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                id={`delivery-qty-${p.id}`}
                                disabled={isEntregaDisabled}
                                value={deliveryQuantities[p.id] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                                  setDeliveryQuantities(prev => ({ ...prev, [p.id]: val }));
                                }}
                                onBlur={() => {
                                  if (isInsufficient) {
                                    setTempAlert("Saldo insuficiente no item");
                                    setTimeout(() => {
                                      setTempAlert(null);
                                      const inputEl = document.getElementById(`delivery-qty-${p.id}`) as HTMLInputElement | null;
                                      if (inputEl) {
                                        inputEl.focus();
                                        inputEl.select();
                                      }
                                    }, 2000);
                                  }
                                }}
                                className={`w-16 rounded text-center text-xs font-black py-0.5 placeholder:text-orange-300 focus:outline-none focus:ring-1 ${
                                  isInsufficient
                                    ? 'bg-red-100 border-2 border-red-500 text-red-900 focus:border-red-600 focus:ring-red-600'
                                    : 'bg-white border border-orange-400 text-orange-950 focus:border-orange-600 focus:ring-orange-600'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quadrant: Lançar retirada de produto */}
                <div className={`border-2 border-blue-500 rounded-xl bg-blue-50 p-4 shadow-xs flex flex-col space-y-3 transition-all ${isRetiradaDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <h4 className="text-xs font-black text-blue-600 uppercase flex items-center gap-2">
                    <span className="text-[10px]">●</span> Lançar retirada de produto
                  </h4>
                  <div className="bg-blue-100 text-blue-950 p-2 border border-blue-300 rounded-lg overflow-hidden flex-1 flex flex-col">
                    <div className="grid grid-cols-4 text-[9px] font-extrabold uppercase tracking-wider text-blue-800 mb-1.5 pb-1 border-b border-blue-200 text-center">
                      <div className="text-left">ITEM</div>
                      <div>SALDO LOJA</div>
                      <div>QTD RETIRAR</div>
                      <div>SALDO NEGATIVO</div>
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[130px]">
                      {transportProducts.map(p => {
                        const clientProdBalance = lancingClient ? (
                          (lancingClient.productBalances && lancingClient.productBalances[p.id] !== undefined)
                            ? (lancingClient.productBalances[p.id] || 0)
                            : (() => {
                                const pIdx = products.findIndex(prod => prod.id === p.id);
                                const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                                return Math.floor((lancingClient.saldoLoja || 0) * pct);
                              })()
                        ) : 0;

                        const qtyRetirar = pickupQuantities[p.id] === '' ? 0 : Number(pickupQuantities[p.id] || 0);
                        const diff = qtyRetirar - clientProdBalance;
                        const saldoNegativoValue = diff > 0 ? diff : '';

                        return (
                          <div key={p.id} className="grid grid-cols-4 items-center text-xs py-1 text-center border-b border-blue-100/50 last:border-0">
                            <div className="text-left font-bold uppercase text-[9px] text-blue-900 truncate pr-1" title={p.description}>
                              {p.description}
                            </div>
                            <div className="font-bold text-[10px] text-blue-800">
                              {clientProdBalance}
                            </div>
                            <div className="flex justify-center">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                disabled={isRetiradaDisabled}
                                value={pickupQuantities[p.id] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                                  setPickupQuantities(prev => ({ ...prev, [p.id]: val }));
                                }}
                                className="w-16 bg-white border border-blue-400 rounded text-center text-xs font-black py-0.5 text-blue-950 placeholder:text-blue-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                              />
                            </div>
                            <div className="font-extrabold text-[10px] text-red-600 font-mono">
                              {saldoNegativoValue}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Middle Flags Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Flag */}
                <div className={`border-2 border-emerald-500 bg-emerald-50 p-4 rounded-xl shadow-xs flex items-center gap-4 transition-all ${isEntregaOkDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <input
                    type="checkbox"
                    id="entrega-ok-checkbox"
                    checked={isEntregaOkSemMov}
                    disabled={isEntregaOkDisabled}
                    onChange={(e) => {
                      setIsEntregaOkSemMov(e.target.checked);
                      if (e.target.checked) {
                        setIsNaoRealizadaEntrega(false);
                      }
                    }}
                    className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 flex-shrink-0"
                  />
                  <div>
                    <label htmlFor="entrega-ok-checkbox" className="text-xs font-black text-emerald-800 uppercase cursor-pointer">
                      Entrega Ok, sem movimentação de Produto
                    </label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Registra conclusão do serviço no cliente sem transferir volumes de estoque.
                    </p>
                  </div>
                </div>

                {/* Right Flag */}
                <div className={`border-2 border-red-500 bg-red-50 p-4 rounded-xl shadow-xs flex items-center gap-4 transition-all ${isNaoRealizadaDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <input
                    type="checkbox"
                    id="nao-realizada-checkbox"
                    checked={isNaoRealizadaEntrega}
                    disabled={isNaoRealizadaDisabled}
                    onChange={(e) => {
                      setIsNaoRealizadaEntrega(e.target.checked);
                      if (e.target.checked) {
                        setIsEntregaOkSemMov(false);
                      }
                    }}
                    className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600 flex-shrink-0"
                  />
                  <div>
                    <label htmlFor="nao-realizada-checkbox" className="text-xs font-black text-red-800 uppercase cursor-pointer">
                      Não será realizada Entrega
                    </label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Marca cliente como retornado/não atendido para esta viagem sem carregar alterações.
                    </p>
                  </div>
                </div>

              </div>

              {/* Botões dentro do fluxo da tela na parte inferior */}
              <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase">{lancingClient.razaoSocial}</h4>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">CNPJ: {lancingClient.cnpj}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setLancingClient(null)}
                    className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white border border-gray-600 font-extrabold text-[12px] uppercase rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={!isSaveEnabled}
                    onClick={handleSaveLancing}
                    className={`px-5 py-2 font-extrabold text-[12px] uppercase rounded-xl transition-all shadow-md ${
                      isSaveEnabled
                        ? 'bg-[#10b981] hover:bg-[#059669] text-white cursor-pointer active:scale-95'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Salvar Alteração
                  </button>
                </div>
              </div>

              {tempAlert && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-3xs p-4 animate-in fade-in duration-100">
                  <div className="bg-red-600 border border-red-700 text-white rounded-xl p-4 shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="material-symbols-outlined text-white text-2xl font-bold">error</span>
                    <span className="text-sm font-black uppercase tracking-wider text-[12px]">{tempAlert}</span>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-[#f3f4f6] w-full max-w-5xl rounded-2xl overflow-hidden border border-blue-600/30 shadow-2xl flex flex-col h-[92vh] my-4">
          
          {/* Header Bar: Vibrant Blue */}
          <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0 relative">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-3xl">local_shipping</span>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider">Dados do Transporte</h3>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setViewingTrpDetail(null)}
              className="text-white hover:text-black/75 transition-colors p-1.5 rounded-full hover:bg-white/20 flex items-center justify-center"
            >
              <span className="material-symbols-outlined font-bold text-xl">close</span>
            </button>
          </div>

          {/* Body Content: Light Gray Background */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f3f4f6] flex flex-col">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1">
              
              {/* LEFT COLUMN: Resumo do Transporte */}
              <div className="md:col-span-5 space-y-6 flex flex-col h-full">
                
                {/* SUMMARY & COUNTERS with Blue theme */}
                <div className="border-2 border-blue-600 rounded-xl bg-white shadow-xs overflow-hidden flex-shrink-0">
                  <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-200">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider">
                      Resumo do Transporte
                    </h4>
                  </div>
                  <div className="p-2.5">
                    <div className="border border-blue-300 rounded-xl p-2.5 bg-white flex flex-col gap-2.5">
                      {/* Top Row: Total + Transport Info */}
                      <div className="flex items-center justify-between gap-3 py-0.5">
                        <div className="bg-blue-50 border border-blue-500 px-1.5 py-1 rounded-md flex items-center justify-between text-left h-[28px] gap-1 w-[calc((100%-18px)/4)] shrink-0">
                          <span className="text-[7.5px] font-bold text-blue-700 uppercase leading-none block">Clientes</span>
                          <span className="text-xs font-black text-blue-900 leading-none">
                            {viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO' || viewingTrpDetail.statusTransporte === 'Finalizado'
                              ? (viewingTrpDetail.clienteTotal ?? 0)
                              : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() !== 'retirada').length}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-blue-600 text-[12px]" title="Nº do Transporte">description</span>
                            <span className="font-black text-slate-800 text-[10px] uppercase tracking-wider">{viewingTrpDetail.number}</span>
                          </div>
                          
                          <div className="h-3.5 w-px bg-gray-200"></div>

                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-blue-600 text-[12px]" title="Veículo">local_shipping</span>
                            <span className="font-black text-slate-800 text-[10px] uppercase tracking-wider">{viewingTrpDetail.placa}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Row: Counters */}
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="bg-yellow-50 border border-yellow-500 px-1.5 py-1 rounded-md flex items-center justify-between text-left h-[28px] gap-1">
                          <span className="text-[7.5px] font-bold text-yellow-700 uppercase leading-none block">Em Entr.</span>
                          <span className="text-xs font-black text-yellow-900 leading-none">
                            {viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO' || viewingTrpDetail.statusTransporte === 'Finalizado'
                              ? (viewingTrpDetail.clienteEmEntrega ?? 0)
                              : transportClients.filter(c => !c.statusEntrega || c.statusEntrega.toLowerCase() === 'em entrega').length}
                          </span>
                        </div>
                        <div className="bg-green-50 border border-green-500 px-1.5 py-1 rounded-md flex items-center justify-between text-left h-[28px] gap-1">
                          <span className="text-[7.5px] font-bold text-green-700 uppercase leading-none block">Entregue</span>
                          <span className="text-xs font-black text-green-900 leading-none">
                            {viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO' || viewingTrpDetail.statusTransporte === 'Finalizado'
                              ? (viewingTrpDetail.clienteEntregue ?? 0)
                              : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'entregue').length}
                          </span>
                        </div>
                        <div className="bg-blue-50 border border-blue-500 px-1.5 py-1 rounded-md flex items-center justify-between text-left h-[28px] gap-1 shadow-3xs">
                          <span className="text-[7.5px] font-bold text-blue-700 uppercase leading-none block">Retirada</span>
                          <span className="text-xs font-black text-blue-900 leading-none">
                            {viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO' || viewingTrpDetail.statusTransporte === 'Finalizado'
                              ? (viewingTrpDetail.clientesRetirados ?? 0)
                              : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'retirada').length}
                          </span>
                        </div>
                        <div className="bg-red-50 border border-red-500 px-1.5 py-1 rounded-md flex items-center justify-between text-left h-[28px] gap-1">
                          <span className="text-[7.5px] font-bold text-red-700 uppercase leading-none block">Não Entr.</span>
                          <span className="text-xs font-black text-red-900 leading-none">
                            {viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO' || viewingTrpDetail.statusTransporte === 'Finalizado'
                              ? (viewingTrpDetail.clienteNaoEntregue ?? 0)
                              : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'retornado' || (c.statusEntrega || '').toLowerCase() === 'não entregue').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITENS DO TRANSPORTE SECTION with Blue Theme */}
                <div className="border-2 border-blue-600 rounded-xl bg-white shadow-xs overflow-hidden flex-1 flex flex-col">
                  <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex items-center justify-between">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider">
                      Itens do Transporte
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowSobrasModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[12px] font-bold">visibility</span>
                      Sobras
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto overflow-y-auto p-1 flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-500 font-extrabold uppercase text-[9px] tracking-wider">
                          <th className="py-2 px-2">Descrição</th>
                          <th className="py-2 px-1 text-center text-amber-600 leading-tight">Saída<br/>(Entrega)</th>
                          <th className="py-2 px-1 text-center text-cyan-600 leading-tight">Coleta<br/>(Retirada)</th>
                          <th className="py-2 px-1 text-center text-blue-600 leading-tight">Entregue<br/>(Cliente)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transportProducts.length === 0 ? (
                           <tr>
                            <td colSpan={4} className="py-4 text-center text-xs text-gray-400 italic">
                              Nenhum produto cadastrado neste transporte.
                            </td>
                          </tr>
                        ) : (
                          transportProducts.map((p) => {
                            const s = viewingTrpDetail.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                            return (
                              <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                                <td className="py-1.5 px-2 font-bold text-slate-800 uppercase text-[10px]">{p.description}</td>
                                <td className="py-1.5 px-1 text-center font-black text-amber-600 text-[10px]">
                                  {(s.entrega !== undefined ? s.entrega : s.veiculo).toLocaleString('pt-BR')}
                                </td>
                                <td className="py-1.5 px-1 text-center font-black text-cyan-600 text-[10px]">
                                  {s.coleta.toLocaleString('pt-BR')}
                                </td>
                                <td className="py-1.5 px-1 text-center font-black text-blue-600 text-[10px]">
                                  {s.cliente.toLocaleString('pt-BR')}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Clientes Atendidos no Roteiro */}
              <div className="md:col-span-7 flex flex-col h-full gap-4">
                
                {/* CLIENTES ATENDIDOS NO ROTEIRO SECTION with Blue Theme */}
                <div className="border-2 border-blue-600 rounded-xl bg-white shadow-xs overflow-hidden flex-1 flex flex-col">
                  <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-200">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider">
                      Clientes Atendidos no Roteiro
                    </h4>
                  </div>
                  
                  <div className="overflow-x-auto overflow-y-auto p-1 flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="py-2 px-3 w-28">Status</th>
                          <th className="py-2 px-3 w-16">MAT</th>
                          <th className="py-2 px-3">Razão Social</th>
                          <th className="py-2 px-3 text-right w-24">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedClients.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-xs text-gray-400 italic">
                              Nenhum cliente roteirizado neste transporte.
                            </td>
                          </tr>
                        ) : (
                          sortedClients.map((c) => {
                            const styles = getRowStyles(c.statusEntrega);
                            return (
                              <tr key={c.id} className="hover:bg-blue-50/15 transition-colors">
                                <td className="py-1 px-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${styles.badgeBg} uppercase`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${styles.badgeDot} animate-pulse`}></span>
                                    {styles.statusText}
                                  </span>
                                </td>
                                <td className={`py-1 px-3 font-mono whitespace-nowrap ${styles.text}`}>
                                  {c.matricula || 'N/A'}
                                </td>
                                <td className={`py-1 px-3 whitespace-nowrap truncate max-w-[200px] ${styles.text}`} title={c.razaoSocial}>
                                  {c.razaoSocial}
                                </td>
                                <td className="py-1 px-3 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    disabled={viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO'}
                                    onClick={() => startLancing(c)}
                                    className={`px-3 py-0.5 border rounded-md uppercase bg-transparent transition-all ${
                                      viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO'
                                        ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                        : styles.btnBorder
                                    }`}
                                  >
                                    {styles.actionBtnText}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Modal Footer Bar with Blue highlights */}
          <div className="bg-white px-6 py-4 border-t border-blue-100 flex flex-wrap items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              disabled={viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO'}
              onClick={handleFinalizarEntrega}
              className={`px-4 py-2 text-white font-extrabold text-[11px] uppercase rounded-lg transition-all shadow-xs ${
                viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-[#10b981] hover:bg-[#059669] active:scale-95'
              }`}
            >
              Finalizar entrega
            </button>

            <button
              type="button"
              disabled={viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO'}
              onClick={() => {
                setCheckedRetiradaClientId(null);
                setRetiradaSearchQuery('');
                setRetiradaSearchField('matricula');
                setIsCreatingRetirada(true);
              }}
              className={`px-4 py-2 text-white font-extrabold text-[11px] uppercase rounded-lg transition-all shadow-xs ${
                viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              Criar Retirada
            </button>

            <button
              type="button"
              onClick={handleSalvarESair}
              className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-[11px] uppercase rounded-lg transition-all shadow-xs active:scale-95"
            >
              SALVAR E SAIR
            </button>

            <button
              type="button"
              onClick={() => setViewingTrpDetail(null)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 border border-gray-300 text-slate-700 font-extrabold text-[11px] uppercase rounded-lg transition-all active:scale-95"
            >
              Voltar
            </button>
          </div>

        </div>

        {/* Modal: showFinalizeConfirm */}
        {showFinalizeConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <span className="material-symbols-outlined text-3xl font-bold">help_outline</span>
                <h3 className="text-lg font-black uppercase tracking-wider">Finalizar Transporte</h3>
              </div>
              <p className="text-slate-700 text-sm font-semibold">
                Deseja finalizar esse transporte?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinalizeConfirm(false)}
                  className="px-4 py-2 bg-gray-150 hover:bg-gray-250 text-slate-700 font-extrabold text-xs uppercase rounded-lg transition-all"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFinalizeConfirm(false);
                    setShowFinalizeSummary(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-lg transition-all shadow-md active:scale-95"
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: showSalvarESairWarning */}
        {showSalvarESairWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white border-2 border-yellow-500 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-yellow-600">
                <span className="material-symbols-outlined text-3xl font-bold">warning</span>
                <h3 className="text-lg font-black uppercase tracking-wider">Aviso</h3>
              </div>
              <p className="text-slate-700 text-sm font-semibold">
                Todas as entregas foram finalizadas, deseja finalizar esse transporte?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    updateActiveTransport(viewingTrpDetail);
                    setViewingTrpDetail(null);
                    setShowSalvarESairWarning(false);
                  }}
                  className="px-4 py-2 bg-gray-150 hover:bg-gray-250 text-slate-700 font-extrabold text-xs uppercase rounded-lg transition-all"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSalvarESairWarning(false);
                    setShowFinalizeSummary(true);
                  }}
                  className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-xs uppercase rounded-lg transition-all shadow-md active:scale-95"
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: showFinalizeSummary (FINALIZAR TRANSPORTE) with Blue Theme */}
        {showFinalizeSummary && (() => {
          const isFrozen = viewingTrpDetail.statusTransporte === 'EM_LIQUIDACAO' || viewingTrpDetail.statusTransporte === 'Finalizado';
          const totalClienteVal = isFrozen ? (viewingTrpDetail.clienteTotal ?? 0) : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() !== 'retirada').length;
          const entregueVal = isFrozen ? (viewingTrpDetail.clienteEntregue ?? 0) : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'entregue').length;
          const retiradaVal = isFrozen ? (viewingTrpDetail.clientesRetirados ?? 0) : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'retirada').length;
          const naoEntregueVal = isFrozen ? (viewingTrpDetail.clienteNaoEntregue ?? 0) : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'retornado' || (c.statusEntrega || '').toLowerCase() === 'não entregue').length;
          const effectivenessVal = totalClienteVal > 0 ? Math.round((entregueVal / totalClienteVal) * 100) : 0;

          return (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white w-full max-w-3xl rounded-3xl border-2 border-blue-600 shadow-2xl flex flex-col p-6 space-y-6 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-150">
                
                <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-3 text-blue-700">
                    <span className="material-symbols-outlined text-3xl font-bold">task_alt</span>
                    <h3 className="text-xl font-black uppercase tracking-wider">Finalizar Entrega</h3>
                  </div>
                </div>

                {/* Summary with Blue accents */}
                <div className="border-2 border-blue-600 rounded-2xl p-4 bg-blue-50/70 space-y-4 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-200 pb-3">
                    <div className="flex flex-wrap items-center gap-4 w-full">
                      
                      {/* Data de Entrega */}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-2xl font-bold">calendar_month</span>
                        <span className="text-base font-extrabold text-slate-850">{viewingTrpDetail.date}</span>
                      </div>

                      <div className="h-6 w-px bg-blue-300 hidden sm:block"></div>

                      {/* Nº do Transporte */}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-2xl font-bold">description</span>
                        <span className="text-base font-extrabold text-slate-850">{viewingTrpDetail.number}</span>
                      </div>

                      <div className="h-6 w-px bg-blue-300 hidden sm:block"></div>

                      {/* Veículo (Placa) */}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-2xl font-bold">local_shipping</span>
                        <span className="text-base font-extrabold text-slate-850">{viewingTrpDetail.placa}</span>
                      </div>

                      <div className="h-6 w-px bg-blue-300 hidden sm:block"></div>

                      {/* Motorista */}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-2xl font-bold">badge</span>
                        <span className="text-base font-extrabold text-slate-850">{viewingTrpDetail.driver}</span>
                      </div>
                    </div>
                  </div>

                  {/* Counter squares */}
                  <div className="grid grid-cols-5 gap-2.5">
                    <div className="bg-blue-100 border border-blue-500 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Total Cliente</span>
                      <span className="text-lg font-black text-blue-900 leading-none">{totalClienteVal}</span>
                    </div>
                    <div className="bg-green-100 border border-green-500 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-green-700 uppercase tracking-wider">Entregue</span>
                      <span className="text-lg font-black text-green-900 leading-none">{entregueVal}</span>
                    </div>
                    <div className="bg-blue-100 border border-blue-500 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Retirada</span>
                      <span className="text-lg font-black text-blue-900 leading-none">{retiradaVal}</span>
                    </div>
                    <div className="bg-red-100 border border-red-500 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-red-700 uppercase tracking-wider">Não Entregue</span>
                      <span className="text-lg font-black text-red-900 leading-none">{naoEntregueVal}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-600 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Efetiv.</span>
                      <span className="text-lg font-black text-blue-600 leading-none">{effectivenessVal}%</span>
                    </div>
                  </div>
                </div>

                {/* Second Quadrant with Blue theme */}
                <div className="border-2 border-blue-600 rounded-2xl bg-blue-50/70 overflow-hidden shadow-2xs">
                  <div className="bg-blue-100/50 px-4 py-2.5 border-b border-blue-200">
                    <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider">Resumo de Carga por Material</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-blue-200 bg-blue-100/30 text-blue-700 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-4">Material</th>
                          <th className="py-2.5 px-4 text-center">Não Entregue</th>
                          <th className="py-2.5 px-4 text-center">Coletado</th>
                          <th className="py-2.5 px-4 text-center bg-blue-350 text-blue-950 font-black">QTDE TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100">
                        {transportProducts.map((p) => {
                          const s = viewingTrpDetail.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                          const saida = s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo;
                          const coleta = s.coleta || 0;
                          const totalRow = saida + coleta;
                          return (
                            <tr key={p.id} className="hover:bg-blue-100/20 transition-colors font-medium text-[12px]">
                              <td className="py-2 px-4 text-[12px]">
                                <div className="text-slate-800 font-semibold">{p.description}</div>
                              </td>
                              <td className="py-2 px-4 text-center font-mono text-slate-700 text-[12px]">{saida}</td>
                              <td className="py-2 px-4 text-center font-mono text-slate-700 text-[12px]">{coleta}</td>
                              <td className="py-2 px-4 text-center font-mono font-black text-blue-950 text-[14px] bg-blue-300">{totalRow}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Third Quadrant (bg: Blue CLARO, borders: Blue VIVO) */}
                <div className="bg-blue-100 border-2 border-blue-600 rounded-2xl p-4 flex items-center justify-end gap-4 shadow-2xs">
                  <span className="text-sm font-black text-blue-800 uppercase tracking-wider">
                    Saldo total de Produtos no veículo:
                  </span>
                  <span className="text-2xl font-black text-blue-900 font-mono">
                    {transportProducts.reduce((sum, p) => {
                      const s = viewingTrpDetail.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                      const saida = s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo;
                      const coleta = s.coleta || 0;
                      return sum + (saida + coleta);
                    }, 0)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-blue-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFinalizeSummary(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-250 border border-gray-300 text-slate-700 font-extrabold text-xs uppercase rounded-xl transition-all active:scale-95"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmFinalize}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">save</span>
                    Salvar
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {showPendingWarning && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-white border-2 border-red-500 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
              <div className="flex flex-col items-center gap-2 text-red-600">
                <span className="material-symbols-outlined text-5xl animate-bounce">warning</span>
                <h3 className="text-base font-black uppercase tracking-wider mt-2">Atenção</h3>
              </div>
              <p className="text-slate-850 text-sm font-black uppercase tracking-wide leading-relaxed">
                Existe cliente pendente de entrega
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
              <div className="flex flex-col items-center gap-2 text-blue-600">
                <span className="material-symbols-outlined text-5xl animate-bounce">check_circle</span>
                <h3 className="text-base font-black uppercase tracking-wider mt-2">Sucesso</h3>
              </div>
              <p className="text-slate-850 text-sm font-black uppercase tracking-wide leading-relaxed">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {showSobrasModal && viewingTrpDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden border border-blue-500 shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-white text-3xl font-bold">visibility</span>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wider">Estoque Temporário: Sobras</h3>
                    <p className="text-xs font-bold text-blue-100 mt-0.5">Transporte: {viewingTrpDetail.number} | Motorista: {viewingTrpDetail.driver}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSobrasModal(false)}
                  className="text-white hover:text-blue-200 transition-colors p-1.5 rounded-full hover:bg-white/10 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined font-bold text-xl">close</span>
                </button>
              </div>

              {/* Table */}
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                <div className="border border-blue-100 rounded-xl bg-white shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-blue-50 text-blue-900 border-b border-blue-100 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Matrícula</th>
                        <th className="py-3 px-4">Razão Social</th>
                        <th className="py-3 px-4">Descrição do Produto</th>
                        <th className="py-3 px-4 text-center">Quantidade de Sobra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50 text-slate-700">
                      {(!viewingTrpDetail.sobras || viewingTrpDetail.sobras.length === 0) ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-xs text-gray-400 italic">
                            Nenhuma sobra registrada neste transporte.
                          </td>
                        </tr>
                      ) : (
                        viewingTrpDetail.sobras.map((sob: any, sIdx: number) => (
                          <tr key={sIdx} className="hover:bg-blue-50/10 transition-colors font-medium">
                            <td className="py-3 px-4 font-bold text-slate-950 font-mono">{sob.matricula}</td>
                            <td className="py-3 px-4 font-bold text-slate-800 uppercase">{sob.razaoSocial}</td>
                            <td className="py-3 px-4 text-slate-700 font-bold uppercase">{sob.descricaoProduto}</td>
                            <td className="py-3 px-4 text-center font-black text-red-600 font-mono text-[13px]">{sob.quantidadeSobra.toLocaleString('pt-BR')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSobrasModal(false)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[12px] uppercase rounded-xl transition-all shadow-md active:scale-95"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl overflow-hidden border border-blue-200 shadow-2xl flex flex-col h-[92vh] my-4">
        
        {/* Header Bar: Blue theme */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-white text-2xl">local_shipping</span>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider">Transportes em Aberto (Lançar Saída)</h3>
              <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Selecione um veículo/transporte para visualizar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Profile type selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="user-profile-select-veiculo" className="text-[9px] font-bold uppercase tracking-widest text-blue-100 hidden sm:inline">Perfil:</label>
              <select
                id="user-profile-select-veiculo"
                value={userRole || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserRole(val || null);
                }}
                className="bg-blue-700 hover:bg-blue-800 border border-blue-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-300 outline-none cursor-pointer"
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
            {userRole !== 'Entregador' && (
              <button 
                type="button"
                onClick={() => setSelectedAction(null)}
                className="text-white hover:text-black/70 transition-colors p-1.5 rounded-full hover:bg-white/20 flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
          
          {filteredTransports.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic text-xs">
              Nenhum transporte encontrado com status CRIADO.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTransports.map((t) => {
                const isSelected = selectedTrpId === t.id;
                
                // Format display status
                const displayStatus = t.status.toString().replace('_', ' ').toUpperCase();
                
                // Status badge styling
                let statusBg = 'bg-gray-100 text-gray-700';
                if (displayStatus === 'CRIADO') {
                  statusBg = 'bg-blue-100 text-blue-700';
                } else if (displayStatus === 'EM ENTREGA') {
                  statusBg = 'bg-amber-100 text-amber-700';
                } else if (displayStatus === 'CONCLUIDO' || displayStatus === 'LIQUIDADO') {
                  statusBg = 'bg-emerald-100 text-emerald-700';
                }

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTrpId(t.id);
                      setViewingTrpDetail(t.raw);
                      const initialQuantities: { [productId: string]: string } = {};
                      products.forEach(p => {
                        const currentQty = t.raw.stock?.[p.id]?.veiculo || 0;
                        initialQuantities[p.id] = String(currentQty);
                      });
                      setLancarSaidaQuantities(initialQuantities);
                    }}
                    className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex flex-col space-y-3 relative bg-white shadow-3xs hover:shadow-sm ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/10'
                        : 'border-blue-600 hover:border-blue-700'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white shadow-3xs">
                        <span className="material-symbols-outlined text-xs font-black">check</span>
                      </div>
                    )}
                    {/* Line 1: Nº do Transporte & Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 uppercase">
                        <span className="material-symbols-outlined text-blue-600 font-bold text-sm">add_road</span>
                        <span>{t.number}</span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBg}`}>
                        {displayStatus}
                      </span>
                    </div>

                    {/* Line 2: Veículo */}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase">
                      <span className="material-symbols-outlined text-blue-600 font-bold text-sm">local_shipping</span>
                      <span>{t.vehicle}</span>
                    </div>

                    {/* Line 3: Motorista */}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
                      <span className="material-symbols-outlined text-blue-600 font-bold text-sm">person</span>
                      <span>{t.driver}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex items-center justify-start flex-shrink-0">
          {userRole !== 'Entregador' && (
            <button
              type="button"
              onClick={() => setSelectedAction(null)}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-350 rounded-xl text-xs font-black text-gray-700 uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Voltar</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
