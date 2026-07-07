'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../lib/AppContext';
import { Product } from '../lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Legend
} from 'recharts';

// SVG Cubes icon (matching MovementsView)
const ThreeCubesSVG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M 50 15 L 85 32 L 50 50 L 15 32 Z" fillOpacity="0.85" />
    <path d="M 15 32 L 50 50 L 50 85 L 15 67 Z" fillOpacity="0.7" />
    <path d="M 50 50 L 85 32 L 85 67 L 50 85 Z" fillOpacity="0.55" />
  </svg>
);

// Beautiful custom truck icon matching the Entrada via NF icon structure, retaining sizes and color states
const TruckIconWithCargo = ({ className, count, variant = 'rose' }: { className?: string; count: number; variant?: 'rose' | 'blue' }) => {
  const strokeColor = variant === 'blue' ? '#3b82f6' : '#f43f5e'; // Blue-500 or Rose-500
  const fillColor = variant === 'blue' ? '#dbeafe' : '#ffe4e6';   // Blue-100 or Rose-100
  const textColor = variant === 'blue' ? '#1e40af' : '#9f1239';   // Blue-800 or Rose-800

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`} style={{ width: '54px', height: '36px' }}>
      <svg
        viewBox="0 0 24 24"
        width="54"
        height="36"
        className="w-full h-full"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Cargo box with rounded top corners */}
        <path d="M14 14V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a1 1 0 0 0 1 1h11" />
        {/* Cabin */}
        <path d="M14 9h4l3 3.5V16a1 1 0 0 1-1 1h-6" />
        {/* Wheels */}
        <circle cx="6" cy="18" r="1.5" fill="#334155" />
        <circle cx="17" cy="18" r="1.5" fill="#334155" />
      </svg>
      {/* Number inside the square cargo box */}
      <span
        className="absolute font-black text-xs"
        style={{
          left: '21px',
          top: '15px',
          transform: 'translate(-50%, -50%)',
          color: textColor,
          lineHeight: '1',
          fontSize: '11px'
        }}
      >
        {count}
      </span>
    </div>
  );
};

// Beautiful moving truck icon matching the Entrada via NF icon structure, scaling, and coloring based on progress
const MovingTruckIcon = ({ percent, clientCount }: { percent: number; clientCount: number }) => {
  // Color logic based on requirements:
  // 0% -> Vermelho
  // 0,01% a 99,9% -> Amarelo
  // 100% -> Verde
  let strokeColor = '#eab308'; // Yellow-500
  let fillColor = '#fef08a';   // Yellow-200
  let textColor = '#854d0e';   // Yellow-900

  if (percent === 0) {
    strokeColor = '#ef4444'; // Red-500
    fillColor = '#fee2e2';   // Red-100
    textColor = '#991b1b';   // Red-800
  } else if (percent >= 100) {
    strokeColor = '#10b981'; // Emerald-500
    fillColor = '#d1fae5';   // Emerald-100
    textColor = '#065f46';   // Emerald-800
  }

  return (
    <div className="relative inline-block select-none shrink-0" style={{ width: '54px', height: '36px' }}>
      <svg
        viewBox="0 0 24 24"
        width="54"
        height="36"
        className="w-full h-full"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Cargo box with rounded top corners */}
        <path d="M14 14V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a1 1 0 0 0 1 1h11" />
        {/* Cabin */}
        <path d="M14 9h4l3 3.5V16a1 1 0 0 1-1 1h-6" />
        {/* Wheels */}
        <circle cx="6" cy="18" r="1.5" fill="#334155" />
        <circle cx="17" cy="18" r="1.5" fill="#334155" />
      </svg>
      {/* Number inside the square cargo box */}
      <span
        className="absolute font-black text-xs"
        style={{
          left: '21px',
          top: '15px',
          transform: 'translate(-50%, -50%)',
          color: textColor,
          lineHeight: '1',
          fontSize: '11px'
        }}
      >
        {clientCount}
      </span>
    </div>
  );
};

const MONTHS = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' }
];

// Beautiful customized Tick component to show day of month below day of week in Recharts XAxis
const CustomizedTick = (props: any) => {
  const { x, y, payload } = props;
  if (!payload || !payload.value) return null;
  const parts = payload.value.split('\n');
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#64748b" fontSize={10} className="font-extrabold uppercase">
        {parts[0]}
      </text>
      {parts[1] && (
        <text x={0} y={12} dy={12} textAnchor="middle" fill="#94a3b8" fontSize={9} className="font-bold">
          {parts[1]}
        </text>
      )}
    </g>
  );
};

// Custom tooltip for the new combined Estoque vs Necessidade chart
const CustomCombinedTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const excess = data.estoque_total - data.necessidade;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs text-left space-y-2 max-w-xs">
        <p className="font-black text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-1.5">{data.name}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-8">
            <span className="text-slate-400 font-bold">Necessidade:</span>
            <span className="font-extrabold text-[#93c5fd] font-mono">{data.necessidade.toLocaleString('pt-BR')} UN</span>
          </div>
          <div className="flex justify-between items-center gap-8">
            <span className="text-slate-400 font-bold">Estoque Total:</span>
            <span className="font-extrabold text-[#fdba74] font-mono">{data.estoque_total.toLocaleString('pt-BR')} UN</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center gap-8">
            <span className="text-slate-400 font-bold">Status:</span>
            {excess >= 0 ? (
              <span className="font-black text-emerald-400 uppercase text-[10px]">Atendido (+{excess.toLocaleString('pt-BR')})</span>
            ) : (
              <span className="font-black text-rose-400 uppercase text-[10px]">Déficit ({excess.toLocaleString('pt-BR')})</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function LogisticDashboardView() {
  const {
    products,
    clients,
    activeTransports,
    transports,
    activeDistributorName,
    isInventoryLocked,
    countDocuments
  } = useApp();

  // Selected product filter for "Saldo de produtos em Loja" chart
  const [selectedProductChart, setSelectedProductChart] = useState<string>('todos');
  
  // Selected month filter for "Saldo de produtos em Loja" chart (0-indexed, default is 6 = Julho)
  const [selectedMonth, setSelectedMonth] = useState<string>('6');

  // Interactive collapsibles for Product View
  const [expandEstoqueTotal, setExpandEstoqueTotal] = useState(false);
  const [expandNecessidade, setExpandNecessidade] = useState(false);

  // Visão Detalhada Modal state
  const [isDetailedViewOpen, setIsDetailedViewOpen] = useState(false);

  // Report modal for active deliveries/transports
  const [isTransportsModalOpen, setIsTransportsModalOpen] = useState(false);
  const [selectedDetailTransport, setSelectedDetailTransport] = useState<{
    t: any;
    matchedTransport: any;
    transportClients: any[];
  } | null>(null);

  // Animation state for vehicle icons
  const [animateProgress, setAnimateProgress] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // --- 1. CALCULATIONS FOR ESTOQUE TOTAL (TOTAL GERAL) ---
  const productStocks = useMemo(() => {
    return products.map((p) => {
      const armazem = p.initialStock || 0;
      const transporte = (activeTransports || [])
        .filter((t) => t.statusTransporte !== 'EXCLUIDO')
        .reduce((sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0), 0);
      const prodLoja = clients.reduce((sum, c) => {
        if (c.productBalances && c.productBalances[p.id] !== undefined) {
          return sum + (c.productBalances[p.id] || 0);
        }
        const pIdx = products.findIndex((prod) => prod.id === p.id);
        const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
        return sum + Math.floor((c.saldoLoja || 0) * pct);
      }, 0);
      const total = armazem + transporte + prodLoja;
      return {
        id: p.id,
        description: p.description,
        code: p.code,
        unit: p.unit,
        armazem,
        transporte,
        prodLoja,
        total
      };
    });
  }, [products, clients, activeTransports]);

  const totalStockChartData = useMemo(() => {
    return productStocks.map((item) => {
      const prod = products.find((p) => p.id === item.id);
      return {
        name: item.code || item.description.split(' ')[0],
        fullName: item.description,
        total: item.total,
        necessity: prod?.necessityQty || 0
      };
    });
  }, [productStocks, products]);

  const totalEstoqueGeral = useMemo(() => {
    return productStocks.reduce((sum, item) => sum + item.total, 0);
  }, [productStocks]);

  // --- 2. CALCULATIONS FOR NECESSIDADE CADASTRADA ---
  const productNecessities = useMemo(() => {
    return products.map((p) => ({
      id: p.id,
      description: p.description,
      code: p.code,
      unit: p.unit,
      necessity: p.necessityQty || 0
    }));
  }, [products]);

  const totalNecessidadeGeral = useMemo(() => {
    return productNecessities.reduce((sum, item) => sum + item.necessity, 0);
  }, [productNecessities]);

  // --- 3. CALCULATIONS FOR PREVISÃO DE PRODUTO POR RETENÇÃO & MULTAS ---
  const detailedFineItems = useMemo(() => {
    return products.map((p) => {
      const description = p.description;
      const unitValue = p.valueR$ || 0;
      const necessity = p.necessityQty || 0;

      const armazem = p.initialStock || 0;
      const transporte = (activeTransports || [])
        .filter((t) => t.statusTransporte !== 'EXCLUIDO')
        .reduce((sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0), 0);
      const prodLoja = clients.reduce((sum, c) => {
        if (c.productBalances && c.productBalances[p.id] !== undefined) {
          return sum + (c.productBalances[p.id] || 0);
        }
        const pIdx = products.findIndex((prod) => prod.id === p.id);
        const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
        return sum + Math.floor((c.saldoLoja || 0) * pct);
      }, 0);
      const physical = armazem + transporte + prodLoja;

      const retencaoAcima = physical - necessity;

      let retencaoAcimaVal: number | '' = '';
      let percentualRetencao: number | '' = '';
      let p0to10: number | '' = '';
      let p10to20: number | '' = '';
      let p20to30: number | '' = '';
      let p30Above: number | '' = '';
      let valorMulta: number | '' = '';

      if (retencaoAcima >= 0) {
        retencaoAcimaVal = retencaoAcima;
        const pct = necessity > 0 ? retencaoAcima / necessity : 0;
        percentualRetencao = pct;
        const pct100 = pct * 100;

        let multaQty = 0;
        if (pct100 >= 0 && pct100 <= 10.0) {
          p0to10 = 0;
          multaQty = 0;
        } else if (pct100 > 10.0 && pct100 <= 20.0) {
          p10to20 = Math.floor(0.25 * retencaoAcima);
          multaQty = p10to20;
        } else if (pct100 > 20.0 && pct100 <= 30.0) {
          p20to30 = Math.floor(0.35 * retencaoAcima);
          multaQty = p20to30;
        } else if (pct100 > 30.0) {
          p30Above = Math.floor(0.40 * retencaoAcima);
          multaQty = p30Above;
        }

        valorMulta = unitValue * multaQty;
      }

      return {
        id: p.id,
        description,
        unitValue,
        necessity,
        physical,
        retencaoAcimaVal,
        percentualRetencao,
        p0to10,
        p10to20,
        p20to30,
        p30Above,
        valorMulta
      };
    });
  }, [products, clients, activeTransports]);

  const totalFineValue = useMemo(() => {
    return detailedFineItems.reduce(
      (sum, item) => sum + (typeof item.valorMulta === 'number' ? item.valorMulta : 0),
      0
    );
  }, [detailedFineItems]);

  const sumDetailedNecessity = useMemo(() => {
    return detailedFineItems.reduce((acc, item) => acc + item.necessity, 0);
  }, [detailedFineItems]);

  const sumDetailedPhysical = useMemo(() => {
    return detailedFineItems.reduce((acc, item) => acc + item.physical, 0);
  }, [detailedFineItems]);

  const sumDetailedRetencaoAcima = useMemo(() => {
    return detailedFineItems.reduce(
      (acc, item) => acc + (typeof item.retencaoAcimaVal === 'number' ? item.retencaoAcimaVal : 0),
      0
    );
  }, [detailedFineItems]);

  // --- 4. DATA FOR HISTORICAL SALDO DE PRODUTOS EM LOJA CHART ---
  const chartDays = useMemo(() => {
    const monthInt = parseInt(selectedMonth, 10);
    const year = 2026;
    let endDate = new Date(year, monthInt, 15); // Default to middle of month

    const today = new Date(); // 2026-07-02
    if (monthInt === today.getMonth() && year === today.getFullYear()) {
      endDate = today;
    } else {
      // Last day of that selected month
      endDate = new Date(year, monthInt + 1, 0);
    }

    // Go back 6 days to get 7 days total
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }); // e.g. "qui." or "qua."
      // Capitalize first letter and remove trailing dot
      const cleanDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).replace('.', '');
      
      const dayOfMonth = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      
      list.push({
        label: `${cleanDayName}\n${dayOfMonth}/${monthNum}`,
        dateObj: d
      });
    }
    return list;
  }, [selectedMonth]);

  const monthMultiplier = useMemo(() => {
    const m = parseInt(selectedMonth, 10);
    const multipliers: { [key: number]: number } = {
      0: 0.85, // Jan
      1: 0.90, // Feb
      2: 0.95, // Mar
      3: 1.05, // Apr
      4: 1.10, // May
      5: 0.95, // Jun
      6: 1.00, // Jul
      7: 1.02, // Aug
      8: 1.08, // Sep
      9: 1.15, // Oct
      10: 1.12, // Nov
      11: 1.25, // Dec
    };
    return multipliers[m] ?? 1.0;
  }, [selectedMonth]);

  const storeStockChartData = useMemo(() => {
    // Determine the current total store balance for selected filter
    let currentStoreTotal = 0;
    if (selectedProductChart === 'todos') {
      currentStoreTotal = productStocks.reduce((sum, item) => sum + item.prodLoja, 0);
    } else {
      const found = productStocks.find((item) => item.id === selectedProductChart);
      currentStoreTotal = found ? found.prodLoja : 0;
    }

    // Generate a beautiful past 7 days trend with slight, realistic fluctuations
    const baseVariance = [1.2, 0.95, 1.1, 1.05, 0.85, 0.9, 1.0]; // multipliers

    return chartDays.map((dayInfo, idx) => {
      const multiplier = baseVariance[idx] * monthMultiplier;
      const val = Math.max(0, Math.floor(currentStoreTotal * multiplier));
      return {
        name: dayInfo.label,
        'Saldo em Loja': val
      };
    });
  }, [productStocks, selectedProductChart, chartDays, monthMultiplier]);

  // --- 5. CALCULATIONS FOR CAMINHÕES EM ENTREGA ---
  const truckTransports = useMemo(() => {
    const active = (activeTransports || []).filter((t) => {
      if (t.statusTransporte === 'EXCLUIDO') return false;
      const tipo = t.tipoTransporte || '';
      return tipo === 'Aberto' || tipo === 'Fechado' || tipo === 'ABERTO' || tipo === 'FECHADO';
    });
    return active.map((t) => {
      const totalClients = t.selectedClientIds?.length || t.clienteTotal || 0;
      // Get the clients of this transport and look up their statusEntrega
      const transportClients = clients.filter((c) => t.selectedClientIds?.includes(c.id));
      const completedClients = transportClients.filter(
        (c) =>
          c.statusEntrega === 'Entregue' ||
          c.statusEntrega === 'Retornado' ||
          c.statusEntrega === 'Retirada' ||
          c.statusEntrega === 'Em Liquidação' ||
          c.statusEntrega === 'Liquidado'
      ).length;

      const progress = totalClients > 0 ? Math.min(100, Math.round((completedClients / totalClients) * 100)) : 0;

      return {
        id: t.id,
        number: t.number,
        driver: t.driver,
        route: t.route,
        placa: t.placa,
        totalClients,
        completedClients,
        progress
      };
    });
  }, [activeTransports, clients]);

  // --- 6. CALCULATIONS FOR ENTREGAS REALIZADAS PIE CHART ---
  const deliveriesPieData = useMemo(() => {
    const active = (activeTransports || []).filter((t) => t.statusTransporte !== 'EXCLUIDO');
    
    // Total number of clients across all transports today
    const totalClientsToday = active.reduce((sum, t) => {
      return sum + (t.selectedClientIds?.length || t.clienteTotal || 0);
    }, 0);

    // Number of clients with completed statuses ("Entregue", "Retornado", "Retirada" or whose transport is liquidated/in liquidation)
    const completedClientsToday = active.reduce((sum, t) => {
      const transportClients = clients.filter((c) => t.selectedClientIds?.includes(c.id));
      const count = transportClients.filter(
        (c) =>
          c.statusEntrega === 'Entregue' ||
          c.statusEntrega === 'Retornado' ||
          c.statusEntrega === 'Retirada' ||
          c.statusEntrega === 'Em Liquidação' ||
          c.statusEntrega === 'Liquidado' ||
          t.statusTransporte === 'LIQUIDADO' ||
          t.statusTransporte === 'EM_LIQUIDACAO'
      ).length;
      return sum + count;
    }, 0);

    const pendingClients = Math.max(0, totalClientsToday - completedClientsToday);

    const percentCompleted = totalClientsToday > 0 
      ? Math.round((completedClientsToday / totalClientsToday) * 100) 
      : 0;

    return {
      totalClients: totalClientsToday,
      completedClients: completedClientsToday,
      percentCompleted,
      chartData: [
        { name: 'Realizadas (Entregue/Liquidado)', value: completedClientsToday, color: '#10b981' }, // Emerald green
        { name: 'Pendente', value: pendingClients, color: '#e2e8f0' } // Gray
      ]
    };
  }, [activeTransports, clients]);

  // --- 7. CALCULATIONS FOR GESTÃO DE EQUIPAMENTOS VAZIOS ---
  const emptyEquipmentData = useMemo(() => {
    // Gray: Total empty equipment across all clients in the "Contagem em Loja" report (matches grand total from ReportsView.tsx)
    const totalVaziosUltimaContagem = (countDocuments || []).reduce((sum, doc) => {
      if (!doc.clientCounts || !doc.clientStatuses) return sum;
      let docSum = 0;
      Object.keys(doc.clientCounts).forEach((clientId) => {
        const status = doc.clientStatuses[clientId];
        if (status === 'CONTADO' || status === 'FECHADO') {
          const clientCountsForDoc = doc.clientCounts[clientId];
          if (clientCountsForDoc) {
            products.forEach((p) => {
              docSum += (clientCountsForDoc[p.id]?.vazio ?? 0);
            });
          }
        }
      });
      return sum + docSum;
    }, 0);

    // Blue: Total empty equipment of clients that have active deliveries today
    const active = (activeTransports || []).filter((t) => t.statusTransporte !== 'EXCLUIDO');
    const clientsWithDeliveryToday = clients.filter((c) =>
      active.some((t) => t.selectedClientIds?.includes(c.id))
    );

    const totalVaziosClientesEntrega = clientsWithDeliveryToday.reduce((sum, c) => {
      // Find their latest count in the system's count documents
      const latestDoc = (countDocuments || []).find(
        (doc) => 
          doc.clientStatuses && 
          (doc.clientStatuses[c.id] === 'CONTADO' || doc.clientStatuses[c.id] === 'FECHADO')
      );
      if (latestDoc && latestDoc.clientCounts?.[c.id]) {
        const clientCounts = latestDoc.clientCounts[c.id];
        let clientSum = 0;
        products.forEach((p) => {
          clientSum += (clientCounts[p.id]?.vazio ?? 0);
        });
        return sum + clientSum;
      }
      if (c.contagemEstoque) {
        return (
          sum +
          Object.values(c.contagemEstoque).reduce((vSum, v) => vSum + (v.vazio || 0), 0)
        );
      }
      return sum;
    }, 0);

    // Green: Empty baskets already collected in transports for these clients
    const totalColetasHoje = active.reduce((sum, t) => {
      if (!t.stock) return sum;
      return (
        sum +
        Object.values(t.stock).reduce((sSum, s) => sSum + (s.coleta || 0), 0)
      );
    }, 0);

    return {
      totalVaziosUltimaContagem,
      totalVaziosClientesEntrega,
      totalColetasHoje
    };
  }, [clients, activeTransports, countDocuments, products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Block with info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-3">
        <div className="text-left">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            ESTEVES E SILVA LTDA • Gestão Estratégica e Logística • Painel Operacional
          </h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
            Controle de Performance e Estoque Operacional
          </p>
        </div>
      </div>

      {/* Main Dashboard Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left Column: Estoque vs Necessidade + Saldo de Produtos em Loja */}
        <div className="flex flex-col gap-5">
          {/* Quadrante: Estoque Total Geral - Visão por Produto */}
          <div id="quadrante_estoque_total_geral" className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between min-h-[440px]">
            <div className="w-full border-b border-gray-100 pb-3 mb-4 text-left">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-teal-600 text-base">trending_up</span>
                Estoque vs Necessidade
              </h3>
            </div>

            <div className="flex-1 min-h-[260px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={totalStockChartData} barGap={0} barCategoryGap="8%" margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="fullName" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#64748b' }} tickFormatter={(val) => val.toLocaleString('pt-BR')} />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      value.toLocaleString('pt-BR'),
                      name === 'total' ? 'Estoque Físico' : name === 'necessity' ? 'Estoque Necessidade' : name
                    ]}
                    labelFormatter={(label, items) => items[0]?.payload?.fullName || label}
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {value === 'total' ? 'Estoque Físico' : value === 'necessity' ? 'Estoque Necessidade' : value}
                      </span>
                    )}
                  />
                  <Bar dataKey="total" name="Estoque Físico" fill="#ea580c" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    <LabelList dataKey="total" position="top" formatter={(val: any) => (val !== undefined && val !== null ? Number(val).toLocaleString('pt-BR') : '')} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#ea580c' }} />
                  </Bar>
                  <Bar dataKey="necessity" name="Estoque Necessidade" fill="#1e3a8a" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    <LabelList dataKey="necessity" position="top" formatter={(val: any) => (val !== undefined && val !== null ? Number(val).toLocaleString('pt-BR') : '')} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#1e3a8a' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Fine Value & Button at the bottom */}
            <div className="border-t border-gray-100 pt-4 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600 text-3xl">payments</span>
                <div className="text-left">
                  <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-wider block">Valor de Multa de Retenção</span>
                  <span className="text-[12px] font-black text-red-600">
                    {totalFineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailedViewOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs hover:shadow-md border border-red-500"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">table_chart</span>
                Visão Detalhada
              </button>
            </div>
          </div>

          {/* Quadrante: Saldo de produtos em Loja */}
          <div id="quadrante_saldo_loja" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[420px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-3 text-left">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-purple-600 text-base">storefront</span>
                  Saldo de produtos em Loja
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Select Month Filter */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-purple-50 hover:bg-purple-100 border border-purple-250 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-purple-700 outline-hidden transition-all select-none cursor-pointer uppercase tracking-wider"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                {/* Select Product Filter */}
                <select
                  value={selectedProductChart}
                  onChange={(e) => setSelectedProductChart(e.target.value)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-hidden transition-all select-none cursor-pointer uppercase tracking-wider"
                >
                  <option value="todos">Todos os Produtos</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recharts Bar/Line Chart */}
            <div className="flex-1 w-full min-h-[200px] flex items-center justify-center">
              {productStocks.length === 0 ? (
                <p className="text-xs italic text-gray-400">Nenhum produto cadastrado para exibir no gráfico.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={storeStockChartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorStore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.85}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tick={<CustomizedTick />}
                      height={45}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '11px'
                      }}
                      formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('pt-BR') : value, 'Saldo em Loja']}
                    />
                    <Bar dataKey="Saldo em Loja" fill="url(#colorStore)" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="Saldo em Loja"
                        position="top"
                        formatter={(val: any) => typeof val === 'number' ? val.toLocaleString('pt-BR') : val}
                        style={{ fill: '#475569', fontSize: '10px', fontWeight: 'bold' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Veículos em Entregas (Hoje) + Entregas Realizadas (Hoje) */}
        <div className="flex flex-col gap-5">
          {/* Quadrante: Veículos em Entregas (Hoje) */}
          <div id="quadrante_caminhoes_entrega" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[500px]">
            <div className="border-b border-gray-100 pb-3 mb-4 text-left flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransportsModalOpen(true)}
                  className="hover:scale-105 active:scale-95 transition-all p-0.5 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 cursor-pointer shadow-4xs"
                  title="Clique para abrir relatório geral de transportes ativos"
                >
                  <TruckIconWithCargo count={truckTransports.length} variant="blue" />
                </button>
                <div>
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Veículos em Entregas (Hoje)
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Acompanhamento e progresso em rota real</p>
                </div>
              </div>
            </div>

            {/* Transport rows / truck pathways */}
            <div className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin max-h-[500px]">
              {truckTransports.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-3xl text-gray-300">add_road</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Nenhum transporte em circulação</span>
                  <p className="text-[10px] text-gray-400">Crie um transporte para ver as rotas ativas aqui.</p>
                </div>
              ) : (
                truckTransports.map((t) => {
                  const currentPercent = animateProgress ? t.progress : 0;
                  return (
                    <div key={t.id} className="py-1 px-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-lg transition-all flex items-center justify-between gap-3">
                      
                      {/* The gray visual road track */}
                      <div className="flex-1 h-5 bg-slate-200 border border-slate-300 rounded-full relative overflow-visible flex items-center">
                        
                        {/* Fixed Placa in left corner of track if progress > 0 */}
                        {t.progress > 0 && (
                          <span className="absolute left-2.5 text-[8px] font-black text-slate-700 uppercase tracking-wider select-none z-10 pointer-events-none leading-none">
                            {t.placa}
                          </span>
                        )}

                        {/* Truck Moving Icon */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center"
                          style={{
                            left: `calc(${currentPercent}% - ${(currentPercent / 100) * 54}px)`,
                            transition: 'left 4000ms cubic-bezier(0.25, 1, 0.5, 1)'
                          }}
                        >
                          <MovingTruckIcon percent={t.progress} clientCount={t.totalClients} />
                          
                          {/* If progress === 0, Placa is in front of the truck with standard text style (no dark badge) */}
                          {t.progress === 0 && (
                            <span className="ml-2 text-[8px] font-black text-slate-700 uppercase tracking-wider select-none whitespace-nowrap leading-none">
                              {t.placa}
                            </span>
                          )}
                        </div>

                      </div>

                      {/* Progress percentage on the right */}
                      <div className="text-right shrink-0 min-w-[32px]">
                        <span
                          className="text-xs font-black block"
                          style={{ color: t.progress === 0 ? '#ef4444' : t.progress >= 100 ? '#10b981' : '#eab308' }}
                        >
                          {t.progress}%
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quadrante: Entregas Realizadas (Hoje) + Gestão de Equipamentos Vazios (Merged) */}
          <div id="quadrante_entregas_realizadas" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[500px]">
            <div className="border-b border-gray-100 pb-3 mb-4 text-left">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-base">donut_large</span>
                Entregas Realizadas (Hoje)
              </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between flex-1 gap-6">
              {/* Left/Middle: Pie Chart & Totals below it */}
              <div className="flex flex-col items-center gap-3 shrink-0 mx-auto">
                <div className="relative w-[210px] h-[210px] flex items-center justify-center">
                  {deliveriesPieData.totalClients === 0 ? (
                    <div className="text-center p-3 bg-slate-50 rounded-full w-full h-full flex flex-col items-center justify-center border border-dashed border-gray-200">
                      <span className="material-symbols-outlined text-gray-300 text-3xl">local_shipping</span>
                      <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Sem transportes</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deliveriesPieData.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={98}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {deliveriesPieData.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Centered Percentage Indicator */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-800 leading-none">
                          {deliveriesPieData.percentCompleted}%
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">Concluído</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Pie legend totals */}
                <div className="text-center">
                  <span className="text-[10px] font-black text-slate-750 uppercase tracking-wider block">
                    {deliveriesPieData.completedClients} de {deliveriesPieData.totalClients} Entregas
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                    Concluídas nas últimas 24h
                  </span>
                </div>
              </div>

              {/* Right/Middle: Compact Bar Chart of Empty Equipment */}
              <div className="flex-1 w-full space-y-4">
                
                {/* Merged Bar Chart representing Vacant Empty Equipment */}
                <div className="rounded-xl p-3 bg-slate-50/50 w-[70%] mx-auto">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block text-left mb-2.5">
                    Fluxo de Equipamentos Reutilizáveis (Hoje)
                  </span>
                  <div className="flex items-end justify-between h-[144px] gap-2">
                    
                    {(() => {
                      const maxVal = Math.max(1, emptyEquipmentData.totalVaziosUltimaContagem, emptyEquipmentData.totalVaziosClientesEntrega, emptyEquipmentData.totalColetasHoje);
                      return (
                        <>
                          {/* Grey Bar: Equipamento vazio */}
                          <div className="flex flex-col items-center flex-1 h-full justify-end">
                            <span className="text-[9px] font-black text-slate-600 mb-1 bg-white border border-slate-200 px-1 py-0.5 rounded shadow-3xs leading-none">
                              {emptyEquipmentData.totalVaziosUltimaContagem}
                            </span>
                            <div
                              className="w-8 bg-slate-400/80 hover:bg-slate-400 rounded-t-xs transition-all shadow-3xs"
                              style={{ height: `${(emptyEquipmentData.totalVaziosUltimaContagem / maxVal) * 125}px` }}
                            />
                            <span className="text-[8px] font-black text-slate-500 text-center uppercase tracking-tight mt-1.5 leading-tight min-h-[22px]">
                              Equipamento vazio
                            </span>
                          </div>

                          {/* Blue Bar: Entregas de Hoje */}
                          <div className="flex flex-col items-center flex-1 h-full justify-end">
                            <span className="text-[9px] font-black text-blue-600 mb-1 bg-white border border-blue-100 px-1 py-0.5 rounded shadow-3xs leading-none">
                              {emptyEquipmentData.totalVaziosClientesEntrega}
                            </span>
                            <div
                              className="w-8 bg-blue-500/80 hover:bg-blue-500 rounded-t-xs transition-all shadow-3xs"
                              style={{ height: `${(emptyEquipmentData.totalVaziosClientesEntrega / maxVal) * 125}px` }}
                            />
                            <span className="text-[8px] font-black text-blue-700 text-center uppercase tracking-tight mt-1.5 leading-tight min-h-[22px]">
                              Entregas de Hoje
                            </span>
                          </div>

                          {/* Green Bar: Equipamentos Recolhidos */}
                          <div className="flex flex-col items-center flex-1 h-full justify-end">
                            <span className="text-[9px] font-black text-emerald-600 mb-1 bg-white border border-emerald-100 px-1 py-0.5 rounded shadow-3xs leading-none">
                              {emptyEquipmentData.totalColetasHoje}
                            </span>
                            <div
                              className="w-8 bg-emerald-500/80 hover:bg-emerald-500 rounded-t-xs transition-all shadow-3xs"
                              style={{ height: `${(emptyEquipmentData.totalColetasHoje / maxVal) * 125}px` }}
                            />
                            <span className="text-[8px] font-black text-emerald-700 text-center uppercase tracking-tight mt-1.5 leading-tight min-h-[22px]">
                              Equipamentos Recolhidos
                            </span>
                          </div>
                        </>
                      );
                    })()}

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- FLOATING VISÃO DETALHADA MODAL (PREVISÃO DE PRODUTO POR RETENÇÃO & MULTAS) --- */}
      {isDetailedViewOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white border-2 border-red-900 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative pointer-events-auto flex flex-col justify-between">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-red-100 pb-4 gap-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600 text-3xl font-black">table_chart</span>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Visão Detalhada de Retenção e Multas
                  </h3>
                  <p className="text-[11px] text-red-700 font-bold italic">
                    Análise de excedentes, percentuais de retenção e cálculo de multa por faixas (arredondamento para menor).
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-3xs flex-1 my-4">
              <table className="w-full text-left text-[11px] border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                    <th className="py-2.5 px-3">Descrição do Material</th>
                    <th className="py-2.5 px-3 text-right">Valor Item (Necessidade)</th>
                    <th className="py-2.5 px-3 text-center">Qtd. Necessidade</th>
                    <th className="py-2.5 px-3 text-center">Saldo Total</th>
                    <th className="py-2.5 px-3 text-center">Retenção Acima</th>
                    <th className="py-2.5 px-3 text-center">% Retenção</th>
                    <th className="py-2.5 px-3 text-center bg-green-50/30">0 a 10% (0%)</th>
                    <th className="py-2.5 px-3 text-center bg-yellow-50/30">10,01 a 20% (25%)</th>
                    <th className="py-2.5 px-3 text-center bg-orange-50/30">20,01 a 30% (35%)</th>
                    <th className="py-2.5 px-3 text-center bg-red-50/30">30,01 ou Superior (40%)</th>
                    <th className="py-2.5 px-3 text-right">Valor Multa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {detailedFineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800 uppercase text-[10px] truncate max-w-[200px]" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-600">
                        {item.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {item.necessity.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {item.physical.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-blue-900">
                        {typeof item.retencaoAcimaVal === 'number' ? item.retencaoAcimaVal.toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-slate-800">
                        {typeof item.percentualRetencao === 'number' ? `${(item.percentualRetencao * 100).toFixed(2)}%` : '-'}
                      </td>
                      {/* Four range columns */}
                      <td className="py-2.5 px-3 text-center bg-green-50/20 font-bold text-green-700">
                        {typeof item.p0to10 === 'number' ? item.p0to10 : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center bg-yellow-50/20 font-bold text-yellow-700">
                        {typeof item.p10to20 === 'number' ? item.p10to20 : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center bg-orange-50/20 font-bold text-orange-700">
                        {typeof item.p20to30 === 'number' ? item.p20to30 : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center bg-red-50/20 font-bold text-red-700">
                        {typeof item.p30Above === 'number' ? item.p30Above : '-'}
                      </td>
                      {/* Valor Multa */}
                      <td className="py-2.5 px-3 text-right font-black text-red-600">
                        {typeof item.valorMulta === 'number'
                          ? item.valorMulta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Totals Row */}
                  <tr className="bg-slate-100 font-extrabold text-slate-800 border-t-2 border-gray-300 sticky bottom-0 text-[11px]">
                    <td className="py-3 px-3 uppercase text-left">Total Geral</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-center">{sumDetailedNecessity.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-3 text-center">{sumDetailedPhysical.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-3 text-center text-blue-900">{sumDetailedRetencaoAcima.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-3 text-center bg-green-100/40 text-green-800">
                      {detailedFineItems.reduce((acc, item) => acc + (typeof item.p0to10 === 'number' ? item.p0to10 : 0), 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-center bg-yellow-100/40 text-yellow-800">
                      {detailedFineItems.reduce((acc, item) => acc + (typeof item.p10to20 === 'number' ? item.p10to20 : 0), 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-center bg-orange-100/40 text-orange-800">
                      {detailedFineItems.reduce((acc, item) => acc + (typeof item.p20to30 === 'number' ? item.p20to30 : 0), 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-center bg-red-100/40 text-red-800">
                      {detailedFineItems.reduce((acc, item) => acc + (typeof item.p30Above === 'number' ? item.p30Above : 0), 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-right text-red-600">
                      {totalFineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center pt-4 border-t border-gray-150 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailedViewOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">arrow_back</span>
                Voltar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- RELATÓRIO GERAL DE TRANSPORTES ATIVOS MODAL --- */}
      {isTransportsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-50 border border-blue-200 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-xl">assignment_turned_in</span>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Relatório Geral de Transportes Ativos
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsTransportsModalOpen(false)}
                className="text-white hover:text-white/85 transition-colors p-1 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold text-lg">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Summary stats row */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-4xs">
                <div className="text-left">
                  <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest">Resumo Operacional (Hoje)</p>
                  <p className="font-extrabold text-slate-800 text-sm uppercase mt-0.5">Total de Veículos em Rota Ativa</p>
                </div>
                <span className="bg-blue-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-3xs">
                  {truckTransports.length} Veículo(s) em Trânsito
                </span>
              </div>

              {/* TABELA DE TRANSPORTES */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-left">
                <div className="border-b border-gray-100 pb-2 mb-3">
                  <h4 className="text-xs font-black text-slate-750 uppercase tracking-wider">
                    TABELA DE TRANSPORTES
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Nº TRANSP.</th>
                        <th className="py-2.5 px-3">PLACA</th>
                        <th className="py-2.5 px-3">MOTORISTA</th>
                        <th className="py-2.5 px-3">ROTA</th>
                        <th className="py-2.5 px-3 text-center">TOTAL</th>
                        <th className="py-2.5 px-3 text-center text-emerald-600 font-extrabold">ENTR.</th>
                        <th className="py-2.5 px-3 text-center text-rose-600 font-extrabold">NÃO ENTR.</th>
                        <th className="py-2.5 px-3 text-center text-amber-600 font-extrabold">PENDENTE</th>
                        <th className="py-2.5 px-3 text-center text-sky-600 font-extrabold">RETIRADO</th>
                        <th className="py-2.5 px-3 text-center">STATUS</th>
                        <th className="py-2.5 px-3 text-center">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {truckTransports.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-xs text-gray-400 italic">
                            Nenhum transporte ativo em circulação no momento.
                          </td>
                        </tr>
                      ) : (
                        truckTransports.map((t) => {
                          const matchedTransport = (activeTransports || []).find((at) => at.id === t.id);
                          const isFrozen = matchedTransport?.statusTransporte === 'EM_LIQUIDACAO' || matchedTransport?.statusTransporte === 'LIQUIDADO' || matchedTransport?.statusTransporte === 'Finalizado' || matchedTransport?.tipoTransporte === 'Fechado' || matchedTransport?.tipoTransporte === 'Finalizado';
                          
                          const transportClients = clients.filter((c) => matchedTransport?.selectedClientIds?.includes(c.id));
                          
                          const total = isFrozen ? (matchedTransport?.clienteTotal ?? 0) : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() !== 'retirada').length;
                          const entr = isFrozen ? (matchedTransport?.clienteEntregue ?? 0) : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'entregue' || c.statusEntrega === 'Liquidado').length;
                          const naoEntr = isFrozen ? (matchedTransport?.clienteNaoEntregue ?? 0) : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'não entregue' || (c.statusEntrega || '').toLowerCase() === 'retornado').length;
                          const pendente = isFrozen ? (matchedTransport?.clienteEmEntrega ?? 0) : transportClients.filter(c => !c.statusEntrega || c.statusEntrega === 'Pendente' || c.statusEntrega === 'Vazio' || c.statusEntrega === 'Em Entrega').length;
                          const retirado = isFrozen ? (matchedTransport?.clientesRetirados ?? 0) : transportClients.filter(c => (c.statusEntrega || '').toLowerCase() === 'retirada').length;

                          const status = (matchedTransport?.statusTransporte || 'CRIADO') as any;
                          
                          let statusBadge = (
                            <span className="inline-block px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border-blue-300">
                              CRIADO
                            </span>
                          );
                          if (status === 'EM_ENTREGA' || status === 'EM ENTREGA') {
                            statusBadge = (
                              <span className="inline-block px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-300">
                                EM ENTREGA
                              </span>
                            );
                          } else if (status === 'EM_LIQUIDACAO' || status === 'EM LIQUIDAÇÃO' || status === 'LIQUIDADO') {
                            statusBadge = (
                              <span className="inline-block px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 border-purple-300">
                                EM LIQUIDAÇÃO
                              </span>
                            );
                          } else if (status === 'Finalizado') {
                            statusBadge = (
                              <span className="inline-block px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-300">
                                FINALIZADO
                              </span>
                            );
                          }

                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                {matchedTransport?.number || t.id}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">
                                {t.placa}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-700">
                                {t.driver}
                              </td>
                              <td className="py-2.5 px-3 font-extrabold text-slate-800">
                                {t.route}
                              </td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-slate-700">
                                {total}
                              </td>
                              <td className="py-2.5 px-3 text-center text-emerald-600 font-black">
                                {entr}
                              </td>
                              <td className="py-2.5 px-3 text-center text-rose-600 font-black">
                                {naoEntr}
                              </td>
                              <td className="py-2.5 px-3 text-center text-amber-600 font-black">
                                {pendente}
                              </td>
                              <td className="py-2.5 px-3 text-center text-sky-600 font-black">
                                {retirado}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {statusBadge}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailTransport({ t, matchedTransport, transportClients })}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black py-1 px-2.5 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer mx-auto transition-all active:scale-95 shadow-4xs"
                                >
                                  <span className="material-symbols-outlined text-[11px] font-bold">visibility</span>
                                  Clientes
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

            {/* Footer */}
            <div className="bg-slate-100 border-t border-gray-200 px-6 py-4 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsTransportsModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px] font-bold">arrow_back</span>
                Voltar ao Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DETALHE DO CLIENTE TRANSPORTE (NEW WINDOW / POPUP MODAL) --- */}
      {selectedDetailTransport && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between text-white flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-xl">local_shipping</span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Clientes do Transporte Nº {selectedDetailTransport.matchedTransport?.number || selectedDetailTransport.t.id}
                  </h3>
                  <p className="text-[10px] text-gray-300 mt-0.5">Placa: {selectedDetailTransport.t.placa} | Motorista: {selectedDetailTransport.t.driver}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedDetailTransport(null)}
                className="text-gray-300 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold text-lg">close</span>
              </button>
            </div>

            {/* Client List Table Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Clientes Cadastrados no Percurso</span>
                <span className="text-xs font-bold text-slate-750 mt-1 block">Relação de matrículas, razão social e status de entrega de cada cliente desta rota.</span>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-24">MATRÍCULA</th>
                      <th className="py-2.5 px-3">RAZÃO SOCIAL</th>
                      <th className="py-2.5 px-4 text-center w-36">STATUS DE ENTREGA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDetailTransport.transportClients.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-xs text-gray-400 italic">
                          Nenhum cliente cadastrado neste percurso.
                        </td>
                      </tr>
                    ) : (
                      selectedDetailTransport.transportClients.map((client) => {
                        const freshClient = clients.find(c => c.id === client.id) || client;
                        const status = freshClient.statusEntrega || 'Vazio';
                        
                        let statusBadge = (
                          <span className="inline-block px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 border-slate-200">
                            {status}
                          </span>
                        );
                        const sLower = status.toLowerCase();
                        if (sLower === 'entregue' || sLower === 'liquidado') {
                          statusBadge = (
                            <span className="inline-block px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border-emerald-250">
                              {status}
                            </span>
                          );
                        } else if (sLower === 'não entregue' || sLower === 'nao entregue') {
                          statusBadge = (
                            <span className="inline-block px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border-rose-250">
                              {status}
                            </span>
                          );
                        } else if (sLower === 'retornado' || sLower === 'retirada' || sLower === 'retirado') {
                          statusBadge = (
                            <span className="inline-block px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border-sky-250">
                              {status}
                            </span>
                          );
                        } else if (sLower === 'em entrega' || sLower === 'em_entrega') {
                          statusBadge = (
                            <span className="inline-block px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border-amber-250">
                              {status}
                            </span>
                          );
                        } else if (sLower === 'em liquidação' || sLower === 'em liquidacao' || sLower === 'em_liquidacao') {
                          statusBadge = (
                            <span className="inline-block px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border-purple-250">
                              {status}
                            </span>
                          );
                        } else if (sLower === 'roteirizado') {
                          statusBadge = (
                            <span className="inline-block px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border-blue-250">
                              {status}
                            </span>
                          );
                        }

                        return (
                          <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                              {client.matricula}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 uppercase text-[10px]">
                              {client.razaoSocial}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {statusBadge}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetailTransport(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-5 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
