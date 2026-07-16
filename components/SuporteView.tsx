'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../lib/AppContext';

// High-quality desk notebook vector illustration representing "pessoas utilizando o sistema no notebook com a marca MOVIX"
const WorkspaceSVG = () => (
  <svg viewBox="0 0 320 200" className="w-full h-44 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Desk Background surface */}
    <rect x="10" y="160" width="300" height="30" rx="4" fill="#e2e8f0" />
    <rect x="25" y="165" width="270" height="5" rx="2" fill="#cbd5e1" />

    {/* Warm backlight glow */}
    <circle cx="160" cy="85" r="55" fill="#fef08a" opacity="0.15" />
    <circle cx="160" cy="85" r="35" fill="#3b82f6" opacity="0.08" />

    {/* Elegant Laptop Setup */}
    {/* Laptop Screen Frame */}
    <rect x="70" y="45" width="180" height="110" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="3" />
    {/* Laptop Inner Screen */}
    <rect x="76" y="51" width="168" height="92" rx="4" fill="#0f172a" />
    
    {/* Laptop Dashboard mockup */}
    <rect x="84" y="58" width="50" height="12" rx="2" fill="#1e293b" />
    <rect x="88" y="62" width="20" height="4" rx="1" fill="#3b82f6" />
    <rect x="140" y="58" width="40" height="12" rx="2" fill="#1e293b" />
    <rect x="186" y="58" width="50" height="12" rx="2" fill="#1e293b" />

    {/* Bar chart mockup on laptop screen */}
    <rect x="84" y="78" width="152" height="40" rx="3" fill="#1e293b" opacity="0.4" />
    <rect x="94" y="105" width="12" height="10" rx="1" fill="#10b981" />
    <rect x="112" y="98" width="12" height="17" rx="1" fill="#3b82f6" />
    <rect x="130" y="92" width="12" height="23" rx="1" fill="#f59e0b" />
    <rect x="148" y="86" width="12" height="29" rx="1" fill="#8b5cf6" />
    <rect x="166" y="95" width="12" height="20" rx="1" fill="#3b82f6" />
    <rect x="184" y="102" width="12" height="13" rx="1" fill="#10b981" />
    <rect x="202" y="89" width="12" height="26" rx="1" fill="#ef4444" />
    <rect x="220" y="94" width="8" height="21" rx="1" fill="#e2e8f0" />

    {/* Real-time indicator pulses on screen */}
    <circle cx="225" cy="64" r="2.5" fill="#10b981" className="animate-ping" />

    {/* Laptop Keyboard Base */}
    <path d="M 55 155 L 265 155 L 255 163 L 65 163 Z" fill="#64748b" />
    <rect x="110" y="156" width="100" height="2" rx="1" fill="#475569" />
    <rect x="135" y="159" width="50" height="3" rx="1.5" fill="#334155" />

    {/* Floating Elements: Hands operating or documents */}
    {/* Styled coffee cup on desk */}
    <path d="M 40 135 L 52 135 L 50 155 L 42 155 Z" fill="#b45309" />
    <path d="M 52 138 C 55 138, 55 146, 52 146" stroke="#b45309" strokeWidth="2.5" fill="none" />
    <path d="M 41 131 C 41 128, 44 128, 44 125 M 46 131 C 46 128, 49 128, 49 125" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

    {/* Styled plant on the right side */}
    <rect x="272" y="138" width="14" height="18" rx="2" fill="#d97706" />
    <path d="M 279 138 C 279 125, 271 128, 267 118" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
    <path d="M 279 138 C 279 122, 287 125, 291 116" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
    
    {/* Stylized user avatar/outline using the laptop */}
    <g opacity="0.85">
      <circle cx="160" cy="180" r="16" fill="#cbd5e1" />
      <path d="M 135 210 Q 135 195, 160 195 Q 185 195, 185 210 Z" fill="#94a3b8" />
    </g>
  </svg>
);

// Styled watermark of the brand logo for backgrounds
const WatermarkSVG = () => (
  <svg viewBox="0 0 120 100" className="w-64 h-64 opacity-[0.03] select-none pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 12 35 C 12 28, 28 28, 28 35 L 28 85 C 28 85, 12 85, 12 85 Z" fill="#0c1e45" />
    <path d="M 92 50 C 92 45, 108 45, 108 50 L 108 85 Z" fill="#0c1e45" />
    <path d="M 20 40 L 58 80 L 105 25" stroke="#1e62ec" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 85 24 L 110 20 L 105 45" stroke="#1e62ec" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Faint brand icon for presentation slides header
const SlideBrandLogo = () => (
  <div className="flex items-center gap-1.5 opacity-60">
    <svg viewBox="0 0 120 100" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 12 35 C 12 28, 28 28, 28 35 L 28 85" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
      <path d="M 92 50 L 92 85" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
      <path d="M 20 40 L 58 80 L 105 25" stroke="#3b82f6" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="font-mono text-[10px] font-black tracking-widest text-slate-800 uppercase">MOVIX</span>
  </div>
);

// High-Fidelity Interactive Mockup component to simulate screenshots inside the slides
const MockupScreen = ({ type }: { type: string }) => {
  return (
    <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col shadow-2xl relative text-[9px]">
      {/* Browser Window Header */}
      <div className="bg-slate-900 px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
        </div>
        <div className="bg-slate-950/80 rounded-md px-3 py-0.5 text-[8px] text-slate-400 font-mono w-28 text-center truncate border border-slate-800/40">
          movix.net/{type}
        </div>
        <span className="material-symbols-outlined text-slate-500 text-[10px]">refresh</span>
      </div>

      {/* Internal Content Area */}
      <div className="flex-1 p-2 overflow-y-auto flex flex-col justify-center">
        {type === 'workspace' && <WorkspaceSVG />}
        
        {type === 'summary_index' && (
          <div className="space-y-1 text-left">
            <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider">Módulos de Cadastros</span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {['Produtos', 'Clientes', 'Fornecedores', 'Funcionários'].map((item, i) => (
                <div key={i} className="bg-slate-900 border border-slate-850 rounded p-1.5 flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-blue-600/10 text-blue-400 font-mono text-[7px] flex items-center justify-center font-bold">{i+1}</span>
                  <span className="text-[8px] text-slate-300 font-bold truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'cadastros_geral' && (
          <div className="space-y-1.5 text-left">
            <div className="flex gap-1 border-b border-slate-800 pb-1">
              <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded text-[7px] font-black">PRODUTOS</span>
              <span className="bg-slate-900 text-slate-500 px-1.5 py-0.2 rounded text-[7px] font-semibold">CLIENTES</span>
              <span className="bg-slate-900 text-slate-500 px-1.5 py-0.2 rounded text-[7px] font-semibold">VEÍCULOS</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-850 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-300">Central de Registros</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-1 py-0.2 rounded text-[7px] font-black">CONECTADO</span>
              </div>
              <div className="h-6 bg-slate-950 rounded border border-slate-850/65 p-1 flex flex-col justify-between">
                <div className="h-1 bg-slate-800 rounded w-1/3" />
                <div className="h-1 bg-slate-850 rounded w-1/2" />
              </div>
            </div>
          </div>
        )}

        {type === 'cadastro_produtos' && (
          <div className="space-y-1.5 text-left">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-200 uppercase tracking-wider block text-[8px]">Cadastrar Produto</span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[7px] text-slate-500 block">Código</span>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-slate-300 font-mono font-bold text-[8px]">PRD-G10</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7px] text-slate-500 block">Unidade</span>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-slate-300 font-bold text-[8px]">UN</div>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] text-slate-500 block">Nome do Material</span>
                <div className="bg-slate-950 p-1 rounded border border-slate-800 text-slate-300 font-semibold text-[8px] truncate">Cilindro Oxigênio 10m³</div>
              </div>
              <div className="flex justify-end">
                <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[7px] uppercase tracking-wider shadow">Gravar</span>
              </div>
            </div>
          </div>
        )}

        {type === 'cadastro_clientes' && (
          <div className="space-y-1.5 text-left">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200 block text-[8px] uppercase">Novo Cliente</span>
                <span className="bg-blue-500/10 text-blue-400 text-[7px] px-1 py-0.2 rounded font-black uppercase border border-blue-500/15">Matrícula Auto</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] text-slate-500 block">Razão Social</span>
                <div className="bg-slate-950 p-1 rounded border border-slate-800 text-slate-300 font-semibold text-[8px] truncate">Metalúrgica Alfa S.A.</div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[7px] text-slate-500 block">CNPJ</span>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-slate-400 font-mono text-[7px] truncate">12.345.678/0001-90</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7px] text-slate-500 block">Matrícula</span>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800 text-emerald-400 font-bold font-mono text-[8px]">#0042</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[7px] text-blue-400 font-semibold flex items-center gap-0.5 cursor-pointer">
                  <span className="material-symbols-outlined text-[9px]">grid_on</span> Bulk Excel
                </span>
                <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[7px] uppercase tracking-wider shadow">Salvar</span>
              </div>
            </div>
          </div>
        )}

        {type === 'cadastro_forn_func' && (
          <div className="space-y-1.5 text-left">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800 space-y-0.5">
                <span className="font-bold text-slate-400 text-[7px] uppercase block">Fornecedor</span>
                <div className="bg-slate-950 p-0.5 text-slate-300 font-bold truncate text-[7px]">Gases do Sul Ltda</div>
                <div className="h-0.5 bg-slate-800 rounded w-1/2 mt-0.5" />
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800 space-y-0.5">
                <span className="font-bold text-slate-400 text-[7px] uppercase block">Funcionário</span>
                <div className="bg-slate-950 p-0.5 text-slate-300 font-bold truncate text-[7px]">Carlos Silva</div>
                <div className="bg-blue-500/10 text-blue-400 text-[6px] px-1 py-0.2 rounded font-extrabold w-max border border-blue-500/10">MOTORISTA</div>
              </div>
            </div>
            <div className="p-1 bg-rose-500/10 border border-rose-500/20 rounded">
              <p className="text-[7px] text-rose-300 leading-tight"><strong>Validação de Unicidade:</strong> O sistema impede duplicidade de e-mails de motoristas cadastrados.</p>
            </div>
          </div>
        )}

        {type === 'cadastro_veiculos' && (
          <div className="space-y-1.5 text-left">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-200 text-[8px] uppercase block">Cadastro de Frota</span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <span className="text-[7px] text-slate-500 block">Placa</span>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-emerald-400 font-mono font-black text-[9px] tracking-widest text-center">MOV-8E88</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7px] text-slate-500 block">Capacidade</span>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-slate-300 font-bold text-[8px]">120 m³</div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[7px]">
                <span className="text-slate-400">Modelo: Volvo FH</span>
                <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[7px] uppercase shadow">Gravar</span>
              </div>
            </div>
          </div>
        )}

        {type === 'cadastro_rotas' && (
          <div className="space-y-1 text-left">
            <span className="font-bold text-slate-200 text-[8px] uppercase block">Configurações de Rotas</span>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800 space-y-1">
              <div className="flex items-center justify-between bg-slate-950 p-1 rounded border border-slate-850">
                <span className="font-mono font-bold text-slate-300 text-[7px]">ROTA LITORAL 01</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded text-[6px] font-black uppercase">DISPONÍVEL</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-1 rounded border border-slate-850">
                <span className="font-mono font-bold text-slate-300 text-[7px]">ROTA SERRA 03</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded text-[6px] font-black uppercase">ROTEIRIZADA</span>
              </div>
            </div>
          </div>
        )}

        {type === 'cadastro_relatorios' && (
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800">
              <span className="material-symbols-outlined text-slate-400 text-[10px] ml-0.5">search</span>
              <div className="text-slate-500 font-semibold text-[7px] flex-1">Filtrar registros...</div>
            </div>
            <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
              <div className="p-1 text-[7px] text-slate-300 flex items-center justify-between border-b border-slate-950 bg-slate-950 font-bold text-slate-400">
                <span>Material</span>
                <div className="flex gap-1.5">
                  <span className="material-symbols-outlined text-blue-400 text-[9px] cursor-pointer">edit</span>
                  <span className="material-symbols-outlined text-rose-400 text-[9px] cursor-pointer">delete</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- CRIAR TRANSPORTE MOCKUPS --- */}
        {type === 'transporte_cover' && <WorkspaceSVG />}

        {type === 'transporte_summary' && (
          <div className="space-y-1.5 text-left py-0.5">
            <span className="font-bold text-slate-200 uppercase text-[8px] block">Etapas de Liberação</span>
            <div className="flex items-center justify-between text-center pt-1 gap-1">
              <div className="bg-slate-900 border border-slate-800 p-1 rounded w-12 shrink-0">
                <span className="text-[7px] text-blue-400 font-black block">1. Início</span>
                <span className="text-[6px] text-slate-500">TP Novo</span>
              </div>
              <span className="text-slate-600 text-[9px]">→</span>
              <div className="bg-slate-900 border border-slate-800 p-1 rounded w-12 shrink-0">
                <span className="text-[7px] text-blue-400 font-black block">2. Carga</span>
                <span className="text-[6px] text-slate-500">Escalas</span>
              </div>
              <span className="text-slate-600 text-[9px]">→</span>
              <div className="bg-slate-900 border border-slate-800 p-1 rounded w-12 shrink-0">
                <span className="text-[7px] text-blue-400 font-black block">3. Envio</span>
                <span className="text-[6px] text-slate-500">Despacho</span>
              </div>
            </div>
          </div>
        )}

        {type === 'transporte_acesso' && (
          <div className="space-y-1 text-left">
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="bg-blue-600/10 text-blue-400 text-[6px] px-1 py-0.2 rounded font-black border border-blue-500/10">ID SEQUENCIAL</span>
                <span className="font-bold text-slate-100 block text-[9px] font-mono">TP-000012</span>
              </div>
              <span className="material-symbols-outlined text-blue-500 text-lg">local_shipping</span>
            </div>
          </div>
        )}

        {type === 'transporte_sugestoes' && (
          <div className="space-y-1.5 text-left">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1">
              <span className="text-[7px] text-slate-400 uppercase block">Campos Assistidos</span>
              <div className="space-y-0.5">
                <span className="text-[6px] text-slate-500 block">Veículo / Placa</span>
                <div className="bg-slate-950 p-1.5 rounded border border-blue-500/40 text-slate-100 font-mono font-bold text-[8px]">MOV-8</div>
                {/* Suggestions dropdown */}
                <div className="bg-slate-900 border border-slate-850 rounded overflow-hidden text-[7px] mt-0.5 divide-y divide-slate-950">
                  <div className="p-1 hover:bg-slate-800 text-emerald-400 font-bold">MOV-8E88 (Volvo)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'transporte_modos' && (
          <div className="space-y-1 text-left">
            <div className="flex gap-0.5 border-b border-slate-800 pb-0.5">
              <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded text-[6px] font-black">ROTA</span>
              <span className="bg-slate-900 text-slate-500 px-1.5 py-0.2 rounded text-[6px] font-semibold">MULTI-ROTA</span>
            </div>
            <div className="p-1.5 bg-slate-900 rounded border border-slate-800 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500 text-white flex items-center justify-center font-bold text-[7px]">✓</span>
                <span className="text-[7px] text-slate-300">Cliente #0012 - Agro Sul</span>
              </div>
            </div>
          </div>
        )}

        {type === 'transporte_carga' && (
          <div className="space-y-1 text-left">
            <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden text-[7px]">
              <div className="bg-slate-950 p-1 text-[6px] font-bold text-slate-400 grid grid-cols-3 border-b border-slate-800">
                <span>Material</span>
                <span className="text-center">S. Carga</span>
                <span className="text-center">S. Coleta</span>
              </div>
              <div className="p-1 text-slate-300 grid grid-cols-3 items-center">
                <span className="truncate">Cilindro O2</span>
                <span className="text-center text-blue-400 font-bold">45</span>
                <span className="text-center text-orange-400 font-bold">10</span>
              </div>
            </div>
          </div>
        )}

        {type === 'transporte_gravar' && (
          <div className="space-y-1 text-left">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-center">
              <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
              <span className="font-bold text-slate-100 block text-[8px] uppercase">GRAVADO COM SUCESSO!</span>
              <p className="text-[7px] text-slate-400 leading-normal">Baixa realizada na conta de armazém, adicionado ao painel &quot;Em Trânsito&quot;.</p>
            </div>
          </div>
        )}

        {/* --- VEÍCULOS EM ENTREGA MOCKUPS --- */}
        {type === 'entrega_cover' && <WorkspaceSVG />}

        {type === 'entrega_summary' && (
          <div className="space-y-1 text-left py-0.5">
            <span className="font-bold text-slate-200 uppercase text-[8px] block">Controle da Rota</span>
            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <div className="bg-slate-900 border border-slate-800 p-1.5 rounded text-center">
                <span className="material-symbols-outlined text-blue-400 text-xs">local_shipping</span>
                <span className="text-[7px] text-slate-300 font-bold block mt-0.5">Visitas</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-1.5 rounded text-center">
                <span className="material-symbols-outlined text-emerald-400 text-xs">payments</span>
                <span className="text-[7px] text-slate-300 font-bold block mt-0.5">Liquidar</span>
              </div>
            </div>
          </div>
        )}

        {type === 'entrega_painel' && (
          <div className="space-y-1.5 text-left">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-slate-200">MOV-8E88</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[6px] px-1 py-0.2 rounded font-black">65% CONCLUÍDO</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        )}

        {type === 'entrega_central' && (
          <div className="space-y-1 text-left">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800 space-y-0.5">
                <span className="font-bold text-slate-400 text-[7px] block uppercase">Paradas (Esq)</span>
                <div className="bg-slate-950 p-1 text-[6px] text-slate-300 flex items-center justify-between rounded">
                  <span>1. Agro Sul</span>
                  <span className="text-emerald-400 font-bold text-[5px]">ENTREGUE</span>
                </div>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800 space-y-0.5">
                <span className="font-bold text-slate-400 text-[7px] block uppercase">Carga (Dir)</span>
                <div className="bg-slate-950 p-1 text-[6px] text-slate-300 flex justify-between rounded font-mono">
                  <span>Cilindro O2</span>
                  <span className="text-blue-400 font-bold">12 UN</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'entrega_baixa' && (
          <div className="space-y-1.5 text-left">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center space-y-1">
              <span className="font-bold text-slate-200 block text-[8px] uppercase">Lançar Baixa</span>
              <div className="grid grid-cols-3 gap-0.5">
                <span className="bg-emerald-600 text-white font-extrabold py-1 rounded text-[6px] uppercase shadow">OK</span>
                <span className="bg-amber-600 text-white font-extrabold py-1 rounded text-[6px] uppercase shadow">Parcial</span>
                <span className="bg-rose-600 text-white font-extrabold py-1 rounded text-[6px] uppercase shadow">Devolvido</span>
              </div>
            </div>
          </div>
        )}

        {type === 'entrega_retirada' && (
          <div className="space-y-1 text-left">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 text-[7px] uppercase block">Criar Retirada</span>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-850 text-orange-400 font-mono font-bold text-center text-[10px]">25 Coletados</div>
            </div>
          </div>
        )}

        {type === 'entrega_sobras' && (
          <div className="space-y-1.5 text-left">
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 text-[7px] uppercase block">Confrontar Sobras</span>
              <div className="bg-slate-950 p-1 rounded text-slate-300 flex justify-between text-[7px]">
                <span>Esperado: 10</span>
                <span className="text-emerald-400 font-black">Físico: 12 (+2 Sobra)</span>
              </div>
            </div>
          </div>
        )}

        {type === 'entrega_liquidacao' && (
          <div className="space-y-1 text-left">
            <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center space-y-1.5">
              <span className="material-symbols-outlined text-emerald-400 text-lg block">currency_exchange</span>
              <span className="font-bold text-slate-200 block text-[8px] uppercase">Pronto para Liquidação</span>
              <span className="bg-blue-600 text-white font-black py-1 px-2 rounded text-[7px] uppercase block shadow">Liquidar</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SuporteView() {
  const {
    products,
    clients,
    activeTransports,
    activeDistributorName,
    employees,
    updateEmployee,
    triggerSuporteStatusUpdate,
    dbStatus,
    dbErrorMessage,
    retryDbConnection,
    setIsSupabaseModalOpen
  } = useApp();

  // Active Presentation selection
  const [exportingIdx, setExportingIdx] = useState<number | null>(null);

  // Derive telegram recipients list from employees with a Chat ID
  const telegramEmployees = useMemo(() => {
    return employees.filter(e => e.telegramChatId && e.telegramChatId.trim() !== '');
  }, [employees]);

  const activeChatIds = useMemo(() => {
    return telegramEmployees.filter(e => e.enableTelegram).map(e => e.telegramChatId || '');
  }, [telegramEmployees]);

  // Modal cadastro states
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState<boolean>(false);
  const [cadastroUserName, setCadastroUserName] = useState<string>('');
  const [cadastroChatId, setCadastroChatId] = useState<string>('');
  const [cadastroError, setCadastroError] = useState<string>('');

  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Automatic Status Update states
  const [isAutoUpdateActive, setIsAutoUpdateActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isAutoUpdateActive');
      return saved === 'true';
    }
    return false;
  });

  const [autoUpdateTime, setAutoUpdateTime] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autoUpdateTime');
      return saved || '08:00';
    }
    return '08:00';
  });

  const [showUpdateSuccessBanner, setShowUpdateSuccessBanner] = useState<boolean>(false);
  const lastRunTimeRef = useRef<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem('isAutoUpdateActive', String(isAutoUpdateActive));
    } catch (err) {
      console.warn('Unable to write isAutoUpdateActive to localStorage:', err);
    }
  }, [isAutoUpdateActive]);

  useEffect(() => {
    try {
      localStorage.setItem('autoUpdateTime', autoUpdateTime);
    } catch (err) {
      console.warn('Unable to write autoUpdateTime to localStorage:', err);
    }
  }, [autoUpdateTime]);

  // Interval-based automatic execution check (runs every 10 seconds when enabled)
  useEffect(() => {
    if (!isAutoUpdateActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;

      if (currentTimeString === autoUpdateTime) {
        if (lastRunTimeRef.current !== currentTimeString) {
          lastRunTimeRef.current = currentTimeString;
          triggerSuporteStatusUpdate();
          setShowUpdateSuccessBanner(true);
          setTimeout(() => setShowUpdateSuccessBanner(false), 5000);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAutoUpdateActive, autoUpdateTime, triggerSuporteStatusUpdate]);

  // Toggle function that triggers immediately when placed on 'Ativado'
  const handleToggleAutoUpdate = (active: boolean) => {
    setIsAutoUpdateActive(active);
    if (active) {
      triggerSuporteStatusUpdate();
      setShowUpdateSuccessBanner(true);
      // Automatically clear banner after 5 seconds
      setTimeout(() => {
        setShowUpdateSuccessBanner(false);
      }, 5000);
    }
  };

  // Telegram Reports States
  interface TelegramReport {
    id: string;
    name: string;
    description: string;
    checked: boolean;
    content: string;
  }

  const [reports, setReports] = useState<TelegramReport[]>([
    {
      id: 'saldo_geral',
      name: 'MOVIX - Relatório de Saldo Geral',
      description: 'Relatório completo com o saldo total consolidado de armazém, trânsito e lojas',
      checked: true,
      content: ''
    },
    {
      id: 'resumo_veiculos',
      name: 'MOVIX - Resumo de Veículos',
      description: 'Lista consolidada com o andamento e status de entrega de todas as frotas em trânsito',
      checked: false,
      content: ''
    },
    {
      id: 'multas_retencao',
      name: 'MOVIX - Relatório de Multa sob Retenção',
      description: 'Análise de excedentes, percentuais de retenção e cálculo de multa por faixas',
      checked: false,
      content: ''
    }
  ]);

  const [previewReportInPhone, setPreviewReportInPhone] = useState<TelegramReport | null>(null);

  // --- CURRENT TOTAL GERAL CALCULATION FOR TELEGRAM REPORT ---
  const currentTotalGeralData = useMemo(() => {
    return products.map((p) => {
      const armazem = p.initialStock;
      const transporte = (activeTransports || []).reduce(
        (sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0),
        0
      );
      const prodLoja = clients.reduce((sum, c) => {
        if (c.productBalances && c.productBalances[p.id] !== undefined) {
          return sum + (c.productBalances[p.id] || 0);
        }
        // Fallback proportional calculation matching MovementsView
        const pIdx = products.findIndex((prod) => prod.id === p.id);
        const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
        return sum + Math.floor((c.saldoLoja || 0) * pct);
      }, 0);

      const total = armazem + transporte + prodLoja;
      return {
        id: p.id,
        code: p.code,
        description: p.description,
        unit: p.unit || 'UN',
        armazem,
        transporte,
        prodLoja,
        total
      };
    });
  }, [products, clients, activeTransports]);

  // Constructing the beautiful Markdown Telegram Message content
  const telegramMessageContent = useMemo(() => {
    let msg = `📊 *MOVIX - Relatório de Saldo Geral*\n\n`;
    msg += `*Saldos atuais de Equipamentos:*\n`;
    msg += `----------------------------------------\n`;

    currentTotalGeralData.forEach((item) => {
      msg += `• *${item.code}* - ${item.description}\n`;
      msg += `  └─ *TOTAL:* ${item.total.toLocaleString('pt-BR')} ${item.unit}\n`;
      msg += `     ├─ Em Armazém: ${item.armazem.toLocaleString('pt-BR')} ${item.unit}\n`;
      msg += `     ├─ Em Transporte: ${item.transporte.toLocaleString('pt-BR')} ${item.unit}\n`;
      msg += `     └─ Em Cliente (Loja): ${item.prodLoja.toLocaleString('pt-BR')} ${item.unit}\n\n`;
    });

    msg += `----------------------------------------\n`;
    msg += `Mensagem enviada pela Central de gestão de dados Movix.`;
    
    return msg;
  }, [currentTotalGeralData]);

  const activeTransportsContent = useMemo(() => {
    let msg = `🚚 *MOVIX - Resumo de Veículos*\n\n`;

    if (!activeTransports || activeTransports.length === 0) {
      msg += `_Nenhum veículo em trânsito no momento._\n`;
    } else {
      activeTransports.forEach((t) => {
        const motoristaName = t.driver || 'N/A';
        const placaVal = t.placa || 'N/A';
        
        let statusValFormatted: string = t.statusTransporte || 'CRIADO';
        if (statusValFormatted === 'CRIADO') statusValFormatted = 'Criado';
        if (statusValFormatted === 'EM_ENTREGA' || statusValFormatted === 'EM ENTREGA') statusValFormatted = 'Em Entrega';
        if (statusValFormatted === 'EM_LIQUIDACAO' || statusValFormatted === 'EM LIQUIDAÇÃO' || statusValFormatted === 'LIQUIDADO') statusValFormatted = 'Em Liquidação';
        if (statusValFormatted === 'Finalizado') statusValFormatted = 'Finalizado';

        const totalClients = t.selectedClientIds?.length || t.clienteTotal || 0;

        msg += `• *Placa:* ${placaVal}\n`;
        msg += `  *Motorista:* ${motoristaName}\n`;
        msg += `  *Qtd. Clientes:* ${totalClients}\n`;
        msg += `  *Rota:* ${t.route || 'N/A'}\n`;
        msg += `  *Status:* ${statusValFormatted}\n\n`;
      });
    }

    msg += `----------------------------------------\n`;
    msg += `Mensagem enviada pela Central de gestão de dados Movix.`;
    return msg;
  }, [activeTransports]);

  // Calculations for Previsão de Produto por Retenção & Multas for Telegram Report
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
      const retAcima = Math.max(0, retencaoAcima);

      const pct = necessity > 0 ? retAcima / necessity : 0;
      const pct100 = pct * 100;

      let bandLetter = 'A';
      let multaQty = 0;

      if (pct100 >= 0 && pct100 <= 10.0) {
        bandLetter = 'A';
        multaQty = 0;
      } else if (pct100 > 10.0 && pct100 <= 20.0) {
        bandLetter = 'B';
        multaQty = Math.floor(0.25 * retAcima);
      } else if (pct100 > 20.0 && pct100 <= 30.0) {
        bandLetter = 'C';
        multaQty = Math.floor(0.35 * retAcima);
      } else if (pct100 > 30.0) {
        bandLetter = 'D';
        multaQty = Math.floor(0.40 * retAcima);
      }

      const valorMulta = unitValue * multaQty;

      return {
        id: p.id,
        description,
        unitValue,
        necessity,
        physical,
        retAcima,
        pct100,
        bandLetter,
        multaQty,
        valorMulta
      };
    });
  }, [products, clients, activeTransports]);

  const multasRetencaoContent = useMemo(() => {
    let msg = `📋 *MOVIX - Relatório de Multa sob Retenção*\n\n`;
    msg += `*Detalhamento de Retenção e Multas por Material:*\n`;
    msg += `----------------------------------------\n`;

    let totalNecessity = 0;
    let totalPhysical = 0;
    let totalRetencaoAcima = 0;
    let totalFines = 0;

    detailedFineItems.forEach((item) => {
      const formattedUnitValue = item.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const formattedMulta = item.valorMulta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      totalNecessity += item.necessity;
      totalPhysical += item.physical;
      totalRetencaoAcima += item.retAcima;
      totalFines += item.valorMulta;

      const pctFormatted = item.pct100.toFixed(2).replace('.', ',');
      let bandPercent = 0;
      if (item.bandLetter === 'A') bandPercent = 0;
      else if (item.bandLetter === 'B') bandPercent = 25;
      else if (item.bandLetter === 'C') bandPercent = 35;
      else if (item.bandLetter === 'D') bandPercent = 40;

      msg += `• *${item.description}*\n`;
      msg += `  ├─ Vl. Unitário: ${formattedUnitValue}\n`;
      msg += `  ├─ Nec. Cadastrada: ${item.necessity.toLocaleString('pt-BR')} UN\n`;
      msg += `  ├─ Saldo Físico Total: ${item.physical.toLocaleString('pt-BR')} UN\n`;
      msg += `  ├─ Retenção Excedente: +${item.retAcima.toLocaleString('pt-BR')} UN\n`;
      msg += `  ├─ % Retenção: ${pctFormatted}% (Faixa ${item.bandLetter})\n`;
      msg += `  ├─ Faixa ${item.bandLetter} (${bandPercent}%): ${item.multaQty.toLocaleString('pt-BR')} UN\n`;
      msg += `  └─ *Valor da Multa:* ${formattedMulta}\n\n`;
    });

    msg += `----------------------------------------\n`;
    msg += `📐 *Faixas Calculadas:*\n`;
    msg += `• Faixa A: 0 a 10% (0% de multa)\n`;
    msg += `• Faixa B: 10,01 a 20% (25% de multa)\n`;
    msg += `• Faixa C: 20,01 a 30% (35% de multa)\n`;
    msg += `• Faixa D: 30,01% ou Superior (40% de multa)\n\n`;

    msg += `----------------------------------------\n`;
    msg += `📊 *RESUMO CONSOLIDADO:*\n`;
    msg += `• Necessidade Total: ${totalNecessity.toLocaleString('pt-BR')} UN\n`;
    msg += `• Saldo Físico Total: ${totalPhysical.toLocaleString('pt-BR')} UN\n`;
    msg += `• Excedente de Retenção: +${totalRetencaoAcima.toLocaleString('pt-BR')} UN\n`;
    msg += `• *VALOR TOTAL DAS MULTAS:* *${totalFines.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n\n`;
    msg += `Mensagem enviada pela Central de gestão de dados Movix.`;

    return msg;
  }, [detailedFineItems]);

  const getReportContent = (id: string): string => {
    if (id === 'saldo_geral') return telegramMessageContent;
    if (id === 'resumo_veiculos') return activeTransportsContent;
    if (id === 'multas_retencao') return multasRetencaoContent;
    return '';
  };

  // Trigger real-time post to API with full error tracking
  const handleSendTelegramReport = async () => {
    if (activeChatIds.length === 0) {
      alert("Por favor, selecione pelo menos um Chat ID destinatário.");
      return;
    }

    const selectedReports = reports.filter(r => r.checked);
    if (selectedReports.length === 0) {
      alert("Por favor, selecione pelo menos um relatório para envio.");
      return;
    }

    setIsSendingTelegram(true);
    setTelegramStatus(null);
    try {
      let anyError = false;
      let errorMsgs: string[] = [];

      for (const report of selectedReports) {
        const messageContent = getReportContent(report.id);
        if (!messageContent) continue;

        const response = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chatIds: activeChatIds,
            message: messageContent
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          anyError = true;
          let errorMsg = data.error || '';
          if (data.results && Array.isArray(data.results)) {
            const failedDetails = data.results
              .filter((r: any) => !r.success)
              .map((r: any) => `Chat ID ${r.chatId}: ${r.error}`)
              .join(' | ');
            if (failedDetails) {
              errorMsg = `Falha no envio do relatório "${report.name}" - ${failedDetails}`;
            }
          }
          if (!errorMsg) {
            errorMsg = `Falha ao enviar o relatório "${report.name}".`;
          }
          errorMsgs.push(errorMsg);
        }
      }

      if (!anyError) {
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      } else {
        setTelegramStatus({
          success: false,
          msg: errorMsgs.join(' ; ')
        });
      }
    } catch (err: any) {
      setTelegramStatus({
        success: false,
        msg: err.message || 'Erro de conexão ao servidor de envio.'
      });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Slide Data arrays representing Power Point presentations as requested
  const manualsData = [
    {
      title: 'Manual de Cadastros Operacionais',
      slides: [
        {
          type: 'cover',
          title: 'Manual de Cadastros Operacionais',
          subtitle: 'Guia completo para utilização e gerenciamento de dados cadastrais no sistema MOVIX',
          extra: 'Aba de Cadastros • Gestão Inteligente',
          mockupType: 'workspace'
        },
        {
          type: 'summary',
          title: 'Sumário da Apresentação',
          topics: [
            '1. Visão Geral da Aba de Cadastros',
            '2. Cadastro de Produtos (Materiais)',
            '3. Cadastro de Clientes',
            '4. Cadastro de Fornecedores e Funcionários',
            '5. Cadastro de Veículos de Carga',
            '6. Rota de Entrega e Rota de Contagem',
            '7. Relatórios e Visualização de Dados'
          ],
          mockupType: 'summary_index'
        },
        {
          type: 'content',
          title: '1. Visão Geral da Aba de Cadastros',
          bullets: [
            'A aba de *Cadastros* é o coração estrutural do sistema MOVIX, servindo de base de validação para as operações.',
            'O acesso é feito de forma simples clicando no item *Cadastros* localizado no menu da barra lateral esquerda.',
            'O painel de cadastros conta com uma interface organizada em guias rápidas no topo para alternar instantaneamente.',
            'Todos os formulários contam com validações automáticas de integridade (CNPJ único, formato de placas, campos obrigatórios).'
          ],
          mockupType: 'cadastros_geral'
        },
        {
          type: 'content',
          title: '2. Cadastro de Produtos (Materiais)',
          bullets: [
            'O cadastro de produtos permite registrar os materiais que serão controlados no estoque físico e movimentados em transporte.',
            'Para cadastrar: Clique na guia *Produtos*, depois em *Novo Produto* para abrir o painel de preenchimento.',
            'Campos requeridos: Código do Material (deve ser único), Descrição do Produto, Unidade de Medida (UN/KG) e o Saldo Inicial de Entrada.',
            'Após clicar em *Gravar*, o produto é imediatamente adicionado e disponibilizado para as movimentações de carga.'
          ],
          mockupType: 'cadastro_produtos'
        },
        {
          type: 'content',
          title: '3. Cadastro de Clientes',
          bullets: [
            'O cadastro de clientes é essencial para a definição de rotas de entrega e registro de saldos pendentes ou de contagem em loja.',
            'Preenchimento: Razão Social, CNPJ completo (com validação contra duplicidade), Bairro, Cidade e a Rota de Entrega correspondente.',
            '**Matrícula Automática:** Ao gravar o registro, o sistema gera de forma automática uma matrícula de 4 dígitos sequenciais.',
            '**Importação em Massa (Bulk):** Conta com suporte para colar listas em formato Excel diretamente no assistente.'
          ],
          mockupType: 'cadastro_clientes'
        },
        {
          type: 'content',
          title: '4. Cadastro de Fornecedores e Funcionários',
          bullets: [
            '**Fornecedores:** Cadastro prático contendo Razão Social, CNPJ de identificação e Telefone para contato.',
            '**Funcionários:** Registro contendo Nome, E-mail único corporativo, Código ID e Seleção de Função (Motorista, Operador de Caixa, Gerente).',
            'A validação é estrita: o sistema impede dois funcionários de compartilharem o mesmo endereço de e-mail cadastrado.',
            'O perfil "Motorista" serve de filtro prioritário para a vinculação automática nos painéis de expedição de transportes.'
          ],
          mockupType: 'cadastro_forn_func'
        },
        {
          type: 'content',
          title: '5. Cadastro de Veículos de Carga',
          bullets: [
            'Os veículos cadastrados são vinculados aos despachos de rota de entrega para controlar o limite de volumes e peso.',
            'Informações necessárias: Placa do veículo, Marca/Modelo, Peso da tara e a Capacidade de Volume Máximo suportado.',
            '**Padronização de Placas:** O sistema trata as placas digitadas, forçando letras maiúsculas e removendo caracteres inválidos automaticamente.',
            'A placa cadastrada passa a sugerir autocompletar na criação de transporte ao digitar suas primeiras letras.'
          ],
          mockupType: 'cadastro_veiculos'
        },
        {
          type: 'content',
          title: '6. Rota de Entrega e Rota de Contagem',
          bullets: [
            '**Rota de Entrega:** Cadastro com o Número da Rota e Descrição da Região de Abrangência. Possui status dinâmico (DISPONÍVEL ou ROTEIRIZADA).',
            '**Rota de Contagem:** Usado para auditorias de inventário periódico. Contém número da rota de contagem e descrição da área física.',
            'Essas rotas estruturam a sequência física de visitas do veículo e ajudam a organizar a divisão de faturamento das filiais.'
          ],
          mockupType: 'cadastro_rotas'
        },
        {
          type: 'content',
          title: '7. Relatórios e Visualização de Dados',
          bullets: [
            '**Grades de Consulta:** Logo abaixo de cada formulário de cadastro, é exibido um relatório completo em tabela com todos os dados já salvos.',
            '**Barra de Pesquisa Dinâmica:** Permite buscar em tempo real por qualquer termo, filtrando as linhas instantaneamente por placa ou CNPJ.',
            '**Controle de Ação:** Cada linha possui botões rápidos para *Editar* o registro em formulário ou *Excluir* do banco de dados.',
            'O relatório se ajusta automaticamente de acordo com o Distribuidor ativo selecionado no cabeçalho geral da aplicação.'
          ],
          mockupType: 'cadastro_relatorios'
        }
      ]
    },
    {
      title: 'Manual de Criação de Transporte',
      slides: [
        {
          type: 'cover',
          title: 'Manual de Criação de Transporte',
          subtitle: 'Como realizar a roteirização, carregamento de volumes e despacho de frotas pelo botão "Criar Transporte"',
          extra: 'Expedição & Logística • Roteirização',
          mockupType: 'transporte_cover'
        },
        {
          type: 'summary',
          title: 'Sumário da Apresentação',
          topics: [
            '1. Acessando a Roteirização',
            '2. Vinculação de Veículo e Motorista',
            '3. Modos de Transporte e Roteirização',
            '4. Tabela de Carregamento de Volumes',
            '5. Finalização e Liberação de Carga'
          ],
          mockupType: 'transporte_summary'
        },
        {
          type: 'content',
          title: '1. Acessando a Roteirização',
          bullets: [
            'O módulo de expedição é acessado clicando no botão de ação rápida *Criar Transporte* na barra lateral ou painéis centrais.',
            '**Restrição de Segurança:** Se houver um inventário bloqueado para contagem geral de saldos, o botão "Criar Transporte" ficará travado.',
            'O sistema calcula de forma autônoma o próximo número do despacho sequencial (ex: *TP-000012*) baseado no histórico geral.',
            'A tela principal do modal exibe campos de cabeçalho, seleção de modalidade, lista de clientes do percurso e controle de estoque.'
          ],
          mockupType: 'transporte_acesso'
        },
        {
          type: 'content',
          title: '2. Vinculação de Veículo e Motorista (Suggestions)',
          bullets: [
            'O preenchimento do cabeçalho é extremamente assistido para evitar erros de digitação manual de placas ou nomes.',
            '**Auto-sugestão de Placa:** Ao digitar na caixa "Placa", o sistema filtra e sugere instantaneamente as placas registradas.',
            'Se digitar uma placa inexistente, uma mensagem vermelha de erro alerta: *"Placa não cadastrada!"* impedindo o envio.',
            '**Auto-sugestão de Motorista:** O mesmo comportamento se aplica ao motorista, filtrando apenas funcionários de perfil condutor.'
          ],
          mockupType: 'transporte_sugestoes'
        },
        {
          type: 'content',
          title: '3. Modos de Transporte e Roteirização',
          bullets: [
            'O sistema permite criar três modalidades de carregamento na aba de opções:',
            '**Modo Rota (Normal):** Seleciona uma única rota cadastrada. O sistema carrega todos os clientes cadastrados de forma sequencial.',
            '**Modo Multirota:** Permite consolidar cargas. Abre um painel de seleção múltipla para agrupar clientes de diferentes rotas.',
            '**Modo Fora de Rota:** Permite buscar e adicionar manualmente clientes avulsos que não seguem um percurso fixo preestabelecido.'
          ],
          mockupType: 'transporte_modos'
        },
        {
          type: 'content',
          title: '4. Tabela de Carregamento de Volumes',
          bullets: [
            'Abaixo da seleção de percurso, é exibida a lista de todos os produtos do estoque com colunas para entrada de quantidades.',
            '**Quantidade Veículo (Carga):** Quantidade física do produto que está sendo embarcada na expedição do estoque.',
            '**Quantidade Coleta:** Quantidade programada para ser coletada/retornada de clientes durante o percurso.',
            'O sistema abate de forma imediata o estoque do armazém assim que o transporte é confirmado, alocando-o na conta "Em Trânsito".'
          ],
          mockupType: 'transporte_carga'
        },
        {
          type: 'content',
          title: '5. Finalização e Liberação de Carga',
          bullets: [
            'Após revisar os clientes escalados no percurso e as quantidades de carga, clique em *Gravar Transporte*.',
            'O sistema realiza a baixa do estoque físico, atualiza a rota de entrega para o status de *ROTEIRIZADA* (bloqueando novo uso),',
            'e insere o veículo na lista de monitoramento do painel "Veículos em Entrega" com progresso inicial em 0%.',
            'Um log de movimentação com o autor do faturamento é salvo para fins de auditoria interna de expedição.'
          ],
          mockupType: 'transporte_gravar'
        }
      ]
    },
    {
      title: 'Manual de Veículos em Entrega',
      slides: [
        {
          type: 'cover',
          title: 'Manual de Veículos em Entrega',
          subtitle: 'Guia de monitoramento de frotas em trânsito, lançamentos de entregas parciais, sobras e acerto financeiro',
          extra: 'Operações de Campo • Liquidação de Viagem',
          mockupType: 'entrega_cover'
        },
        {
          type: 'summary',
          title: 'Sumário da Apresentação',
          topics: [
            '1. O Painel de Controle de Entregas',
            '2. Central do Transporte Selecionado',
            '3. Lançamento de Baixa de Cliente',
            '4. Criação de Retiradas de Emergência em Campo',
            '5. Gestão de Sobras de Retorno no Estoque',
            '6. Acerto Final e Liquidação do Transporte'
          ],
          mockupType: 'entrega_summary'
        },
        {
          type: 'content',
          title: '1. O Painel de Controle de Entregas',
          bullets: [
            'Acessado através do botão *Veículo em entrega* no sidebar ou clicando na miniatura ilustrada no painel logístico principal.',
            'Exibe cartões interativos de todas as viagens ativas com Placa, Motorista, Rota, progresso percentual e relação de entregas.',
            'Os cartões mostram barras de progresso que mudam de cor dinamicamente (Vermelho: 0%, Amarelo: Intermediário, Verde: Concluído).',
            'Clicar em qualquer cartão abre a central integrada de acompanhamento para realizar as baixas das paradas.'
          ],
          mockupType: 'entrega_painel'
        },
        {
          type: 'content',
          title: '2. Central do Transporte Selecionado',
          bullets: [
            'Uma tela dedicada de controle operacional dividida em painéis:',
            '**Esquerda (Relação de Paradas):** Lista sequencial de clientes roteirizados na carga com seus respectivos status (Vazio, Em Entrega, Entregue, Devolvido).',
            '**Direita (Balanço de Carga):** Resumo analítico mostrando cada produto, a quantidade originalmente embarcada e o saldo atual dentro do veículo.'
          ],
          mockupType: 'entrega_central'
        },
        {
          type: 'content',
          title: '3. Lançamento de Baixa de Cliente',
          bullets: [
            'Ao selecionar um cliente da lista esquerda, abre-se o assistente de baixa de parada:',
            '**Entrega Padrão (OK):** Se tudo ocorreu conforme programado, basta clicar em *Confirmar Entrega Sem Alterações*. O status do cliente muda para *Entregue*.',
            '**Lançamento Manual:** Se houve divergência ou devolução, preencha manualmente a quantidade real entregue e a quantidade realmente coletada.',
            '**Não Realizada:** Se o cliente estava fechado, marque esta opção para registrar a recusa e manter os produtos a bordo.'
          ],
          mockupType: 'entrega_baixa'
        },
        {
          type: 'content',
          title: '4. Criação de Retiradas de Emergência',
          bullets: [
            'Durante a rota, se o motorista precisar realizar uma retirada de cilindros/materiais avulsa em um cliente fora do programado:',
            'Clique no botão *Criar Retirada* no topo da central. Selecione o cliente por Razão Social, CNPJ ou Matrícula.',
            'Informe na tabela as quantidades que estão sendo coletadas e clique em *Confirmar Retirada*.',
            'Os saldos são inseridos no veículo e o saldo de depósito do cliente é updated imediatamente.'
          ],
          mockupType: 'entrega_retirada'
        },
        {
          type: 'content',
          title: '5. Gestão de Sobras de Retorno',
          bullets: [
            'Se ao final da rota o veículo retornar com materiais de devolução ou sobras físicas não programadas:',
            'O painel permite lançar as sobras identificadas no veículo através do botão *Lançar Sobras*.',
            'Essas sobras são confrontadas com o balanço de carga e devolvidas ao estoque do armazém principal mediante aprovação do operador.',
            'Previne perdas de materiais e furos em inventário por cilindros/recipientes esquecidos nos caminhões.'
          ],
          mockupType: 'entrega_sobras'
        },
        {
          type: 'content',
          title: '6. Acerto Final e Liquidação do Transporte',
          bullets: [
            'Quando todas as paradas dos clientes foram preenchidas e as sobras declaradas, o botão *Liquidar Rota* ficará habilitado.',
            'Ao clicar, o sistema exibe um relatório resumo final detalhando: Volumes Carregados, Entregues, Coletados, Sobras e Perdas.',
            'Após confirmar a liquidação, a rota é destravada para o status *DISPONÍVEL*, o veículo é liberado e os saldos em clientes são consolidados.'
          ],
          mockupType: 'entrega_liquidacao'
        }
      ]
    }
  ];

  // PowerPoint Presentation (.PPTX) Dynamic Exporter Function using pptxgenjs
  const handleDownloadPPT = async (idx: number) => {
    setExportingIdx(idx);
    try {
      const currentManual = manualsData[idx];
      const pptxgen = (await import('pptxgenjs')).default;
      const pptx = new pptxgen();
      
      pptx.layout = 'LAYOUT_16x9';
      
      currentManual.slides.forEach((slideData) => {
        const slide = pptx.addSlide();
        
        if (slideData.type === 'cover') {
          // Dark Background style for Covers
          slide.background = { color: '0F172A' };
          
          // Small decorative subtitle
          slide.addText((slideData.extra || '').toUpperCase(), {
            x: 1.0,
            y: 1.2,
            w: 11.3,
            h: 0.4,
            fontSize: 10,
            bold: true,
            color: '3B82F6',
            fontFace: 'Arial'
          });
          
          // Big bold title
          slide.addText(slideData.title, {
            x: 1.0,
            y: 1.6,
            w: 11.3,
            h: 1.6,
            fontSize: 30,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
          });
          
          // Description
          slide.addText(slideData.subtitle || '', {
            x: 1.0,
            y: 3.2,
            w: 11.3,
            h: 1.0,
            fontSize: 14,
            color: '94A3B8',
            fontFace: 'Arial'
          });
          
          // Small brand footer
          slide.addText('SISTEMA MOVIX LOGÍSTICA INTELIGENTE • DOCUMENTAÇÃO', {
            x: 1.0,
            y: 4.8,
            w: 11.3,
            h: 0.3,
            fontSize: 8,
            bold: true,
            color: '475569',
            fontFace: 'Arial'
          });
        } else if (slideData.type === 'summary') {
          // Dark Background for summaries
          slide.background = { color: '0F172A' };
          
          // Slide Title
          slide.addText(slideData.title, {
            x: 1.0,
            y: 0.8,
            w: 11.3,
            h: 0.6,
            fontSize: 22,
            bold: true,
            color: '3B82F6',
            fontFace: 'Arial'
          });
          
          // Arrange topics in columns
          if (slideData.topics) {
            slideData.topics.forEach((topic, i) => {
              const row = Math.floor(i / 2);
              const col = i % 2;
              const posX = 1.0 + (col * 5.8);
              const posY = 1.8 + (row * 0.8);
              
              slide.addText(topic, {
                x: posX,
                y: posY,
                w: 5.2,
                h: 0.6,
                fontSize: 11,
                bold: true,
                color: 'E2E8F0',
                fontFace: 'Arial'
              });
            });
          }
          
          // Footer
          slide.addText('SISTEMA MOVIX • APRESENTAÇÃO DE TREINAMENTO', {
            x: 1.0,
            y: 5.1,
            w: 6.0,
            h: 0.3,
            fontSize: 8,
            color: '475569',
            fontFace: 'Arial'
          });
        } else {
          // Standard light content slide
          slide.background = { color: 'F8FAFC' };
          
          // Slide title
          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.6,
            w: 11.7,
            h: 0.8,
            fontSize: 20,
            bold: true,
            color: '1E293B',
            fontFace: 'Arial'
          });
          
          // Bullet list column
          if (slideData.bullets) {
            const bulletTexts = slideData.bullets.map(b => b.replace(/\*/g, ''));
            const textObjects = bulletTexts.map(text => ({
              text: ' ' + text,
              options: { bullet: true, fontSize: 11, color: '334155', fontFace: 'Arial' }
            }));
            slide.addText(textObjects, {
              x: 0.8,
              y: 1.6,
              w: 6.8,
              h: 3.4,
              lineSpacing: 16
            });
          }
          
          // Frame box representing screen mockup
          slide.addShape((pptx as any).shapes.ROUNDED_RECTANGLE, {
            x: 8.0,
            y: 1.6,
            w: 4.5,
            h: 3.0,
            fill: { color: '0F172A' },
            line: { color: '334155', width: 1 }
          });
          
          // Mockup text placeholder
          slide.addText(`📱 [MOCKUP DA TELA]\n${slideData.title.toUpperCase()}\n\nConsulte o ambiente interativo da Central de Suporte Movix para visualizar e testar o protótipo real desta tela.`, {
            x: 8.2,
            y: 2.1,
            w: 4.1,
            h: 2.0,
            fontSize: 10,
            color: '3B82F6',
            align: 'center',
            fontFace: 'Arial'
          });
          
          // Slide Footer
          slide.addText('SISTEMA MOVIX LOGÍSTICA • CENTRAL DE SUPORTE', {
            x: 0.8,
            y: 5.1,
            w: 6.0,
            h: 0.3,
            fontSize: 8,
            color: '94A3B8',
            fontFace: 'Arial'
          });
        }
      });
      
      const sanitizedTitle = currentManual.title.toLowerCase().replace(/\s+/g, '_');
      await pptx.writeFile({ fileName: `movix_${sanitizedTitle}.pptx` });
    } catch (err) {
      console.error('Error generating PPTX:', err);
      alert('Houve um erro ao tentar gerar o PowerPoint. Por favor, tente novamente.');
    } finally {
      setExportingIdx(null);
    }
  };

  return (
    <div id="suporte_view_container" className="space-y-8 text-left">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT & CENTER COLUMN: MANUALS COMPACT LIST VIEW (reduced width) --- */}
        <div className="lg:col-span-5 space-y-6">
          {/* --- DATABASE DIAGNOSTICS & SYNC STATUS PANEL --- */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 text-left">
              <div className="shrink-0 p-1.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
                <span className="material-symbols-outlined text-[24px]">database</span>
              </div>
              <div className="text-left">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Sincronização:</span>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">Status do Banco de Dados</h3>
              </div>
            </div>

            {/* Checking Status */}
            {dbStatus === 'checking' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col space-y-3 animate-pulse text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span className="text-xs font-bold text-amber-800">Verificando conexão...</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  O sistema está consultando os metadados do banco de dados na nuvem Supabase para validar a comunicação e as permissões de acesso.
                </p>
              </div>
            )}

            {/* Connected (Database Synced) Status */}
            {dbStatus === 'connected' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative flex shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold text-emerald-800">Nuvem Conectada e Sincronizada</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Sua aplicação está sincronizada em tempo real com o banco de dados Supabase! Qualquer alteração feita aqui será refletida instantaneamente para todos os usuários em qualquer dispositivo conectado.
                </p>
                <button
                  type="button"
                  onClick={() => retryDbConnection()}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border border-emerald-700/10"
                >
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                  Forçar Sincronia Agora
                </button>
                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  Ver / Editar API do Supabase
                </button>
              </div>
            )}

            {/* Disconnected (Offline Fallback / LocalStorage) Status */}
            {dbStatus === 'disconnected' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Modo Offline (Dados Locais)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  A aplicação está rodando em modo isolado offline usando o <strong className="font-extrabold text-slate-800">Armazenamento Local (LocalStorage)</strong> do navegador.
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-[10px] text-amber-800 leading-relaxed">
                  <strong className="font-bold">Por que isso acontece?</strong> As variáveis de ambiente do Supabase não foram configuradas no seu servidor ou painel de hospedagem Hostinger. Por isso, as alterações feitas neste computador <strong className="font-bold">ficam restritas a esta máquina</strong> e não aparecem em outras.
                </div>
                
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Como Ativar Compartilhamento:</span>
                  <ol className="list-decimal list-inside text-[10px] text-slate-600 space-y-1 pl-1 leading-normal">
                    <li>Acesse seu painel do <strong className="font-bold">Supabase</strong>.</li>
                    <li>Vá em <strong className="font-bold">Project Settings &gt; API</strong>.</li>
                    <li>Copie o <strong className="font-bold">Project URL</strong> e a chave <strong className="font-bold">anon public</strong>.</li>
                    <li>No painel da <strong className="font-bold">Hostinger</strong> (Ambiente de VPS ou nas configurações de variáveis do Next.js), crie as seguintes chaves de ambiente:</li>
                    <div className="bg-slate-100 p-1.5 rounded font-mono text-[9px] text-slate-800 my-1 font-bold space-y-0.5 border border-slate-200">
                      <div>NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui</div>
                      <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui</div>
                    </div>
                    <li>Recompile ou reinicie a aplicação na Hostinger para que o servidor passe essas variáveis ao navegador.</li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  Configurar Supabase Manualmente
                </button>
              </div>
            )}

            {/* Error / Table Missing Status */}
            {dbStatus === 'error' && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-xs font-bold text-rose-800">Falha na Sincronização de Tabelas</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  O Supabase está conectado, mas ocorreram falhas ao ler ou gravar os dados (o app caiu em fallback local para não travar):
                </p>
                <div className="bg-white/85 border border-rose-100 rounded-lg p-2.5 text-[10px] text-rose-800 font-mono break-all leading-normal max-h-24 overflow-y-auto">
                  {dbErrorMessage}
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-[10px] text-amber-800 leading-relaxed">
                  <strong className="font-bold">Causa Mais Comum:</strong> A estrutura de tabelas ainda não foi criada no banco de dados.
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Como Corrigir em 1 Minuto:</span>
                  <ol className="list-decimal list-inside text-[10px] text-slate-600 space-y-1 pl-1 leading-normal">
                    <li>Abra o arquivo <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px]">supabase_schema.sql</code> localizado na raiz deste projeto.</li>
                    <li>Copie todo o código SQL de dentro dele.</li>
                    <li>No painel do <strong className="font-bold">Supabase</strong>, clique em <strong className="font-bold">SQL Editor &gt; New Query</strong>.</li>
                    <li>Cole o código copiado e clique em <strong className="font-bold">Run (Executar)</strong> no canto inferior direito.</li>
                    <li>Após a execução concluída com sucesso, clique no botão abaixo para reatar a conexão.</li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={() => retryDbConnection()}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border border-rose-700/10"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Reatar Conexão e Carregar Tabelas
                </button>
                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  Reconfigurar API do Supabase
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-5 text-left">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">auto_stories</span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Manuais:</span>
            </div>

            <div className="divide-y divide-gray-100">
              {manualsData.map((manual, idx) => (
                <div key={idx} className="flex flex-col py-4 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
                  {/* Top Row: Title & Download Button side-by-side */}
                  <div className="flex items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-2 text-left">
                      <span className="material-symbols-outlined text-blue-600 select-none text-[20px] shrink-0">menu_book</span>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">
                        {manual.title}
                      </h4>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleDownloadPPT(idx)}
                      disabled={exportingIdx === idx}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer border border-emerald-700/10 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px] font-bold">
                        {exportingIdx === idx ? 'progress_activity' : 'download'}
                      </span>
                      {exportingIdx === idx ? 'Baixando...' : 'Baixar'}
                    </button>
                  </div>
                  
                  {/* Description row below */}
                  <p className="text-[11px] text-slate-500 mt-2 pl-7 text-left leading-relaxed">
                    Apresentação executiva em formato de slides contendo {manual.slides.length} slides interativos de treinamento operacional.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* --- AUTOMATIC STATUS UPDATE QUADRANT --- */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 text-left">
              <div className="shrink-0 p-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                <svg viewBox="0 0 100 100" className="w-8 h-8 select-none text-slate-700" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  {/* Left Gear Half */}
                  <path d="M50,15 C45,15 42,12 42,8 C42,8 36,10 32,14 C32,14 34,18 31,21 C28,24 24,24 21,21 C21,21 16,25 14,30 C14,30 18,32 18,36 C18,40 14,42 10,42 C10,42 8,48 8,53 C8,53 12,55 12,59 C12,63 10,67 14,71 C14,71 16,76 21,78 C21,78 24,76 28,79 C31,82 32,86 32,86 C36,90 42,92 47,92 M50,15 L50,92" stroke="currentColor" strokeWidth="4" />
                  {/* Central Circle & Microchip */}
                  <circle cx="50" cy="53" r="16" fill="white" stroke="currentColor" strokeWidth="4" />
                  <rect x="44" y="47" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="3" />
                  <rect x="48" y="51" width="4" height="4" fill="currentColor" />
                  {/* Right Branching Lines & Nodes */}
                  <path d="M50,37 L68,37 L68,12" stroke="currentColor" strokeWidth="4" />
                  <circle cx="68" cy="12" r="5" fill="white" stroke="currentColor" strokeWidth="4" />
                  <path d="M64,44 L78,32" stroke="currentColor" strokeWidth="4" />
                  <circle cx="78" cy="32" r="5" fill="white" stroke="currentColor" strokeWidth="4" />
                  <path d="M66,53 L86,53" stroke="currentColor" strokeWidth="4" />
                  <circle cx="86" cy="53" r="5" fill="white" stroke="currentColor" strokeWidth="4" />
                  <path d="M64,62 L78,74" stroke="currentColor" strokeWidth="4" />
                  <circle cx="78" cy="74" r="5" fill="white" stroke="currentColor" strokeWidth="4" />
                  <path d="M50,69 L68,69 L68,90" stroke="currentColor" strokeWidth="4" />
                  <circle cx="68" cy="90" r="5" fill="white" stroke="currentColor" strokeWidth="4" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Automação:</span>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">Atualização Automática</h3>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-700">Modo de Operação</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Ativar ou desativar a rotina automática</span>
              </div>
              
              {/* Mode Toggle Switch */}
              <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleToggleAutoUpdate(false)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    !isAutoUpdateActive
                      ? 'bg-red-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Desativado
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAutoUpdate(true)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    isAutoUpdateActive
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Ativado
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-700">Horário Programado</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Executar a rotina diariamente no horário (HH:MM)</span>
              </div>

              {/* Time input field */}
              <div className="relative flex items-center shrink-0">
                <span className="material-symbols-outlined text-slate-400 absolute left-3 pointer-events-none text-base">schedule</span>
                <input
                  type="time"
                  value={autoUpdateTime}
                  onChange={(e) => setAutoUpdateTime(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-800 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-2xs cursor-pointer"
                />
              </div>
            </div>

            {/* Success feedback banner */}
            {showUpdateSuccessBanner && (
              <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-3 flex items-center gap-2.5 text-left text-emerald-800 text-[11px] font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <div>
                  <span className="font-bold block">Status atualizados com sucesso!</span>
                  A rotina automática de limpeza e liberação de dados foi executada.
                </div>
              </div>
            )}

            {/* Explanatory rules */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-[10px] text-slate-600 text-left">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px] mb-1">Rotinas executadas ao Ativar / Programar:</div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-slate-700 shrink-0">1º</span>
                <span>Clientes com &quot;Status de Entrega&quot; igual a <span className="font-bold text-red-600">Liquidado</span> passam para <span className="font-bold text-emerald-600">Disponível</span>.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-slate-700 shrink-0">2º</span>
                <span>Clientes com &quot;Status Durante Contagem&quot; passam para <span className="font-bold text-blue-600">Vazio</span>.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-slate-700 shrink-0">3º</span>
                <span>Transportes com &quot;Tipo de Transporte&quot; igual a <span className="font-bold text-red-600">Fechado</span> passam para <span className="font-bold text-emerald-600">Finalizado</span>.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-slate-700 shrink-0">4º</span>
                <span>Rotas de Contagem com Status &quot;Finalizada&quot; passam para <span className="font-bold text-emerald-600">Disponível</span>.</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: TELEGRAM REPORT ENGINE --- */}
        <div id="quadrante_relatorios_telegram" className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full min-h-[500px]">
          
          <div className="space-y-5">
            
            {/* Quadrant Header */}
            <div className="border-b border-gray-100 pb-3 text-left">
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 select-none drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" fill="#24A1DE" />
                      <path d="M17.5 7.97l-2.61 12.3c-.2.9-.73 1.12-1.48.7L9.36 17.9l-1.95 1.88c-.22.22-.4.4-.82.4l.29-4.13 7.52-6.8c.33-.29-.07-.45-.51-.16L4.62 14.1l-4-1.25c-.87-.27-.89-.87.18-1.3L16.4 5.23c.73-.27 1.37.17 1.1 2.74z" fill="white" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Relatórios via Telegram
                    </h3>
                  </div>
                </div>

                {/* Relatórios via Telegram Enviar Button */}
                <button
                  type="button"
                  onClick={handleSendTelegramReport}
                  disabled={isSendingTelegram || activeChatIds.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold h-9 px-4 rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98 shrink-0"
                >
                  {isSendingTelegram ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px] font-bold">send</span>
                      <span>Enviar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recipients List Header & Add Button */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Lista de Chat IDs Destinatários:
                </label>
              </div>

              {/* Table of Recipients */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[140px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3 w-8 text-center">Flag</th>
                      <th className="py-2 px-2">Usuário</th>
                      <th className="py-2 px-2">Chat ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {telegramEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-center italic text-slate-400">
                          Nenhum funcionário com Chat ID Telegram cadastrado.
                        </td>
                      </tr>
                    ) : (
                      telegramEmployees.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!r.enableTelegram}
                              onChange={() => {
                                updateEmployee({
                                  ...r,
                                  enableTelegram: !r.enableTelegram
                                });
                              }}
                              className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-2 font-bold text-slate-700 truncate max-w-[110px]" title={r.nome}>
                            {r.nome}
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-500 text-[10px]">
                            {r.telegramChatId}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Relatório para Envio Sub-section */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Relatório para Envio:
              </label>

              {/* Table of Reports */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3 w-8 text-center">Flag</th>
                      <th className="py-2 px-2">Nome do Relatório</th>
                      <th className="py-2 px-2">Descrição</th>
                      <th className="py-2 px-3 w-10 text-center">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={report.checked}
                            onChange={() => {
                              setReports(reports.map(item =>
                                item.id === report.id ? { ...item, checked: !item.checked } : item
                              ));
                            }}
                            className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-2 font-bold text-slate-800 leading-tight">
                          {report.name}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 text-[10px] leading-relaxed">
                          {report.description}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              // Open mobile preview modal
                              const updatedReport = { ...report, content: getReportContent(report.id) };
                              setPreviewReportInPhone(updatedReport);
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-all flex items-center justify-center border border-transparent hover:border-slate-200 cursor-pointer"
                            title="Visualizar Mensagem"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Action buttons and Status block */}
          {telegramStatus && (
            <div className="pt-4 border-t border-gray-100 space-y-3 mt-4">
              <div className={`p-3 rounded-xl border text-xs text-left font-bold flex items-start gap-2 animate-in fade-in duration-200 bg-rose-50 text-rose-800 border-rose-200`}>
                <span className="material-symbols-outlined text-[15px] mt-0.5 shrink-0">
                  error
                </span>
                <span className="leading-snug">{telegramStatus.msg}</span>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* PHONE PREVIEW MODAL */}
      {previewReportInPhone && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="flex flex-col items-center space-y-4">
            
            {/* Elegant Mock Smartphone Container */}
            <div className="relative mx-auto border-slate-950 bg-slate-950 border-[12px] rounded-[3rem] h-[580px] w-[310px] shadow-2xl flex flex-col overflow-hidden ring-4 ring-slate-800/50">
              
              {/* Notch / Speaker bar */}
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 flex justify-center items-center z-20">
                <div className="w-24 h-4 bg-black rounded-b-xl flex items-center justify-around px-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="w-8 h-1 bg-slate-800 rounded-full" />
                </div>
              </div>

              {/* Mobile Screen Container */}
              <div className="flex-1 bg-[#17212b] rounded-[2.2rem] overflow-hidden flex flex-col text-slate-200 relative pt-6">
                
                {/* Mock Phone Status Bar */}
                <div className="bg-[#17212b] px-5 py-1 flex justify-between items-center text-[9px] font-bold text-slate-400 select-none">
                  <span>12:15</span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">signal_cellular_alt</span>
                    <span className="material-symbols-outlined text-[10px]">wifi</span>
                    <span className="material-symbols-outlined text-[10px]">battery_5_bar</span>
                  </div>
                </div>

                {/* Telegram App Header Bar */}
                <div className="bg-[#24303f] px-4 py-2.5 border-b border-[#182533] flex items-center gap-2 select-none shadow-sm shrink-0 text-left">
                  <div className="w-7 h-7 rounded-full bg-[#3b82f6] text-white font-extrabold flex items-center justify-center text-xs">
                    M
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-[11px] truncate text-white leading-tight">MOVIX Central Bot</h5>
                    <span className="text-[9px] text-[#53b2f5]">bot</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                  <span className="material-symbols-outlined text-slate-400 text-lg">more_vert</span>
                </div>

                {/* Telegram Chat Message Thread Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col justify-start phone-scrollbar">
                  <style dangerouslySetInnerHTML={{ __html: `
                    .phone-scrollbar::-webkit-scrollbar {
                      width: 5px;
                    }
                    .phone-scrollbar::-webkit-scrollbar-track {
                      background: #17212b;
                    }
                    .phone-scrollbar::-webkit-scrollbar-thumb {
                      background: #24303f;
                      border-radius: 3px;
                    }
                    .phone-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: #3b82f6;
                    }
                  `}} />
                  
                  {/* Speech Bubble */}
                  <div className="max-w-[90%] self-start bg-[#182533] border border-[#202f3e] rounded-2xl rounded-tl-sm p-3 shadow-md relative animate-in slide-in-from-bottom-2 duration-200 w-full">
                    <p className="text-[9px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed break-words text-left">
                      {previewReportInPhone.content}
                    </p>
                    <div className="h-4" /> {/* Spacer to prevent content overlap with timestamp */}
                    <span className="text-[8px] text-slate-400 absolute bottom-1 right-2 select-none">12:15 ✓✓</span>
                  </div>

                </div>

                {/* Mock Chat Input Footer */}
                <div className="bg-[#17212b] p-2 border-t border-[#1a2734] flex items-center gap-2 shrink-0 select-none">
                  <span className="material-symbols-outlined text-slate-400 text-lg">mood</span>
                  <div className="flex-1 bg-[#24303f] rounded-full py-1.5 px-3 text-[10px] text-slate-500 text-left border border-[#1d2d3d]">
                    Mensagem
                  </div>
                  <span className="material-symbols-outlined text-blue-400 text-lg">mic</span>
                </div>

                {/* Android Native Navigation Bar (Replaces Voltar Button) */}
                <div className="bg-[#121212] py-2 px-6 border-t border-slate-900 shrink-0 flex items-center justify-around select-none">
                  {/* Left: Back Button (Triangle pointing left, Blue) */}
                  <button
                    type="button"
                    onClick={() => setPreviewReportInPhone(null)}
                    className="w-12 h-10 flex items-center justify-center transition-all cursor-pointer hover:bg-white/5 rounded-xl active:scale-90"
                    title="Voltar"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#3b82f6]">
                      <path d="M15 5l-7 7 7 7V5z" />
                    </svg>
                  </button>

                  {/* Center: Home Button (Concentric circles, white/light-gray) */}
                  <div className="w-12 h-10 flex items-center justify-center opacity-60" title="Início (Sem Função)">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <circle cx="12" cy="12" r="7" fill="none" stroke="white" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="4.5" fill="white" />
                    </svg>
                  </div>

                  {/* Right: Recents Button (Rounded square, white/light-gray) */}
                  <div className="w-12 h-10 flex items-center justify-center opacity-60" title="Recentes (Sem Função)">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <rect x="5" y="5" width="14" height="14" rx="2.5" />
                    </svg>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* TEMPORARY FLOATING TOAST OVERLAY (3 Seconds) */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 border border-emerald-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md">
            <span className="material-symbols-outlined text-white text-xl animate-bounce">check_circle</span>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider font-black">Notificação</p>
              <p className="text-xs font-semibold mt-0.5">Relatório(s) enviado(s) com sucesso!</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
