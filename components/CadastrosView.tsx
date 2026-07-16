'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../lib/AppContext';
import { BRAZILIAN_STATES, STATE_CITIES } from '../lib/constants';
import { Product, Client, Supplier, Employee, Vehicle } from '../lib/types';

export default function CadastrosView() {
  const {
    activeDistributor,
    activeDistributorName,
    activeCadastroTab,
    setActiveCadastroTab,
    isInventoryLocked,
    userRole,
    
    // Lists from context
    products,
    clients,
    suppliers,
    employees,
    vehicles,
    deliveryRoutes,
    countingRoutes,

    // Actions from context
    addProduct,
    updateProduct,
    deleteProduct,
    addClient,
    addClientsBulk,
    updateClient,
    deleteClient,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addDeliveryRoute,
    updateDeliveryRoute,
    deleteDeliveryRoute,
    addCountingRoute,
    updateCountingRoute,
    deleteCountingRoute
  } = useApp();

  // Search Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFormMode, setClientFormMode] = useState<'none' | 'new' | 'mass'>('none');
  const [prevTab, setPrevTab] = useState(activeCadastroTab);
  if (activeCadastroTab !== prevTab) {
    setPrevTab(activeCadastroTab);
    setSearchTerm('');
  }

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Success / Error Alerts custom states with custom timers of exactly 2s/3s
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CNPJ inline warnings
  const [cnpjWarning, setCnpjWarning] = useState<string | null>(null);

  // Necessity Stock Modal State
  const [isNecessityModalOpen, setIsNecessityModalOpen] = useState(false);
  const [editableProducts, setEditableProducts] = useState<any[]>([]);

  const handleLocalProductChange = (id: string, field: string, value: any) => {
    setEditableProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleSaveNecessities = () => {
    let hasError = false;
    
    // First, validate all values
    for (const ep of editableProducts) {
      const trimmed = (ep.valueR$Str || '').trim();
      if (!/^\d+([.,]\d{2})$/.test(trimmed)) {
        setErrorMsg(`O valor do produto "${ep.description}" deve ser preenchido obrigatoriamente com 2 dígitos após a vírgula (ex: 10,00).`);
        hasError = true;
        break;
      }
    }
    
    if (hasError) return;

    // If validation passes, assign parsed value and save
    for (const ep of editableProducts) {
      const trimmed = (ep.valueR$Str || '').trim();
      const numericValue = parseFloat(trimmed.replace(',', '.'));
      
      const res = updateProduct({
        ...ep,
        valueR$: numericValue
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Erro ao salvar necessidade.');
        hasError = true;
        break;
      }
    }
    if (!hasError) {
      setSuccessMsg('Necessidades atualizadas com sucesso!');
      setIsNecessityModalOpen(false);
    }
  };

  // Auto-fading handlers
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 2000); // 2 seconds exactly
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000); // 3 seconds exactly
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // For city suggestions
  const [activeCitySuggestions, setActiveCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Dynamic theme colors per tab
  const getThemeColors = (tab: string) => {
    switch (tab) {
      case 'clientes':
        return {
          text: 'text-emerald-500', // VERDE VIVO
          icon: 'text-emerald-500', // VERDE VIVO
          border: 'border-emerald-500',
          focusRing: 'focus:ring-emerald-500',
          bg: 'bg-emerald-600 hover:bg-emerald-700',
          badge: 'bg-emerald-50 text-emerald-700',
          editBtn: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
          headerBg: 'bg-emerald-50'
        };
      case 'fornecedores':
        return {
          text: 'text-green-800', // VERDE ESCURO
          icon: 'text-green-800', // VERDE ESCURO
          border: 'border-green-800',
          focusRing: 'focus:ring-green-800',
          bg: 'bg-green-800 hover:bg-green-900', // VERDE ESCURO button background
          badge: 'bg-green-50 text-green-800',
          editBtn: 'bg-green-50 text-green-800 hover:bg-green-100',
          headerBg: 'bg-green-100'
        };
      case 'funcionarios':
        return {
          text: 'text-purple-600', // ROXO
          icon: 'text-purple-600', // ROXO
          border: 'border-purple-600',
          focusRing: 'focus:ring-purple-600',
          bg: 'bg-purple-600 hover:bg-purple-700',
          badge: 'bg-purple-50 text-purple-700',
          editBtn: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
          headerBg: 'bg-purple-50'
        };
      case 'veiculos':
        return {
          text: 'text-red-600', // VERMELHO
          icon: 'text-red-600', // VERMELHO
          border: 'border-red-600',
          focusRing: 'focus:ring-red-600',
          bg: 'bg-red-600 hover:bg-red-700',
          badge: 'bg-red-50 text-red-700',
          editBtn: 'bg-red-50 text-red-700 hover:bg-red-100',
          headerBg: 'bg-red-50'
        };
      case 'rotas_entrega':
        return {
          text: 'text-orange-500', // LARANJA
          icon: 'text-orange-500', // LARANJA
          border: 'border-orange-500',
          focusRing: 'focus:ring-orange-500',
          bg: 'bg-orange-500 hover:bg-orange-600',
          badge: 'bg-orange-50 text-orange-600',
          editBtn: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
          headerBg: 'bg-orange-50'
        };
      case 'rotas_contagem':
        return {
          text: 'text-amber-600', // AMARELO ESCURO
          icon: 'text-amber-600', // AMARELO ESCURO
          border: 'border-amber-600',
          focusRing: 'focus:ring-amber-600',
          bg: 'bg-amber-600 hover:bg-amber-700',
          badge: 'bg-amber-50 text-amber-700',
          editBtn: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
          headerBg: 'bg-amber-50'
        };
      default:
        return {
          text: 'text-blue-600',
          icon: 'text-blue-600',
          border: 'border-blue-500',
          focusRing: 'focus:ring-blue-500',
          bg: 'bg-blue-600 hover:bg-blue-700',
          badge: 'bg-blue-50 text-blue-700',
          editBtn: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
          headerBg: 'bg-blue-50'
        };
    }
  };

  const findStateForCity = (cityName: string): string => {
    for (const [state, cities] of Object.entries(STATE_CITIES)) {
      if (cities.includes(cityName)) {
        return state;
      }
    }
    return 'SP'; // Fallback
  };

  const generateClientTestExcel = () => {
    const data = [];
    
    const firstNames = ['Lucas', 'Mateus', 'Gabriel', 'Felipe', 'Pedro', 'João', 'Ana', 'Maria', 'Juliana', 'Carla', 'Bruna', 'Rodrigo', 'Gustavo', 'Ricardo', 'Renata', 'Amanda'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes'];
    const businessTypes = ['Distribuidora', 'Supermercado', 'Mercearia', 'Comércio de Bebidas', 'Mini Mercado', 'Empório', 'Loja de Conveniência', 'Atacado'];

    for (let i = 1; i <= 40; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const bizType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
      
      const razaoSocial = `${bizType} ${lastName} ${i} Ltda`;
      const cnpj = String(Math.floor(10000000000000 + Math.random() * 90000000000000));
      
      // Select registered routes or fallback if none are in the state
      const dRoute = deliveryRoutes.length > 0
        ? deliveryRoutes[Math.floor(Math.random() * deliveryRoutes.length)]
        : { numeroRota: Math.floor(1 + Math.random() * 6), cidade: 'São Paulo' };
        
      const cRoute = countingRoutes.length > 0
        ? countingRoutes[Math.floor(Math.random() * countingRoutes.length)]
        : { numeroRota: Math.floor(101 + Math.random() * 15) };

      const rEntrega = String(dRoute.numeroRota);
      const rContagem = String(cRoute.numeroRota);
      
      const city = dRoute.cidade || 'São Paulo';
      const state = findStateForCity(city);

      data.push({
        'Razão Social': razaoSocial,
        'CNPJ': cnpj,
        'Nome Responsável': firstName,
        'Sobrenome Responsável': lastName,
        'Contato Responsável': `(${state}) 9${Math.floor(10000000 + Math.random() * 90000000)}`,
        'CEP': String(Math.floor(10000000 + Math.random() * 89999999)),
        'Endereço': `Rua Principal, ${i * 5}`,
        'Número': String(10 + i),
        'Bairro': `Centro`,
        'Estado': state,
        'Cidade': city,
        'Rota de Entrega': rEntrega,
        'Rota de Contagem': rContagem
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes Teste');
    XLSX.writeFile(workbook, 'planilha_teste_clientes.xlsx');
    setSuccessMsg('Planilha de teste com 40 clientes gerada com sucesso utilizando apenas rotas cadastradas!');
  };

  // ==========================================
  // FORM FIELDS STATES (CLEAN - NO PLACEHOLDERS EXAMPLES)
  // ==========================================

  // Product Form
  const [prodCode, setProdCode] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodUnit, setProdUnit] = useState<'UN' | 'CX' | 'PÇ' | ''>('');
  const [prodStock, setProdStock] = useState<number | ''>('');

  // Client Form
  const [cliRazao, setCliRazao] = useState('');
  const [cliCnpj, setCliCnpj] = useState('');
  const [cliNome, setCliNome] = useState('');
  const [cliSobrenome, setCliSobrenome] = useState('');
  const [cliContato, setCliContato] = useState('');
  const [cliEndereco, setCliEndereco] = useState('');
  const [cliNumero, setCliNumero] = useState('');
  const [cliBairro, setCliBairro] = useState('');
  const [cliCep, setCliCep] = useState('');
  const [cliEstado, setCliEstado] = useState('');
  const [cliCidade, setCliCidade] = useState('');
  const [cliRotaEnt, setCliRotaEnt] = useState('');
  const [cliRotaCont, setCliRotaCont] = useState('');

  // Supplier Form
  const [supRazao, setSupRazao] = useState('');
  const [supCnpj, setSupCnpj] = useState('');
  const [supNome, setSupNome] = useState('');
  const [supContato, setSupContato] = useState('');
  const [supEstado, setSupEstado] = useState('');
  const [supCidade, setSupCidade] = useState('');

  // Employee Form
  const [empNome, setEmpNome] = useState('');
  const [empCargo, setEmpCargo] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPerfil, setEmpPerfil] = useState('');
  const [empEnableTelegram, setEmpEnableTelegram] = useState(false);
  const [empTelegramChatId, setEmpTelegramChatId] = useState('');

  // Vehicle Form
  const [vehPlaca, setVehPlaca] = useState('');
  const [vehCarrier, setVehCarrier] = useState('');

  // Delivery Route Form
  const [delRouteNum, setDelRouteNum] = useState<number | ''>('');
  const [delRouteCidade, setDelRouteCidade] = useState('');
  const [delRouteBairro, setDelRouteBairro] = useState('');
  const [delRouteComp, setDelRouteComp] = useState('');
  const [delRouteStatus, setDelRouteStatus] = useState('DISPONÍVEL');

  // Counting Route Form
  const [countRouteNum, setCountRouteNum] = useState<number | ''>('');
  const [countRouteCidade, setCountRouteCidade] = useState('');
  const [countRouteBairro, setCountRouteBairro] = useState('');
  const [countRouteComp, setCountRouteComp] = useState('');
  const [countRouteStatus, setCountRouteStatus] = useState('DISPONÍVEL');

  // Refs for fields that require focus-lock validation e.g. CNPJ
  const clientCnpjRef = useRef<HTMLInputElement>(null);
  const supplierCnpjRef = useRef<HTMLInputElement>(null);

  // Reset all form states
  const clearAllForms = () => {
    setEditingId(null);
    setCnpjWarning(null);

    setProdCode('');
    setProdDesc('');
    setProdUnit('');
    setProdStock('');

    setCliRazao('');
    setCliCnpj('');
    setCliNome('');
    setCliSobrenome('');
    setCliContato('');
    setCliEndereco('');
    setCliNumero('');
    setCliBairro('');
    setCliCep('');
    setCliEstado('');
    setCliCidade('');
    setCliRotaEnt('');
    setCliRotaCont('');

    setSupRazao('');
    setSupCnpj('');
    setSupNome('');
    setSupContato('');
    setSupEstado('');
    setSupCidade('');

    setEmpNome('');
    setEmpCargo('');
    setEmpEmail('');
    setEmpPerfil('');
    setEmpEnableTelegram(false);
    setEmpTelegramChatId('');

    setVehPlaca('');
    setVehCarrier('');

    setDelRouteNum('');
    setDelRouteCidade('');
    setDelRouteBairro('');
    setDelRouteComp('');
    setDelRouteStatus('DISPONÍVEL');

    setCountRouteNum('');
    setCountRouteCidade('');
    setCountRouteBairro('');
    setCountRouteComp('');
    setCountRouteStatus('DISPONÍVEL');
  };

  // Forms state and search terms are cleared via click handlers procedurally to avoid cascading renders

  // Handle City suggestions lookups
  const handleCityInput = (val: string, stateAcronym: string) => {
    if (!stateAcronym) {
      setActiveCitySuggestions([]);
      return;
    }
    const cities = STATE_CITIES[stateAcronym] || [];
    if (!val) {
      setActiveCitySuggestions(cities);
    } else {
      const filtered = cities.filter(c => c.toLowerCase().includes(val.toLowerCase()));
      setActiveCitySuggestions(filtered);
    }
  };

  // CNPJ field formatting / digits only
  const sanitizeDigits = (val: string) => {
    return val.replace(/\D/g, ''); // Digits only
  };

  // CNPJ onBlur Validation Focus-Lock
  const handleCnpjBlur = (val: string, inputRef: React.RefObject<HTMLInputElement | null>) => {
    const cleanValue = sanitizeDigits(val);
    if (cleanValue.length > 0 && cleanValue.length !== 14) {
      setCnpjWarning('Preencher com 14 dígitos');
      
      // Keep focused after message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);

      // Dismiss warning after 3 seconds
      setTimeout(() => {
        setCnpjWarning(null);
      }, 3000);
      return false;
    }
    return true;
  };

  // ==========================================
  // REGISTER SUBMISSION ACTIONS
  // ==========================================

  // PRODUCT SUBMIT
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodCode || !prodDesc || !prodUnit || prodStock === '') {
      setErrorMsg('Os campos Código, Descrição, Unidade e Estoque Inicial são obrigatórios.');
      return;
    }

    if (editingId) {
      const res = updateProduct({
        id: editingId,
        code: prodCode,
        description: prodDesc,
        unit: prodUnit as any,
        initialStock: Number(prodStock)
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar material.');
      }
    } else {
      const res = addProduct({
        code: prodCode,
        description: prodDesc,
        unit: prodUnit as any,
        initialStock: Number(prodStock)
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao realizar o cadastro do material.');
      }
    }
  };

  // CLIENT SUBMIT
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure 14 digits cnpj
    const cleanCnpj = sanitizeDigits(cliCnpj);
    if (!cliRazao || cleanCnpj.length !== 14 || !cliNome || !cliEstado || !cliCidade || !cliRotaEnt) {
      setErrorMsg('Razão Social, CNPJ (14 dígitos), Nome Responsável, Estado, Cidade e Rota de Entrega são obrigatórios.');
      return;
    }

    if (editingId) {
      const targetClient = clients.find(c => c.id === editingId);
      if (!targetClient) return;

      const res = updateClient({
        ...targetClient,
        razaoSocial: cliRazao,
        cnpj: cleanCnpj,
        responsavelNome: cliNome,
        responsavelSobrenome: cliSobrenome,
        responsavelContato: cliContato,
        endereco: cliEndereco,
        numero: cliNumero,
        bairro: cliBairro,
        cep: cliCep,
        estado: cliEstado,
        cidade: cliCidade,
        rotaEntrega: cliRotaEnt,
        rotaContagem: cliRotaCont
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
        setClientFormMode('none');
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar dados do cliente.');
      }
    } else {
      const res = addClient({
        razaoSocial: cliRazao,
        cnpj: cleanCnpj,
        responsavelNome: cliNome,
        responsavelSobrenome: cliSobrenome,
        responsavelContato: cliContato,
        endereco: cliEndereco,
        numero: cliNumero,
        bairro: cliBairro,
        cep: cliCep,
        estado: cliEstado,
        cidade: cliCidade,
        rotaEntrega: cliRotaEnt,
        rotaContagem: cliRotaCont
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
        setClientFormMode('none');
      } else {
        setErrorMsg(res.error || 'Erro ao realizar o cadastro do cliente.');
      }
    }
  };

  // SUPPLIER SUBMIT
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = sanitizeDigits(supCnpj);
    if (!supRazao || cleanCnpj.length !== 14 || !supNome || !supEstado || !supCidade) {
      setErrorMsg('Razão Social, CNPJ (14 dígitos), Responsável, Estado e Cidade são obrigatórios.');
      return;
    }

    if (editingId) {
      const res = updateSupplier({
        id: editingId,
        razaoSocial: supRazao,
        cnpj: cleanCnpj,
        responsavelNome: supNome,
        responsavelContato: supContato,
        estado: supEstado,
        cidade: supCidade
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar os dados do fornecedor.');
      }
    } else {
      const res = addSupplier({
        razaoSocial: supRazao,
        cnpj: cleanCnpj,
        responsavelNome: supNome,
        responsavelContato: supContato,
        estado: supEstado,
        cidade: supCidade
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao cadastrar o fornecedor.');
      }
    }
  };

  // EMPLOYEE SUBMIT
  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empNome || !empCargo || !empEmail || !empPerfil) {
      setErrorMsg('Nome, Cargo, E-mail e Perfil são campos obrigatórios.');
      return;
    }
    if (empEnableTelegram && !empTelegramChatId) {
      setErrorMsg('O Nº Chat ID Telegram é obrigatório quando Habilitar Telegram estiver selecionado.');
      return;
    }

    const companyName = activeDistributorName;

    if (editingId) {
      const res = updateEmployee({
        id: editingId,
        empresa: companyName,
        nome: empNome,
        cargo: empCargo,
        email: empEmail,
        perfilTipo: empPerfil,
        enableTelegram: empEnableTelegram,
        telegramChatId: empEnableTelegram ? empTelegramChatId : ''
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar cadastro do funcionário.');
      }
    } else {
      const res = addEmployee({
        empresa: companyName,
        nome: empNome,
        cargo: empCargo,
        email: empEmail,
        perfilTipo: empPerfil,
        enableTelegram: empEnableTelegram,
        telegramChatId: empEnableTelegram ? empTelegramChatId : ''
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao cadastrar o funcionário.');
      }
    }
  };

  // VEHICLE SUBMIT
  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehPlaca || !vehCarrier) {
      setErrorMsg('A placa do veículo e a transportadora são campos obrigatórios.');
      return;
    }

    if (editingId) {
      const res = updateVehicle({
        id: editingId,
        placa: vehPlaca.toUpperCase(),
        transportadora: vehCarrier
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar dados do veículo.');
      }
    } else {
      const res = addVehicle({
        placa: vehPlaca.toUpperCase(),
        transportadora: vehCarrier
      });
      if (res.success) {
        setSuccessMsg('cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao cadastrar o veículo.');
      }
    }
  };

  // ==========================================
  // EDITIONS TRIGGER
  // ==========================================
  const startEditProduct = (p: Product) => {
    setEditingId(p.id);
    setProdCode(p.code);
    setProdDesc(p.description);
    setProdUnit(p.unit);
    setProdStock(p.initialStock);
  };

  const startEditClient = (c: Client) => {
    setClientFormMode('new');
    setEditingId(c.id);
    setCliRazao(c.razaoSocial);
    setCliCnpj(c.cnpj);
    setCliNome(c.responsavelNome);
    setCliSobrenome(c.responsavelSobrenome);
    setCliContato(c.responsavelContato);
    setCliEndereco(c.endereco);
    setCliNumero(c.numero);
    setCliBairro(c.bairro);
    setCliCep(c.cep);
    setCliEstado(c.estado);
    setCliCidade(c.cidade);
    setCliRotaEnt(c.rotaEntrega);
    setCliRotaCont(c.rotaContagem);
  };

  const startEditSupplier = (s: Supplier) => {
    setEditingId(s.id);
    setSupRazao(s.razaoSocial);
    setSupCnpj(s.cnpj);
    setSupNome(s.responsavelNome);
    setSupContato(s.responsavelContato);
    setSupEstado(s.estado);
    setSupCidade(s.cidade);
  };

  const startEditEmployee = (e: Employee) => {
    setEditingId(e.id);
    setEmpNome(e.nome);
    setEmpCargo(e.cargo);
    setEmpEmail(e.email);
    setEmpPerfil(e.perfilTipo);
    setEmpEnableTelegram(!!e.enableTelegram);
    setEmpTelegramChatId(e.telegramChatId || '');
  };

  const startEditVehicle = (v: Vehicle) => {
    setEditingId(v.id);
    setVehPlaca(v.placa);
    setVehCarrier(v.transportadora);
  };

  // CLIENT BLOCK ACTION
  const toggleBlockClient = (client: Client) => {
    updateClient({
      ...client,
      inativo: !client.inativo
    });
    setSuccessMsg(`Cliente "${client.razaoSocial}" foi ${!client.inativo ? 'BLOQUEADO' : 'ATIVADO'} com sucesso!`);
  };

  // DELIVERY ROUTE SUBMIT
  const handleDeliveryRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (delRouteNum === '' || !delRouteCidade || !delRouteBairro) {
      setErrorMsg('Nº Rota, Cidade e Bairro/Região são campos obrigatórios.');
      return;
    }

    if (editingId) {
      const res = updateDeliveryRoute({
        id: editingId,
        numeroRota: Number(delRouteNum),
        cidade: delRouteCidade,
        bairroRegiao: delRouteBairro,
        complemento: delRouteComp,
        statusRotaEntrega: delRouteStatus || 'DISPONÍVEL'
      });
      if (res.success) {
        setSuccessMsg('Cadastro updated with success!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar dados da rota de entrega.');
      }
    } else {
      const res = addDeliveryRoute({
        numeroRota: Number(delRouteNum),
        cidade: delRouteCidade,
        bairroRegiao: delRouteBairro,
        complemento: delRouteComp,
        statusRotaEntrega: delRouteStatus || 'DISPONÍVEL'
      });
      if (res.success) {
        setSuccessMsg('Cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao cadastrar a rota de entrega.');
      }
    }
  };

  // COUNTING ROUTE SUBMIT
  const handleCountingRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (countRouteNum === '' || !countRouteCidade || !countRouteBairro) {
      setErrorMsg('Nº Rota, Cidade e Bairro/Região são campos obrigatórios.');
      return;
    }

    if (editingId) {
      const res = updateCountingRoute({
        id: editingId,
        numeroRota: Number(countRouteNum),
        cidade: countRouteCidade,
        bairroRegiao: countRouteBairro,
        complemento: countRouteComp,
        statusRotaContagem: countRouteStatus || 'DISPONÍVEL'
      });
      if (res.success) {
        setSuccessMsg('Cadastro updated with success!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar dados da rota de contagem.');
      }
    } else {
      const res = addCountingRoute({
        numeroRota: Number(countRouteNum),
        cidade: countRouteCidade,
        bairroRegiao: countRouteBairro,
        complemento: countRouteComp,
        statusRotaContagem: countRouteStatus || 'DISPONÍVEL'
      });
      if (res.success) {
        setSuccessMsg('Cadastro realizado com sucesso!');
        clearAllForms();
      } else {
        setErrorMsg(res.error || 'Erro ao cadastrar a rota de contagem.');
      }
    }
  };

  const startEditDeliveryRoute = (r: any) => {
    setEditingId(r.id);
    setDelRouteNum(r.numeroRota);
    setDelRouteCidade(r.cidade);
    setDelRouteBairro(r.bairroRegiao);
    setDelRouteComp(r.complemento || '');
    setDelRouteStatus(r.statusRotaEntrega || 'DISPONÍVEL');
  };

  const startEditCountingRoute = (r: any) => {
    setEditingId(r.id);
    setCountRouteNum(r.numeroRota);
    setCountRouteCidade(r.cidade);
    setCountRouteBairro(r.bairroRegiao);
    setCountRouteComp(r.complemento || '');
    setCountRouteStatus(r.statusRotaContagem || 'DISPONÍVEL');
  };

  // Real Excel template downloads
  const handleDownloadTemplate = (type: string) => {
    if (type === 'clientes') {
      const headers = [
        {
          'Razão Social': 'Exemplo Distribuidora de Bebidas Ltda',
          'CNPJ': '12345678000199',
          'Nome Responsável': 'João',
          'Sobrenome Responsável': 'Silva',
          'Contato Responsável': '(11) 98765-4321',
          'CEP': '01001-000',
          'Endereço': 'Praça da Sé',
          'Número': '100',
          'Bairro': 'Sé',
          'Estado': 'SP',
          'Cidade': 'São Paulo',
          'Rota de Entrega': '1',
          'Rota de Contagem': '101'
        }
      ];
      const worksheet = XLSX.utils.json_to_sheet(headers);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo Importação Clientes');
      XLSX.writeFile(workbook, 'modelo_importacao_clientes.xlsx');
      setSuccessMsg('Modelo de importação de clientes baixado com sucesso!');
    } else if (type === 'produtos') {
      const headers = [
        {
          'Código': '1001',
          'Descrição': 'Cerveja Pilsen 350ml',
          'Unidade': 'UN',
          'Estoque Inicial': '500'
        }
      ];
      const worksheet = XLSX.utils.json_to_sheet(headers);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo Importação Produtos');
      XLSX.writeFile(workbook, 'modelo_importacao_produtos.xlsx');
      setSuccessMsg('Modelo de importação de produtos baixado com sucesso!');
    } else if (type === 'fornecedores') {
      const headers = [
        {
          'CNPJ': '12345678000199',
          'Razão Social': 'Exemplo Fornecedor Ltda',
          'Nome Responsável': 'Maria Silva',
          'Contato': '(11) 98765-4321',
          'Estado': 'SP',
          'Cidade': 'São Paulo'
        }
      ];
      const worksheet = XLSX.utils.json_to_sheet(headers);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo Importação Fornecedores');
      XLSX.writeFile(workbook, 'modelo_importacao_fornecedores.xlsx');
      setSuccessMsg('Modelo de importação de fornecedores baixado com sucesso!');
    } else {
      setSuccessMsg(`Modelo para ${type} não disponível.`);
    }
  };

  // Real Excel/CSV file uploader and parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error('Não foi possível ler os dados do arquivo.');
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json<any>(sheet);

        if (parsedData.length === 0) {
          setErrorMsg('A planilha está vazia ou não pôde ser lida.');
          return;
        }

        let importedCount = 0;
        let errorCount = 0;
        let lastError = '';

        if (type === 'clientes') {
          const clientsToImport: Omit<Client, 'id' | 'matricula' | 'saldoLoja' | 'saldoContagem'>[] = [];

          parsedData.forEach((row: any) => {
            const rSocial = row['Razão Social'] || row['razaoSocial'] || row['Razao Social'];
            const cnpjVal = String(row['CNPJ'] || row['cnpj'] || '').replace(/\D/g, '');
            const nResp = row['Nome Responsável'] || row['Nome Responsavel'] || row['responsavelNome'] || row['Nome'] || '';
            const sResp = row['Sobrenome Responsável'] || row['Sobrenome Responsavel'] || row['responsavelSobrenome'] || row['Sobrenome'] || '';
            const cResp = row['Contato Responsável'] || row['Contato Responsavel'] || row['responsavelContato'] || row['Contato'] || '';
            const cepVal = row['CEP'] || row['cep'] || '';
            const endVal = row['Endereço'] || row['Endereco'] || row['endereco'] || '';
            const numVal = String(row['Número'] || row['Numero'] || row['numero'] || '');
            const baiVal = row['Bairro'] || row['bairro'] || '';
            const estVal = row['Estado'] || row['estado'] || '';
            const cidVal = row['Cidade'] || row['cidade'] || '';
            const rEnt = String(row['Rota de Entrega'] || row['Rota de Entrega'] || row['rotaEntrega'] || row['Rota Entrega'] || '');
            const rCont = String(row['Rota de Contagem'] || row['Rota de Contagem'] || row['rotaContagem'] || row['Rota Contagem'] || '');

            if (!rSocial || cnpjVal.length !== 14 || !nResp || !estVal || !cidVal || !rEnt) {
              errorCount++;
              lastError = 'Campos obrigatórios ausentes ou CNPJ inválido em algumas linhas.';
              return;
            }

            clientsToImport.push({
              razaoSocial: rSocial,
              cnpj: cnpjVal,
              responsavelNome: nResp,
              responsavelSobrenome: sResp,
              responsavelContato: cResp,
              cep: cepVal,
              endereco: endVal,
              numero: numVal,
              bairro: baiVal,
              estado: estVal,
              cidade: cidVal,
              rotaEntrega: rEnt,
              rotaContagem: rCont
            });
          });

          if (clientsToImport.length > 0) {
            const bulkRes = addClientsBulk(clientsToImport);
            importedCount = bulkRes.addedCount;
            errorCount += bulkRes.errorCount;
            if (bulkRes.lastError) {
              lastError = bulkRes.lastError;
            }
          }

          if (importedCount > 0) {
            setSuccessMsg(`${importedCount} clientes importados com sucesso!${errorCount > 0 ? ` (${errorCount} erros)` : ''}`);
            setClientFormMode('none');
          } else {
            setErrorMsg(`Nenhum cliente pôde ser importado. Motivo: ${lastError || 'Dados inválidos.'}`);
          }
        } else if (type === 'produtos') {
          parsedData.forEach((row: any) => {
            const code = String(row['Código'] || row['Codigo'] || row['code'] || '');
            const desc = row['Descrição'] || row['Descricao'] || row['description'] || '';
            const unit = (row['Unidade'] || row['unit'] || 'UN').toUpperCase();
            const stock = Number(row['Estoque Inicial'] || row['Estoque Inicial por Contagem'] || row['initialStock'] || 0);

            if (!code || !desc || !['UN', 'CX', 'PÇ'].includes(unit)) {
              errorCount++;
              lastError = 'Código, descrição ou unidade inválidos em algumas linhas.';
              return;
            }

            const result = addProduct({
              code,
              description: desc,
              unit: unit as 'UN' | 'CX' | 'PÇ',
              initialStock: stock
            });

            if (result.success) {
              importedCount++;
            } else {
              errorCount++;
              lastError = result.error || 'Erro ao cadastrar.';
            }
          });

          if (importedCount > 0) {
            setSuccessMsg(`${importedCount} produtos importados com sucesso!${errorCount > 0 ? ` (${errorCount} erros)` : ''}`);
          } else {
            setErrorMsg(`Nenhum produto pôde ser importado. Motivo: ${lastError || 'Dados inválidos.'}`);
          }
        }
      } catch (err: any) {
        setErrorMsg('Falha ao processar arquivo: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  if (isInventoryLocked) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-2xl min-h-[400px] text-center space-y-4 shadow-sm my-12" style={{ fontFamily: 'Calibri, sans-serif' }}>
        <span className="material-symbols-outlined text-red-500 text-6xl font-bold animate-bounce">lock</span>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide">Funções de Cadastro Bloqueadas</h2>
        <p className="text-sm font-semibold text-slate-500 max-w-md leading-relaxed">
          O sistema detectou um documento de inventário com status <span className="text-red-600 font-extrabold uppercase bg-red-50 px-1.5 py-0.5 rounded border border-red-200">aberto</span>.
          Para garantir a integridade e precisão dos saldos durante a contagem de estoque, a criação, edição e exclusão de cadastros estão temporariamente desabilitadas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300" style={{ fontFamily: 'Calibri, sans-serif' }}>
      
      {/* Alert Notices */}
      {/* SUCCESS: (2s) Green Text and Green Border */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-50 text-emerald-800 border-2 border-emerald-550 border-emerald-500 rounded-xl px-6 py-4 flex items-center gap-3.5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
          <div>
            <p className="font-extrabold text-sm uppercase">Cadastro Realizado com Sucesso!</p>
            <p className="text-xs text-emerald-600 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* FAILURE/ERROR: (3s) Red Text and Red Border */}
      {errorMsg && (
        <div className="fixed top-20 right-6 z-50 bg-rose-50 text-rose-800 border-2 border-rose-500 rounded-xl px-6 py-4 flex items-center gap-3.5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-rose-600 text-2xl">error_outline</span>
          <div>
            <p className="font-extrabold text-sm uppercase">Ocorreu um Erro no Registro!</p>
            <p className="text-xs text-rose-600 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation Selector */}
      <div className="sticky -top-6 md:-top-8 z-20 bg-slate-50 -mx-6 md:-mx-8 px-6 md:px-8 py-3 border-b border-gray-200">
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-3xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'clientes' as const, label: 'Clientes', icon: 'groups', color: 'text-emerald-600', activeBg: 'bg-emerald-50 text-emerald-700 font-bold border-emerald-200' },
              { id: 'produtos' as const, label: 'Produtos', icon: 'inventory_2', color: 'text-blue-600', activeBg: 'bg-blue-50 text-blue-700 font-bold border-blue-200' },
              { id: 'fornecedores' as const, label: 'Fornecedores', icon: 'store', color: 'text-green-800', activeBg: 'bg-green-100 text-green-800 font-bold border-green-800' },
              { id: 'funcionarios' as const, label: 'Funcionários', icon: 'badge', color: 'text-purple-600', activeBg: 'bg-purple-50 text-purple-700 font-bold border-purple-200' },
              { id: 'veiculos' as const, label: 'Veículos', icon: 'local_shipping', color: 'text-red-600', activeBg: 'bg-red-50 text-red-700 font-bold border-red-200' },
              { id: 'rotas_entrega' as const, label: 'Rota de Entrega', icon: 'route', color: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 font-bold border-orange-200' },
              { id: 'rotas_contagem' as const, label: 'Rota de Contagem', icon: 'pin_drop', color: 'text-amber-600', activeBg: 'bg-amber-50 text-amber-700 font-bold border-amber-200' }
            ].map(tab => {
              const isActive = activeCadastroTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCadastroTab(tab.id);
                    clearAllForms();
                    setSearchTerm('');
                  }}
                  className={`py-2 px-5 text-xs rounded-xl border flex items-center gap-2.5 transition-all outline-none ${
                    isActive
                      ? tab.activeBg
                      : 'bg-transparent border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${tab.color}`}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Central Interactive Content Grid */}
      {activeCadastroTab !== 'clientes' && (
        <div className={activeCadastroTab === 'produtos' ? "flex flex-col lg:flex-row gap-6 items-stretch" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"}>
        
        {/* LEFT QUADRANT: The Form controls */}
        <div className={activeCadastroTab === 'produtos' ? "w-full lg:w-[28%] flex flex-col space-y-6 h-full" : "lg:col-span-4 flex flex-col space-y-6 h-full"}>
          <div className={`bg-white border border-gray-200 rounded-2xl shadow-xs h-full flex flex-col overflow-hidden ${['veiculos', 'rotas_entrega', 'rotas_contagem'].includes(activeCadastroTab) ? 'justify-start' : 'justify-between'}`}>
            <div className={`${getThemeColors(activeCadastroTab).headerBg} px-6 py-4 border-b border-gray-150 flex items-center space-x-2.5`}>
              <span className={`material-symbols-outlined ${getThemeColors(activeCadastroTab).icon} text-xl font-bold`}>assignment</span>
              <h4 className="text-sm font-black text-slate-800 uppercase">
                {editingId ? 'Editar Cadastro' : 'Novo Cadastro:'} {activeCadastroTab}
              </h4>
            </div>

            <div className="p-6 flex-grow flex flex-col justify-between space-y-4">

          {/* Render forms conditionally */}
          
          {/* 1. PRODUCT FORM */}
          {activeCadastroTab === 'produtos' && (
            <form onSubmit={handleProductSubmit} className="space-y-4 text-[12px]">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Código do Material *</label>
                <input
                  type="text"
                  value={prodCode}
                  onChange={(e) => setProdCode(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-105"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Descrição do Material *</label>
                <input
                  type="text"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-105"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Unidade de Medida *</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value as any)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-105 cursor-pointer text-slate-800"
                    required
                  >
                    <option value="" className="text-[12px]">Selecione Unit...</option>
                    <option value="UN" className="text-[12px]">UN</option>
                    <option value="CX" className="text-[12px]">CX</option>
                    <option value="PÇ" className="text-[12px]">PÇ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Estoque Inicial</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{editingId ? 'Salvar Edição' : 'Concluir Cadastro'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={clearAllForms}
                    className="px-4 h-11 border border-gray-250 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 2. CLIENT FORM */}
          {(activeCadastroTab as string) === 'clientes' && (
            <form onSubmit={handleClientSubmit} className="space-y-4 text-[12px]">
              {/* Row 1: Matricula, CNPJ, Razão Social */}
              <div className="grid grid-cols-12 gap-4">
                {/* Matricula */}
                <div className="col-span-12 md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MATRÍCULA</label>
                  <div className="w-full h-10 px-2 bg-green-50 border border-green-500 rounded-lg text-[12px] font-extrabold flex items-center text-green-600">
                    {editingId ? clients.find(c => c.id === editingId)?.matricula : String(clients.length + 1).padStart(4, '0')}
                  </div>
                </div>

                {/* CNPJ */}
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">CNPJ (14 números) *</label>
                  <input
                    ref={clientCnpjRef}
                    type="text"
                    value={cliCnpj}
                    onChange={(e) => setCliCnpj(sanitizeDigits(e.target.value))}
                    onBlur={() => handleCnpjBlur(cliCnpj, clientCnpjRef)}
                    maxLength={14}
                    placeholder="Somente números"
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  {cnpjWarning && (
                    <p className="text-[12px] font-bold text-rose-600 animate-pulse">{cnpjWarning}</p>
                  )}
                </div>

                {/* Razão Social */}
                <div className="col-span-12 md:col-span-7 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Razão Social *</label>
                  <input
                    type="text"
                    value={cliRazao}
                    onChange={(e) => setCliRazao(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Nome, Sobrenome, Contato */}
              <div className="grid grid-cols-12 gap-4">
                {/* Nome Responsável */}
                <div className="col-span-12 md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nome Responsável *</label>
                  <input
                    type="text"
                    value={cliNome}
                    onChange={(e) => setCliNome(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                    required
                  />
                </div>

                {/* Sobrenome */}
                <div className="col-span-12 md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sobrenome</label>
                  <input
                    type="text"
                    value={cliSobrenome}
                    onChange={(e) => setCliSobrenome(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Contato */}
                <div className="col-span-12 md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Contato</label>
                  <input
                    type="text"
                    value={cliContato}
                    onChange={(e) => setCliContato(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Endereço (82%), Numero (18%) */}
              <div className="grid grid-cols-12 gap-4">
                {/* Endereço */}
                <div className="col-span-12 md:col-span-10 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Endereço</label>
                  <input
                    type="text"
                    value={cliEndereco}
                    onChange={(e) => setCliEndereco(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Numero */}
                <div className="col-span-12 md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Número</label>
                  <input
                    type="text"
                    value={cliNumero}
                    onChange={(e) => setCliNumero(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Bairro (35%), CEP (22%), Cidade (28%), Estado (15%) */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                {/* Bairro */}
                <div className="md:w-[35%] w-full space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Bairro</label>
                  <input
                    type="text"
                    value={cliBairro}
                    onChange={(e) => setCliBairro(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                  />
                </div>

                {/* CEP */}
                <div className="md:w-[22%] w-full space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">CEP</label>
                  <input
                    type="text"
                    value={cliCep}
                    onChange={(e) => setCliCep(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Cidade with suggestions dropdown */}
                <div className="md:w-[28%] w-full space-y-1 relative">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cidade</label>
                  <input
                    type="text"
                    value={cliCidade}
                    onChange={(e) => {
                      setCliCidade(e.target.value);
                      handleCityInput(e.target.value, cliEstado);
                      setShowCitySuggestions(true);
                    }}
                    onFocus={() => {
                      handleCityInput(cliCidade, cliEstado);
                      setShowCitySuggestions(true);
                    }}
                    placeholder="Digite..."
                    required
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                  />
                  {showCitySuggestions && activeCitySuggestions.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCitySuggestions(false)} />
                      <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 divide-y divide-gray-100">
                        {activeCitySuggestions.map((cit, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCliCidade(cit);
                              setShowCitySuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                          >
                            {cit}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Estado */}
                <div className="md:w-[15%] w-full space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Estado</label>
                  <select
                    value={cliEstado}
                    onChange={(e) => {
                      setCliEstado(e.target.value);
                      handleCityInput('', e.target.value);
                    }}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white cursor-pointer text-slate-800"
                    required
                  >
                    <option value="" className="text-[12px]">UF...</option>
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st} value={st} className="text-[12px]">{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Rota de Entrega, Rota de Contagem, Botão Concluir Cadastro */}
              <div className="flex flex-col md:flex-row gap-4 w-full items-end pt-2">
                {/* Rota de Entrega */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Rota de Entrega *</label>
                  <select
                    value={cliRotaEnt}
                    onChange={(e) => setCliRotaEnt(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white text-slate-800 cursor-pointer"
                    required
                  >
                    <option value="" className="text-[12px]">Selecione a Rota de Entrega...</option>
                    {(deliveryRoutes || []).map((r) => (
                      <option key={r.id} value={r.numeroRota} className="text-[12px]">
                        Rota {r.numeroRota} - {r.cidade} ({r.bairroRegiao})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rota de Contagem */}
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Rota de Contagem *</label>
                  <select
                    value={cliRotaCont}
                    onChange={(e) => setCliRotaCont(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white text-slate-800 cursor-pointer"
                    required
                  >
                    <option value="" className="text-[12px]">Selecione a Rota de Contagem...</option>
                    {(countingRoutes || []).map((r) => (
                      <option key={r.id} value={r.numeroRota} className="text-[12px]">
                        Rota {r.numeroRota} - {r.cidade} ({r.bairroRegiao})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botões de Ação na mesma linha */}
                <div className="flex-1 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{editingId ? 'Salvar Edição' : 'Concluir Cadastro'}</span>
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={clearAllForms}
                      className="px-4 h-10 border border-gray-250 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* 3. SUPPLIER FORM */}
          {activeCadastroTab === 'fornecedores' && (
            <form onSubmit={handleSupplierSubmit} className="space-y-4 text-[12px]">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">CNPJ (14 números) *</label>
                  <input
                    ref={supplierCnpjRef}
                    type="text"
                    value={supCnpj}
                    onChange={(e) => setSupCnpj(sanitizeDigits(e.target.value))}
                    onBlur={() => handleCnpjBlur(supCnpj, supplierCnpjRef)}
                    maxLength={14}
                    placeholder="Apenas números"
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white"
                    required
                  />
                  {cnpjWarning && (
                    <p className="text-[12px] font-bold text-rose-600 animate-pulse">{cnpjWarning}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Razão Social *</label>
                  <input
                    type="text"
                    value={supRazao}
                    onChange={(e) => setSupRazao(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nome Responsável *</label>
                  <input
                    type="text"
                    value={supNome}
                    onChange={(e) => setSupNome(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Contato</label>
                  <input
                    type="text"
                    value={supContato}
                    onChange={(e) => setSupContato(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Estado</label>
                  <select
                    value={supEstado}
                    onChange={(e) => {
                      setSupEstado(e.target.value);
                      handleCityInput('', e.target.value);
                    }}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white cursor-pointer text-slate-800"
                    required
                  >
                    <option value="" className="text-[12px]">UF...</option>
                    {BRAZILIAN_STATES.map(st => (
                      <option key={st} value={st} className="text-[12px]">{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cidade</label>
                  <input
                    type="text"
                    value={supCidade}
                    onChange={(e) => {
                      setSupCidade(e.target.value);
                      handleCityInput(e.target.value, supEstado);
                      setShowCitySuggestions(true);
                    }}
                    onFocus={() => {
                      handleCityInput(supCidade, supEstado);
                      setShowCitySuggestions(true);
                    }}
                    placeholder="Digite..."
                    required
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                  />
                  {showCitySuggestions && activeCitySuggestions.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCitySuggestions(false)} />
                      <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 divide-y divide-gray-100">
                        {activeCitySuggestions.map((cit, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSupCidade(cit);
                              setShowCitySuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                          >
                            {cit}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 bg-green-800 hover:bg-green-900 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{editingId ? 'Salvar Edição' : 'Concluir Cadastro'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={clearAllForms}
                    className="px-4 h-11 border border-gray-250 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 4. EMPLOYEE FORM */}
          {activeCadastroTab === 'funcionarios' && (
            <form onSubmit={handleEmployeeSubmit} className="space-y-4 text-[12px]">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Empresa do Funcionário (Automático)</label>
                <div className="w-full h-10 px-3 bg-gray-100 border border-gray-200 rounded-lg text-[12px] font-extrabold flex items-center text-slate-500">
                  {activeDistributorName}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nome do Funcionário *</label>
                <input
                  type="text"
                  value={empNome}
                  onChange={(e) => setEmpNome(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cargo *</label>
                <input
                  type="text"
                  value={empCargo}
                  onChange={(e) => setEmpCargo(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">E-mail corporativo *</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Tipo de Perfil *</label>
                  <select
                    value={empPerfil}
                    onChange={(e) => setEmpPerfil(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white cursor-pointer text-slate-800"
                    required
                  >
                    <option value="" className="text-[12px]">Selecione Perfil...</option>
                    <option value="TI Admin" className="text-[12px]">TI Admin</option>
                    <option value="Gerencial" className="text-[12px]">Gerencial</option>
                    <option value="Administrativo" className="text-[12px]">Administrativo</option>
                    <option value="Logístico" className="text-[12px]">Logístico</option>
                    <option value="Entregador" className="text-[12px]">Entregador</option>
                    <option value="Conferencia" className="text-[12px]">Conferencia</option>
                    <option value="Comercial" className="text-[12px]">Comercial</option>
                  </select>
                </div>
              </div>

              {/* Telegram ID configuration block */}
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                <div className="flex items-center gap-2 select-none h-10 shrink-0">
                  <input
                    type="checkbox"
                    id="empEnableTelegram"
                    checked={empEnableTelegram}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEmpEnableTelegram(checked);
                      if (!checked) {
                        setEmpTelegramChatId('');
                      }
                    }}
                    className="w-4 h-4 rounded-md border-gray-350 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="empEnableTelegram" className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider cursor-pointer">
                    Habilitar Telegram
                  </label>
                </div>

                <div className="flex-1 space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-widest block transition-colors ${empEnableTelegram ? 'text-gray-600' : 'text-gray-300'}`}>
                    Nº Chat ID Telegram {empEnableTelegram && '*'}
                  </label>
                  <input
                    type="text"
                    value={empTelegramChatId}
                    onChange={(e) => setEmpTelegramChatId(e.target.value)}
                    disabled={!empEnableTelegram}
                    placeholder={empEnableTelegram ? "Ex: 123456789" : "Selecione à esquerda para liberar"}
                    className={`w-full h-10 px-3 border rounded-lg text-[12px] font-semibold transition-all focus:bg-white ${
                      empEnableTelegram 
                        ? 'bg-white border-gray-300 text-slate-800 focus:border-purple-500' 
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed select-none'
                    }`}
                    required={empEnableTelegram}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{editingId ? 'Salvar Edição' : 'Concluir Cadastro'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={clearAllForms}
                    className="px-4 h-11 border border-gray-250 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 5. VEHICLE FORM */}
          {activeCadastroTab === 'veiculos' && (
            <form onSubmit={handleVehicleSubmit} className="space-y-4 text-[12px]">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Placa do Veículo *</label>
                <input
                  type="text"
                  value={vehPlaca}
                  onChange={(e) => setVehPlaca(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold uppercase focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Transportadora *</label>
                <input
                  type="text"
                  value={vehCarrier}
                  onChange={(e) => setVehCarrier(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                  required
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{editingId ? 'Salvar Edição' : 'Concluir Cadastro'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={clearAllForms}
                    className="px-4 h-11 border border-gray-250 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 6. DELIVERY ROUTE FORM */}
          {activeCadastroTab === 'rotas_entrega' && (
            <form onSubmit={handleDeliveryRouteSubmit} className="space-y-4 text-[12px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nº Rota de Entrega *</label>
                  <input
                    type="number"
                    value={delRouteNum}
                    onChange={(e) => setDelRouteNum(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cidade da Rota *</label>
                  <input
                    type="text"
                    value={delRouteCidade}
                    onChange={(e) => setDelRouteCidade(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Bairro ou Região de Atendimento *</label>
                <input
                  type="text"
                  value={delRouteBairro}
                  onChange={(e) => setDelRouteBairro(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Complemento / Observações</label>
                <input
                  type="text"
                  value={delRouteComp}
                  onChange={(e) => setDelRouteComp(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status Rota de Entrega</label>
                <select
                  value={delRouteStatus}
                  onChange={(e) => setDelRouteStatus(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white"
                >
                  <option value="DISPONÍVEL">DISPONÍVEL</option>
                  <option value="INDISPONÍVEL">INDISPONÍVEL</option>
                  <option value="EM ROTA">EM ROTA</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{editingId ? 'Salvar Edição' : 'Concluir Cadastro'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={clearAllForms}
                    className="px-4 h-11 border border-gray-250 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 7. COUNTING ROUTE FORM */}
          {activeCadastroTab === 'rotas_contagem' && (
            <form onSubmit={handleCountingRouteSubmit} className="space-y-4 text-[12px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nº Rota de Contagem *</label>
                  <input
                    type="number"
                    value={countRouteNum}
                    onChange={(e) => setCountRouteNum(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cidade da Rota *</label>
                  <input
                    type="text"
                    value={countRouteCidade}
                    onChange={(e) => setCountRouteCidade(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Bairro ou Região de Atendimento *</label>
                <input
                  type="text"
                  value={countRouteBairro}
                  onChange={(e) => setCountRouteBairro(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Complemento / Observações</label>
                <input
                  type="text"
                  value={countRouteComp}
                  onChange={(e) => setCountRouteComp(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status Rota de Contagem</label>
                <select
                  value={countRouteStatus}
                  onChange={(e) => setCountRouteStatus(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white"
                >
                  <option value="DISPONÍVEL">DISPONÍVEL</option>
                  <option value="INDISPONÍVEL">INDISPONÍVEL</option>
                  <option value="EM ROTA">EM ROTA</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{editingId ? 'Salvar Edição' : 'Concluir Cadastro'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={clearAllForms}
                    className="px-4 h-11 border border-gray-250 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

            </div>
          </div>

        </div>

        {/* If products tab, render its specific middle and right columns */}
        {activeCadastroTab === 'produtos' ? (
          <>
            {/* MIDDLE COLUMN for Products (Cadastro em Massa + Estoque Necessidade) */}
            <div className="w-full lg:w-[32%] flex flex-col space-y-6 h-full">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col justify-between h-full min-h-[380px] overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-gray-150 flex items-center space-x-2.5">
                  <span className={`material-symbols-outlined ${getThemeColors('produtos').icon} text-xl font-bold`}>upload_file</span>
                  <h4 className="text-sm font-black text-slate-800 uppercase">
                    Cadastro em Massa
                  </h4>
                </div>
                
                <div className="p-6 flex-grow flex flex-col justify-between h-full">
                  <div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Carregue registros múltiplos instantaneamente de forma segura. Baixe a planilha padrão correspondente e envie abaixo.
                    </p>
                  </div>

                  <div className="flex flex-row items-stretch gap-4 flex-grow justify-center mt-2">
                    {/* Box Upload - reduced by 50% width (w-1/2) */}
                    <div className="w-1/2 border-2 border-dashed border-gray-250 bg-gray-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-gray-400 text-3xl mb-1.5">cloud_upload</span>
                      <p className="text-[10px] font-bold text-slate-700 leading-tight">Importar Planilha (CSV / XLSX)</p>
                      <p className="text-[8px] text-gray-400 mt-1 leading-tight">Solte o arquivo ou clique</p>
                      
                      <input
                        type="file"
                        id="batch-file-picker-prod"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'produtos')}
                        accept=".xlsx, .xls, .csv"
                      />
                      
                      <label
                        htmlFor="batch-file-picker-prod"
                        className="mt-2.5 px-2 py-1 border font-bold text-[8px] rounded-lg tracking-wide uppercase cursor-pointer transition-colors border-blue-200 hover:bg-blue-100/40 text-blue-700"
                      >
                        Selecionar
                      </label>
                    </div>

                    {/* Download link mockup - w-1/2 width, styled light-blue background, renamed Planilha_Modelo */}
                    <div className="w-1/2 p-4 bg-[#e0f2fe] rounded-xl flex flex-col items-center justify-center text-center border border-sky-200 gap-2">
                      <span 
                        className="material-symbols-outlined text-blue-600 hover:text-blue-800 cursor-pointer text-3xl font-extrabold select-none transition-all hover:scale-110"
                        onClick={() => handleDownloadTemplate('produtos')}
                        title="Baixar Modelo"
                      >
                        download
                      </span>
                      <span className="text-[10px] font-bold text-blue-800 tracking-wide uppercase">Planilha_Modelo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ESTOQUE NECESSIDADE BUTTON below Cadastro em Massa */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="material-symbols-outlined text-blue-900 text-xl font-bold">warehouse</span>
                    <h4 className="text-sm font-black text-slate-800 uppercase">Estoque Necessidade</h4>
                  </div>
                  
                  <button
                    type="button"
                    id="btn-atualizar-necessidade"
                    onClick={() => {
                      setEditableProducts(products.map(p => ({
                        ...p,
                        necessityQty: p.necessityQty !== undefined ? p.necessityQty : 0,
                        valueR$: p.valueR$ !== undefined ? p.valueR$ : 0,
                        valueR$Str: p.valueR$ !== undefined ? p.valueR$.toFixed(2).replace('.', ',') : '0,00'
                      })));
                      setIsNecessityModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    <span>Atualizar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN for Products (Relatório de Produtos Cadastrados) */}
            <div className="w-full lg:w-[40%] bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between h-full min-h-[460px] overflow-hidden">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="bg-blue-50 px-6 py-4 border-b border-gray-150 flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="material-symbols-outlined text-blue-600">list_alt</span>
                      <h4 className="text-sm font-black text-slate-800 uppercase">
                        Relatório de Produtos Cadastrados
                      </h4>
                    </div>
                    <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      {products.length} registros
                    </span>
                  </div>

                  <div className="px-6">
                    {/* Search bar specifically for products */}
                    <div className="relative w-full mb-4">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                      <input
                        type="text"
                        placeholder="Pesquisar por descrição ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 h-8 bg-gray-50 border border-gray-200 rounded-lg text-[10px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="overflow-x-auto min-h-[160px] overflow-y-auto max-h-[380px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                            <th className="py-2.5 px-3">Código</th>
                            <th className="py-2.5 px-3">Descrição do Material</th>
                            <th className="py-2.5 px-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {products.filter(p => p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-6 text-center text-gray-400 italic">Nenhum produto cadastrado.</td>
                            </tr>
                          ) : (
                            products.filter(p => p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-1 px-3 font-bold text-slate-800">{p.code}</td>
                                <td className="py-1 px-3 font-semibold text-slate-700">{p.description}</td>
                                <td className="py-1 px-3 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    onClick={() => startEditProduct(p)}
                                    className="p-1 px-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold uppercase text-[10px]"
                                    title="Editar"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                  </button>
                                  <button
                                    onClick={() => deleteProduct(p.id)}
                                    className="p-1 px-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px]"
                                    title="Excluir"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 mx-6 mb-6">
                  <span className="text-[9px] bg-slate-200/60 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Sincronizado p/ {activeDistributorName}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
             {/* RIGHT QUADRANT: Upload em Massa for Clients OR Registered Report for others */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs lg:col-span-8 flex flex-col min-h-[460px] h-full overflow-hidden">
              
              {/* A. CLIENTS: SHOW BATCH UPLOAD */}
              {(activeCadastroTab as string) === 'clientes' && (
                <div className="flex flex-col h-full flex-grow">
                  <div className={`${getThemeColors('clientes').headerBg} px-6 py-4 border-b border-gray-150 flex items-center space-x-2.5 mb-4`}>
                    <span className={`material-symbols-outlined ${getThemeColors(activeCadastroTab).icon} text-xl font-bold`}>upload_file</span>
                    <h4 className="text-sm font-black text-slate-800 uppercase">
                      Cadastro em Massa
                    </h4>
                  </div>

                  <div className="px-6 pb-6 flex flex-col justify-between h-full flex-grow">
                    <div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        Carregue registros múltiplos instantaneamente de forma segura. Baixe a planilha padrão correspondente e envie abaixo.
                      </p>
                    </div>

                    <div className="space-y-4 flex-grow flex flex-col justify-center">
                      {/* Box Upload */}
                      <div className="border-2 border-dashed border-gray-250 bg-gray-50/50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">cloud_upload</span>
                        <p className="text-xs font-bold text-slate-700">Importar Planilha (CSV / XLSX)</p>
                        <p className="text-[10px] text-gray-400 mt-1">Solte seu arquivo ou clique para selecionar</p>
                        
                        <input
                          type="file"
                          id="batch-file-picker"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, activeCadastroTab)}
                          accept=".xlsx, .xls, .csv"
                        />
                        
                        <label
                          htmlFor="batch-file-picker"
                          className="mt-4 px-4 py-2 border font-bold text-[10px] rounded-lg tracking-wide uppercase cursor-pointer transition-colors border-emerald-200 hover:bg-emerald-100/40 text-emerald-700"
                        >
                          Selecionar Arquivo
                        </label>
                      </div>

                      {/* Download link mockup */}
                      <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <span 
                            className="material-symbols-outlined text-emerald-600 hover:text-emerald-850 cursor-pointer text-xl font-extrabold select-none transition-all hover:scale-110"
                            onClick={() => handleDownloadTemplate('clientes')}
                            title="Baixar Modelo"
                            style={{ fontSize: '24px' }}
                          >
                            download
                          </span>
                          <span className="text-xs font-semibold text-slate-700">modelo_importacao_clientes.xlsx</span>
                        </div>
                      </div>

                      {/* Test Data spreadsheet for clients */}
                      <div className="p-3 bg-emerald-50/50 rounded-xl flex items-center justify-between border border-emerald-100/80">
                        <div className="flex items-center space-x-2.5">
                          <span 
                            className="material-symbols-outlined text-emerald-600 hover:text-emerald-850 cursor-pointer text-xl font-extrabold select-none transition-all hover:scale-110"
                            onClick={generateClientTestExcel}
                            title="Baixar"
                            style={{ fontSize: '24px' }}
                          >
                            download
                          </span>
                          <span className="text-xs font-semibold text-slate-700 font-bold">planilha_teste_clientes.xlsx</span>
                        </div>
                        <div className="flex items-center space-x-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={generateClientTestExcel}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded flex items-center justify-center transition-all"
                            title="Atualizar"
                          >
                            <span className="material-symbols-outlined text-[16px] font-bold">refresh</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* B. FORNECEDORES: REGISTERED RECORDS REPORT */}
              {activeCadastroTab === 'fornecedores' && (
                <div className="flex flex-col h-full flex-grow justify-between">
                  <div>
                    <div className={`${getThemeColors('fornecedores').headerBg} px-6 py-4 border-b border-gray-150 flex items-center justify-between mb-4`}>
                      <div className="flex items-center space-x-2.5">
                        <span className="material-symbols-outlined text-green-800">store</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase">Relatório de Fornecedores Cadastrados</h4>
                      </div>
                      <span className="text-xs bg-green-800 text-white font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {suppliers.length} registros
                      </span>
                    </div>
                    
                    <div className="px-6">
                      <div className="overflow-y-auto max-h-[380px] pr-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-455 font-bold uppercase">
                              <th className="py-2 px-1">Fornecedor</th>
                              <th className="py-2 px-1 font-mono">CNPJ</th>
                              <th className="py-2 px-1">CIDADE / ESTADO</th>
                              <th className="py-2 px-1 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {suppliers.filter(s => s.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) || s.cnpj.includes(searchTerm)).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-gray-400 italic">Nenhum fornecedor cadastrado.</td>
                              </tr>
                            ) : (
                              suppliers.filter(s => s.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) || s.cnpj.includes(searchTerm)).map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-1 px-1">
                                    <p className="text-[10px] font-bold text-slate-800">{s.razaoSocial}</p>
                                  </td>
                                  <td className="py-1 px-1 font-mono text-[10px] font-bold text-gray-500">{s.cnpj}</td>
                                  <td className="py-1 px-1">
                                    <p className="text-[10px] font-bold text-slate-800">{s.cidade}/{s.estado}</p>
                                  </td>
                                  <td className="py-1 px-1 text-right space-x-1 whitespace-nowrap">
                                    <button
                                      onClick={() => startEditSupplier(s)}
                                      className="p-1 px-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold uppercase text-[10px]"
                                      title="Editar"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                    </button>
                                    <button
                                      onClick={() => deleteSupplier(s.id)}
                                      className="p-1 px-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px]"
                                      title="Excluir"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 pb-3 border-t border-gray-100 mx-6 flex items-center justify-between">
                    <span className="text-[9px] bg-slate-200/60 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Sincronizado p/ {activeDistributorName}
                    </span>
                  </div>
                </div>
              )}

              {/* C. FUNCIONARIOS: REGISTERED RECORDS REPORT */}
              {activeCadastroTab === 'funcionarios' && (
                <div className="flex flex-col h-full flex-grow justify-between">
                  <div>
                    <div className={`${getThemeColors('funcionarios').headerBg} px-6 py-4 border-b border-gray-150 flex items-center justify-between mb-4`}>
                      <div className="flex items-center space-x-2.5">
                        <span className="material-symbols-outlined text-purple-600">badge</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase">Relatório de Funcionários</h4>
                      </div>
                      <span className="text-xs bg-purple-600 text-white font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {employees.length} registros
                      </span>
                    </div>

                    <div className="px-6">
                      <div className="overflow-y-auto max-h-[380px] pr-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-455 font-bold uppercase">
                              <th className="py-2 px-1">Nome</th>
                              <th className="py-2 px-1">Empresa</th>
                              <th className="py-2 px-1">Cargo</th>
                              <th className="py-2 px-1">Perfil</th>
                              <th className="py-2 px-1">Email</th>
                              <th className="py-2 px-1 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {(() => {
                              const filtered = employees.filter(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase()));
                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={6} className="py-6 text-center text-gray-400 italic">Nenhum funcionário cadastrado.</td>
                                  </tr>
                                );
                              }
                              // Sort so "TI Admin" comes first
                              const sorted = [...filtered].sort((a, b) => {
                                const isA = a.perfilTipo === 'TI Admin';
                                const isB = b.perfilTipo === 'TI Admin';
                                if (isA && !isB) return -1;
                                if (!isA && isB) return 1;
                                return 0;
                              });
                              return sorted.map((e) => {
                                const isTiAdmin = e.perfilTipo === 'TI Admin';
                                return (
                                  <tr key={e.id} className={`hover:bg-slate-50/50 transition-colors text-[10px] font-bold ${isTiAdmin ? 'text-purple-700 bg-purple-50/20' : ''}`}>
                                    <td className={`py-1 px-1 ${isTiAdmin ? 'text-purple-700 font-extrabold' : 'text-slate-800'}`}>{e.nome}</td>
                                    <td className={`py-1 px-1 uppercase font-extrabold ${isTiAdmin ? 'text-purple-700' : 'text-slate-650'}`}>{e.empresa || activeDistributorName}</td>
                                    <td className="py-1 px-1">
                                      <p className={`text-[10px] font-bold ${isTiAdmin ? 'text-purple-700' : 'text-slate-500'}`}>{e.cargo}</p>
                                    </td>
                                    <td className="py-1 px-1">
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-extrabold uppercase tracking-wider ${isTiAdmin ? 'bg-purple-100 border-purple-200 text-purple-800' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                        {e.perfilTipo || 'N/A'}
                                      </span>
                                    </td>
                                    <td className={`py-1 px-1 font-mono ${isTiAdmin ? 'text-purple-700' : 'text-gray-500'}`}>{e.email}</td>
                                    <td className="py-1 px-1 text-right space-x-1 whitespace-nowrap">
                                      {userRole !== 'Administrativo' ? (
                                        <>
                                          <button
                                            onClick={() => startEditEmployee(e)}
                                            className="p-1 px-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold uppercase text-[10px]"
                                            title="Editar"
                                          >
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                          </button>
                                          <button
                                            onClick={() => deleteEmployee(e.id)}
                                            className="p-1 px-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px]"
                                            title="Excluir"
                                          >
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-gray-400 text-[10px] italic">Sem permissão</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mx-6 mb-6">
                    <span className="text-[9px] bg-slate-200/60 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Sincronizado p/ {activeDistributorName}
                    </span>
                  </div>
                </div>
              )}

              {/* D. VEICULOS: REGISTERED RECORDS REPORT */}
              {activeCadastroTab === 'veiculos' && (
                <div className="flex flex-col h-full flex-grow justify-between">
                  <div>
                    <div className={`${getThemeColors('veiculos').headerBg} px-6 py-4 border-b border-gray-150 flex items-center justify-between mb-4`}>
                      <div className="flex items-center space-x-2.5">
                        <span className="material-symbols-outlined text-rose-600">local_shipping</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase">Relatório de Veículos</h4>
                      </div>
                      <span className="text-xs bg-rose-700 text-white font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {vehicles.length} registros
                      </span>
                    </div>

                    <div className="px-6">
                      <div className="overflow-y-auto max-h-[380px] pr-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-455 font-bold uppercase">
                              <th className="py-2.5 px-1">Placa</th>
                              <th className="py-2.5 px-1">Transportadora</th>
                              <th className="py-2.5 px-1 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {vehicles.filter(v => v.placa.toLowerCase().includes(searchTerm.toLowerCase()) || v.transportadora.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                              <tr>
                                <td colSpan={3} className="py-6 text-center text-gray-400 italic">Nenhum veículo cadastrado.</td>
                              </tr>
                            ) : (
                              vehicles.filter(v => v.placa.toLowerCase().includes(searchTerm.toLowerCase()) || v.transportadora.toLowerCase().includes(searchTerm.toLowerCase())).map((v) => (
                                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-1.5 px-1 font-extrabold text-rose-700 tracking-wider uppercase">{v.placa}</td>
                                  <td className="py-1.5 px-1 font-semibold text-slate-800">{v.transportadora}</td>
                                  <td className="py-1.5 px-1 text-right space-x-1 whitespace-nowrap">
                                    <button
                                      onClick={() => startEditVehicle(v)}
                                      className="p-1 px-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold uppercase text-[10px]"
                                      title="Editar"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                    </button>
                                    <button
                                      onClick={() => deleteVehicle(v.id)}
                                      className="p-1 px-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px]"
                                      title="Excluir"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mx-6 mb-6">
                    <span className="text-[9px] bg-slate-200/60 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Sincronizado p/ {activeDistributorName}
                    </span>
                  </div>
                </div>
              )}

              {/* E. ROTAS_ENTREGA: REGISTERED RECORDS REPORT */}
              {activeCadastroTab === 'rotas_entrega' && (
                <div className="flex flex-col h-full flex-grow justify-between">
                  <div>
                    <div className={`${getThemeColors('rotas_entrega').headerBg} px-6 py-4 border-b border-gray-150 flex items-center justify-between mb-4`}>
                      <div className="flex items-center space-x-2.5">
                        <span className="material-symbols-outlined text-orange-500">route</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase">Rotas de Entrega</h4>
                      </div>
                      <span className="text-xs bg-orange-600 text-white font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {(deliveryRoutes || []).length} registros
                      </span>
                    </div>

                    <div className="px-6">
                      <div className="overflow-y-auto max-h-[380px] pr-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-455 font-bold uppercase">
                              <th className="py-2.5 px-1">Rota</th>
                              <th className="py-2.5 px-1">Cidade</th>
                              <th className="py-2.5 px-1">Região</th>
                              <th className="py-2.5 px-1">Status Rota de Entrega</th>
                              <th className="py-2.5 px-1">Obs</th>
                              <th className="py-2.5 px-1 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {(deliveryRoutes || []).filter(r => r.cidade.toLowerCase().includes(searchTerm.toLowerCase()) || r.bairroRegiao.toLowerCase().includes(searchTerm.toLowerCase()) || String(r.numeroRota).includes(searchTerm)).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-gray-400 italic">Nenhuma rota cadastrada.</td>
                              </tr>
                            ) : (
                              (deliveryRoutes || []).filter(r => r.cidade.toLowerCase().includes(searchTerm.toLowerCase()) || r.bairroRegiao.toLowerCase().includes(searchTerm.toLowerCase()) || String(r.numeroRota).includes(searchTerm)).map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors text-[10px] text-black">
                                  <td className="py-1.5 px-1 font-extrabold text-orange-500 tracking-wider"># {r.numeroRota}</td>
                                  <td className="py-1.5 px-1 font-semibold text-black uppercase">{r.cidade}</td>
                                  <td className="py-1.5 px-1 text-black font-semibold uppercase">{r.bairroRegiao}</td>
                                  <td className="py-1.5 px-1 font-bold text-black uppercase">{r.statusRotaEntrega || 'DISPONÍVEL'}</td>
                                  <td className="py-1.5 px-1 text-black truncate max-w-[80px]">{r.complemento || '-'}</td>
                                  <td className="py-1.5 px-1 text-right space-x-1 whitespace-nowrap">
                                    <button
                                      onClick={() => startEditDeliveryRoute(r)}
                                      className="p-1 px-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold uppercase text-[10px]"
                                      title="Editar"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                    </button>
                                    <button
                                      onClick={() => deleteDeliveryRoute(r.id)}
                                      className="p-1 px-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px]"
                                      title="Excluir"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mx-6 mb-6">
                    <span className="text-[9px] bg-slate-200/60 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Sincronizado p/ {activeDistributorName}
                    </span>
                  </div>
                </div>
              )}

              {/* F. ROTAS_CONTAGEM: REGISTERED RECORDS REPORT */}
              {activeCadastroTab === 'rotas_contagem' && (
                <div className="flex flex-col h-full flex-grow justify-between">
                  <div>
                    <div className={`${getThemeColors('rotas_contagem').headerBg} px-6 py-4 border-b border-gray-150 flex items-center justify-between mb-4`}>
                      <div className="flex items-center space-x-2.5">
                        <span className="material-symbols-outlined text-orange-500">pin_drop</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase">Rotas de Contagem</h4>
                      </div>
                      <span className="text-xs bg-amber-600 text-white font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {(countingRoutes || []).length} registros
                      </span>
                    </div>

                    <div className="px-6">
                      <div className="overflow-y-auto max-h-[380px] pr-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-455 font-bold uppercase">
                              <th className="py-2.5 px-1">Rota</th>
                              <th className="py-2.5 px-1">Cidade</th>
                              <th className="py-2.5 px-1">Região</th>
                              <th className="py-2.5 px-1">Status Rota de Contagem</th>
                              <th className="py-2.5 px-1">Obs</th>
                              <th className="py-2.5 px-1 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {(countingRoutes || []).filter(r => r.cidade.toLowerCase().includes(searchTerm.toLowerCase()) || r.bairroRegiao.toLowerCase().includes(searchTerm.toLowerCase()) || String(r.numeroRota).includes(searchTerm)).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-gray-400 italic">Nenhuma rota cadastrada.</td>
                              </tr>
                            ) : (
                              (countingRoutes || []).filter(r => r.cidade.toLowerCase().includes(searchTerm.toLowerCase()) || r.bairroRegiao.toLowerCase().includes(searchTerm.toLowerCase()) || String(r.numeroRota).includes(searchTerm)).map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors text-[10px] text-black">
                                  <td className="py-1.5 px-1 font-extrabold text-orange-500 tracking-wider"># {r.numeroRota}</td>
                                  <td className="py-1.5 px-1 font-semibold text-black uppercase">{r.cidade}</td>
                                  <td className="py-1.5 px-1 text-black font-semibold uppercase">{r.bairroRegiao}</td>
                                  <td className="py-1.5 px-1 font-bold text-black uppercase">{r.statusRotaContagem || 'DISPONÍVEL'}</td>
                                  <td className="py-1.5 px-1 text-black truncate max-w-[80px]">{r.complemento || '-'}</td>
                                  <td className="py-1.5 px-1 text-right space-x-1 whitespace-nowrap">
                                    <button
                                      onClick={() => startEditCountingRoute(r)}
                                      className="p-1 px-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold uppercase text-[10px]"
                                      title="Editar"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                    </button>
                                    <button
                                      onClick={() => deleteCountingRoute(r.id)}
                                      className="p-1 px-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px]"
                                      title="Excluir"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mx-6 mb-6">
                    <span className="text-[9px] bg-slate-200/60 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Sincronizado p/ {activeDistributorName}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>
      )}



      {/* LOWER QUADRANT: Dynamic Report Tables of Registered details */}
      {activeCadastroTab === 'clientes' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-4">
          <div className="flex items-center space-x-2.5">
            <span className="material-symbols-outlined text-emerald-600">list_alt</span>
            <h4 className="text-sm font-black text-slate-800 uppercase">
              Relatório de {activeCadastroTab} Cadastrados
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setClientFormMode(prev => prev === 'new' ? 'none' : 'new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 shadow-3xs ${
                clientFormMode === 'new'
                  ? 'bg-emerald-700 text-white border border-emerald-800 scale-95 font-extrabold'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-xs'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">add_circle</span>
              Novo Cadastro
            </button>
            <button
              type="button"
              onClick={() => setClientFormMode(prev => prev === 'mass' ? 'none' : 'mass')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 shadow-3xs ${
                clientFormMode === 'mass'
                  ? 'bg-emerald-700 text-white border border-emerald-800 scale-95 font-extrabold'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-xs'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
              Cadastro em Massa
            </button>
            <span className="text-xs bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider ml-1">
              {clients.length} registros
            </span>
          </div>
        </div>

        {/* Overlay Novo Cadastro Form Modal */}
        {clientFormMode === 'new' && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            {/* Click backdrop to close */}
            <div 
              className="absolute inset-0" 
              onClick={() => {
                clearAllForms();
                setClientFormMode('none');
              }} 
            />
            
            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden z-10">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-50/20">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 font-black">assignment</span>
                  <h4 className="text-sm font-black text-slate-850 uppercase tracking-wider">
                    {editingId ? 'Editar Cadastro de Cliente' : 'Novo Cadastro de Cliente'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearAllForms();
                    setClientFormMode('none');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl font-bold">close</span>
                </button>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto space-y-4">
                <form onSubmit={handleClientSubmit} className="space-y-4 text-[12px]">
                  {/* Row 1: Matricula, CNPJ, Razão Social */}
                  <div className="grid grid-cols-12 gap-4">
                    {/* Matricula */}
                    <div className="col-span-12 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MATRÍCULA</label>
                      <div className="w-full h-10 px-2 bg-green-50 border border-green-500 rounded-lg text-[12px] font-extrabold flex items-center text-green-600">
                        {editingId ? clients.find(c => c.id === editingId)?.matricula : String(clients.length + 1).padStart(4, '0')}
                      </div>
                    </div>

                    {/* CNPJ */}
                    <div className="col-span-12 md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">CNPJ (14 números) *</label>
                      <input
                        ref={clientCnpjRef}
                        type="text"
                        value={cliCnpj}
                        onChange={(e) => setCliCnpj(sanitizeDigits(e.target.value))}
                        onBlur={() => handleCnpjBlur(cliCnpj, clientCnpjRef)}
                        maxLength={14}
                        placeholder="Somente números"
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                      {cnpjWarning && (
                        <p className="text-[12px] font-bold text-rose-600 animate-pulse">{cnpjWarning}</p>
                      )}
                    </div>

                    {/* Razão Social */}
                    <div className="col-span-12 md:col-span-7 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Razão Social *</label>
                      <input
                        type="text"
                        value={cliRazao}
                        onChange={(e) => setCliRazao(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Nome, Sobrenome, Contato */}
                  <div className="grid grid-cols-12 gap-4">
                    {/* Nome Responsável */}
                    <div className="col-span-12 md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nome Responsável *</label>
                      <input
                        type="text"
                        value={cliNome}
                        onChange={(e) => setCliNome(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white"
                        required
                      />
                    </div>

                    {/* Sobrenome */}
                    <div className="col-span-12 md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sobrenome</label>
                      <input
                        type="text"
                        value={cliSobrenome}
                        onChange={(e) => setCliSobrenome(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Contato */}
                    <div className="col-span-12 md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Contato</label>
                      <input
                        type="text"
                        value={cliContato}
                        onChange={(e) => setCliContato(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 3: Endereço (82%), Numero (18%) */}
                  <div className="grid grid-cols-12 gap-4">
                    {/* Endereço */}
                    <div className="col-span-12 md:col-span-10 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Endereço</label>
                      <input
                        type="text"
                        value={cliEndereco}
                        onChange={(e) => setCliEndereco(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Numero */}
                    <div className="col-span-12 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Número</label>
                      <input
                        type="text"
                        value={cliNumero}
                        onChange={(e) => setCliNumero(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 4: Bairro (35%), CEP (22%), Cidade (28%), Estado (15%) */}
                  <div className="flex flex-col md:flex-row gap-4 w-full">
                    {/* Bairro */}
                    <div className="md:w-[35%] w-full space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Bairro</label>
                      <input
                        type="text"
                        value={cliBairro}
                        onChange={(e) => setCliBairro(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* CEP */}
                    <div className="md:w-[22%] w-full space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">CEP</label>
                      <input
                        type="text"
                        value={cliCep}
                        onChange={(e) => setCliCep(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Cidade with suggestions dropdown */}
                    <div className="md:w-[28%] w-full space-y-1 relative">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cidade</label>
                      <input
                        type="text"
                        value={cliCidade}
                        onChange={(e) => {
                          setCliCidade(e.target.value);
                          handleCityInput(e.target.value, cliEstado);
                          setShowCitySuggestions(true);
                        }}
                        onFocus={() => {
                          handleCityInput(cliCidade, cliEstado);
                          setShowCitySuggestions(true);
                        }}
                        placeholder="Digite..."
                        required
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-semibold focus:bg-white focus:outline-none"
                      />
                      {showCitySuggestions && activeCitySuggestions.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowCitySuggestions(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 divide-y divide-gray-100">
                            {activeCitySuggestions.map((cit, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setCliCidade(cit);
                                  setShowCitySuggestions(false);
                                }}
                                className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                              >
                                {cit}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Estado */}
                    <div className="md:w-[15%] w-full space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Estado</label>
                      <select
                        value={cliEstado}
                        onChange={(e) => {
                          setCliEstado(e.target.value);
                          handleCityInput('', e.target.value);
                        }}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white cursor-pointer text-slate-800"
                        required
                      >
                        <option value="" className="text-[12px]">UF...</option>
                        {BRAZILIAN_STATES.map(st => (
                          <option key={st} value={st} className="text-[12px]">{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Rota de Entrega, Rota de Contagem, Botão Concluir Cadastro */}
                  <div className="flex flex-col md:flex-row gap-4 w-full items-end pt-2">
                    {/* Rota de Entrega */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Rota de Entrega *</label>
                      <select
                        value={cliRotaEnt}
                        onChange={(e) => setCliRotaEnt(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white text-slate-800 cursor-pointer"
                        required
                      >
                        <option value="" className="text-[12px]">Selecione a Rota de Entrega...</option>
                        {(deliveryRoutes || []).map((r) => (
                          <option key={r.id} value={r.numeroRota} className="text-[12px]">
                            Rota {r.numeroRota} - {r.cidade} ({r.bairroRegiao})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rota de Contagem */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Rota de Contagem *</label>
                      <select
                        value={cliRotaCont}
                        onChange={(e) => setCliRotaCont(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[12px] font-bold focus:bg-white text-slate-800 cursor-pointer"
                        required
                      >
                        <option value="" className="text-[12px]">Selecione a Rota de Contagem...</option>
                        {(countingRoutes || []).map((r) => (
                          <option key={r.id} value={r.numeroRota} className="text-[12px]">
                            Rota {r.numeroRota} - {r.cidade} ({r.bairroRegiao})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex-1 flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>{editingId ? 'Salvar Edição' : 'Concluir Cadastro'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          clearAllForms();
                          setClientFormMode('none');
                        }}
                        className="px-4 h-10 border border-gray-250 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap cursor-pointer text-slate-700"
                      >
                        {editingId ? 'Cancelar' : 'Fechar'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Overlay Cadastro em Massa Upload Modal */}
        {clientFormMode === 'mass' && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            {/* Click backdrop to close */}
            <div 
              className="absolute inset-0" 
              onClick={() => setClientFormMode('none')} 
            />
            
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden z-10">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-50/20">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 font-black">upload_file</span>
                  <h4 className="text-sm font-black text-slate-850 uppercase tracking-wider">
                    Cadastro de Clientes em Massa
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setClientFormMode('none')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl font-bold">close</span>
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Carregue registros múltiplos instantaneamente de forma segura. Baixe a planilha padrão correspondente e envie abaixo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Box Upload */}
                  <div className="border-2 border-dashed border-gray-250 bg-gray-50/50 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-emerald-300 hover:bg-emerald-50/10 transition-all duration-200">
                    <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">cloud_upload</span>
                    <p className="text-xs font-bold text-slate-700">Importar Planilha (CSV / XLSX)</p>
                    <p className="text-[10px] text-gray-400 mt-1">Solte seu arquivo ou clique para selecionar</p>
                    
                    <input
                      type="file"
                      id="batch-file-picker-inline"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, activeCadastroTab)}
                      accept=".xlsx, .xls, .csv"
                    />
                    
                    <label
                      htmlFor="batch-file-picker-inline"
                      className="mt-4 px-4 py-2 border font-bold text-[10px] rounded-lg tracking-wide uppercase cursor-pointer transition-colors border-emerald-200 hover:bg-emerald-100/40 text-emerald-700"
                    >
                      Selecionar Arquivo
                    </label>
                  </div>

                  {/* Download and templates column */}
                  <div className="flex flex-col justify-center space-y-4">
                    {/* Download link mockup */}
                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 hover:border-emerald-200 transition-all">
                      <div className="flex items-center space-x-2.5">
                        <span 
                          className="material-symbols-outlined text-emerald-600 hover:text-emerald-850 cursor-pointer text-xl font-extrabold select-none transition-all hover:scale-110"
                          onClick={() => handleDownloadTemplate('clientes')}
                          title="Baixar Modelo"
                          style={{ fontSize: '24px' }}
                        >
                          download
                        </span>
                        <span className="text-xs font-semibold text-slate-750">modelo_importacao_clientes.xlsx</span>
                      </div>
                    </div>

                    {/* Test Data spreadsheet for clients */}
                    <div className="p-3 bg-emerald-50/50 rounded-xl flex items-center justify-between border border-emerald-100/80 hover:border-emerald-300 transition-all">
                      <div className="flex items-center space-x-2.5">
                        <span 
                          className="material-symbols-outlined text-emerald-600 hover:text-emerald-850 cursor-pointer text-xl font-extrabold select-none transition-all hover:scale-110"
                          onClick={generateClientTestExcel}
                          title="Baixar"
                          style={{ fontSize: '24px' }}
                        >
                          download
                        </span>
                        <span className="text-xs font-semibold text-slate-700 font-bold">planilha_teste_clientes.xlsx</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={generateClientTestExcel}
                          className="p-1 text-emerald-700 hover:bg-emerald-100 rounded flex items-center justify-center transition-all"
                          title="Atualizar"
                        >
                          <span className="material-symbols-outlined text-[16px] font-bold">refresh</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic tables conditional view */}
        <div className="overflow-x-auto min-h-[160px]">

          {/* 2. CLIENTS TABLE */}
          {activeCadastroTab === 'clientes' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                  <th className="py-2.5 px-3">Matrícula</th>
                  <th className="py-2.5 px-3">Razão Social</th>
                  <th className="py-2.5 px-3">CNPJ</th>
                  <th className="py-2.5 px-3">Saldos (Loja/Cont./Transp.)</th>
                  <th className="py-2.5 px-3 text-[10px] leading-tight font-bold uppercase">
                    Status<br/>de<br/>Entrega
                  </th>
                  <th className="py-2.5 px-3 text-[10px] leading-tight font-bold uppercase">
                    Status<br/>Durante<br/>Contagem
                  </th>
                  <th className="py-2.5 px-3 text-[10px] leading-tight font-bold uppercase">
                    Status<br/>Final<br/>Contagem
                  </th>
                  <th className="py-2.5 px-3 text-[10px] leading-tight font-bold uppercase">
                    Rota de<br/>Entrega
                  </th>
                  <th className="py-2.5 px-3 text-[10px] leading-tight font-bold uppercase">
                    Rota de<br/>Contagem
                  </th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.filter(c => c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm)).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-gray-400 italic">Nenhum cliente cadastrado.</td>
                  </tr>
                ) : (
                  clients.filter(c => c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm)).map((c) => (
                    <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${c.inativo ? 'text-red-600 font-semibold bg-red-50/30' : 'text-slate-750'}`}>
                      <td className={`py-1.5 px-3 font-extrabold ${c.inativo ? 'text-red-600' : 'text-emerald-700'}`}>{c.matricula}</td>
                      <td className={`py-1.5 px-3 font-semibold whitespace-nowrap ${c.inativo ? 'text-red-600' : 'text-slate-800'}`}>{c.razaoSocial}</td>
                      <td className={`py-1.5 px-3 tracking-wider font-mono ${c.inativo ? 'text-red-500' : 'text-gray-500'}`}>{c.cnpj}</td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <div className="flex gap-1.5 text-[9px] font-bold">
                          <span className={`px-1.5 py-0.5 rounded ${
                            c.saldoLoja > 0 
                              ? 'bg-green-100 text-green-700 font-black border border-green-300' 
                              : (c.inativo ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')
                          }`}>L: {c.saldoLoja}</span>
                          <span className={`px-1.5 py-0.5 rounded ${c.inativo ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>C: {c.saldoContagem}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-[10px] leading-tight font-semibold text-slate-700">
                        {c.statusEntrega || 'Vazio'}
                      </td>
                      <td className="py-1.5 px-3 text-[10px] leading-tight font-semibold text-slate-700">
                        {c.statusDuranteContagem || 'Vazio'}
                      </td>
                      <td className="py-1.5 px-3 text-[10px] leading-tight font-semibold text-slate-700">
                        {c.statusFinalContagem || 'Vazio'}
                      </td>
                      <td className="py-1.5 px-3 text-[10px] leading-tight font-semibold text-slate-700">
                        {c.rotaEntrega ? `Rota ${c.rotaEntrega}` : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-[10px] leading-tight font-semibold text-slate-700">
                        {c.rotaContagem ? `Rota ${c.rotaContagem}` : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right space-x-1 whitespace-nowrap">
                        {/* Block/Unblock Padlock Button */}
                        <button
                          type="button"
                          onClick={() => toggleBlockClient(c)}
                          className={`p-1 px-1.5 rounded font-bold uppercase text-[10px] inline-flex items-center justify-center transition-all ${
                            c.inativo
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title={c.inativo ? 'Ativar Cliente' : 'Bloquear Cliente'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {c.inativo ? 'lock' : 'lock_open'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditClient(c)}
                          className="p-1 px-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold uppercase text-[10px] inline-flex items-center justify-center transition-all"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteClient(c.id)}
                          className="p-1 px-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px] inline-flex items-center justify-center transition-all"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
      )}

      {/* 9. ATUALIZAR NECESSIDADE MODAL */}
      {isNecessityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-blue-50">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-blue-900 text-2xl font-bold">warehouse</span>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Atualizar Necessidade: Estoque em Armazém
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-semibold">
                    Insira a quantidade necessária e o valor unitário de cada produto.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNecessityModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body: Scrollable Table */}
            <div className="p-6 overflow-y-auto flex-1 text-[10px]">
              {editableProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 italic">
                  Nenhum produto cadastrado para atualizar.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-blue-50 border-b border-blue-100 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Código do Material</th>
                        <th className="py-3 px-4">Descrição</th>
                        <th className="py-3 px-4 text-center">Unidade de Medida</th>
                        <th className="py-3 px-4 w-44">Quantidade de Necessidade</th>
                        <th className="py-3 px-4 w-44">Valor R$</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {editableProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors text-slate-750">
                          <td className="py-2 px-4 font-mono font-bold text-gray-700">{p.code}</td>
                          <td className="py-2 px-4 font-semibold text-slate-800">{p.description}</td>
                          <td className="py-2 px-4 text-center">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md font-bold text-[9px] uppercase">
                              {p.unit}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="number"
                              min={0}
                              value={p.necessityQty === 0 && p.necessityQty !== undefined ? '' : p.necessityQty}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                handleLocalProductChange(p.id, 'necessityQty', val);
                              }}
                              className="w-full h-9 px-3 bg-gray-50 border border-gray-250 rounded-lg text-[11px] font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">R$</span>
                              <input
                                type="text"
                                value={p.valueR$Str !== undefined ? p.valueR$Str : ''}
                                placeholder="0,00"
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                                  handleLocalProductChange(p.id, 'valueR$Str', val);
                                }}
                                className="w-full h-9 pl-8 pr-3 bg-gray-50 border border-gray-250 rounded-lg text-[11px] font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-150 flex items-center justify-end gap-3 bg-gray-50">
              <button
                type="button"
                id="btn-necessity-back"
                onClick={() => setIsNecessityModalOpen(false)}
                className="px-5 h-11 border border-gray-250 bg-white hover:bg-gray-50 rounded-xl text-[11px] font-bold uppercase text-gray-600 transition-all active:scale-95 flex items-center gap-2 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Voltar</span>
              </button>
              
              <button
                type="button"
                id="btn-necessity-save"
                onClick={handleSaveNecessities}
                className="px-6 h-11 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-[11px] font-bold uppercase transition-all active:scale-95 flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Salvar</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
