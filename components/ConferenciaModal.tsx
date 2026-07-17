'use client';

import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';
import { Transport } from '../lib/types';

export default function ConferenciaModal() {
  const {
    activeTransports,
    products,
    clients,
    setSelectedAction,
    updateActiveTransport,
    addSobraCliente,
    updateClient,
    incrementProductStocks,
    addLiquidatedTransport,
    deliveryRoutes,
    updateDeliveryRoute,
    addMovementLog,
  } = useApp();

  // State to manage selected transport for confirmation and detailed view
  const [selectedTrp, setSelectedTrp] = useState<Transport | null>(null);
  const [showConfirmConfirm, setShowConfirmConfirm] = useState(false);
  const [showFinalizeConference, setShowFinalizeConference] = useState(false);

  // Printing State
  const [printingTrp, setPrintingTrp] = useState<Transport | null>(null);
  const [printedTrpIds, setPrintedTrpIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('movix_printed_transports');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const markAsPrinted = (id: string) => {
    const updated = [...printedTrpIds, id];
    setPrintedTrpIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('movix_printed_transports', JSON.stringify(updated));
    }
  };

  // Lancing Clientes Retirados States
  const [isLancingRetirados, setIsLancingRetirados] = useState(false);
  const [clientesRetiradosInput, setClientesRetiradosInput] = useState<number>(0);
  const [retiradasLanced, setRetiradasLanced] = useState<{ [clientId: string]: { [productId: string]: number } }>({});
  const [isFinalizingLoading, setIsFinalizingLoading] = useState(false);
  const [postFinalizeMessage, setPostFinalizeMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Filter transports to show only those with status of EM_LIQUIDACAO (EM LIQUIDAÇÃO CRIADO)
  const filteredTransports = (activeTransports || []).filter(
    (t) => t.statusTransporte === 'EM_LIQUIDACAO'
  );

  const transportClients = clients.filter((c) => selectedTrp?.selectedClientIds?.includes(c.id));
  const retiradosClients = transportClients.filter((c) => (c.statusEntrega || '').toLowerCase() === 'retirada');


  const handleFinalizeClick = () => {
    if (!selectedTrp) return;
    if (isFinalizingLoading || postFinalizeMessage || successMessage) return; // Prevent double clicks and duplicate state mutations

    if ((selectedTrp.clienteEmEntrega || 0) > 0) {
      setErrorAlert("Erro: Não é possível finalizar. O campo 'Cliente Em Entrega' não está com quantidade Zero.");
      setTimeout(() => {
        setErrorAlert(null);
        setShowFinalizeConference(false);
        setSelectedTrp(null);
      }, 4000);
      return;
    }

    // 2. Fixar no transporte os números nos campos "contadores" e bloquear alterações
    // 3. Modificar o status do transporte para "Finalizado"
    // 4. Mudar o status da rota de Entrega pra "Finalizado"
    // 5. Manter o status do cliente em Status de Entrega para "Finalizado"
    // 6. Transferir todo o saldo dos produtos em Estoque "Entrega" para "Estoque Físico" em Armazém (tipo 301)
    // 7. Transferir todo o saldo dos produtos em Estoque "Cliente" para Estoque "Em Loja" nos clientes (tipo 501)
    // 8 & 9. Transferir "Coleta" / "Retirada" para Armazém e debitar de "Em Loja" nos clientes (tipo 502) com relatórios de sobras
    // 10. Zerar todo o saldo dos produtos em Estoque "Veículo"

    // --- Action 4: Update Delivery Route status ---
    const transportRoutes = (deliveryRoutes || []).filter(r => selectedTrp.selectedRouteIds?.includes(r.id));
    transportRoutes.forEach(r => {
      updateDeliveryRoute({
        ...r,
        statusRotaEntrega: 'Finalizado'
      });
    });

    // --- Action 6, 7, 8 & 9: Gather stocks, run transfers and write Movement Logs ---
    const increments301: { [productId: string]: number } = {};
    const items301: { productCode: string; productDescription: string; qty: number; unit: string }[] = [];

    const productDeliverySums: { [productId: string]: number } = {};
    const items501: { productCode: string; productDescription: string; qty: number; unit: string }[] = [];

    const coletaProductSums: { [productId: string]: number } = {};
    const sobraProductSums: { [productId: string]: number } = {};

    const items502: { productCode: string; productDescription: string; qty: number; unit: string }[] = [];

    // Debit and Credit Client balances
    transportClients.forEach(c => {
      let clientCurrentSaldo = c.saldoLoja || 0;
      const currentBalances = { ...(c.productBalances || {}) };

      // Initialize missing products
      products.forEach(p => {
        if (currentBalances[p.id] === undefined) {
          // Fallback distribution of initial flat balance if we didn't have it
          currentBalances[p.id] = 0;
        }
      });

      // Credit Action 7 (Deliveries)
      if (c.deliveryQuantities) {
        Object.entries(c.deliveryQuantities).forEach(([prodId, deliveredQty]) => {
          if (deliveredQty > 0) {
            currentBalances[prodId] = (currentBalances[prodId] || 0) + deliveredQty;
            clientCurrentSaldo += deliveredQty;
          }
        });
      }

      // Merge regular pickups and clientWithdrawals (from "Criar Retirada")
      const mergedWithdrawals: { [productId: string]: number } = {};
      if (c.pickupQuantities) {
        Object.entries(c.pickupQuantities).forEach(([prodId, val]) => {
          if (val > 0) {
            mergedWithdrawals[prodId] = val;
          }
        });
      }
      const trpWithdrawals = selectedTrp.clientWithdrawals?.[c.id];
      if (trpWithdrawals) {
        Object.entries(trpWithdrawals).forEach(([prodId, val]) => {
          if (val > 0) {
            mergedWithdrawals[prodId] = val;
          }
        });
      }

      // Debit Action 9 with sobra reporting and movement division (502)
      if (Object.keys(mergedWithdrawals).length > 0) {
        Object.entries(mergedWithdrawals).forEach(([prodId, pickedUpQty]) => {
          if (pickedUpQty > 0) {
            const prod = products.find(p => p.id === prodId);
            if (!prod) return;

            const currentProdBalance = currentBalances[prodId] || 0;
            if (currentProdBalance >= pickedUpQty) {
              // 1º Se o “Saldo em Loja” do cliente for maior ou igual a quantidade retirada no cliente, debitar no saldo em loja e creditar como 502
              currentBalances[prodId] = currentProdBalance - pickedUpQty;
              clientCurrentSaldo = Math.max(0, clientCurrentSaldo - pickedUpQty);

              coletaProductSums[prodId] = (coletaProductSums[prodId] || 0) + pickedUpQty;
            } else {
              // 2º Se o saldo em Loja do cliente for menor que a quantidade retirada no cliente:
              // Debitar todo o saldo que o cliente tem em “Saldo em Loja” e creditar como 502
              const debited = currentProdBalance;
              const sobra = pickedUpQty - debited;
              currentBalances[prodId] = 0;
              clientCurrentSaldo = Math.max(0, clientCurrentSaldo - debited);

              if (debited > 0) {
                coletaProductSums[prodId] = (coletaProductSums[prodId] || 0) + debited;
              }

              // Diferença é creditada como 502 e lançada no relatório de sobras
              if (sobra > 0) {
                sobraProductSums[prodId] = (sobraProductSums[prodId] || 0) + sobra;

                addSobraCliente({
                  matricula: c.matricula,
                  razaoSocial: c.razaoSocial,
                  dataTransporte: selectedTrp.date,
                  numeroTransporte: selectedTrp.number,
                  codigoProduto: prod.code,
                  descricaoProduto: prod.description,
                  quantidadeSobra: sobra,
                });
              }
            }
          }
        });
      }

      updateClient({
        ...c,
        saldoLoja: clientCurrentSaldo,
        productBalances: currentBalances,
        statusEntrega: 'Liquidado'
      });
    });

    // Gather products totals and build lists for movement logs
    products.forEach(p => {
      const s = selectedTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
      
      // Action 6: "Entrega" quantity
      const entregaQty = s.entrega !== undefined ? s.entrega : (s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo);
      if (entregaQty > 0) {
        increments301[p.id] = entregaQty;
        items301.push({
          productCode: p.code,
          productDescription: p.description,
          qty: entregaQty,
          unit: p.unit || 'UN'
        });
      }

      // Action 7: "Cliente" quantity summation
      let totalDeliveredOfProduct = 0;
      transportClients.forEach(c => {
        const dQty = c.deliveryQuantities?.[p.id] || 0;
        totalDeliveredOfProduct += dQty;
      });
      productDeliverySums[p.id] = totalDeliveredOfProduct;
      if (totalDeliveredOfProduct > 0) {
        items501.push({
          productCode: p.code,
          productDescription: p.description,
          qty: totalDeliveredOfProduct,
          unit: p.unit || 'UN'
        });
      }

      // Coleta (502) sum for logs - we sum both debited (coleta) and sobra (sobra) for type 502 as per user requested
      const totalColeta = (coletaProductSums[p.id] || 0) + (sobraProductSums[p.id] || 0);
      if (totalColeta > 0) {
        items502.push({
          productCode: p.code,
          productDescription: p.description,
          qty: totalColeta,
          unit: p.unit || 'UN'
        });
      }
    });

    // Consolidate total pickup to return to physical stock in warehouse (sobras are excluded from warehouse stock)
    const productPickupSums: { [productId: string]: number } = {};
    products.forEach(p => {
      const totalToReturn = (coletaProductSums[p.id] || 0);
      if (totalToReturn > 0) {
        productPickupSums[p.id] = totalToReturn;
      }
    });

    // Run increments for Action 6 (Return of Entrega stock to warehouse)
    if (Object.keys(increments301).length > 0) {
      incrementProductStocks(increments301);
    }

    // Run increments for Action 8 & 9 (Return of Coleta and Sobras stock to warehouse)
    if (Object.keys(productPickupSums).length > 0) {
      incrementProductStocks(productPickupSums);
    }

    // Write movement log entries
    if (items301.length > 0) {
      addMovementLog({
        nfNumber: `TR-${selectedTrp.number}`,
        date: new Date().toLocaleDateString('pt-BR'),
        supplier: selectedTrp.driver,
        responsible: selectedTrp.driver,
        observation: `Retorno de saldo de estoque Entrega para Armazém - Transporte ${selectedTrp.number}`,
        type: '301 – ENTRADA POR TRANSPORTE – RETORNO',
        items: items301
      });
    }

    if (items501.length > 0) {
      addMovementLog({
        nfNumber: `TR-${selectedTrp.number}`,
        date: new Date().toLocaleDateString('pt-BR'),
        supplier: selectedTrp.driver,
        responsible: selectedTrp.driver,
        observation: `Entrega em clientes - Transporte ${selectedTrp.number}`,
        type: '501 – ENTREGA EM CLIENTE',
        items: items501
      });
    }

    if (items502.length > 0) {
      addMovementLog({
        nfNumber: `TR-${selectedTrp.number}`,
        date: new Date().toLocaleDateString('pt-BR'),
        supplier: selectedTrp.driver,
        responsible: selectedTrp.driver,
        observation: `Coleta em clientes - Transporte ${selectedTrp.number}`,
        type: '502 – COLETA EM CLIENTE',
        items: items502
      });
    }

    // --- Action 10: Zero out "Veículo", "Entrega", "Coleta", "Cliente" stocks in transport ---
    const updatedStock = { ...selectedTrp.stock };
    products.forEach(p => {
      if (updatedStock[p.id]) {
        updatedStock[p.id] = {
          ...updatedStock[p.id],
          veiculo: 0,
          entrega: 0,
          saidaEntrega: 0,
          coleta: 0,
          cliente: 0
        };
      }
    });

    // Update transport
    const totalClienteVal = selectedTrp.clienteTotal || 0;
    const entregueVal = selectedTrp.clienteEntregue || 0;
    const naoEntregueVal = selectedTrp.clienteNaoEntregue || 0;
    const effectivenessVal = totalClienteVal > 0 ? Math.round((entregueVal / totalClienteVal) * 100) : 0;

    const finalizedTrp: Transport = {
      ...selectedTrp,
      statusTransporte: 'Finalizado',
      tipoTransporte: 'Fechado',
      clienteTotal: totalClienteVal,
      clienteEmEntrega: 0,
      clienteEntregue: entregueVal,
      clienteNaoEntregue: naoEntregueVal,
      clientesRetirados: clientesRetiradosInput,
      stock: updatedStock
    };

    updateActiveTransport(finalizedTrp);

    addLiquidatedTransport({
      id: selectedTrp.id,
      number: selectedTrp.number,
      date: selectedTrp.date,
      placa: selectedTrp.placa,
      driver: selectedTrp.driver,
      route: selectedTrp.route,
      clientsCount: totalClienteVal,
      delivered: entregueVal,
      notDelivered: naoEntregueVal,
      retirados: clientesRetiradosInput,
      effectiveness: effectivenessVal,
    });

    // --- Action 11: Display loader for 4 seconds and then show custom 2s notification ---
    setIsFinalizingLoading(true);
    const finalizedTrpNum = selectedTrp.number;
    setTimeout(() => {
      setIsFinalizingLoading(false);
      setShowFinalizeConference(false);
      setSelectedTrp(null);
      
      // Trigger warning message for 2 seconds
      setPostFinalizeMessage(`O transporte ${finalizedTrpNum} foi finalizado com sucesso!`);
      setTimeout(() => {
        setPostFinalizeMessage(null);
      }, 2000);
    }, 4000);
  };

  // If viewing details / finalization summary for conference
  if (printingTrp) {
    const printProducts = products.filter((p) => {
      const s = printingTrp.stock?.[p.id];
      return s && (s.veiculo > 0 || s.coleta > 0 || s.cliente > 0);
    });

    const printClients = clients.filter((c) => printingTrp.selectedClientIds?.includes(c.id));
    const totalClienteVal = printingTrp.clienteTotal || 0;
    const entregueVal = printingTrp.clienteEntregue || 0;
    const naoEntregueVal = printingTrp.clienteNaoEntregue || 0;
    const printRetirados = printingTrp.clientesRetirados !== undefined ? printingTrp.clientesRetirados : printClients.filter((c) => (c.statusEntrega || '').toLowerCase() === 'retirada').length;
    const effectivenessVal = totalClienteVal > 0 ? Math.round((entregueVal / totalClienteVal) * 100) : 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto print:overflow-visible">
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              position: static !important;
            }
          }
        `}</style>

        <div id="print-preview-modal-content" className="print-container bg-white w-full max-w-4xl rounded-2xl border-2 border-green-600 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-4 animate-in zoom-in-95 duration-150 relative print:border-0 print:shadow-none print:max-h-none print:overflow-visible print:my-0">
          
          {/* Header Bar */}
          <div className="no-print bg-[#10b981] px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-white text-2xl font-bold animate-pulse">print</span>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider">Pré-visualização do Relatório</h3>
                <p className="text-[10px] text-green-100 font-bold uppercase tracking-wider">Confira as informações antes de imprimir o relatório de conferência</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setPrintingTrp(null)}
              className="text-white hover:text-black/70 transition-colors p-1.5 rounded-full hover:bg-white/20 flex items-center justify-center"
            >
              <span className="material-symbols-outlined font-bold text-xl">close</span>
            </button>
          </div>

          {/* Scrollable Report Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50 print:bg-white print:p-0 print:overflow-visible print:space-y-8">
            
            {/* Header / Brand of the report */}
            <div className="flex items-center justify-between border-b-2 border-slate-300 pb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl font-black text-green-600 print:text-black">local_shipping</span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">MOVIX LOGÍSTICA</h1>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Sistema de Controle de Entregas e Cargas</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200 print:border-0 print:bg-transparent print:p-0">Relatório de Conferência</span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>

            {/* First Quadrant: Transport Details */}
            <div className="border-2 border-green-600 rounded-2xl p-4 bg-green-50/70 space-y-4 shadow-2xs print:border-slate-300 print:bg-transparent print:rounded-none print:p-3 print:space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                
                {/* Data de Entrega */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-700 text-xl font-bold print:hidden">calendar_month</span>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Data de Entrega</p>
                    <span className="text-sm font-extrabold text-slate-850">{printingTrp.date}</span>
                  </div>
                </div>

                {/* Nº do Transporte */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-700 text-xl font-bold print:hidden">description</span>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Nº Transporte</p>
                    <span className="text-sm font-extrabold text-slate-850">{printingTrp.number}</span>
                  </div>
                </div>

                {/* Veículo (Placa) */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-700 text-xl font-bold print:hidden">local_shipping</span>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Veículo (Placa)</p>
                    <span className="text-sm font-extrabold text-slate-850">{printingTrp.placa}</span>
                  </div>
                </div>

                {/* Motorista */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-700 text-xl font-bold print:hidden">person</span>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Motorista</p>
                    <span className="text-sm font-extrabold text-slate-850">{printingTrp.driver}</span>
                  </div>
                </div>

              </div>

              {/* Counters Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 print:grid-cols-5 print:gap-1.5">
                {/* 1. TOTAL CLIENTE */}
                <div className="bg-slate-100 border border-slate-350 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 h-9 shadow-3xs print:border-slate-300 print:bg-transparent print:rounded-none">
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Total Cliente</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{totalClienteVal}</span>
                </div>

                {/* 2. ENTREGUE */}
                <div className="bg-green-100 border border-green-400 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 h-9 shadow-3xs print:border-slate-300 print:bg-transparent print:rounded-none">
                  <span className="text-[9px] font-black text-green-800 uppercase tracking-wider">Entregue</span>
                  <span className="text-sm font-black text-green-900 font-mono">{entregueVal}</span>
                </div>

                {/* 3. NÃO ENTREGUE */}
                <div className="bg-red-100 border border-red-300 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 h-9 shadow-3xs print:border-slate-300 print:bg-transparent print:rounded-none">
                  <span className="text-[9px] font-black text-red-800 uppercase tracking-wider">Não Entregue</span>
                  <span className="text-sm font-black text-red-900 font-mono">{naoEntregueVal}</span>
                </div>

                {/* 4. RETIRADA */}
                <div className="bg-sky-100 border border-sky-300 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 h-9 shadow-3xs print:border-slate-300 print:bg-transparent print:rounded-none">
                  <span className="text-[9px] font-black text-sky-850 uppercase tracking-wider">Retirada</span>
                  <span className="text-sm font-black text-sky-950 font-mono">{printRetirados}</span>
                </div>

                {/* 5. EFETIVIDADE */}
                <div className="bg-emerald-100 border border-emerald-400 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 h-9 shadow-3xs print:border-slate-300 print:bg-transparent print:rounded-none">
                  <span className="text-[9px] font-black text-emerald-850 uppercase tracking-wider">Efetividade</span>
                  <span className="text-sm font-black text-emerald-950 font-mono">{effectivenessVal}%</span>
                </div>
              </div>
            </div>

            {/* Second Quadrant: Load summary table */}
            <div className="border-2 border-green-600 rounded-2xl bg-green-50/70 overflow-hidden shadow-2xs flex flex-col justify-between print:border-slate-300 print:bg-transparent print:rounded-none">
              <div className="bg-green-100/50 px-4 py-2 border-b border-green-200 print:bg-transparent print:border-b-2 print:border-slate-300">
                <h4 className="text-xs font-black text-green-800 uppercase tracking-wider print:text-black">Resumo de Carga por Material</h4>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-green-200 bg-green-100/30 text-green-700 font-extrabold uppercase text-[10px] tracking-wider print:border-b-2 print:border-slate-300 print:text-black print:bg-transparent">
                      <th className="py-2 px-4">Material</th>
                      <th className="py-2 px-4 text-center">Não Entregue</th>
                      <th className="py-2 px-4 text-center">Coletado</th>
                      <th className="py-2 px-4 text-center bg-green-300 text-green-950 font-black print:bg-transparent print:text-black print:border-l print:border-slate-200">QTDE TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100 print:divide-slate-200">
                    {printProducts.map((p) => {
                      const s = printingTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                      const saida = s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo;
                      const coleta = s.coleta || 0;
                      const totalRow = saida + coleta;
                      return (
                        <tr key={p.id} className="font-medium text-[12px] print:text-black">
                          <td className="py-2 px-4 text-[12px]">
                            <div className="text-slate-800 font-semibold print:text-black">{p.description}</div>
                          </td>
                          <td className="py-2 px-4 text-center font-mono text-slate-700 text-[12px] print:text-black">{saida}</td>
                          <td className="py-2 px-4 text-center font-mono text-slate-700 text-[12px] print:text-black">{coleta}</td>
                          <td className="py-2 px-4 text-center font-mono font-black text-green-950 text-[14px] bg-green-300 print:bg-transparent print:text-black print:border-l print:border-slate-200">{totalRow}</td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    {(() => {
                      const totalSaida = printProducts.reduce((sum, p) => {
                        const s = printingTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                        const saida = s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo;
                        return sum + saida;
                      }, 0);

                      const totalColeta = printProducts.reduce((sum, p) => {
                        const s = printingTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                        return sum + (s.coleta || 0);
                      }, 0);

                      const totalQtdeTotal = printProducts.reduce((sum, p) => {
                        const s = printingTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                        const saida = s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo;
                        const coleta = s.coleta || 0;
                        return sum + (saida + coleta);
                      }, 0);

                      return (
                        <tr className="bg-green-100/60 border-t-2 border-green-300 font-extrabold text-[12px] text-slate-900 print:bg-transparent print:border-t-2 print:border-slate-300 print:text-black">
                          <td className="py-2 px-4 font-black uppercase text-green-800 text-[10px] tracking-wider print:text-black">Soma Total</td>
                          <td className="py-2 px-4 text-center font-mono">{totalSaida}</td>
                          <td className="py-2 px-4 text-center font-mono">{totalColeta}</td>
                          <td className="py-2 px-4 text-center font-mono font-black text-green-950 text-[14px] bg-green-300 print:bg-transparent print:text-black print:border-l print:border-slate-200">{totalQtdeTotal}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature fields for paper log receipt */}
            <div className="hidden print:grid grid-cols-3 gap-8 pt-12 text-center text-[11px] font-bold text-slate-800">
              <div className="space-y-8">
                <div className="border-b border-slate-400 w-full h-4"></div>
                <p className="uppercase tracking-wide">Assinatura do Motorista</p>
              </div>
              <div className="space-y-8">
                <div className="border-b border-slate-400 w-full h-4"></div>
                <p className="uppercase tracking-wide">Assinatura do Conferente</p>
              </div>
              <div className="space-y-8">
                <div className="border-b border-slate-400 w-full h-4"></div>
                <p className="uppercase tracking-wide">Assinatura do Responsável</p>
              </div>
            </div>

          </div>

          {/* Action Buttons in footer */}
          <div className="no-print bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setPrintingTrp(null)}
              className="px-5 py-2.5 bg-white hover:bg-gray-150 border border-gray-300 text-slate-700 font-extrabold text-xs uppercase rounded-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                markAsPrinted(printingTrp.id);
                setTimeout(() => {
                  window.print();
                }, 100);
              }}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm font-bold">print</span>
              Imprimir
            </button>
          </div>

        </div>
      </div>
    );
  }

  // If viewing details / finalization summary for conference
  if (showFinalizeConference && selectedTrp) {
    const transportProducts = products.filter((p) => {
      const s = selectedTrp.stock?.[p.id];
      return s && (s.veiculo > 0 || s.coleta > 0 || s.cliente > 0);
    });

    const totalClienteVal = selectedTrp.clienteTotal || 0;
    const entregueVal = selectedTrp.clienteEntregue || 0;
    const naoEntregueVal = selectedTrp.clienteNaoEntregue || 0;
    const effectivenessVal =
      totalClienteVal > 0 ? Math.round((entregueVal / totalClienteVal) * 100) : 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
        {errorAlert && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] bg-rose-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-rose-500 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="material-symbols-outlined text-2xl font-bold animate-bounce">error</span>
            <span className="text-sm font-black uppercase tracking-wider text-center">{errorAlert}</span>
          </div>
        )}

        <div className="bg-white w-full max-w-5xl rounded-2xl border-2 border-green-600 shadow-2xl flex flex-col h-[92vh] overflow-hidden my-4 animate-in zoom-in-95 duration-150 relative">
          {isFinalizingLoading && (
            <div className="absolute inset-0 z-50 bg-[#00c853] flex flex-col items-center justify-center text-white p-8 animate-in fade-in duration-300">
              <style>{`
                @keyframes win11-orbit {
                  0% {
                    transform: rotate(225deg);
                    opacity: 1;
                    animation-timing-function: ease-out;
                  }
                  7% {
                    transform: rotate(345deg);
                    animation-timing-function: linear;
                  }
                  30% {
                    transform: rotate(455deg);
                    animation-timing-function: ease-in-out;
                  }
                  39% {
                    transform: rotate(690deg);
                    animation-timing-function: linear;
                  }
                  70% {
                    transform: rotate(815deg);
                    opacity: 1;
                    animation-timing-function: ease-out;
                  }
                  75% {
                    transform: rotate(945deg);
                    animation-timing-function: ease-out;
                  }
                  76% {
                    transform: rotate(945deg);
                    opacity: 0;
                  }
                  100% {
                    transform: rotate(945deg);
                    opacity: 0;
                  }
                }
              `}</style>
              <div className="flex flex-col items-center gap-8">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0" style={{ animation: 'win11-orbit 5.5s infinite', animationDelay: '0ms' }}>
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-xs"></div>
                  </div>
                  <div className="absolute inset-0" style={{ animation: 'win11-orbit 5.5s infinite', animationDelay: '-160ms' }}>
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-xs"></div>
                  </div>
                  <div className="absolute inset-0" style={{ animation: 'win11-orbit 5.5s infinite', animationDelay: '-320ms' }}>
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-xs"></div>
                  </div>
                  <div className="absolute inset-0" style={{ animation: 'win11-orbit 5.5s infinite', animationDelay: '-480ms' }}>
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-xs"></div>
                  </div>
                  <div className="absolute inset-0" style={{ animation: 'win11-orbit 5.5s infinite', animationDelay: '-640ms' }}>
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-xs"></div>
                  </div>
                  <div className="absolute inset-0" style={{ animation: 'win11-orbit 5.5s infinite', animationDelay: '-800ms' }}>
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-xs"></div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-black uppercase tracking-widest text-white drop-shadow-sm animate-pulse">Finalizando Transporte...</h4>
                </div>
              </div>
            </div>
          )}
          
          {/* Header Bar */}
          <div className="bg-green-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-white text-2xl font-bold animate-pulse">fact_check</span>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider">Finalizar Conferência do Transporte</h3>
                <p className="text-[10px] text-green-100 font-bold uppercase tracking-wider">Auditar e Liquidar Carga</p>
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">

          {/* First Quadrant: Top Quadrant (LIGHT GREEN with BRIGHT GREEN borders, inverted No. and Date) */}
          <div className="border-2 border-green-600 rounded-2xl p-4 bg-green-50/70 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-green-200 pb-3">
              <div className="flex flex-wrap items-center gap-4 w-full">
                
                {/* INVERTED POSITION: 1st Data de Entrega (Calendário) */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-700 text-2xl font-bold">calendar_month</span>
                  <span className="text-base font-extrabold text-slate-850">{selectedTrp.date}</span>
                </div>

                <div className="h-6 w-px bg-green-300 hidden sm:block"></div>

                {/* INVERTED POSITION: 2nd Nº do Transporte */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-700 text-2xl font-bold">description</span>
                  <span className="text-base font-extrabold text-slate-850">{selectedTrp.number}</span>
                </div>

                <div className="h-6 w-px bg-green-300 hidden sm:block"></div>

                {/* Veículo (Placa) */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-700 text-2xl font-bold">local_shipping</span>
                  <span className="text-base font-extrabold text-slate-850">{selectedTrp.placa}</span>
                </div>

                <div className="h-6 w-px bg-green-300 hidden sm:block"></div>

                {/* Motorista */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-700 text-2xl font-bold">person</span>
                  <span className="text-base font-extrabold text-slate-850">{selectedTrp.driver}</span>
                </div>
              </div>
            </div>

            {/* Counter squares */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {/* 1. TOTAL CLIENTE: CINZA */}
              <div className="bg-slate-100 border border-slate-350 rounded-xl px-3 py-1 flex items-center justify-between gap-2 h-8 shadow-3xs">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Total Cliente</span>
                <span className="text-sm font-black text-slate-900 font-mono">{totalClienteVal}</span>
              </div>

              {/* 2. ENTREGUE: VERDE */}
              <div className="bg-green-100 border border-green-400 rounded-xl px-3 py-1 flex items-center justify-between gap-2 h-8 shadow-3xs">
                <span className="text-[10px] font-black text-green-800 uppercase tracking-wider">Entregue</span>
                <span className="text-sm font-black text-green-900 font-mono">{entregueVal}</span>
              </div>

              {/* 3. NÃO ENTREGUE: VERMELHO CLARO */}
              <div className="bg-red-100 border border-red-300 rounded-xl px-3 py-1 flex items-center justify-between gap-2 h-8 shadow-3xs">
                <span className="text-[10px] font-black text-red-800 uppercase tracking-wider">Não Entregue</span>
                <span className="text-sm font-black text-red-900 font-mono">{naoEntregueVal}</span>
              </div>

              {/* 4. RETIRADA: AZUL CLARO */}
              <div className="bg-sky-100 border border-sky-300 rounded-xl px-3 py-1 flex items-center justify-between gap-2 h-8 shadow-3xs">
                <span className="text-[10px] font-black text-sky-850 uppercase tracking-wider">Retirada</span>
                <span className="text-sm font-black text-sky-950 font-mono">{clientesRetiradosInput}</span>
              </div>

              {/* 5. EFETIVIDADE: VERDE/EMERALD */}
              <div className="bg-emerald-100 border border-emerald-400 rounded-xl px-3 py-1 flex items-center justify-between gap-2 h-8 shadow-3xs">
                <span className="text-[10px] font-black text-emerald-850 uppercase tracking-wider">Efetividade</span>
                <span className="text-sm font-black text-emerald-950 font-mono">{effectivenessVal}%</span>
              </div>
            </div>
          </div>

          {/* Second Quadrant: format of lines and columns (LIGHT GREEN with BRIGHT GREEN borders) */}
          <div className="border-2 border-green-600 rounded-2xl bg-green-50/70 overflow-hidden shadow-2xs min-h-[270px] flex flex-col justify-between">
            <div className="bg-green-100/50 px-4 py-2.5 border-b border-green-200">
              <h4 className="text-xs font-black text-green-800 uppercase tracking-wider">Resumo de Carga por Material</h4>
            </div>
            <div className="overflow-x-auto flex-1 max-h-[220px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-green-200 bg-green-100/30 text-green-700 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Material</th>
                    <th className="py-2.5 px-4 text-center">Não Entregue</th>
                    <th className="py-2.5 px-4 text-center">Coletado</th>
                    <th className="py-2.5 px-4 text-center bg-green-600 text-white font-black">QTDE TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-100">
                  {transportProducts.map((p) => {
                    const s = selectedTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                    const saida = s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo;
                    const coleta = s.coleta || 0;
                    const totalRow = saida + coleta;
                    return (
                      <tr key={p.id} className="hover:bg-green-100/20 transition-colors font-medium text-[12px]">
                        <td className="py-2.5 px-4 text-[12px]">
                           <div className="text-slate-800 font-semibold">{p.description}</div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-700 text-[12px]">{saida}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-700 text-[12px]">{coleta}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-white text-[14px] bg-green-600">{totalRow}</td>
                      </tr>
                    );
                  })}
                  {/* Soma Total Row */}
                  {(() => {
                    const totalSaida = transportProducts.reduce((sum, p) => {
                      const s = selectedTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                      const saida = s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo;
                      return sum + saida;
                    }, 0);

                    const totalColeta = transportProducts.reduce((sum, p) => {
                      const s = selectedTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                      return sum + (s.coleta || 0);
                    }, 0);

                    const totalQtdeTotal = transportProducts.reduce((sum, p) => {
                      const s = selectedTrp.stock?.[p.id] || { veiculo: 0, coleta: 0, cliente: 0 };
                      const saida = s.saidaEntrega !== undefined ? s.saidaEntrega : s.veiculo;
                      const coleta = s.coleta || 0;
                      return sum + (saida + coleta);
                    }, 0);

                    return (
                      <tr className="bg-green-100/60 border-t-2 border-green-300 font-extrabold text-[12px] text-slate-900">
                        <td className="py-2.5 px-4 font-black uppercase text-green-800 text-[10px] tracking-wider">Soma Total</td>
                        <td className="py-2.5 px-4 text-center font-mono">{totalSaida}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{totalColeta}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-white text-[14px] bg-green-600">{totalQtdeTotal}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          </div>

          {/* Footer Bar / Action Buttons */}
          <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowFinalizeConference(false);
                setSelectedTrp(null);
              }}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-slate-700 font-extrabold text-xs uppercase rounded-xl transition-all active:scale-95"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleFinalizeClick}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm font-bold">done_all</span>
              Finalizar
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl overflow-hidden border border-green-200 shadow-2xl flex flex-col h-[92vh] my-4">
        
        {/* Header Bar */}
        <div className="bg-[#10b981] px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-white text-2xl">fact_check</span>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider">Transportes para Liquidar</h3>
              <p className="text-[10px] text-green-100 font-bold uppercase tracking-wider">Selecione um transporte para realizar a conferência</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setSelectedAction(null)}
            className="text-white hover:text-black/70 transition-colors p-1.5 rounded-full hover:bg-white/20 flex items-center justify-center"
          >
            <span className="material-symbols-outlined font-bold text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
          
          {filteredTransports.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic text-xs">
              Nenhum transporte encontrado com status EM LIQUIDAÇÃO.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTransports.map((t) => {
                const isSelected = selectedTrp?.id === t.id;
                
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTrp(t);
                      const transportClients = clients.filter((c) => t.selectedClientIds?.includes(c.id));
                      const count = t.clientesRetirados !== undefined ? t.clientesRetirados : transportClients.filter((c) => (c.statusEntrega || '').toLowerCase() === 'retirada').length;
                      setClientesRetiradosInput(count);
                      setShowConfirmConfirm(true);
                    }}
                    className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex flex-col space-y-3 relative bg-white shadow-3xs hover:shadow-sm ${
                      isSelected
                        ? 'border-[#22c55e] ring-2 ring-green-100 bg-green-50/10'
                        : 'border-[#22c55e] hover:border-green-600'
                    }`}
                  >
                    {/* Line 1: Nº do Transporte & Status (Same line) */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 uppercase">
                        <span className="material-symbols-outlined text-[#22c55e] font-bold text-sm">add_road</span>
                        <span>{t.number}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-green-100 text-green-700">
                          EM LIQUIDAÇÃO
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintingTrp(t);
                          }}
                          className={`p-1 rounded-md transition-all duration-200 hover:bg-slate-100 flex items-center justify-center ${
                            printedTrpIds.includes(t.id)
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-green-400 hover:text-green-500'
                          }`}
                          title="Visualizar e Imprimir Relatório de Conferência"
                        >
                          <span className="material-symbols-outlined text-base font-black">print</span>
                        </button>
                      </div>
                    </div>
 
                    {/* Line 2: Veículo */}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase">
                      <span className="material-symbols-outlined text-[#22c55e] font-bold text-sm">local_shipping</span>
                      <span>{t.placa}</span>
                    </div>
 
                    {/* Line 3: Motorista */}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
                      <span className="material-symbols-outlined text-[#22c55e] font-bold text-sm">person</span>
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
          <button
            type="button"
            onClick={() => setSelectedAction(null)}
            className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-350 rounded-xl text-xs font-black text-gray-700 uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Voltar</span>
          </button>
        </div>

      </div>

      {/* Warning/Confirmation modal */}
      {showConfirmConfirm && selectedTrp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border-2 border-green-600 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-green-700">
              <span className="material-symbols-outlined text-3xl font-bold">help_outline</span>
              <h3 className="text-lg font-black uppercase tracking-wider">Conferência</h3>
            </div>
            <p className="text-slate-700 text-sm font-semibold">
              Deseja Conferir e Finalizar o transporte {selectedTrp.number}?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmConfirm(false);
                  setSelectedTrp(null);
                }}
                className="px-4 py-2 bg-gray-150 hover:bg-gray-250 text-slate-700 font-extrabold text-xs uppercase rounded-lg transition-all"
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmConfirm(false);
                  setShowFinalizeConference(true);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs uppercase rounded-lg transition-all shadow-md active:scale-95"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-second alert message after 4-second loading */}
      {postFinalizeMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border-4 border-green-600 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500 shadow-md animate-bounce">
              <span className="material-symbols-outlined text-green-600 text-5xl font-black">check_circle</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sucesso</h3>
              <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase tracking-wider">
                {postFinalizeMessage}
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-600 h-full animate-[shrink-width_2s_linear_forwards]" style={{ width: '100%' }}></div>
            </div>
            <style>{`
              @keyframes shrink-width {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
          </div>
        </div>
      )}

    </div>
  );
}
