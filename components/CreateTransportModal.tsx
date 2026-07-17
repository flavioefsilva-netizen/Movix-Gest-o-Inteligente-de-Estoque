'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../lib/AppContext';
import { Transport, Vehicle, Employee, DeliveryRoute, Client } from '../lib/types';

function generateUniqueId() {
  return 'active_trp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

function getFormattedCurrentDate() {
  return new Date().toLocaleDateString('pt-BR');
}

export default function CreateTransportModal() {
  const {
    activeTransports,
    transports,
    vehicles,
    employees,
    deliveryRoutes,
    clients,
    products,
    addActiveTransport,
    setSelectedAction,
    updateClient,
    incrementProductStocks,
    addMovementLog,
    updateActiveTransport,
    activeDistributor,
    activeDistributorName,
    getLoggedInUserName,
    updateDeliveryRoute,
    isInventoryLocked,
    setActiveView
  } = useApp();

  const sortedDeliveryRoutes = [...deliveryRoutes]
    .filter(r => r.statusRotaEntrega?.toUpperCase() !== 'ROTEIRIZADA')
    .sort((a, b) => Number(a.numeroRota) - Number(b.numeroRota));

  // Next index sequence calculations
  const nextIndex = (activeTransports?.length || 0) + (transports?.length || 0) + 1;
  const transportNumber = `TRP-${String(nextIndex).padStart(6, '0')}`;

  // Vehicle (Placa) state and suggest
  const [placaInput, setPlacaInput] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleSuggest, setShowVehicleSuggest] = useState(false);
  const [placaError, setPlacaError] = useState('');
  const vehicleRef = useRef<HTMLDivElement>(null);

  // Driver (Motorista) state and suggest
  const [driverInput, setDriverInput] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Employee | null>(null);
  const [showDriverSuggest, setShowDriverSuggest] = useState(false);
  const [driverError, setDriverError] = useState('');
  const driverRef = useRef<HTMLDivElement>(null);

  // Route (Rota Entrega) state and suggest
  const [routeInput, setRouteInput] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);
  const [showRouteSuggest, setShowRouteSuggest] = useState(false);
  const [routeError, setRouteError] = useState('');
  const routeRef = useRef<HTMLDivElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateAnotherConfirm, setShowCreateAnotherConfirm] = useState(false);

  // Custom states for date and client searching
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [clientSearchField, setClientSearchField] = useState<'matricula' | 'razaoSocial' | 'cnpj' | 'rotaEntrega'>('matricula');
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const resetForm = () => {
    setPlacaInput('');
    setSelectedVehicle(null);
    setPlacaError('');
    setDriverInput('');
    setSelectedDriver(null);
    setDriverError('');
    setRouteInput('');
    setSelectedRoute(null);
    setRouteError('');
    setTransportMode('rota');
    setSelectedClientIds({});
    setSelectedMultiRouteIds([]);
    setDraftMultiRouteIds([]);
    setIsAbrirMultiRotasChecked(false);
    setProductQuantities({});
    setShowRoutesReport(false);
    setSuccessMessage(null);
    setShowCreateAnotherConfirm(false);
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setClientSearchField('matricula');
    setClientSearchQuery('');
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (vehicleRef.current && !vehicleRef.current.contains(event.target as Node)) {
        setShowVehicleSuggest(false);
        // Validate plaque on blur
        if (placaInput.trim() !== '') {
          const match = vehicles.find(v => v.placa.toUpperCase() === placaInput.toUpperCase());
          if (!match) {
            setPlacaError('Placa não cadastrada em veículos!');
            setSelectedVehicle(null);
          } else {
            setPlacaError('');
            setSelectedVehicle(match);
          }
        }
      }
      if (driverRef.current && !driverRef.current.contains(event.target as Node)) {
        setShowDriverSuggest(false);
        // Validate driver on blur
        if (driverInput.trim() !== '') {
          const match = employees.find(
            e =>
              e.nome.toLowerCase() === driverInput.toLowerCase() &&
              (e.perfilTipo?.toLowerCase() === 'motorista' || e.perfilTipo?.toLowerCase() === 'entregador' || e.cargo?.toLowerCase() === 'motorista' || e.cargo?.toLowerCase() === 'entregador')
          );
          if (!match) {
            setDriverError('Motorista não cadastrado!');
            setSelectedDriver(null);
          } else {
            setDriverError('');
            setSelectedDriver(match);
          }
        }
      }
      if (routeRef.current && !routeRef.current.contains(event.target as Node)) {
        setShowRouteSuggest(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [vehicles, employees, placaInput, driverInput]);

  // Toggle states
  const [transportMode, setTransportMode] = useState<'rota' | 'multirota' | 'forarota'>('rota');

  const [showExcluirTransportesModal, setShowExcluirTransportesModal] = useState(false);
  const [selectedTransportIdsForDeletion, setSelectedTransportIdsForDeletion] = useState<string[]>([]);
  const [showDeletionConfirmDialog, setShowDeletionConfirmDialog] = useState(false);
  const [isAbrirMultiRotasChecked, setIsAbrirMultiRotasChecked] = useState(false);
  const [selectedMultiRouteIds, setSelectedMultiRouteIds] = useState<string[]>([]);
  const [draftMultiRouteIds, setDraftMultiRouteIds] = useState<string[]>([]);
  const [openedFromCheckbox, setOpenedFromCheckbox] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<{ [clientId: string]: boolean }>({});
  const [showMultiRouteModal, setShowMultiRouteModal] = useState(false);

  // States for REATIVAR ROTAS modal
  const [showReativarRotasModal, setShowReativarRotasModal] = useState(false);
  const [selectedReactivarRouteIds, setSelectedReactivarRouteIds] = useState<string[]>([]);
  const [showReactivarConfirmDialog, setShowReactivarConfirmDialog] = useState(false);

  const handleModeChange = (mode: 'rota' | 'multirota' | 'forarota') => {
    setTransportMode(mode);
    setRouteError('');
    setSelectedClientIds({});
    if (mode === 'rota') {
      setIsAbrirMultiRotasChecked(false);
      setSelectedMultiRouteIds([]);
    } else if (mode === 'multirota') {
      setIsAbrirMultiRotasChecked(true);
      setSelectedRoute(null);
      setRouteInput('');
      setOpenedFromCheckbox(false);
      setDraftMultiRouteIds([...selectedMultiRouteIds]);
      setShowMultiRouteModal(true);
    } else if (mode === 'forarota') {
      setIsAbrirMultiRotasChecked(false);
      setSelectedRoute(null);
      setRouteInput('');
      setSelectedMultiRouteIds([]);
    }
  };

  const handleToggleAbrirMultiRotas = (checked: boolean) => {
    setIsAbrirMultiRotasChecked(checked);
    if (checked) {
      setTransportMode('multirota');
      setRouteError('');
      setSelectedClientIds({});
      setSelectedRoute(null);
      setRouteInput('');
      setOpenedFromCheckbox(true);
      setDraftMultiRouteIds([...selectedMultiRouteIds]);
      setShowMultiRouteModal(true);
    } else {
      setTransportMode('rota');
      setRouteError('');
      setSelectedClientIds({});
      setSelectedMultiRouteIds([]);
    }
  };

  // Sub-reports toggles
  const [showRoutesReport, setShowRoutesReport] = useState(false);

  // Quantities for products ("Quantidade Saída")
  const [productQuantities, setProductQuantities] = useState<{ [productId: string]: string }>({});

  // Handle Multi route selections
  const toggleMultiRouteId = (routeId: string) => {
    setSelectedClientIds({});
    if (selectedMultiRouteIds.includes(routeId)) {
      setSelectedMultiRouteIds(prev => prev.filter(id => id !== routeId));
    } else {
      setSelectedMultiRouteIds(prev => [...prev, routeId]);
    }
  };

  // Filter clients based on selected mode
  const baseActiveClients = clients.filter(c => {
    // Check if client belongs to a route that has status ROTEIRIZADA
    const clientRoute = deliveryRoutes.find(r => String(r.numeroRota) === String(c.rotaEntrega));
    if (clientRoute && clientRoute.statusRotaEntrega?.toUpperCase() === 'ROTEIRIZADA') {
      return false;
    }
    if (transportMode === 'forarota') {
      return true; // show all clients when Fora Rota (except ROTEIRIZADA ones)
    }
    if (transportMode === 'multirota') {
      const activeRoutesStr: string[] = [];
      selectedMultiRouteIds.forEach(id => {
        const match = deliveryRoutes.find(r => r.id === id);
        if (match) activeRoutesStr.push(String(match.numeroRota));
      });
      return activeRoutesStr.includes(String(c.rotaEntrega));
    }
    // 'rota' mode
    if (selectedRoute) {
      return String(selectedRoute.numeroRota) === String(c.rotaEntrega);
    }
    return false;
  });

  const activeClients = baseActiveClients.filter(c => {
    if (!clientSearchQuery) return true;
    const query = clientSearchQuery.toLowerCase();
    if (clientSearchField === 'matricula') {
      return (c.matricula || '').toLowerCase().includes(query);
    }
    if (clientSearchField === 'razaoSocial') {
      return (c.razaoSocial || '').toLowerCase().includes(query);
    }
    if (clientSearchField === 'cnpj') {
      return (c.cnpj || '').toLowerCase().includes(query);
    }
    if (clientSearchField === 'rotaEntrega') {
      return (c.rotaEntrega || '').toLowerCase().includes(query);
    }
    return true;
  });

  // Totals of clients selected
  const selectedClients = activeClients.filter(c => selectedClientIds[c.id]);
  const selectedClientsCount = selectedClients.length;

  const handleSelectAllClients = (checked: boolean) => {
    const nextSelected: { [clientId: string]: boolean } = {};
    if (checked) {
      activeClients.forEach(c => {
        nextSelected[c.id] = true;
      });
    }
    setSelectedClientIds(nextSelected);
  };

  const handleClientCheckChange = (clientId: string, checked: boolean) => {
    setSelectedClientIds(prev => ({
      ...prev,
      [clientId]: checked
    }));
  };

  // Reabilitar rotas button (opens REATIVAR ROTAS modal)
  const handleReabilitarRotas = () => {
    setSelectedReactivarRouteIds([]);
    setShowReativarRotasModal(true);
  };

  const handleReativarClick = () => {
    if (selectedReactivarRouteIds.length === 0) {
      alert('Por favor, selecione ao menos uma rota para reativar.');
      return;
    }
    setShowReactivarConfirmDialog(true);
  };

  const handleConfirmReactivar = () => {
    selectedReactivarRouteIds.forEach(id => {
      const route = deliveryRoutes.find(r => r.id === id);
      if (route) {
        updateDeliveryRoute({
          ...route,
          statusRotaEntrega: 'DISPONÍVEL'
        });
      }
    });

    // Reset states and close modals
    setSelectedReactivarRouteIds([]);
    setShowReactivarConfirmDialog(false);
    setShowReativarRotasModal(false);
  };

  // Save/Record Transport click
  const handleGravarTransporte = (bypassQtyCheck = false) => {
    if (successMessage !== null) return; // Prevent double submission/clicks during success feedback
    if (isInventoryLocked) {
      alert("Aviso de Bloqueio Sistêmico Ativo: Não é possível gravar transporte enquanto houver um inventário ativo no armazém.");
      return;
    }
    // Validate
    let valid = true;

    if (!selectedVehicle && placaInput.trim() === '') {
      setPlacaError('Veículo é obrigatório!');
      valid = false;
    } else if (!selectedVehicle) {
      // Validate string input
      const match = vehicles.find(v => v.placa.toUpperCase() === placaInput.toUpperCase());
      if (!match) {
        setPlacaError('Placa não cadastrada em veículos!');
        valid = false;
      } else {
        setSelectedVehicle(match);
      }
    }

    if (!selectedDriver && driverInput.trim() === '') {
      setDriverError('Motorista é obrigatório!');
      valid = false;
    } else if (!selectedDriver) {
      const match = employees.find(
        e =>
          e.nome.toLowerCase() === driverInput.toLowerCase() &&
          (e.perfilTipo?.toLowerCase() === 'motorista' || e.perfilTipo?.toLowerCase() === 'entregador' || e.cargo?.toLowerCase() === 'motorista' || e.cargo?.toLowerCase() === 'entregador')
      );
      if (!match) {
        setDriverError('Motorista não cadastrado!');
        valid = false;
      } else {
        setSelectedDriver(match);
      }
    }

    let finalRoute = selectedRoute;
    if (transportMode === 'rota') {
      if (!finalRoute && routeInput.trim() !== '') {
        const match = deliveryRoutes.find(
          r =>
            `RT-${r.numeroRota}`.toLowerCase() === routeInput.trim().toLowerCase() ||
            `RT-${r.numeroRota} - ${r.cidade}`.toLowerCase() === routeInput.trim().toLowerCase() ||
            String(r.numeroRota) === routeInput.trim().toLowerCase()
        );
        if (match) {
          finalRoute = match;
          setSelectedRoute(match);
          setRouteInput(`RT-${match.numeroRota} - ${match.cidade}`);
        }
      }

      if (!finalRoute) {
        setRouteError('Rota de entrega cadastrada é obrigatória!');
        valid = false;
      }
    } else if (transportMode === 'multirota') {
      if (selectedMultiRouteIds.length === 0) {
        setRouteError('Selecione ao menos uma rota no painel Multi-Rotas!');
        valid = false;
      }
    }

    if (!valid) return;

    // Build the stock object for each product (initialized to 0 on transport creation)
    const transportStock: {
      [productId: string]: {
        veiculo: number;
        entrega: number;
        coleta: number;
        cliente: number;
        saidaEntrega?: number;
      };
    } = {};

    products.forEach(p => {
      transportStock[p.id] = {
        veiculo: 0,
        entrega: 0,
        coleta: 0,
        cliente: 0,
        saidaEntrega: 0
      };
    });

    // Build route description string
    let routeDesc = '';
    if (transportMode === 'forarota') {
      routeDesc = 'FORA DE ROTA';
    } else if (transportMode === 'multirota') {
      const selectedNums = selectedMultiRouteIds
        .map(id => {
          const match = deliveryRoutes.find(r => r.id === id);
          return match ? `RT-${match.numeroRota}` : '';
        })
        .filter(Boolean);
      routeDesc = `MULTI-ROTAS (${selectedNums.join(', ')})`;
    } else if (finalRoute) {
      routeDesc = `RT-${finalRoute.numeroRota} - ${finalRoute.cidade}`;
    }

    // Selected client list
    const finalClientIds = activeClients.filter(c => selectedClientIds[c.id]).map(c => c.id);

    const newTransport: Transport = {
      id: generateUniqueId(),
      number: transportNumber,
      date: deliveryDate.split('-').reverse().join('/'),
      placa: selectedVehicle ? selectedVehicle.placa : placaInput.toUpperCase(),
      driver: selectedDriver ? selectedDriver.nome : driverInput,
      route: routeDesc,
      isForaDeRota: transportMode === 'forarota',
      isMultiRota: transportMode === 'multirota',
      selectedRouteIds: transportMode === 'multirota'
        ? selectedMultiRouteIds
        : finalRoute
          ? [finalRoute.id]
          : [],
      selectedClientIds: finalClientIds,
      tipoTransporte: 'Aberto',
      statusTransporte: 'CRIADO',
      clienteTotal: finalClientIds.length,
      clienteEntregue: 0,
      clienteNaoEntregue: 0,
      clienteEmEntrega: finalClientIds.length,
      stock: transportStock,
      observation: `Carga lançada para entrega. Rota: ${routeDesc}`,
      sobras: []
    };

    // Execute state insertion
    addActiveTransport(newTransport);

    // Modificar o "Status de Entrega" dos clientes do Transporte para "Roteirizado" e zerar quantidades de entrega e retirada
    finalClientIds.forEach(cid => {
      const clientObj = clients.find(c => c.id === cid);
      if (clientObj) {
        updateClient({
          ...clientObj,
          statusEntrega: 'Roteirizado',
          deliveryQuantities: {},
          pickupQuantities: {}
        });
      }
    });

    // Se o campo "Rota de Entrega" foi preenchido com uma Rota de Entrega, mudar o Status Rota de Entrega dessa rota de entrega para o status "ROTEIRIZADA"
    if (transportMode === 'rota' && finalRoute) {
      updateDeliveryRoute({
        ...finalRoute,
        statusRotaEntrega: 'ROTEIRIZADA'
      });
    }

    setSuccessMessage(`Transporte ${newTransport.number} foi gravado com sucesso!`);

    setTimeout(() => {
      setSuccessMessage(null);
      setShowCreateAnotherConfirm(true);
    }, 2000);
  };

  const handleConfirmExcluir = () => {
    // Collect all selected transport objects
    const selectedTransports = (activeTransports || []).filter(t => 
      selectedTransportIdsForDeletion.includes(t.id)
    );

    if (selectedTransports.length === 0) return;

    // We will accumulate stock increments for products across all selected transports
    const increments: { [productId: string]: number } = {};
    const movementItemsList: { [productId: string]: { code: string; description: string; quantity: number; unit: string } } = {};

    selectedTransports.forEach(t => {
      // Mark as excluded
      const updatedTransport = {
        ...t,
        statusTransporte: 'EXCLUIDO' as const
      };
      updateActiveTransport(updatedTransport);

      // Return stocks
      Object.entries(t.stock || {}).forEach(([prodId, val]) => {
        const qtyInVehicle = val.veiculo || 0;
        if (qtyInVehicle > 0) {
          increments[prodId] = (increments[prodId] || 0) + qtyInVehicle;
          
          // Find product details
          const prod = products.find(p => p.id === prodId);
          if (prod) {
            if (!movementItemsList[prodId]) {
              movementItemsList[prodId] = {
                code: prod.code,
                description: prod.description,
                quantity: 0,
                unit: prod.unit
              };
            }
            movementItemsList[prodId].quantity += qtyInVehicle;
          }
        }
      });
    });

    // 1. Update product stocks
    if (Object.keys(increments).length > 0) {
      incrementProductStocks(increments);
    }

    // 2. Log in MovementLog
    const movementItemsArray = Object.entries(movementItemsList).map(([id, info]) => ({
      productCode: info.code,
      productDescription: info.description,
      qty: info.quantity,
      unit: info.unit
    }));

    if (movementItemsArray.length > 0) {
      addMovementLog({
        nfNumber: 'CANCELADO',
        date: new Date().toLocaleDateString('pt-BR'),
        supplier: activeDistributorName,
        responsible: getLoggedInUserName() || 'Marta TI',
        observation: `Cancelamento de ${selectedTransports.length} transporte(s) (${selectedTransports.map(t => t.number).join(', ')})`,
        type: '311 – ENTRADA POR TRANSPORTE CANCELADO',
        items: movementItemsArray
      });
    }

    // Clear selection, close confirm dialog
    setSelectedTransportIdsForDeletion([]);
    setShowDeletionConfirmDialog(false);
  };

  // Filter vehicles suggestions
  const filteredVehicles = vehicles.filter(v =>
    v.placa.toLowerCase().includes(placaInput.toLowerCase())
  );

  // Filter motoristas suggestions
  const filteredDrivers = employees.filter(
    e =>
      (e.perfilTipo?.toLowerCase() === 'motorista' || e.perfilTipo?.toLowerCase() === 'entregador' || e.cargo?.toLowerCase() === 'motorista' || e.cargo?.toLowerCase() === 'entregador') &&
      e.nome.toLowerCase().includes(driverInput.toLowerCase())
  );

  // Filter routes suggestions
  const filteredRoutes = deliveryRoutes.filter(
    r =>
      r.statusRotaEntrega?.toUpperCase() !== 'ROTEIRIZADA' && (
        `rota ${r.numeroRota}`.toLowerCase().includes(routeInput.toLowerCase()) ||
        r.cidade.toLowerCase().includes(routeInput.toLowerCase()) ||
        r.bairroRegiao.toLowerCase().includes(routeInput.toLowerCase())
      )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl xl:max-w-[1180px] rounded-2xl overflow-hidden border border-blue-200 shadow-2xl flex flex-col h-[92vh] my-4">
        
        {/* Header Bar */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-white text-2xl">add_road</span>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider">CRIAR NOVO REGISTRO DE CARGA</h3>
              <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Lançar Saída para Transporte</p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
          
          {/* Main Top Header Controls */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              Dados do Transporte
            </h4>
            <button 
              type="button" 
              onClick={() => {
                setSelectedTransportIdsForDeletion([]);
                setShowExcluirTransportesModal(true);
              }}
              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-[10px] font-black text-red-700 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Excluir Transportes
            </button>
          </div>

          {/* Sub-window: Relatório de Rotas/Clientes */}
          {showRoutesReport && (
            <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-blue-600">table_rows</span>
                  Relatório de Rotas de Entrega & Abrangência
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowRoutesReport(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  Fechar ✕
                </button>
              </div>
              <div className="overflow-x-auto border border-gray-150 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[9px] border-b border-gray-150">
                    <tr>
                      <th className="py-2.5 px-4">Rota de Entrega</th>
                      <th className="py-2.5 px-4">Cidade</th>
                      <th className="py-2.5 px-4">Bairros Atendidos / Região</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedDeliveryRoutes.map(route => (
                      <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-4 font-bold text-blue-600">RT-{route.numeroRota}</td>
                        <td className="py-2 px-4 font-medium text-slate-800">{route.cidade}</td>
                        <td className="py-2 px-4 text-gray-500">{route.bairroRegiao} {route.complemento && `(${route.complemento})`}</td>
                      </tr>
                    ))}
                    {sortedDeliveryRoutes.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-400 italic">Nenhuma rota de entrega cadastrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Main 2-Row/Columns Layout */}
          <div className="space-y-6">
            
            {/* Top Row: Dados da Carga */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Column 1: Dados da Carga (lg:col-span-12) */}
              <div className="lg:col-span-12 space-y-4">
                <div className="w-full bg-slate-50 border border-blue-500 rounded-xl p-4 shadow-3xs text-black text-[12px] font-bold">
                  <div className="border-b border-blue-200 pb-2 mb-4 flex flex-wrap items-center justify-between text-blue-600 gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-blue-600">local_shipping</span>
                      <span className="text-[12px] font-black uppercase tracking-wider text-black">Dados da Carga</span>
                    </div>

                    {/* All required action buttons aligned in the header row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setSelectedTransportIdsForDeletion([]);
                          setShowExcluirTransportesModal(true);
                        }}
                        className="h-8 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-[10px] font-black text-red-700 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Excluir Transportes
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setShowRoutesReport(!showRoutesReport)}
                        className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-black text-blue-700 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-sm">assignment</span>
                        Rotas e Clientes
                      </button>

                      <button 
                        type="button" 
                        onClick={handleReabilitarRotas}
                        className="h-8 px-2.5 bg-gray-150 hover:bg-gray-200 border border-gray-300 rounded-lg text-[10px] font-black text-gray-750 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                        Reativar Rotas
                      </button>

                      <div className="flex p-0.5 bg-gray-205 border border-gray-300 rounded-xl w-48 h-8 items-center">
                        <button
                          type="button"
                          onClick={() => handleModeChange('rota')}
                          className={`flex-1 h-6 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                            transportMode === 'rota'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-850'
                          }`}
                        >
                          Rota
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModeChange('multirota')}
                          className={`flex-1 h-6 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                            transportMode === 'multirota'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-850'
                          }`}
                          title="Mini Rota"
                        >
                          Mini Rota
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModeChange('forarota')}
                          className={`flex-1 h-6 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                            transportMode === 'forarota'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-850'
                          }`}
                        >
                          Fora Rota
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5-Column Inline Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start relative">
                    
                    {/* Column 1: Nº do Transporte */}
                    <div className="flex flex-col justify-between h-full space-y-2">
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Nº do Transporte
                        </label>
                        <input
                          type="text"
                          value={transportNumber}
                          disabled
                          readOnly
                          className="w-full h-9 px-2 text-slate-500 font-bold text-center text-xs rounded-lg border border-gray-250 bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Column 2: Data de Entrega */}
                    <div className="flex flex-col justify-between h-full space-y-2">
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Data de Entrega
                        </label>
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full h-9 px-2 text-slate-800 font-bold text-center text-xs rounded-lg border border-gray-250 shadow-3xs outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* Column 3: Placa do Veículo */}
                    <div className="flex flex-col justify-between h-full space-y-2 relative" ref={vehicleRef}>
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Placa do Veículo <span className="text-red-500">*</span>
                        </label>
                        <div className="relative w-full">
                          <input
                            type="text"
                            value={placaInput}
                            onChange={(e) => {
                              setPlacaInput(e.target.value.toUpperCase());
                              setSelectedVehicle(null);
                              setPlacaError('');
                            }}
                            onFocus={() => setShowVehicleSuggest(true)}
                            className={`w-full h-9 px-2 pr-7 bg-white rounded-lg border text-xs font-bold uppercase transition-all outline-hidden focus:ring-2 focus:ring-blue-500 ${
                              placaError ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-250 shadow-3xs'
                            }`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined pointer-events-none text-sm">
                            search
                          </span>
                        </div>
                        {selectedVehicle ? (
                          <span className="text-[9px] font-bold text-blue-600 mt-0.5 truncate max-w-full block">
                            🚗 {selectedVehicle.transportadora}
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-400 mt-0.5 block">
                            Sem veículo
                          </span>
                        )}
                        {placaError && <span className="text-[9px] font-bold text-red-500 mt-0.5 block">{placaError}</span>}
                      </div>

                      {/* Suggester Box for Vehicle */}
                      {showVehicleSuggest && (
                        <div className="absolute top-[58px] left-0 w-full z-30 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-[200px]">
                          {filteredVehicles.map(v => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                setSelectedVehicle(v);
                                setPlacaInput(v.placa);
                                setPlacaError('');
                                setShowVehicleSuggest(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors text-xs font-bold text-slate-800 flex justify-between border-b border-gray-50 last:border-0"
                            >
                              <span className="text-blue-600 font-extrabold">{v.placa}</span>
                              <span className="text-gray-400 text-[9px] font-medium">{v.transportadora}</span>
                            </button>
                          ))}
                          {filteredVehicles.length === 0 && (
                            <p className="p-2 text-center text-[11px] text-gray-400 italic">Nenhum veículo encontrado</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Column 4: Motorista */}
                    <div className="flex flex-col justify-between h-full space-y-2 relative" ref={driverRef}>
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Motorista <span className="text-red-500">*</span>
                        </label>
                        <div className="relative w-full">
                          <input
                            type="text"
                            value={driverInput}
                            onChange={(e) => {
                              setDriverInput(e.target.value);
                              setSelectedDriver(null);
                              setDriverError('');
                            }}
                            onFocus={() => setShowDriverSuggest(true)}
                            className={`w-full h-9 px-2 pr-7 bg-white rounded-lg border text-xs font-semibold transition-all outline-hidden focus:ring-2 focus:ring-blue-500 ${
                              driverError ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-250 shadow-3xs'
                            }`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined pointer-events-none text-sm">
                            person_search
                          </span>
                        </div>
                        {selectedDriver ? (
                          <span className="text-[9px] font-bold text-blue-600 mt-0.5 block">
                            ✓ Motorista Homologado
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-450 mt-0.5 block">
                            Sem motorista
                          </span>
                        )}
                        {driverError && <span className="text-[9px] font-bold text-red-500 mt-0.5 block">{driverError}</span>}
                      </div>

                      {/* Suggester Box for Driver */}
                      {showDriverSuggest && (
                        <div className="absolute top-[58px] left-0 w-full z-30 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-[200px]">
                          {filteredDrivers.map(d => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setSelectedDriver(d);
                                setDriverInput(d.nome);
                                setDriverError('');
                                setShowDriverSuggest(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors text-xs font-bold text-slate-800 flex justify-between border-b border-gray-50 last:border-0"
                            >
                              <span>{d.nome}</span>
                              <span className="text-blue-500 text-[8px] font-bold bg-blue-50 px-1.5 py-0.2 rounded-sm uppercase">{d.cargo}</span>
                            </button>
                          ))}
                          {filteredDrivers.length === 0 && (
                            <p className="p-2 text-center text-[11px] text-gray-400 italic">Nenhum motorista cadastrado</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Column 5: Rota de Entrega */}
                    <div className="flex flex-col justify-between h-full space-y-2 relative" ref={routeRef}>
                      <div>
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
                          Rota de Entrega <span className="text-red-500">*</span>
                        </label>
                        <div className="relative w-full">
                          <input
                            type="text"
                            value={routeInput}
                            disabled={transportMode !== 'rota'}
                            onChange={(e) => {
                              setRouteInput(e.target.value);
                              setSelectedRoute(null);
                              setRouteError('');
                            }}
                            onFocus={() => {
                              if (transportMode === 'rota') setShowRouteSuggest(true);
                            }}
                            className={`w-full h-9 px-2 pr-7 rounded-lg border text-xs font-bold transition-all outline-hidden focus:ring-2 focus:ring-blue-500 ${
                              transportMode !== 'rota'
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                : routeError
                                  ? 'bg-white border-red-500 ring-1 ring-red-100'
                                  : 'bg-white border-gray-250 shadow-3xs'
                            }`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined pointer-events-none text-sm">
                            map
                          </span>
                        </div>
                        {routeError && <span className="text-[9px] font-bold text-red-500 mt-0.5 block">{routeError}</span>}
                        {transportMode === 'multirota' && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenedFromCheckbox(false);
                              setDraftMultiRouteIds([...selectedMultiRouteIds]);
                              setShowMultiRouteModal(true);
                            }}
                            className="text-[9px] text-blue-600 font-extrabold hover:underline uppercase tracking-wider mt-0.5 block text-left cursor-pointer"
                          >
                            {selectedMultiRouteIds.length === 0 
                              ? 'Selecionar Rotas' 
                              : `${selectedMultiRouteIds.length} Rota(s) (Alterar)`}
                          </button>
                        )}
                        {transportMode === 'forarota' && (
                          <span className="text-[9px] text-gray-500 mt-0.5 block uppercase font-bold">
                            Toda a Rede
                          </span>
                        )}
                      </div>

                      {/* Suggester Box for Route */}
                      {transportMode === 'rota' && showRouteSuggest && (
                        <div className="absolute top-[58px] left-0 w-full z-30 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-[200px]">
                          {filteredRoutes.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setSelectedRoute(r);
                                setRouteInput(`RT-${r.numeroRota} - ${r.cidade}`);
                                setRouteError('');
                                setShowRouteSuggest(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors text-xs font-semibold text-slate-800 flex flex-col border-b border-gray-50 last:border-0"
                            >
                              <span className="text-blue-600 font-extrabold text-[11px]">RT-{r.numeroRota} - {r.cidade}</span>
                              <span className="text-gray-400 text-[9px]">{r.bairroRegiao}</span>
                            </button>
                          ))}
                          {filteredRoutes.length === 0 && (
                            <p className="p-2 text-center text-[11px] text-gray-400 italic">Nenhuma rota encontrada</p>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            </div>

            {/* Row 2: "Clientes Atendidos" (lg:col-span-12) */}
            <div className="bg-white border border-blue-500 rounded-xl shadow-xs overflow-hidden flex flex-col w-full text-black text-[12px] font-bold">
              <div className="bg-gray-100 px-4 py-3 border-b border-blue-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">groups</span>
                  <span className="text-[12px] font-black text-black uppercase tracking-widest">Clientes Atendidos</span>
                </div>

                {/* Filters aligned on the same header line */}
                {baseActiveClients.length > 0 && (
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="search-field-select" className="text-[10px] font-black text-slate-700 uppercase whitespace-nowrap">Pesquisar por:</label>
                      <select
                        id="search-field-select"
                        value={clientSearchField}
                        onChange={(e) => {
                          setClientSearchField(e.target.value as any);
                          setClientSearchQuery('');
                        }}
                        className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400 h-7"
                      >
                        <option value="matricula">Matricula</option>
                        <option value="razaoSocial">Razão Social</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="rotaEntrega">Rota de Entrega</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label htmlFor="search-query-input" className="text-[10px] font-black text-slate-700 uppercase whitespace-nowrap">Pesquisa:</label>
                      <input
                        id="search-query-input"
                        type="text"
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400 w-44 h-7"
                      />
                    </div>

                    {/* Selecionar Todos checkbox */}
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-black cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeClients.length > 0 && activeClients.every(c => selectedClientIds[c.id])}
                        onChange={(e) => handleSelectAllClients(e.target.checked)}
                        className="w-3.5 h-3.5 border-gray-300 text-blue-600 focus:ring-blue-500 rounded-xs cursor-pointer"
                      />
                      <span>Selecionar Todos</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Clients Checklist as a Grid */}
              <div className="p-4 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {activeClients.map(c => {
                    const isSelected = !!selectedClientIds[c.id];
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50/55 border-blue-200 hover:border-blue-300' 
                            : 'bg-white border-gray-150 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleClientCheckChange(c.id, e.target.checked)}
                          className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded-xs focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1 flex flex-col text-[12px] min-w-0">
                          <span className="font-black text-black uppercase truncate">{c.razaoSocial}</span>
                          <span className="text-[11px] text-gray-750 font-bold uppercase tracking-wider mt-0.5">
                            Matrícula: {c.matricula} • <span className="text-blue-600 font-black">Rota: {c.rotaEntrega}</span>
                          </span>
                          <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">
                            CNPJ: {c.cnpj}
                          </span>
                        </div>
                      </label>
                    );
                  })}

                  {activeClients.length === 0 && (
                    <div className="col-span-full py-8 text-center text-gray-400 italic flex flex-col items-center justify-center gap-1.5 w-full">
                      <span className="material-symbols-outlined text-gray-300 text-3xl">route</span>
                      <p className="text-xs">Selecione uma rota para carregar os clientes correspondentes.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Clients Selected Indicator */}
              <div className="bg-gray-50 border-t border-gray-150 p-4 flex items-center justify-end gap-2 text-[12px]">
                <span className="font-bold text-black">Total de clientes selecionados:</span>
                <span className="bg-blue-600 text-white font-black px-2.5 py-1 rounded-lg text-sm shadow-3xs">
                  {selectedClientsCount}
                </span>
              </div>
            </div>

            {/* Modal Footer (moved inside scrollable area, under Clientes Atendidos) */}
            <div className="bg-slate-105 border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-end">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-5 py-2 border border-gray-300 hover:bg-gray-150 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleGravarTransporte()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-bold">save</span>
                  Gravar Transporte
                </button>
              </div>
            </div>

          </div>

          {/* Centered Temporary multi-route selection overlay dialog */}
          {showMultiRouteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-2xl border border-blue-200 shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-blue-600 px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">widgets</span>
                    <h5 className="text-xs font-black uppercase tracking-widest">Selecionar Multi-Rotas</h5>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowMultiRouteModal(false)}
                    className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined text-lg font-bold">close</span>
                  </button>
                </div>
                
                <div className="p-5 bg-slate-50 flex-1 overflow-y-auto min-h-[150px] max-h-[350px]">
                  <div className="grid grid-cols-4 gap-4 justify-items-center">
                    {sortedDeliveryRoutes.map(route => {
                      const isSelected = draftMultiRouteIds.includes(route.id);
                      return (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => {
                            if (draftMultiRouteIds.includes(route.id)) {
                              setDraftMultiRouteIds(prev => prev.filter(id => id !== route.id));
                            } else {
                              setDraftMultiRouteIds(prev => [...prev, route.id]);
                            }
                          }}
                          className={`aspect-square w-16 h-16 flex items-center justify-center rounded-xl font-bold transition-all border cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-700 text-white shadow-md' 
                              : 'bg-blue-50 border border-blue-400 text-blue-800 hover:bg-blue-100 shadow-4xs'
                          }`}
                          style={{ fontSize: openedFromCheckbox ? '16px' : '14px' }}
                        >
                          {route.numeroRota}
                        </button>
                      );
                    })}
                    {sortedDeliveryRoutes.length === 0 && (
                      <p className="col-span-full text-center text-xs text-gray-400 italic py-6">Nenhuma rota de entrega cadastrada.</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-100 px-5 py-4 border-t border-gray-200 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      // Cancel, just close
                      setShowMultiRouteModal(false);
                    }}
                    className="px-5 py-2 border border-gray-300 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Confirm selections
                      setSelectedMultiRouteIds([...draftMultiRouteIds]);
                      setShowMultiRouteModal(false);
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
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

        {/* Caixa de Mensagem: Deseja criar novo Transporte? */}
        {showCreateAnotherConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl border border-blue-200 shadow-2xl p-6 text-center space-y-4">
              <div className="flex flex-col items-center gap-2 text-blue-600">
                <span className="material-symbols-outlined text-5xl">help_outline</span>
                <h3 className="text-base font-black uppercase tracking-wider mt-2">Deseja criar novo Transporte?</h3>
              </div>
              <p className="text-slate-700 text-sm font-black uppercase tracking-wide leading-relaxed">
                Transporte gravado com sucesso. Deseja criar um novo transporte agora?
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAnotherConfirm(false);
                    setSelectedAction(null);
                    setActiveView('movements');
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      const mainEl = document.querySelector('main');
                      if (mainEl) {
                        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="px-5 py-2 border border-gray-300 hover:bg-gray-150 rounded-xl text-xs font-bold text-gray-750 uppercase tracking-wider transition-all cursor-pointer"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Sub-window modal: EXCLUIR TRANSPORTES */}
        {showExcluirTransportesModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-red-50 w-full max-w-5xl rounded-2xl border-2 border-red-300 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
              
              {/* Header of Excluir Transportes */}
              <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-2xl">delete_sweep</span>
                  <h3 className="text-sm font-black uppercase tracking-widest">EXCLUIR TRANSPORTES</h3>
                </div>
                
                {/* Top "Excluir" Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTransportIdsForDeletion.length === 0) {
                      alert('Por favor, selecione ao menos um transporte para excluir.');
                      return;
                    }
                    setShowDeletionConfirmDialog(true);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-400 border border-red-750 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md text-white transition-all"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Excluir ({selectedTransportIdsForDeletion.length})
                </button>
              </div>

              {/* Table list area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-white border border-red-200 rounded-xl shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-red-100 text-red-900 font-bold uppercase text-[9px] border-b border-red-200">
                      <tr>
                        <th className="py-3 px-4">Data de Criação</th>
                        <th className="py-3 px-4">Nº do Transporte</th>
                        <th className="py-3 px-4">Placa</th>
                        <th className="py-3 px-4">Motorista</th>
                        <th className="py-3 px-4">Rota</th>
                        <th className="py-3 px-4 text-center">Qtde de Clientes</th>
                        <th className="py-3 px-4">Status do Transporte</th>
                        <th className="py-3 px-4 text-center w-20">Excluir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {(() => {
                        const getTransportNumValue = (num: string) => {
                          return Number(num.replace(/[^0-9]/g, '')) || 0;
                        };
                        const criadoTransports = (activeTransports || [])
                          .filter(t => (t.statusTransporte || 'CRIADO') === 'CRIADO')
                          .sort((a, b) => getTransportNumValue(a.number) - getTransportNumValue(b.number));

                        if (criadoTransports.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-gray-400 italic font-medium">
                                Nenhum transporte com status CRIADO encontrado para exclusão.
                              </td>
                            </tr>
                          );
                        }

                        return criadoTransports.map(t => {
                          const isChecked = selectedTransportIdsForDeletion.includes(t.id);
                          const rowTextStyle = isChecked ? 'text-red-600 font-bold bg-red-100/40' : 'text-slate-800';

                          return (
                            <tr 
                              key={t.id} 
                              className={`hover:bg-red-50/50 transition-colors ${rowTextStyle}`}
                            >
                              <td className="py-3 px-4">{t.date}</td>
                              <td className="py-3 px-4 font-black">{t.number}</td>
                              <td className="py-3 px-4 font-medium uppercase">{t.placa}</td>
                              <td className="py-3 px-4 font-medium uppercase">{t.driver}</td>
                              <td className="py-3 px-4 font-bold">{t.route}</td>
                              <td className="py-3 px-4 text-center font-bold">{t.clienteTotal}</td>
                              <td className="py-3 px-4">
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-100 text-blue-800 border border-blue-200">
                                  {t.statusTransporte || 'CRIADO'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTransportIdsForDeletion(prev => [...prev, t.id]);
                                    } else {
                                      setSelectedTransportIdsForDeletion(prev => prev.filter(id => id !== t.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-red-600 border-red-300 rounded-sm focus:ring-red-500 accent-red-600 cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer with Voltar button */}
              <div className="bg-red-100/50 px-6 py-4 border-t border-red-200 flex justify-start flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowExcluirTransportesModal(false)}
                  className="px-6 py-2 border border-red-300 hover:bg-red-100 bg-white text-red-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs"
                >
                  <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                  Voltar
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Confirm Exclusion Dialog */}
        {showDeletionConfirmDialog && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl border border-red-300 shadow-2xl p-6 text-center space-y-4">
              <div className="flex flex-col items-center gap-2 text-red-600">
                <span className="material-symbols-outlined text-5xl">delete_forever</span>
                <h3 className="text-base font-black uppercase tracking-wider mt-2">Confirmar Exclusão</h3>
              </div>
              <p className="text-slate-850 text-sm font-bold leading-relaxed">
                Deseja excluir {selectedTransportIdsForDeletion.length} transporte{selectedTransportIdsForDeletion.length > 1 ? 's' : ''}?
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeletionConfirmDialog(false)}
                  className="px-5 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-wider transition-all cursor-pointer"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExcluir}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/10 cursor-pointer"
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REATIVAR ROTAS Modal */}
        {showReativarRotasModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-yellow-50 border-2 border-yellow-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header bar */}
              <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4 flex items-center justify-between text-slate-900 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-yellow-600 text-2xl font-bold">restart_alt</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">REATIVAR ROTAS</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReativarClick}
                    className="px-4 py-2 bg-yellow-450 hover:bg-yellow-500 active:scale-95 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-yellow-500"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">arrow_upward</span>
                    Reativar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowReativarRotasModal(false)}
                    className="text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-yellow-100/50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg font-bold">close</span>
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="bg-white border border-yellow-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-yellow-200 bg-yellow-100/40 text-slate-700 font-black uppercase tracking-wider">
                        <th className="py-3 px-4">Rotas de Entrega</th>
                        <th className="py-3 px-4">Cidade</th>
                        <th className="py-3 px-4">Status da Rota de Entrega</th>
                        <th className="py-3 px-4 text-center">excluir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-100">
                      {(() => {
                        const roteirizadas = deliveryRoutes
                          .filter(r => r.statusRotaEntrega?.toUpperCase() === 'ROTEIRIZADA')
                          .sort((a, b) => Number(a.numeroRota) - Number(b.numeroRota));

                        if (roteirizadas.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400 italic font-medium">
                                {"Nenhuma rota de entrega com status 'ROTEIRIZADA' encontrada."}
                              </td>
                            </tr>
                          );
                        }

                        return roteirizadas.map((route) => {
                          const isChecked = selectedReactivarRouteIds.includes(route.id);
                          const rowClass = isChecked ? 'text-yellow-600 font-bold bg-yellow-50' : 'text-slate-705';

                          return (
                            <tr 
                              key={route.id} 
                              className={`hover:bg-yellow-50/50 transition-colors ${rowClass}`}
                            >
                              <td className="py-3 px-4 font-extrabold">
                                RT-{route.numeroRota}
                              </td>
                              <td className="py-3 px-4 font-semibold">
                                {route.cidade}
                              </td>
                              <td className="py-3 px-4 font-bold uppercase text-[10px]">
                                <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-md">
                                  {route.statusRotaEntrega || 'ROTEIRIZADA'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedReactivarRouteIds(prev => [...prev, route.id]);
                                    } else {
                                      setSelectedReactivarRouteIds(prev => prev.filter(id => id !== route.id));
                                    }
                                  }}
                                  className="w-4.5 h-4.5 text-yellow-600 border-yellow-300 rounded-sm focus:ring-yellow-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-yellow-100/30 px-6 py-4 border-t border-yellow-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowReativarRotasModal(false)}
                  className="px-5 py-2 border border-yellow-300 hover:bg-yellow-100/50 rounded-xl text-xs font-black text-slate-700 uppercase tracking-wider transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Reactivar Dialog */}
        {showReactivarConfirmDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl border border-yellow-300 shadow-2xl p-6 text-center space-y-4">
              <div className="flex flex-col items-center gap-2 text-yellow-600">
                <span className="material-symbols-outlined text-5xl font-bold">restart_alt</span>
                <h3 className="text-base font-black uppercase tracking-wider mt-2 text-slate-800">Confirmar Reativação</h3>
              </div>
              <p className="text-slate-850 text-sm font-bold leading-relaxed">
                Deseja reativar {selectedReactivarRouteIds.length} Rotas de Entrega?
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReactivarConfirmDialog(false)}
                  className="px-5 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-wider transition-all cursor-pointer"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReactivar}
                  className="px-6 py-2 bg-yellow-450 hover:bg-yellow-500 text-slate-900 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-yellow-500/10 cursor-pointer"
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
