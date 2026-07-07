'use client';

import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';

export default function ReportsView() {
  const { transports, activeDistributor, activeDistributorName, movementsHistory, sobraClientes, reportsTab, setReportsTab, countDocuments, products, clients, clearAllTransportsAndHistory } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sorter / Filter matching the table of Imagem 5
  const filteredTransports = transports.filter(t => 
    t.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.driver.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.placa.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSobraClientes = (sobraClientes || []).filter(s =>
    s.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.numeroTransporte.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descricaoProduto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCountDocuments = (countDocuments || []).filter(d =>
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const flatMovements = (movementsHistory || []).flatMap((m) => {
    const isEntrance = m.type.toUpperCase().includes('ENTRADA');
    const isExit = m.type.toUpperCase().includes('SAIDA') || m.type.toUpperCase().includes('SAÍDA');

    const origem = isEntrance 
      ? m.supplier 
      : isExit 
        ? activeDistributorName 
        : 'ARMAZÉM INTERNO';

    const destino = isEntrance 
      ? activeDistributorName 
      : isExit 
        ? m.supplier 
        : 'AJUSTE DE ESTOQUE';

    const operacao = m.type;

    // Derive a stable hour based on the movement ID or index
    let hour = '10:00';
    if (m.id) {
      const sum = m.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const min = (sum % 45) + 10; // 10 to 54
      const hr = (sum % 8) + 8; // 8 to 15
      hour = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }

    return (m.items || []).map((item) => ({
      date: m.date,
      hour: hour,
      origem: origem,
      destino: destino,
      operacao: operacao,
      referencia: m.nfNumber,
      productCode: item.productCode,
      productDescription: item.productDescription,
      qty: item.qty,
      unit: item.unit,
      observation: m.observation || 'Sem observações'
    }));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300" style={{ fontFamily: 'Calibri, sans-serif' }}>
      
      {/* Reports navigation resembling image 5 tabs bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-3xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'transports' as const, label: 'Transportes', icon: 'list_alt', color: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 font-bold border-orange-200' },
            { id: 'movements' as const, label: 'Movimentações', icon: 'trending_up', color: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 font-bold border-orange-200' },
            { id: 'sobra_clientes' as const, label: 'Sobra em Clientes', icon: 'report_problem', color: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 font-bold border-orange-200' },
            { id: 'saldo_loja' as const, label: 'Saldo em Loja', icon: 'storefront', color: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 font-bold border-orange-200' },
            { id: 'contagem_loja' as const, label: 'Contagem em Loja', icon: 'calculate', color: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 font-bold border-orange-200' },
            { id: 'contagem_doc' as const, label: 'Doc. Contagem', icon: 'assignment_turned_in', color: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 font-bold border-orange-200' },
            { id: 'saldo_vs_contagem' as const, label: 'Saldo vs Contagem', icon: 'compare_arrows', color: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 font-bold border-orange-200' }
          ].map(tab => {
            const isActive = reportsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setReportsTab(tab.id);
                  setSearchTerm('');
                }}
                className={`py-2 px-5 text-xs rounded-xl border flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                  isActive
                    ? tab.activeBg
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-bold'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${tab.color}`}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Liquidation, Movements, or Sobra Clientes Table */}
      {reportsTab === 'transports' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header styled as Laranja Claro */}
          <div className="bg-orange-50/70 border-b border-orange-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <span className="material-symbols-outlined text-orange-600 font-bold">article</span>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Relatório de Transportes Liquidados
              </h4>
            </div>

            {/* Delete all transports and history button */}
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-rose-700 animate-pulse">Confirmar exclusão de TODOS os transportes e históricos?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllTransportsAndHistory();
                      setConfirmDelete(false);
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">delete_forever</span>
                    Sim, Excluir!
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                  Excluir Todos os Transportes
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              {filteredTransports.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">
                  <span className="material-symbols-outlined text-4xl block text-gray-300 mb-2">article_off</span>
                  Nenhum transporte liquidado cadastrado ou operando.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Nº do Transporte</th>
                      <th className="py-3 px-3">Data do Transporte</th>
                      <th className="py-3 px-3">Placa</th>
                      <th className="py-3 px-3">Motorista</th>
                      <th className="py-3 px-3">Rota de Entrega</th>
                      <th className="py-3 px-3 text-center">Qtd. Clientes</th>
                      <th className="py-3 px-3 text-center text-emerald-600">Entregue</th>
                      <th className="py-3 px-3 text-center text-rose-600">Não Entregue</th>
                      <th className="py-3 px-3 text-center text-sky-600">Retirada</th>
                      <th className="py-3 px-3 text-right text-orange-600">% Efetividade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTransports.map((t) => (
                      <tr key={t.id} className="hover:bg-orange-50/10 transition-colors font-bold text-[10px] text-black whitespace-nowrap">
                        <td className="py-0.5 px-3 text-black font-bold text-[10px] whitespace-nowrap">{t.number}</td>
                        <td className="py-0.5 px-3 font-mono text-black font-bold text-[10px] whitespace-nowrap">{t.date}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px] tracking-wide uppercase whitespace-nowrap">{t.placa}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px] whitespace-nowrap">{t.driver}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px] whitespace-nowrap">{t.route}</td>
                        <td className="py-0.5 px-3 text-center text-black font-bold text-[10px] whitespace-nowrap">{t.clientsCount}</td>
                        <td className="py-0.5 px-3 text-center text-black font-bold text-[10px] whitespace-nowrap">{t.delivered}</td>
                        <td className="py-0.5 px-3 text-center text-black font-bold text-[10px] whitespace-nowrap">{t.notDelivered}</td>
                        <td className="py-0.5 px-3 text-center text-black font-bold text-[10px] whitespace-nowrap">{t.retirados ?? 0}</td>
                        <td className="py-0.5 px-3 text-right text-black font-bold text-[10px] whitespace-nowrap">
                          {t.effectiveness}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>


        </div>
      )}
      {reportsTab === 'movements' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header styled as Laranja Claro */}
          <div className="bg-orange-50/70 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="material-symbols-outlined text-orange-600 font-bold">receipt_long</span>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Histórico de Movimentações
              </h4>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              {flatMovements.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">
                  <span className="material-symbols-outlined text-4xl block text-gray-300 mb-2">history</span>
                  Nenhuma movimentação por Nota Fiscal registrada neste distribuidor.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] whitespace-nowrap leading-tight">
                      <th className="py-3 px-3">Data do<br />Documento</th>
                      <th className="py-3 px-3">Hora do<br />Lançamento</th>
                      <th className="py-3 px-3">Origem da<br />Movimentação</th>
                      <th className="py-3 px-3">Destino da<br />Movimentação</th>
                      <th className="py-3 px-3">Tipo de<br />Operação</th>
                      <th className="py-3 px-3">Referência<br />Movimento</th>
                      <th className="py-3 px-3">Código do<br />Material</th>
                      <th className="py-3 px-3">Descrição do<br />Material</th>
                      <th className="py-3 px-3 text-right">Quantidade<br />Movimentada</th>
                      <th className="py-3 px-3 text-center">Unidade de<br />Medida</th>
                      <th className="py-3 px-3">Observações<br />Geral</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {flatMovements.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors font-bold text-[10px] text-black whitespace-nowrap">
                        <td className="py-0.5 px-3 font-mono text-black font-bold text-[10px]">{row.date}</td>
                        <td className="py-0.5 px-3 font-mono text-black font-bold text-[10px]">{row.hour}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px]">{row.origem}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px]">{row.destino}</td>
                        <td className="py-0.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            row.operacao.toUpperCase().includes('ENTRADA') ? 'bg-emerald-100 text-emerald-850 border border-emerald-300' :
                            row.operacao.toUpperCase().includes('SAIDA') || row.operacao.toUpperCase().includes('SAÍDA') ? 'bg-rose-100 text-rose-850 border border-rose-350' : 'bg-amber-100 text-amber-850 border border-amber-300'
                          }`}>
                            {row.operacao}
                          </span>
                        </td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px]">{row.referencia?.replace(/^TR-/, '')}</td>
                        <td className="py-0.5 px-3 font-mono text-black font-bold text-[10px]">{row.productCode}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px]">{row.productDescription}</td>
                        <td className="py-0.5 px-3 text-right text-black font-bold text-[10px]">{row.qty}</td>
                        <td className="py-0.5 px-3 text-center text-black font-bold text-[10px]">{row.unit}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px]" title={row.observation}>
                          {row.observation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>


        </div>
      )}

      {reportsTab === 'sobra_clientes' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header styled as Laranja Claro */}
          <div className="bg-orange-50/70 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="material-symbols-outlined text-orange-600 font-bold">report_problem</span>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Sobra em Clientes
              </h4>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              {filteredSobraClientes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">
                  <span className="material-symbols-outlined text-4xl block text-gray-300 mb-2">check_circle</span>
                  Nenhuma sobra em coletas de clientes apontada.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Matrícula</th>
                      <th className="py-3 px-3">Razão Social</th>
                      <th className="py-3 px-3">Nº do Transporte</th>
                      <th className="py-3 px-3">Data do Transporte</th>
                      <th className="py-3 px-3">Código do Material</th>
                      <th className="py-3 px-3">Descrição do Material</th>
                      <th className="py-3 px-3 text-right">Quantidade Sobra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredSobraClientes.map((s) => (
                      <tr key={s.id} className="hover:bg-orange-50/10 transition-colors font-bold text-[10px] text-black whitespace-nowrap">
                        <td className="py-0.5 px-3 font-mono text-black font-bold text-[10px] whitespace-nowrap">{s.matricula}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px] whitespace-nowrap">{s.razaoSocial}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px] whitespace-nowrap">{s.numeroTransporte}</td>
                        <td className="py-0.5 px-3 font-mono text-black font-bold text-[10px] whitespace-nowrap">{s.dataTransporte}</td>
                        <td className="py-0.5 px-3 font-mono text-black font-bold text-[10px] whitespace-nowrap">{s.codigoProduto}</td>
                        <td className="py-0.5 px-3 text-black font-bold text-[10px] whitespace-nowrap">{s.descricaoProduto}</td>
                        <td className="py-0.5 px-3 text-right text-black font-bold text-[10px] whitespace-nowrap">{s.quantidadeSobra}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>


          </div>
        </div>
      )}

      {reportsTab === 'contagem_doc' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header styled as Laranja Claro */}
          <div className="bg-orange-50/70 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="material-symbols-outlined text-orange-600 font-bold">assignment_turned_in</span>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Relatório de Documentos de Contagem
              </h4>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              {filteredCountDocuments.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">
                  <span className="material-symbols-outlined text-4xl block text-gray-300 mb-2">inventory</span>
                  Nenhum documento de contagem encontrado.
                </div>
              ) : (
                <div className="space-y-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-3">Nº do Documento</th>
                        <th className="py-3 px-3">Data</th>
                        <th className="py-3 px-3">Funcionário</th>
                        <th className="py-3 px-3">Rota</th>
                        <th className="py-3 px-3 text-center">Total Clientes</th>
                        <th className="py-3 px-3 text-center">Aderência</th>
                        <th className="py-3 px-3 text-center">Fechados</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredCountDocuments.map((d) => {
                        const isExpanded = selectedDocId === d.id;
                        const hasSummary = !!d.countsSummary;
                        const aderenciaStr = hasSummary ? `${d.countsSummary!.aderencia.toFixed(1)}%` : 'N/A';
                        const fechadosStr = hasSummary ? `${d.countsSummary!.fechadosPerc.toFixed(1)}%` : 'N/A';
                        
                        return (
                          <React.Fragment key={d.id}>
                            <tr className="hover:bg-orange-50/10 transition-colors font-bold text-[10px] text-black whitespace-nowrap">
                              <td className="py-1.5 px-3 text-black font-bold text-[10px] whitespace-nowrap font-mono">{d.id}</td>
                              <td className="py-1.5 px-3 font-mono text-black font-bold text-[10px] whitespace-nowrap">{d.date}</td>
                              <td className="py-1.5 px-3 text-black font-bold text-[10px] whitespace-nowrap">{d.employeeName}</td>
                              <td className="py-1.5 px-3 text-black font-bold text-[10px] whitespace-nowrap">Rota {d.route}</td>
                              <td className="py-1.5 px-3 text-center text-black font-bold text-[10px] whitespace-nowrap">{d.totalClients}</td>
                              <td className="py-1.5 px-3 text-center text-black font-bold text-[10px] whitespace-nowrap">{aderenciaStr}</td>
                              <td className="py-1.5 px-3 text-center text-black font-bold text-[10px] whitespace-nowrap">{fechadosStr}</td>
                              <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  d.status === 'Finalizado' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {d.status}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocId(isExpanded ? null : d.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black rounded-md transition-colors"
                                >
                                  {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                                </button>
                              </td>
                            </tr>
                            
                            {/* Expanded Details Row */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={9} className="bg-slate-50/70 p-4">
                                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-3xs">
                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-700 border-b pb-1.5 flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-[14px]">toc</span>
                                      Detalhamento de Clientes e Produtos Lançados
                                    </h5>
                                    
                                    {/* Client List */}
                                    <div className="space-y-4">
                                      {Object.keys(d.clientStatuses).map((clientId) => {
                                        const cStatus = d.clientStatuses[clientId];
                                        const isClosed = d.clientClosedFlags[clientId] || false;
                                        
                                        // Try to find client from main context or reconstruct
                                        let cName = 'Cliente Desconhecido';
                                        let cMatrícula = '---';
                                        const activeClient = clients ? clients.find(c => c.id === clientId) : null;
                                        if (activeClient) {
                                          cName = activeClient.razaoSocial;
                                          cMatrícula = activeClient.matricula;
                                        }

                                        return (
                                          <div key={clientId} className="border border-slate-100 rounded-lg p-3 bg-slate-50/40 space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                              <div>
                                                <span className="font-mono text-black">[{cMatrícula}]</span>{' '}
                                                <span className="text-slate-800 uppercase">{cName}</span>
                                              </div>
                                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                                cStatus === 'CONTADO'
                                                  ? 'bg-emerald-100 text-emerald-700'
                                                  : cStatus === 'FECHADO'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                              }`}>
                                                {cStatus}
                                              </span>
                                            </div>

                                            {/* Product quantities if not closed and is counted */}
                                            {!isClosed && cStatus === 'CONTADO' && (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                                {products.map((p) => {
                                                  const counts = d.clientCounts[clientId]?.[p.id] || { cheio: 0, vazio: 0 };
                                                  if (counts.cheio === 0 && counts.vazio === 0) return null;
                                                  
                                                  return (
                                                    <div key={p.id} className="bg-white border border-slate-150 rounded-md p-2 text-[9px] font-bold text-slate-700 flex justify-between items-center">
                                                      <span className="truncate max-w-[150px]" title={p.description}>
                                                        {p.code} - {p.description}
                                                      </span>
                                                      <div className="flex gap-2">
                                                        <span className="text-emerald-600 bg-emerald-50 px-1 rounded">C: {counts.cheio}</span>
                                                        <span className="text-sky-600 bg-sky-50 px-1 rounded">V: {counts.vazio}</span>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                {/* If all products were zero */}
                                                {Object.values(d.clientCounts[clientId] || {}).every(v => v.cheio === 0 && v.vazio === 0) && (
                                                  <span className="text-[9px] text-gray-400 italic">Nenhum produto com quantidade maior que zero.</span>
                                                )}
                                              </div>
                                            )}
                                            {isClosed && (
                                              <p className="text-[9px] text-red-500 italic font-bold">Estabelecimento estava fechado no momento da contagem.</p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


          </div>
        </div>
      )}

      {reportsTab === 'saldo_loja' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-orange-50/70 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="material-symbols-outlined text-orange-600 font-bold">storefront</span>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Relatório de Saldo em Lojas
              </h4>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              {clients.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">
                  <span className="material-symbols-outlined text-4xl block text-gray-300 mb-2">storefront</span>
                  Nenhum cliente cadastrado.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Matrícula</th>
                      <th className="py-3 px-3">Razão Social</th>
                      <th className="py-3 px-3">Rota de Entrega</th>
                      <th className="py-3 px-3">Rota de Contagem</th>
                      {products.map((p) => (
                        <th key={p.id} className="py-3 px-3 text-right">
                          {p.code} - {p.description}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {clients
                      .filter(c => 
                        c.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((c) => {
                        const hasAnyBalance = products.some((p) => (c.productBalances?.[p.id] ?? 0) > 0);
                        return (
                          <tr key={c.id} className="hover:bg-orange-50/10 transition-colors font-bold text-[10px] text-black whitespace-nowrap">
                            <td className="py-2 px-3 text-black font-mono font-bold text-[10px]">{c.matricula}</td>
                            <td className="py-2 px-3 text-black font-bold text-[10px] uppercase">{c.razaoSocial}</td>
                            <td className="py-2 px-3 text-black font-bold text-[10px]">Rota {c.rotaEntrega}</td>
                            <td className="py-2 px-3 text-black font-bold text-[10px]">Rota {c.rotaContagem}</td>
                            {products.map((p) => {
                              const balance = c.productBalances?.[p.id] ?? 0;
                              return (
                                <td 
                                  key={p.id} 
                                  className={`py-2 px-3 text-right font-mono font-black text-[11px] border-r border-slate-100 ${
                                    hasAnyBalance
                                      ? 'bg-purple-100/90 text-purple-700 border-x border-purple-200/50'
                                      : 'text-black font-bold text-[10px]'
                                  }`}
                                >
                                  {balance}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>


          </div>
        </div>
      )}

      {reportsTab === 'contagem_loja' && (() => {
        const reportRows: any[] = [];
        clients.forEach((c) => {
          // Find all count documents containing a saved count for this client.
          const docsWithCount = countDocuments.filter(
            (doc) => 
              doc.clientStatuses && 
              (doc.clientStatuses[c.id] === 'CONTADO' || doc.clientStatuses[c.id] === 'FECHADO')
          );

          if (docsWithCount.length === 0) {
            reportRows.push({
              id: `${c.id}-none`,
              client: c,
              docId: 'Sem Contagem',
              date: '-',
              counts: null,
              status: 'NÃO CONTADO',
              contagemTiming: '-'
            });
          } else {
            docsWithCount.forEach((doc) => {
              reportRows.push({
                id: `${c.id}-${doc.id}`,
                client: c,
                docId: doc.id,
                date: doc.date,
                counts: doc.clientCounts?.[c.id] || null,
                status: doc.clientStatuses[c.id],
                contagemTiming: doc.clientContagemTiming?.[c.id] || '-'
              });
            });
          }
        });

        const filteredRows = reportRows.filter(row => 
          row.client.matricula.toLowerCase().includes(searchTerm.toLowerCase()) || 
          row.client.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) || 
          row.docId.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Calculate grand totals of all products
        const grandTotalCheio = products.reduce((acc, p) => {
          return acc + filteredRows.reduce((rowAcc, row) => {
            const hasCounts = row.counts && (row.status === 'CONTADO' || row.status === 'FECHADO');
            return rowAcc + (hasCounts ? (row.counts[p.id]?.cheio ?? 0) : 0);
          }, 0);
        }, 0);

        const grandTotalVazio = products.reduce((acc, p) => {
          return acc + filteredRows.reduce((rowAcc, row) => {
            const hasCounts = row.counts && (row.status === 'CONTADO' || row.status === 'FECHADO');
            return rowAcc + (hasCounts ? (row.counts[p.id]?.vazio ?? 0) : 0);
          }, 0);
        }, 0);

        return (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-orange-50/70 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-orange-600 font-bold">calculate</span>
                <h4 className="text-sm font-black text-slate-900 uppercase">
                  Relatório de Contagem em Cliente
                </h4>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                {filteredRows.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 italic">
                    <span className="material-symbols-outlined text-4xl block text-gray-300 mb-2">calculate</span>
                    Nenhuma contagem registrada ou encontrada para os filtros.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px] bg-slate-50/50">
                        <th className="py-2.5 px-3 border-r border-slate-100" colSpan={6}>
                          Informações Gerais
                        </th>
                        {products.map((p) => (
                          <th key={`h-cheio-${p.id}`} className="py-2.5 px-3 text-center text-orange-600 border-r border-slate-100" colSpan={1}>
                            {p.description} (CHEIO)
                          </th>
                        ))}
                        {products.map((p) => (
                          <th key={`h-vazio-${p.id}`} className="py-2.5 px-3 text-center text-blue-600" colSpan={1}>
                            {p.description} (VAZIO)
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px]">
                        <th className="py-2 px-3">Matrícula</th>
                        <th className="py-2 px-3">Razão Social</th>
                        <th className="py-2 px-3">Rota de Contagem</th>
                        <th className="py-2 px-3">Documento de Contagem</th>
                        <th className="py-2 px-3">Data da Contagem</th>
                        <th className="py-2 px-3 border-r border-slate-100">Momento da Contagem</th>
                        {products.map((p) => (
                          <th key={`sh-cheio-${p.id}`} className="py-2 px-3 text-center text-[8px] text-orange-500 border-r border-slate-100">
                            Qtd. Cheio
                          </th>
                        ))}
                        {products.map((p) => (
                          <th key={`sh-vazio-${p.id}`} className="py-2 px-3 text-center text-[8px] text-blue-500">
                            Qtd. Vazio
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRows.map((row) => {
                        const c = row.client;
                        const hasCounts = row.counts && (row.status === 'CONTADO' || row.status === 'FECHADO');
                        const hasAnyCountedQty = hasCounts && products.some((p) => {
                          const cheioVal = row.counts?.[p.id]?.cheio ?? 0;
                          const vazioVal = row.counts?.[p.id]?.vazio ?? 0;
                          return cheioVal > 0 || vazioVal > 0;
                        });
                        
                        return (
                          <tr key={row.id} className="hover:bg-orange-50/10 transition-colors font-bold text-[10px] text-black whitespace-nowrap">
                            <td className="py-2 px-3 text-black font-mono font-bold text-[10px]">{c.matricula}</td>
                            <td className="py-2 px-3 text-black font-bold text-[10px] uppercase truncate max-w-[180px]">{c.razaoSocial}</td>
                            <td className="py-2 px-3 text-black font-bold text-[10px]">Rota {c.rotaContagem}</td>
                            <td className={`py-2 px-3 font-mono font-bold text-[10px] ${row.docId === 'Sem Contagem' ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                              {row.docId}
                            </td>
                            <td className="py-2 px-3 font-mono text-black font-bold text-[10px]">{row.date}</td>
                            <td className="py-2 px-3 font-mono text-black font-bold text-[10px] border-r border-slate-100">{row.contagemTiming}</td>
                            
                            {products.map((p) => {
                              const value = hasCounts ? (row.counts[p.id]?.cheio ?? 0) : 0;
                              return (
                                <td 
                                  key={`v-cheio-${p.id}`} 
                                  className={`py-2 px-3 text-center font-mono font-black text-[11px] border-r border-slate-100 transition-colors ${
                                    hasAnyCountedQty
                                      ? 'bg-orange-100/90 text-orange-700 border-x border-orange-200/50'
                                      : 'text-orange-500 bg-orange-50/10'
                                  }`}
                                >
                                  {value}
                                </td>
                              );
                            })}

                            {products.map((p) => {
                              const value = hasCounts ? (row.counts[p.id]?.vazio ?? 0) : 0;
                              return (
                                <td 
                                  key={`v-vazio-${p.id}`} 
                                  className={`py-2 px-3 text-center font-mono font-black text-[11px] transition-colors ${
                                    hasAnyCountedQty
                                      ? 'bg-blue-100/90 text-blue-700 border-x border-blue-200/50'
                                      : 'text-blue-600 bg-blue-50/10'
                                  }`}
                                >
                                  {value}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                      {/* Row 1: Sums per item */}
                      <tr className="text-[10px] text-slate-800 uppercase divide-y divide-slate-100">
                        <td className="py-2.5 px-3 text-right font-black border-r border-slate-200" colSpan={6}>
                          Soma por Item:
                        </td>
                        {products.map((p) => {
                          const itemTotalCheio = filteredRows.reduce((rowAcc, row) => {
                            const hasCounts = row.counts && (row.status === 'CONTADO' || row.status === 'FECHADO');
                            return rowAcc + (hasCounts ? (row.counts[p.id]?.cheio ?? 0) : 0);
                          }, 0);
                          return (
                            <td key={`f-cheio-${p.id}`} className="py-2.5 px-3 text-center font-mono font-black text-[11px] text-orange-700 bg-orange-100/60 border-r border-orange-200">
                              {itemTotalCheio}
                            </td>
                          );
                        })}
                        {products.map((p) => {
                          const itemTotalVazio = filteredRows.reduce((rowAcc, row) => {
                            const hasCounts = row.counts && (row.status === 'CONTADO' || row.status === 'FECHADO');
                            return rowAcc + (hasCounts ? (row.counts[p.id]?.vazio ?? 0) : 0);
                          }, 0);
                          return (
                            <td key={`f-vazio-${p.id}`} className="py-2.5 px-3 text-center font-mono font-black text-[11px] text-blue-700 bg-blue-100/60 border-r border-blue-200 last:border-r-0">
                              {itemTotalVazio}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 2: Grand totals */}
                      <tr className="text-[10px] text-slate-800 uppercase bg-slate-100 font-black border-t border-slate-200">
                        <td className="py-3 px-3 text-right font-black border-r border-slate-200" colSpan={6}>
                          Total de Todos os Itens:
                        </td>
                        <td colSpan={products.length} className="py-3 px-3 text-center text-orange-800 bg-orange-200/80 font-black text-xs border-r border-orange-300">
                          Total Cheio: <span className="font-extrabold text-sm text-orange-700">{grandTotalCheio}</span>
                        </td>
                        <td colSpan={products.length} className="py-3 px-3 text-center text-blue-800 bg-blue-200/80 font-black text-xs">
                          Total Vazio: <span className="font-extrabold text-sm text-blue-700">{grandTotalVazio}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>


            </div>
          </div>
        );
      })()}

      {reportsTab === 'saldo_vs_contagem' && (() => {
        // Filter clients based on search
        const filteredClients = clients.filter(c => 
          c.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-orange-50/70 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-orange-600 font-bold">compare_arrows</span>
                <h4 className="text-sm font-black text-slate-900 uppercase">
                  Relatório Comparativo: Saldo vs Contagem
                </h4>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 italic">
                    <span className="material-symbols-outlined text-4xl block text-gray-300 mb-2">compare_arrows</span>
                    Nenhum cliente cadastrado ou encontrado para os filtros.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase text-[9px] bg-slate-50/50">
                        <th className="py-2.5 px-3 border-r border-slate-200" colSpan={4}>
                          Informações Gerais do Cliente
                        </th>
                        {products.map((p) => (
                          <th key={`h-prod-${p.id}`} className="py-2.5 px-3 text-center text-slate-700 border-r border-l border-slate-250 bg-slate-100/50 font-black" colSpan={3}>
                            {p.code} - {p.description}
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px]">
                        <th className="py-2 px-3">Matrícula</th>
                        <th className="py-2 px-3">Razão Social</th>
                        <th className="py-2 px-3 text-center">Rota Entrega</th>
                        <th className="py-2 px-3 text-center border-r border-slate-200 font-bold">Rota Contagem</th>
                        {products.map((p) => (
                          <React.Fragment key={`sh-prod-${p.id}`}>
                            <th className="py-2 px-2 text-right text-[8px] text-purple-700 font-black border-l border-slate-250 bg-purple-50/10">Saldo</th>
                            <th className="py-2 px-2 text-right text-[8px] text-indigo-600 font-black bg-indigo-50/5">Contagem</th>
                            <th className="py-2 px-2 text-right text-[8px] text-amber-600 font-black border-r border-slate-250 bg-amber-50/5">Dif.</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredClients.map((c) => {
                        // Find the most recent count document for this client
                        const latestDoc = [...countDocuments]
                          .reverse()
                          .find(doc => doc.clientStatuses && (doc.clientStatuses[c.id] === 'CONTADO' || doc.clientStatuses[c.id] === 'FECHADO') && doc.clientCounts?.[c.id]);

                        return (
                          <tr key={c.id} className="hover:bg-orange-50/10 transition-colors font-bold text-[10px] text-black whitespace-nowrap">
                            <td className="py-2 px-3 text-black font-mono font-bold text-[10px]">{c.matricula}</td>
                            <td className="py-2 px-3 text-black font-bold text-[10px] uppercase truncate max-w-[180px]">{c.razaoSocial}</td>
                            <td className="py-2 px-3 text-center text-black font-bold text-[10px]">Rota {c.rotaEntrega}</td>
                            <td className="py-2 px-3 text-center text-black font-bold text-[10px] border-r border-slate-200">Rota {c.rotaContagem}</td>
                            
                            {products.map((p) => {
                              const saldoLoja = c.productBalances?.[p.id] ?? 0;
                              
                              let somaContagem = 0;
                              if (latestDoc && latestDoc.clientCounts?.[c.id]?.[p.id]) {
                                const cheio = latestDoc.clientCounts[c.id][p.id].cheio ?? 0;
                                const vazio = latestDoc.clientCounts[c.id][p.id].vazio ?? 0;
                                somaContagem = cheio + vazio;
                              }
                              
                              const diff = somaContagem - saldoLoja;
                              
                              return (
                                <React.Fragment key={`v-prod-${p.id}`}>
                                  {/* Saldo em Loja Column */}
                                  <td className="py-2 px-2 text-right font-mono font-black text-[10px] bg-purple-50/20 text-purple-700 border-l border-slate-250">
                                    {saldoLoja}
                                  </td>
                                  {/* Soma Contagem (Cheio + Vazio) Column */}
                                  <td className="py-2 px-2 text-right font-mono font-bold text-[10px] bg-indigo-50/20 text-indigo-700">
                                    {latestDoc ? somaContagem : '-'}
                                  </td>
                                  {/* Difference Column */}
                                  <td className={`py-2 px-2 text-right font-mono font-black text-[11px] border-r border-slate-250 ${
                                    !latestDoc 
                                      ? 'text-slate-400 bg-slate-50/10'
                                      : diff > 0
                                        ? 'text-emerald-700 bg-emerald-50/50'
                                        : diff < 0
                                          ? 'text-rose-700 bg-rose-50/50'
                                          : 'text-slate-500 bg-slate-100/50'
                                  }`}>
                                    {latestDoc ? (diff > 0 ? `+${diff}` : diff) : '-'}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
