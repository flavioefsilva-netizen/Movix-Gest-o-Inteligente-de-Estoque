'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Client, Supplier, Employee, Vehicle, TransportLiquidated, DeliveryRoute, CountingRoute, MovementLog, Transport, SobraClienteLog, CountDocument, TelegramRecipient } from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CLIENTS,
  INITIAL_SUPPLIERS,
  INITIAL_EMPLOYEES,
  INITIAL_VEHICLES,
  INITIAL_TRANSPORTS,
  INITIAL_DELIVERY_ROUTES,
  INITIAL_COUNTING_ROUTES
} from './constants';
import { supabase, initializeDynamicSupabase } from './supabase';

type Distributor = string;

interface AppState {
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  employees: Employee[];
  vehicles: Vehicle[];
  transports: TransportLiquidated[];
  activeTransports?: Transport[];
  deliveryRoutes: DeliveryRoute[];
  countingRoutes: CountingRoute[];
  movementsHistory: MovementLog[];
  sobraClientes?: SobraClienteLog[];
  countDocuments?: CountDocument[];
}

interface AppContextType {
  authenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  activeDistributor: Distributor;
  activeDistributorName: string;
  selectDistributor: (dist: Distributor) => void;
  isLoading: boolean;
  distributors: { id: string; name: string; cnpj?: string }[];
  createDistributor: (name: string, cnpj: string) => string;
  deleteDistributor: (id: string) => void;
  getDistributorStats: (distId: string) => { clientsCount: number; vehiclesCount: number; employeesCount: number; totalStockCount: number };
  
  // Real active lists based on selected distributor
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  employees: Employee[];
  vehicles: Vehicle[];
  transports: TransportLiquidated[];
  activeTransports: Transport[];
  deliveryRoutes: DeliveryRoute[];
  countingRoutes: CountingRoute[];
  movementsHistory: MovementLog[];
  sobraClientes: SobraClienteLog[];
  countDocuments: CountDocument[];

  // State management actions
  addProduct: (product: Omit<Product, 'id'>) => { success: boolean; error?: string };
  updateProduct: (product: Product) => { success: boolean; error?: string };
  deleteProduct: (id: string) => void;
  incrementProductStocks: (updates: { [productId: string]: number }) => void;
  decrementProductStocks: (updates: { [productId: string]: number }) => void;

  addActiveTransport: (transport: Transport) => void;
  deleteActiveTransport: (id: string) => void;
  updateActiveTransport: (transport: Transport) => void;
  addLiquidatedTransport: (transport: TransportLiquidated) => void;
  zerarSaldosEmTransporte: () => void;
  clearAllTransportsAndHistory: () => void;

  addClient: (client: Omit<Client, 'id' | 'matricula' | 'saldoLoja' | 'saldoContagem'>) => { success: boolean; error?: string };
  addClientsBulk: (clients: Omit<Client, 'id' | 'matricula' | 'saldoLoja' | 'saldoContagem'>[]) => { success: boolean; addedCount: number; errorCount: number; lastError?: string };
  updateClient: (client: Client) => { success: boolean; error?: string };
  deleteClient: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => { success: boolean; error?: string };
  updateSupplier: (supplier: Supplier) => { success: boolean; error?: string };
  deleteSupplier: (id: string) => void;

  addEmployee: (employee: Omit<Employee, 'id'>) => { success: boolean; error?: string };
  updateEmployee: (employee: Employee) => { success: boolean; error?: string };
  deleteEmployee: (id: string) => void;

  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => { success: boolean; error?: string };
  updateVehicle: (vehicle: Vehicle) => { success: boolean; error?: string };
  deleteVehicle: (id: string) => void;

  addDeliveryRoute: (route: Omit<DeliveryRoute, 'id'>) => { success: boolean; error?: string };
  updateDeliveryRoute: (route: DeliveryRoute) => { success: boolean; error?: string };
  deleteDeliveryRoute: (id: string) => void;

  addCountingRoute: (route: Omit<CountingRoute, 'id'>) => { success: boolean; error?: string };
  updateCountingRoute: (route: CountingRoute) => { success: boolean; error?: string };
  deleteCountingRoute: (id: string) => void;

  addMovementLog: (log: Omit<MovementLog, 'id'>) => void;
  addSobraCliente: (log: Omit<SobraClienteLog, 'id'>) => void;
  addCountDocument: (doc: CountDocument) => void;
  updateCountDocument: (doc: CountDocument) => void;
  currentUserEmail: string;
  getLoggedInUserName: () => string;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  userDistributorId: string | null;

  // Active page state
  activeView: 'dashboard' | 'movements' | 'cadastros' | 'reports' | 'logistic_dashboard' | 'suporte';
  setActiveView: (view: 'dashboard' | 'movements' | 'cadastros' | 'reports' | 'logistic_dashboard' | 'suporte') => void;
  activeCadastroTab: 'produtos' | 'clientes' | 'fornecedores' | 'funcionarios' | 'veiculos' | 'rotas_entrega' | 'rotas_contagem';
  setActiveCadastroTab: (tab: 'produtos' | 'clientes' | 'fornecedores' | 'funcionarios' | 'veiculos' | 'rotas_entrega' | 'rotas_contagem') => void;
  selectedAction: string | null;
  setSelectedAction: (action: string | null) => void;
  isInventoryLocked: boolean;
  setInventoryLocked: (locked: boolean) => void;
  reportsTab: 'transports' | 'movements' | 'sobra_clientes' | 'contagem_doc' | 'saldo_loja' | 'contagem_loja' | 'saldo_vs_contagem';
  setReportsTab: (tab: 'transports' | 'movements' | 'sobra_clientes' | 'contagem_doc' | 'saldo_loja' | 'contagem_loja' | 'saldo_vs_contagem') => void;
  telegramRecipients: TelegramRecipient[];
  setTelegramRecipients: (recipients: TelegramRecipient[]) => void;
  triggerSuporteStatusUpdate: () => void;
  dbStatus: 'connected' | 'disconnected' | 'error' | 'checking';
  dbErrorMessage?: string;
  retryDbConnection: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==========================================
// SUPABASE FIELD MAPPERS
// ==========================================

const mapProductFromDB = (db: any): Product => ({
  id: db.id,
  code: db.code,
  description: db.description,
  unit: db.unit,
  initialStock: db.initial_stock || 0,
  necessityQty: db.necessity_qty || undefined,
  valueR$: db.value_rs != null ? parseFloat(db.value_rs) : undefined
});

const mapProductToDB = (p: Product, distributor: string) => ({
  id: p.id,
  distributor,
  code: p.code,
  description: p.description,
  unit: p.unit,
  initial_stock: p.initialStock,
  necessity_qty: p.necessityQty || null,
  value_rs: p.valueR$ != null ? p.valueR$ : null
});

const mapClientFromDB = (db: any): Client => ({
  id: db.id,
  matricula: db.matricula,
  razaoSocial: db.razao_social,
  cnpj: db.cnpj,
  responsavelNome: db.responsavel_nome,
  responsavelSobrenome: db.responsavel_sobrenome,
  responsavelContato: db.responsavel_contato,
  endereco: db.endereco,
  numero: db.numero,
  bairro: db.bairro,
  cep: db.cep,
  estado: db.estado,
  cidade: db.cidade,
  rotaEntrega: db.rota_entrega,
  rotaContagem: db.rota_contagem,
  saldoLoja: db.saldo_loja != null ? parseFloat(db.saldo_loja) : 0,
  saldoContagem: db.saldo_contagem != null ? parseFloat(db.saldo_contagem) : 0,
  productBalances: db.product_balances || {},
  inativo: db.inativo || false,
  statusEntrega: db.status_entrega || 'Vazio',
  statusDuranteContagem: db.status_durante_contagem || 'Vazio',
  statusFinalContagem: db.status_final_contagem || 'Vazio',
  pickupQuantities: db.pickup_quantities || {},
  deliveryQuantities: db.delivery_quantities || {},
  contagemEstoque: db.contagem_estoque || {}
});

const mapClientToDB = (c: Client, distributor: string) => ({
  id: c.id,
  distributor,
  matricula: c.matricula,
  razao_social: c.razaoSocial,
  cnpj: c.cnpj,
  responsavel_nome: c.responsavelNome,
  responsavel_sobrenome: c.responsavelSobrenome,
  responsavel_contato: c.responsavelContato,
  endereco: c.endereco,
  numero: c.numero,
  bairro: c.bairro,
  cep: c.cep,
  estado: c.estado,
  cidade: c.cidade,
  rota_entrega: c.rotaEntrega,
  rota_contagem: c.rotaContagem,
  saldo_loja: c.saldoLoja,
  saldo_contagem: c.saldoContagem,
  product_balances: c.productBalances || {},
  inativo: c.inativo || false,
  status_entrega: c.statusEntrega || 'Vazio',
  status_durante_contagem: c.statusDuranteContagem || 'Vazio',
  status_final_contagem: c.statusFinalContagem || 'Vazio',
  pickup_quantities: c.pickupQuantities || {},
  delivery_quantities: c.deliveryQuantities || {},
  contagem_estoque: c.contagemEstoque || {}
});

const mapDeliveryRouteFromDB = (db: any): DeliveryRoute => ({
  id: db.id,
  numeroRota: db.numero_rota,
  cidade: db.cidade,
  bairroRegiao: db.bairro_regiao,
  complemento: db.complemento || undefined,
  statusRotaEntrega: db.status_rota_entrega || 'DISPONÍVEL'
});

const mapDeliveryRouteToDB = (r: DeliveryRoute, distributor: string) => ({
  id: r.id,
  distributor,
  numero_rota: r.numeroRota,
  cidade: r.cidade,
  bairro_regiao: r.bairroRegiao,
  complemento: r.complemento || null,
  status_rota_entrega: r.statusRotaEntrega || 'DISPONÍVEL'
});

const mapCountingRouteFromDB = (db: any): CountingRoute => ({
  id: db.id,
  numeroRota: db.numero_rota,
  cidade: db.cidade,
  bairroRegiao: db.bairro_regiao,
  complemento: db.complemento || undefined,
  statusRotaContagem: db.status_rota_contagem || 'Disponível'
});

const mapCountingRouteToDB = (r: CountingRoute, distributor: string) => ({
  id: r.id,
  distributor,
  numero_rota: r.numeroRota,
  cidade: r.cidade,
  bairro_regiao: r.bairroRegiao,
  complemento: r.complemento || null,
  status_rota_contagem: r.statusRotaContagem || 'Disponível'
});

const mapSupplierFromDB = (db: any): Supplier => ({
  id: db.id,
  razaoSocial: db.razao_social,
  cnpj: db.cnpj,
  responsavelNome: db.responsavel_nome,
  responsavelContato: db.responsavel_contato,
  estado: db.estado,
  cidade: db.cidade
});

const mapSupplierToDB = (s: Supplier, distributor: string) => ({
  id: s.id,
  distributor,
  razao_social: s.razaoSocial,
  cnpj: s.cnpj,
  responsavel_nome: s.responsavelNome,
  responsavel_contato: s.responsavelContato,
  estado: s.estado,
  cidade: s.cidade
});

const mapEmployeeFromDB = (db: any): Employee => ({
  id: db.id,
  empresa: db.empresa,
  nome: db.nome,
  cargo: db.cargo,
  email: db.email,
  perfilTipo: db.perfil_tipo,
  telegramChatId: db.telegram_chat_id || undefined,
  enableTelegram: db.enable_telegram !== false
});

const mapEmployeeToDB = (e: Employee, distributor: string) => ({
  id: e.id,
  distributor,
  empresa: e.empresa,
  nome: e.nome,
  cargo: e.cargo,
  email: e.email,
  perfil_tipo: e.perfilTipo,
  telegram_chat_id: e.telegramChatId || null,
  enable_telegram: e.enableTelegram !== false
});

const mapVehicleFromDB = (db: any): Vehicle => ({
  id: db.id,
  placa: db.placa,
  transportadora: db.transportadora
});

const mapVehicleToDB = (v: Vehicle, distributor: string) => ({
  id: v.id,
  distributor,
  placa: v.placa,
  transportadora: v.transportadora
});

const mapTransportLiquidatedFromDB = (db: any): TransportLiquidated => ({
  id: db.id,
  number: db.number,
  date: db.date,
  placa: db.placa,
  driver: db.driver,
  route: db.route,
  clientsCount: db.clients_count || 0,
  delivered: db.delivered || 0,
  notDelivered: db.not_delivered || 0,
  retirados: db.retirados != null ? db.retirados : undefined,
  effectiveness: db.effectiveness != null ? parseFloat(db.effectiveness) : 0
});

const mapTransportLiquidatedToDB = (t: TransportLiquidated, distributor: string) => ({
  id: t.id,
  distributor,
  number: t.number,
  date: t.date,
  placa: t.placa,
  driver: t.driver,
  route: t.route,
  clients_count: t.clientsCount,
  delivered: t.delivered,
  not_delivered: t.notDelivered,
  retirados: t.retirados != null ? t.retirados : null,
  effectiveness: t.effectiveness
});

const mapMovementLogFromDB = (db: any): MovementLog => ({
  id: db.id,
  nfNumber: db.nf_number,
  date: db.date,
  supplier: db.supplier,
  responsible: db.responsible,
  observation: db.observation || '',
  type: db.type,
  items: db.items || []
});

const mapMovementLogToDB = (m: MovementLog, distributor: string) => ({
  id: m.id,
  distributor,
  nf_number: m.nfNumber,
  date: m.date,
  supplier: m.supplier,
  responsible: m.responsible,
  observation: m.observation,
  type: m.type,
  items: m.items || []
});

const mapTransportFromDB = (db: any): Transport => ({
  id: db.id,
  number: db.number,
  date: db.date,
  placa: db.placa,
  driver: db.driver,
  route: db.route,
  isForaDeRota: db.is_fora_de_rota || false,
  isMultiRota: db.is_multi_rota || false,
  selectedRouteIds: db.selected_route_ids || [],
  selectedClientIds: db.selected_client_ids || [],
  tipoTransporte: db.tipo_transporte,
  statusTransporte: db.status_transporte,
  clienteTotal: db.cliente_total || 0,
  clienteEntregue: db.cliente_entregue || 0,
  clienteNaoEntregue: db.cliente_nao_entregue || 0,
  clienteEmEntrega: db.cliente_em_entrega || 0,
  clientesRetirados: db.clientes_retirados != null ? db.clientes_retirados : undefined,
  stock: db.stock || {},
  observation: db.observation || undefined,
  clientWithdrawals: db.client_withdrawals || {},
  sobras: db.sobras || []
});

const mapTransportToDB = (t: Transport, distributor: string) => ({
  id: t.id,
  distributor,
  number: t.number,
  date: t.date,
  placa: t.placa,
  driver: t.driver,
  route: t.route,
  is_fora_de_rota: t.isForaDeRota,
  is_multi_rota: t.isMultiRota,
  selected_route_ids: t.selectedRouteIds || [],
  selected_client_ids: t.selectedClientIds || [],
  tipo_transporte: t.tipoTransporte,
  status_transporte: t.statusTransporte,
  cliente_total: t.clienteTotal,
  cliente_entregue: t.clienteEntregue,
  cliente_nao_entregue: t.clienteNaoEntregue,
  cliente_em_entrega: t.clienteEmEntrega,
  clientes_retirados: t.clientesRetirados != null ? t.clientesRetirados : null,
  stock: t.stock || {},
  observation: t.observation || null,
  client_withdrawals: t.clientWithdrawals || {},
  sobras: t.sobras || []
});

const mapSobraClienteLogFromDB = (db: any): SobraClienteLog => ({
  id: db.id,
  matricula: db.matricula,
  razaoSocial: db.razao_social,
  dataTransporte: db.data_transporte,
  numeroTransporte: db.numero_transporte,
  codigoProduto: db.codigo_produto,
  descricaoProduto: db.descricao_produto,
  quantidadeSobra: db.quantidade_sobra || 0
});

const mapSobraClienteLogToDB = (s: SobraClienteLog, distributor: string) => ({
  id: s.id,
  distributor,
  matricula: s.matricula,
  razao_social: s.razaoSocial,
  data_transporte: s.dataTransporte,
  numero_transporte: s.numeroTransporte,
  codigo_produto: s.codigoProduto,
  descricao_produto: s.descricaoProduto,
  quantidade_sobra: s.quantidadeSobra
});

const mapCountDocumentFromDB = (db: any): CountDocument => ({
  id: db.id,
  date: db.date,
  employeeName: db.employee_name,
  route: db.route,
  totalClients: db.total_clients || 0,
  status: db.status,
  clientStatuses: db.client_statuses || {},
  clientCounts: db.client_counts || {},
  clientClosedFlags: db.client_closed_flags || {},
  clientContagemTiming: db.client_contagem_timing || {},
  countsSummary: db.counts_summary || undefined
});

const mapCountDocumentToDB = (d: CountDocument, distributor: string) => ({
  id: d.id,
  distributor,
  date: d.date,
  employee_name: d.employeeName,
  route: d.route,
  total_clients: d.totalClients,
  status: d.status,
  client_statuses: d.clientStatuses || {},
  client_counts: d.clientCounts || {},
  client_closed_flags: d.clientClosedFlags || {},
  client_contagem_timing: d.clientContagemTiming || {},
  counts_summary: d.countsSummary || null
});

const mapTelegramRecipientFromDB = (db: any): TelegramRecipient => ({
  id: db.id,
  name: db.name,
  checked: db.checked !== false
});

const mapTelegramRecipientToDB = (t: TelegramRecipient) => ({
  id: t.id,
  name: t.name,
  checked: t.checked
});

// ==========================================
// CONTEXT PROVIDER
// ==========================================

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('marta.ti@movix.com.br');
  const [activeDistributor, setActiveDistributor] = useState<Distributor>('A');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDistributorId, setUserDistributorId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'movements' | 'cadastros' | 'reports' | 'logistic_dashboard' | 'suporte'>('dashboard');
  const [activeCadastroTab, setActiveCadastroTab] = useState<'produtos' | 'clientes' | 'fornecedores' | 'funcionarios' | 'veiculos' | 'rotas_entrega' | 'rotas_contagem'>('produtos');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isInventoryLocked, setInventoryLocked] = useState<boolean>(false);
  const [reportsTab, setReportsTab] = useState<'transports' | 'movements' | 'sobra_clientes' | 'contagem_doc' | 'saldo_loja' | 'contagem_loja' | 'saldo_vs_contagem'>('transports');
  const [telegramRecipients, setTelegramRecipients] = useState<TelegramRecipient[]>([
    { id: '8987478627', name: 'Suporte Movix Central', checked: true },
    { id: '1287498374', name: 'Logística Regional', checked: true },
    { id: '5572834910', name: 'Gerente Operacional', checked: false }
  ]);

  // Hydration safety
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Database Connection Status
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'error' | 'checking'>('checking');
  const [dbErrorMessage, setDbErrorMessage] = useState<string | undefined>(undefined);

  // Dynamic list of active distributors
  const [distributors, setDistributors] = useState<{ id: string; name: string; cnpj?: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('movix_distributors');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing distributors', e);
        }
      }
    }
    return [{ id: 'A', name: 'ESTEVES E SILVA LTDA', cnpj: '24.123.456/0001-89' }];
  });

  // Separate states for each distributor (acting as our active memory cache)
  const [distributorStates, setDistributorStates] = useState<Record<string, AppState>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('movix_distributor_states');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing distributor states from localStorage', e);
        }
      }
    }
    return {
      A: {
        products: INITIAL_PRODUCTS,
        clients: INITIAL_CLIENTS,
        suppliers: INITIAL_SUPPLIERS,
        employees: INITIAL_EMPLOYEES,
        vehicles: INITIAL_VEHICLES,
        transports: INITIAL_TRANSPORTS,
        activeTransports: [],
        deliveryRoutes: INITIAL_DELIVERY_ROUTES,
        countingRoutes: INITIAL_COUNTING_ROUTES,
        movementsHistory: [],
        sobraClientes: [],
        countDocuments: [],
      }
    };
  });

  // Save distributors and distributorStates dynamically
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('movix_distributors', JSON.stringify(distributors));
      localStorage.setItem('movix_distributor_states', JSON.stringify(distributorStates));
    }
  }, [distributors, distributorStates, hydrated]);

  // ==========================================
  // SYNC ACTION HELPER WRAPPERS
  // ==========================================

  const loadDistributors = async () => {
    if (!supabase) {
      setDbStatus('disconnected');
      return;
    }
    try {
      const { data, error } = await supabase.from('distributors').select('*');
      if (error) {
        if (error.code === '42P01') {
          console.warn('[Supabase] Tabela "distributors" não existe. Usando local storage.');
          setDbStatus('error');
          setDbErrorMessage('A tabela "distributors" não existe no banco de dados. Por favor, crie as tabelas executando o script "supabase_schema.sql" no editor de SQL do Supabase.');
        } else {
          console.error('[Supabase] Erro ao carregar distribuidores:', error);
          setDbStatus('error');
          setDbErrorMessage(error.message);
        }
        return;
      }
      if (data && data.length > 0) {
        const mapped = data.map(d => ({ id: d.id, name: d.name, cnpj: d.cnpj || undefined }));
        setDistributors(mapped);
      } else {
        const defaultDist = { id: 'A', name: 'ESTEVES E SILVA LTDA', cnpj: '24.123.456/0001-89' };
        await supabase.from('distributors').upsert(defaultDist);
        setDistributors([defaultDist]);
      }
    } catch (e: any) {
      console.error('[Supabase] Falha ao carregar distribuidores:', e);
      setDbStatus('error');
      setDbErrorMessage(e?.message || String(e));
    }
  };

  const saveDistributorToSupabase = async (dist: { id: string; name: string; cnpj?: string }) => {
    if (!supabase) return;
    try {
      await supabase.from('distributors').upsert({
        id: dist.id,
        name: dist.name,
        cnpj: dist.cnpj || null
      });
    } catch (e) {
      console.error('[Supabase] Erro ao salvar distribuidor:', e);
    }
  };

  const deleteDistributorFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('distributors').delete().eq('id', id);
    } catch (e) {
      console.error('[Supabase] Erro ao excluir distribuidor:', e);
    }
  };

  const saveProductToSupabase = async (prod: Product) => {
    if (!supabase) return;
    try {
      await supabase.from('products').upsert(mapProductToDB(prod, activeDistributor));
    } catch (e) {
      console.error('Error syncing product to Supabase:', e);
    }
  };

  const deleteProductFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting product from Supabase:', e);
    }
  };

  const saveClientToSupabase = async (cli: Client) => {
    if (!supabase) return;
    try {
      await supabase.from('clients').upsert(mapClientToDB(cli, activeDistributor));
    } catch (e) {
      console.error('Error syncing client to Supabase:', e);
    }
  };

  const deleteClientFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('clients').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting client from Supabase:', e);
    }
  };

  const saveSupplierToSupabase = async (sup: Supplier) => {
    if (!supabase) return;
    try {
      await supabase.from('suppliers').upsert(mapSupplierToDB(sup, activeDistributor));
    } catch (e) {
      console.error('Error syncing supplier to Supabase:', e);
    }
  };

  const deleteSupplierFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('suppliers').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting supplier from Supabase:', e);
    }
  };

  const saveEmployeeToSupabase = async (emp: Employee) => {
    if (!supabase) return;
    try {
      await supabase.from('employees').upsert(mapEmployeeToDB(emp, activeDistributor));
    } catch (e) {
      console.error('Error syncing employee to Supabase:', e);
    }
  };

  const deleteEmployeeFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('employees').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting employee from Supabase:', e);
    }
  };

  const saveVehicleToSupabase = async (veh: Vehicle) => {
    if (!supabase) return;
    try {
      await supabase.from('vehicles').upsert(mapVehicleToDB(veh, activeDistributor));
    } catch (e) {
      console.error('Error syncing vehicle to Supabase:', e);
    }
  };

  const deleteVehicleFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('vehicles').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting vehicle from Supabase:', e);
    }
  };

  const saveDeliveryRouteToSupabase = async (route: DeliveryRoute) => {
    if (!supabase) return;
    try {
      await supabase.from('delivery_routes').upsert(mapDeliveryRouteToDB(route, activeDistributor));
    } catch (e) {
      console.error('Error syncing delivery route to Supabase:', e);
    }
  };

  const deleteDeliveryRouteFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('delivery_routes').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting delivery route from Supabase:', e);
    }
  };

  const saveCountingRouteToSupabase = async (route: CountingRoute) => {
    if (!supabase) return;
    try {
      await supabase.from('counting_routes').upsert(mapCountingRouteToDB(route, activeDistributor));
    } catch (e) {
      console.error('Error syncing counting route to Supabase:', e);
    }
  };

  const deleteCountingRouteFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('counting_routes').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting counting route from Supabase:', e);
    }
  };

  const saveTransportToSupabase = async (transport: Transport) => {
    if (!supabase) return;
    try {
      await supabase.from('transports').upsert(mapTransportToDB(transport, activeDistributor));
    } catch (e) {
      console.error('Error syncing transport to Supabase:', e);
    }
  };

  const deleteTransportFromSupabase = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from('transports').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting transport from Supabase:', e);
    }
  };

  const saveTransportLiquidatedToSupabase = async (transport: TransportLiquidated) => {
    if (!supabase) return;
    try {
      await supabase.from('transports_liquidated').upsert(mapTransportLiquidatedToDB(transport, activeDistributor));
    } catch (e) {
      console.error('Error syncing liquidated transport to Supabase:', e);
    }
  };

  const saveMovementLogToSupabase = async (log: MovementLog) => {
    if (!supabase) return;
    try {
      await supabase.from('movement_logs').upsert(mapMovementLogToDB(log, activeDistributor));
    } catch (e) {
      console.error('Error syncing movement log to Supabase:', e);
    }
  };

  const saveSobraClienteToSupabase = async (log: SobraClienteLog) => {
    if (!supabase) return;
    try {
      await supabase.from('sobra_cliente_logs').upsert(mapSobraClienteLogToDB(log, activeDistributor));
    } catch (e) {
      console.error('Error syncing sobra cliente log to Supabase:', e);
    }
  };

  const deleteSobraClienteLogsAllFromSupabase = async () => {
    if (!supabase) return;
    try {
      await supabase.from('sobra_cliente_logs').delete().eq('distributor', activeDistributor);
    } catch (e) {
      console.error('Error deleting all sobra cliente logs from Supabase:', e);
    }
  };

  const saveCountDocumentToSupabase = async (doc: CountDocument) => {
    if (!supabase) return;
    try {
      await supabase.from('count_documents').upsert(mapCountDocumentToDB(doc, activeDistributor));
    } catch (e) {
      console.error('Error syncing count document to Supabase:', e);
    }
  };

  const updateTelegramRecipientsInSupabase = async (recipients: TelegramRecipient[]) => {
    setTelegramRecipients(recipients);
    if (!supabase) return;
    try {
      const { error } = await supabase.from('telegram_recipients').upsert(recipients.map(mapTelegramRecipientToDB));
      if (error) {
        console.warn('[Supabase] Não foi possível salvar destinatários do Telegram (a tabela pode não existir):', error.message || error);
      }
    } catch (e: any) {
      console.warn('[Supabase] Erro ao tentar salvar destinatários do Telegram:', e?.message || e);
    }
  };

  // ==========================================
  // SEED AND LOADING ENGINE
  // ==========================================

  const seedSupabase = async (dist: Distributor) => {
    if (!supabase) return;
    try {
      const getSeedId = (originalId: string) => dist === 'A' ? originalId : `${originalId}_${dist}`;

      const dbProds = INITIAL_PRODUCTS.map(p => mapProductToDB({ ...p, id: getSeedId(p.id) }, dist));
      const dbClis = INITIAL_CLIENTS.map(c => {
        const mappedBalances: Record<string, number> = {};
        if (c.productBalances) {
          Object.entries(c.productBalances).forEach(([key, val]) => {
            mappedBalances[getSeedId(key)] = val;
          });
        }
        return mapClientToDB({
          ...c,
          id: getSeedId(c.id),
          productBalances: mappedBalances
        }, dist);
      });
      const dbSups = INITIAL_SUPPLIERS.map(s => mapSupplierToDB({ ...s, id: getSeedId(s.id) }, dist));
      const dbEmps = INITIAL_EMPLOYEES.map(e => mapEmployeeToDB({ ...e, id: getSeedId(e.id) }, dist));
      const dbVehs = INITIAL_VEHICLES.map(v => mapVehicleToDB({ ...v, id: getSeedId(v.id) }, dist));
      const dbDeliv = INITIAL_DELIVERY_ROUTES.map(r => mapDeliveryRouteToDB({ ...r, id: getSeedId(r.id) }, dist));
      const dbCount = INITIAL_COUNTING_ROUTES.map(r => mapCountingRouteToDB({ ...r, id: getSeedId(r.id) }, dist));
      const dbTransports = INITIAL_TRANSPORTS.map(t => mapTransportLiquidatedToDB({ ...t, id: getSeedId(t.id) }, dist));

      await Promise.all([
        supabase.from('products').insert(dbProds),
        supabase.from('clients').insert(dbClis),
        supabase.from('suppliers').insert(dbSups),
        supabase.from('employees').insert(dbEmps),
        supabase.from('vehicles').insert(dbVehs),
        supabase.from('delivery_routes').insert(dbDeliv),
        supabase.from('counting_routes').insert(dbCount),
        supabase.from('transports_liquidated').insert(dbTransports)
      ]);
      console.log(`Seeding of ${dist} completed successfully.`);
    } catch (e) {
      console.error(`Error seeding initial dataset to Supabase for ${dist}:`, e);
    }
  };

  const loadDataForDistributor = async (dist: Distributor) => {
    if (!supabase) {
      setDbStatus('disconnected');
      return;
    }
    setIsLoading(true);
    setDbStatus('checking');
    try {
      console.log(`Loading Supabase datasets for distributor: ${dist}`);
      const [
        productsRes,
        clientsRes,
        deliveryRoutesRes,
        countingRoutesRes,
        suppliersRes,
        employeesRes,
        vehiclesRes,
        transportsLiquidatedRes,
        movementLogsRes,
        transportsRes,
        sobraClienteLogsRes,
        countDocumentsRes
      ] = await Promise.all([
        supabase.from('products').select('*').eq('distributor', dist),
        supabase.from('clients').select('*').eq('distributor', dist),
        supabase.from('delivery_routes').select('*').eq('distributor', dist),
        supabase.from('counting_routes').select('*').eq('distributor', dist),
        supabase.from('suppliers').select('*').eq('distributor', dist),
        supabase.from('employees').select('*').or(`distributor.eq.${dist},perfil_tipo.eq.TI Admin`),
        supabase.from('vehicles').select('*').eq('distributor', dist),
        supabase.from('transports_liquidated').select('*').eq('distributor', dist),
        supabase.from('movement_logs').select('*').eq('distributor', dist).order('created_at', { ascending: false }),
        supabase.from('transports').select('*').eq('distributor', dist),
        supabase.from('sobra_cliente_logs').select('*').eq('distributor', dist).order('created_at', { ascending: false }),
        supabase.from('count_documents').select('*').eq('distributor', dist).order('created_at', { ascending: false })
      ]);

      const previousState = distributorStates[dist] || {
        products: [],
        clients: [],
        suppliers: [],
        employees: [],
        vehicles: [],
        transports: [],
        activeTransports: [],
        deliveryRoutes: [],
        countingRoutes: [],
        movementsHistory: [],
        sobraClientes: [],
        countDocuments: [],
      };

      // Keep previous state if query returns null (e.g. on missing tables or connection failure)
      let products = productsRes.data ? productsRes.data.map(mapProductFromDB) : (productsRes.error ? previousState.products : null);
      let clients = clientsRes.data ? clientsRes.data.map(mapClientFromDB) : (clientsRes.error ? previousState.clients : null);
      let deliveryRoutes = deliveryRoutesRes.data ? deliveryRoutesRes.data.map(mapDeliveryRouteFromDB) : (deliveryRoutesRes.error ? previousState.deliveryRoutes : null);
      let countingRoutes = countingRoutesRes.data ? countingRoutesRes.data.map(mapCountingRouteFromDB) : (countingRoutesRes.error ? previousState.countingRoutes : null);
      let suppliers = suppliersRes.data ? suppliersRes.data.map(mapSupplierFromDB) : (suppliersRes.error ? previousState.suppliers : null);
      let employees = employeesRes.data ? employeesRes.data.map(mapEmployeeFromDB) : (employeesRes.error ? previousState.employees : null);
      let vehicles = vehiclesRes.data ? vehiclesRes.data.map(mapVehicleFromDB) : (vehiclesRes.error ? previousState.vehicles : null);
      let transports = transportsLiquidatedRes.data ? transportsLiquidatedRes.data.map(mapTransportLiquidatedFromDB) : (transportsLiquidatedRes.error ? previousState.transports : null);
      let movementsHistory = movementLogsRes.data ? movementLogsRes.data.map(mapMovementLogFromDB) : (movementLogsRes.error ? previousState.movementsHistory : null);
      let activeTransports = transportsRes.data ? transportsRes.data.map(mapTransportFromDB) : (transportsRes.error ? previousState.activeTransports : null);
      let sobraClientes = sobraClienteLogsRes.data ? sobraClienteLogsRes.data.map(mapSobraClienteLogFromDB) : (sobraClienteLogsRes.error ? previousState.sobraClientes : null);
      let countDocuments = countDocumentsRes.data ? countDocumentsRes.data.map(mapCountDocumentFromDB) : (countDocumentsRes.error ? previousState.countDocuments : null);

      // Check for errors
      const errors = [
        productsRes.error, clientsRes.error, deliveryRoutesRes.error,
        countingRoutesRes.error, suppliersRes.error, employeesRes.error,
        vehiclesRes.error, transportsLiquidatedRes.error, movementLogsRes.error,
        transportsRes.error, sobraClienteLogsRes.error, countDocumentsRes.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.warn('[Supabase] Alguns erros ao carregar tabelas para o distribuidor:', dist, errors);
        setDbStatus('error');
        const hasRelationError = errors.some(e => e && (e.code === '42P01' || e.message?.includes('relation') || e.message?.includes('does not exist')));
        if (hasRelationError) {
          setDbErrorMessage('Uma ou mais tabelas do banco de dados não existem. Por favor, certifique-se de executar o script "supabase_schema.sql" no painel SQL do seu projeto Supabase para criar as tabelas.');
        } else {
          setDbErrorMessage(errors.map(e => e?.message || '').join(' | '));
        }
      } else {
        setDbStatus('connected');
        setDbErrorMessage(undefined);
      }

      // Fallback to previous state if null
      let finalProducts = products !== null ? products : previousState.products;
      let finalClients = clients !== null ? clients : previousState.clients;
      let finalDeliveryRoutes = deliveryRoutes !== null ? deliveryRoutes : previousState.deliveryRoutes;
      let finalCountingRoutes = countingRoutes !== null ? countingRoutes : previousState.countingRoutes;
      let finalSuppliers = suppliers !== null ? suppliers : previousState.suppliers;
      let finalEmployees = employees !== null ? employees : previousState.employees;
      let finalVehicles = vehicles !== null ? vehicles : previousState.vehicles;
      let finalTransports = transports !== null ? transports : previousState.transports;
      let finalMovementsHistory = movementsHistory !== null ? movementsHistory : previousState.movementsHistory;
      let finalActiveTransports = activeTransports !== null ? activeTransports : previousState.activeTransports;
      let finalSobraClientes = sobraClientes !== null ? sobraClientes : previousState.sobraClientes;
      let finalCountDocuments = countDocuments !== null ? countDocuments : previousState.countDocuments;

      // If distributor has no products, populate with defaults (ONLY for distributor A / ESTEVES E SILVA LTDA)
      if (finalProducts.length === 0 && dist === 'A') {
        console.log(`Supabase dataset is currently empty for distributor ${dist}. Seeding default assets in background...`);
        
        const getSeedId = (originalId: string) => dist === 'A' ? originalId : `${originalId}_${dist}`;

        // Use defaults for local state immediately to make app functional
        finalProducts = INITIAL_PRODUCTS.map(p => ({ ...p, id: getSeedId(p.id) }));
        finalClients = INITIAL_CLIENTS.map(c => {
          const mappedBalances: Record<string, number> = {};
          if (c.productBalances) {
            Object.entries(c.productBalances).forEach(([key, val]) => {
              mappedBalances[getSeedId(key)] = val;
            });
          }
          return {
            ...c,
            id: getSeedId(c.id),
            productBalances: mappedBalances
          };
        });
        finalDeliveryRoutes = INITIAL_DELIVERY_ROUTES.map(r => ({ ...r, id: getSeedId(r.id) }));
        finalCountingRoutes = INITIAL_COUNTING_ROUTES.map(r => ({ ...r, id: getSeedId(r.id) }));
        finalSuppliers = INITIAL_SUPPLIERS.map(s => ({ ...s, id: getSeedId(s.id) }));
        finalEmployees = INITIAL_EMPLOYEES.map(e => ({ ...e, id: getSeedId(e.id) }));
        finalVehicles = INITIAL_VEHICLES.map(v => ({ ...v, id: getSeedId(v.id) }));
        finalTransports = INITIAL_TRANSPORTS.map(t => ({ ...t, id: getSeedId(t.id) }));

        // Fire and forget seed in background - do NOT recursively reload
        seedSupabase(dist).catch(err => {
          console.error(`Background seeding failed for ${dist}:`, err);
        });
      }

      const updatedState: AppState = {
        products: finalProducts,
        clients: finalClients,
        deliveryRoutes: finalDeliveryRoutes,
        countingRoutes: finalCountingRoutes,
        suppliers: finalSuppliers,
        employees: finalEmployees,
        vehicles: finalVehicles,
        transports: finalTransports,
        movementsHistory: finalMovementsHistory,
        activeTransports: finalActiveTransports,
        sobraClientes: finalSobraClientes,
        countDocuments: finalCountDocuments
      };

      setDistributorStates(prev => ({
        ...prev,
        [dist]: updatedState
      }));

    } catch (error: any) {
      console.warn(`Failed to load data from Supabase for distributor ${dist}:`, error);
      setDbStatus('error');
      setDbErrorMessage(error?.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const loadTelegramRecipients = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('telegram_recipients').select('*');
      if (error) {
        if (error.code === '42P01') {
          console.warn(
            `[Supabase] A tabela 'telegram_recipients' ainda não foi criada no banco de dados. ` +
            `Os destinatários do Telegram padrão serão usados localmente em memória. ` +
            `Para sincronizar, crie a tabela executando o script correspondente em 'supabase_schema.sql'.`
          );
        } else {
          console.warn('[Supabase] Erro ao carregar destinatários do Telegram:', error.message || error);
        }
        return; // Gracefully keep the initial default in-memory state
      }
      if (data && data.length > 0) {
        setTelegramRecipients(data.map(mapTelegramRecipientFromDB));
      } else {
        const defaults = [
          { id: '8987478627', name: 'Suporte Movix Central', checked: true },
          { id: '1287498374', name: 'Logística Regional', checked: true },
          { id: '5572834910', name: 'Gerente Operacional', checked: false }
        ];
        try {
          const { error: insertError } = await supabase.from('telegram_recipients').insert(defaults.map(mapTelegramRecipientToDB));
          if (insertError) {
            console.warn('[Supabase] Erro ao inserir destinatários padrão do Telegram:', insertError.message || insertError);
          }
        } catch (insertErr) {
          console.warn('[Supabase] Falha ao tentar salvar os destinatários padrão do Telegram:', insertErr);
        }
        setTelegramRecipients(defaults);
      }
    } catch (e: any) {
      console.warn('[Supabase] Erro ao carregar destinatários do Telegram:', e?.message || e);
    }
  };

  // Safely restore basic local session variables on mount
  useEffect(() => {
    const loadSession = () => {
      const isAuth = localStorage.getItem('movix_authenticated') === 'true';
      setAuthenticated(isAuth);

      const savedDist = localStorage.getItem('movix_active_distributor') as Distributor;
      if (savedDist && distributors.some(d => d.id === savedDist)) {
        setActiveDistributor(savedDist);
      }

      const savedView = localStorage.getItem('movix_active_view') as any;
      if (savedView) {
        setActiveView(savedView);
      }

      const savedTab = localStorage.getItem('movix_active_cadastro_tab') as any;
      if (savedTab) {
        setActiveCadastroTab(savedTab);
      }

      const savedEmail = localStorage.getItem('movix_user_email');
      if (savedEmail) {
        setCurrentUserEmail(savedEmail);
      }

      setHydrated(true);
    };

    const runTimer = setTimeout(loadSession, 0);
    return () => clearTimeout(runTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync session indicators back to local storage
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('movix_authenticated', String(authenticated));
    localStorage.setItem('movix_active_distributor', activeDistributor);
    localStorage.setItem('movix_active_view', activeView);
    localStorage.setItem('movix_active_cadastro_tab', activeCadastroTab);
  }, [authenticated, activeDistributor, activeView, activeCadastroTab, hydrated]);

  // Unified sync database helper that handles dynamic client discovery
  const syncDatabase = async (distId: Distributor) => {
    setDbStatus('checking');
    setDbErrorMessage(undefined);
    
    let isClientReady = !!supabase;
    if (!isClientReady) {
      try {
        const res = await fetch('/api/supabase-config');
        if (res.ok) {
          const data = await res.json();
          if (data.supabaseUrl && data.supabaseAnonKey) {
            const client = initializeDynamicSupabase(data.supabaseUrl, data.supabaseAnonKey);
            isClientReady = !!client;
          }
        }
      } catch (err) {
        console.warn('[Supabase] Erro ao buscar chaves de runtime via API:', err);
      }
    }

    if (!isClientReady) {
      setDbStatus('disconnected');
      return;
    }

    try {
      await loadDistributors();
      await loadDataForDistributor(distId);
      await loadTelegramRecipients();
    } catch (e: any) {
      console.warn('[Supabase] Falha na sincronização dos dados:', e);
      setDbStatus('error');
      setDbErrorMessage(e?.message || String(e));
    }
  };

  const retryDbConnection = async () => {
    await syncDatabase(activeDistributor);
  };

  // Load from Supabase dynamically on Distributor switches or mount hydration
  useEffect(() => {
    if (hydrated) {
      const timer = setTimeout(() => {
        syncDatabase(activeDistributor);
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDistributor, hydrated]);

  // Automatically resolve logged-in user's distributor and role
  useEffect(() => {
    const checkUserProfile = async () => {
      if (authenticated && hydrated && currentUserEmail) {
        const emailLower = currentUserEmail.trim().toLowerCase();
        if (emailLower === 'flavio.esteves@movix.com.br' || emailLower === 'jonatan.agostinho@movix.com.br') {
          setUserRole('TI Admin');
          setUserDistributorId(null);
          
          if (supabase) {
            try {
              const name = emailLower === 'flavio.esteves@movix.com.br' ? 'Flavio Esteves' : 'Jonatan Agostinho';
              const { data, error } = await supabase
                .from('employees')
                .select('email')
                .eq('email', emailLower);

              if (!error && (!data || data.length === 0)) {
                const newEmp = {
                  id: emailLower === 'flavio.esteves@movix.com.br' ? 'emp_flavio_esteves' : 'emp_jonatan_agostinho',
                  distributor: 'A',
                  empresa: 'MOVIX CENTRAL',
                  nome: name,
                  cargo: 'ADM Master',
                  email: emailLower,
                  perfil_tipo: 'TI Admin',
                  enable_telegram: true,
                  telegram_chat_id: emailLower === 'flavio.esteves@movix.com.br' ? '8987478627' : null
                };
                await supabase.from('employees').upsert(newEmp);
              }
            } catch (err) {
              console.warn('[Auto-Integration] Falha ao tentar registrar TI Admin:', err);
            }
          }
          return;
        }
        if (supabase) {
          try {
            const { data } = await supabase
              .from('employees')
              .select('distributor, perfil_tipo')
              .eq('email', emailLower);
            if (data && data.length > 0) {
              const userDist = data[0].distributor;
              const userPerfil = data[0].perfil_tipo;
              if (userPerfil === 'TI Admin') {
                setUserRole('TI Admin');
                setUserDistributorId(null);
              } else {
                setUserRole(userPerfil || null);
                setUserDistributorId(userDist || null);
                if (['Gerencial', 'Administrativo', 'Logístico', 'Entregador', 'Comercial', 'Conferencia'].includes(userPerfil)) {
                  if (activeDistributor !== userDist) {
                    setActiveDistributor(userDist);
                  }
                }
              }
            } else {
              setUserRole(null);
              setUserDistributorId(null);
            }
          } catch (err) {
            console.error('Error resolving user profile:', err);
          }
        }
      } else {
        setUserRole(null);
        setUserDistributorId(null);
      }
    };
    checkUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, hydrated, currentUserEmail]);

  const login = (email: string) => {
    setAuthenticated(true);
    setCurrentUserEmail(email);
    if (typeof window !== 'undefined') {
      localStorage.setItem('movix_user_email', email);
    }
  };

  const logout = () => {
    setAuthenticated(false);
    setUserRole(null);
    setUserDistributorId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('movix_authenticated');
      localStorage.removeItem('movix_user_email');
    }
  };

  const selectDistributor = (dist: Distributor) => {
    if (['Gerencial', 'Administrativo', 'Logístico', 'Entregador', 'Comercial', 'Conferencia'].includes(userRole || '') && userDistributorId && dist !== userDistributorId) {
      alert(`Acesso Restrito: Seu perfil ${userRole} só permite o acesso ao seu distribuidor cadastrado.`);
      return;
    }
    setActiveDistributor(dist);
  };

  const getActiveState = (): AppState => {
    const state = distributorStates[activeDistributor];
    if (state) return state;

    // Default structure for non-existent distributor states
    const emptyState: AppState = {
      products: [],
      clients: [],
      suppliers: [],
      employees: [],
      vehicles: [],
      transports: [],
      activeTransports: [],
      deliveryRoutes: [],
      countingRoutes: [],
      movementsHistory: [],
      sobraClientes: [],
      countDocuments: [],
    };
    return emptyState;
  };

  const updateActiveStateBySetter = (updater: (prev: AppState) => AppState) => {
    setDistributorStates(prev => {
      const current = prev[activeDistributor] || {
        products: [],
        clients: [],
        suppliers: [],
        employees: [],
        vehicles: [],
        transports: [],
        activeTransports: [],
        deliveryRoutes: [],
        countingRoutes: [],
        movementsHistory: [],
        sobraClientes: [],
        countDocuments: [],
      };
      return {
        ...prev,
        [activeDistributor]: updater(current)
      };
    });
  };

  const activeState = getActiveState();

  // PRODUCTS ACTIONS
  const addProduct = (prod: Omit<Product, 'id'>) => {
    const exists = activeState.products.some(p => p.code.toLowerCase() === prod.code.toLowerCase());
    if (exists) {
      return { success: false, error: `Material com código ${prod.code} já existe.` };
    }
    const newProduct: Product = {
      ...prod,
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    };
    updateActiveStateBySetter(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
    saveProductToSupabase(newProduct);
    return { success: true };
  };

  const updateProduct = (updated: Product) => {
    const conflict = activeState.products.some(p => p.id !== updated.id && p.code.toLowerCase() === updated.code.toLowerCase());
    if (conflict) {
      return { success: false, error: `Material com código ${updated.code} já existe em outro produto.` };
    }
    updateActiveStateBySetter(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === updated.id ? updated : p)
    }));
    saveProductToSupabase(updated);
    return { success: true };
  };

  const deleteProduct = (id: string) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
    deleteProductFromSupabase(id);
  };

  const incrementProductStocks = (updates: { [productId: string]: number }) => {
    updateActiveStateBySetter(prev => {
      const updatedProducts = prev.products.map(p => {
        const added = updates[p.id] || 0;
        if (added > 0) {
          const updatedProd = {
            ...p,
            initialStock: p.initialStock + added
          };
          saveProductToSupabase(updatedProd);
          return updatedProd;
        }
        return p;
      });
      return {
        ...prev,
        products: updatedProducts
      };
    });
  };

  const decrementProductStocks = (updates: { [productId: string]: number }) => {
    updateActiveStateBySetter(prev => {
      const updatedProducts = prev.products.map(p => {
        const removed = updates[p.id] || 0;
        if (removed > 0) {
          const updatedProd = {
            ...p,
            initialStock: Math.max(0, p.initialStock - removed)
          };
          saveProductToSupabase(updatedProd);
          return updatedProd;
        }
        return p;
      });
      return {
        ...prev,
        products: updatedProducts
      };
    });
  };

  // CLIENTS ACTIONS
  const addClient = (cli: Omit<Client, 'id' | 'matricula' | 'saldoLoja' | 'saldoContagem'>) => {
    const exists = activeState.clients.some(c => c.cnpj === cli.cnpj);
    if (exists) {
      return { success: false, error: `Cliente com CNPJ ${cli.cnpj} já está cadastrado.` };
    }

    let maxNum = 0;
    activeState.clients.forEach(c => {
      const num = parseInt(c.matricula, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    const formattedMatricula = String(nextNum).padStart(4, '0');

    const newClient: Client = {
      ...cli,
      id: 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      matricula: formattedMatricula,
      saldoLoja: 0,
      productBalances: {},
      saldoContagem: 0,
      statusEntrega: 'Vazio',
      statusDuranteContagem: 'Vazio',
      statusFinalContagem: 'Vazio'
    };

    updateActiveStateBySetter(prev => ({
      ...prev,
      clients: [...prev.clients, newClient]
    }));
    saveClientToSupabase(newClient);
    return { success: true };
  };

  const addClientsBulk = (clis: Omit<Client, 'id' | 'matricula' | 'saldoLoja' | 'saldoContagem'>[]) => {
    let addedCount = 0;
    let errorCount = 0;
    let lastError = '';
    const newlyAdded: Client[] = [];

    updateActiveStateBySetter(prev => {
      let maxNum = 0;
      prev.clients.forEach(c => {
        const num = parseInt(c.matricula, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      });

      const existingCnpjs = new Set(prev.clients.map(c => c.cnpj));
      const newClients: Client[] = [];

      clis.forEach(cli => {
        if (existingCnpjs.has(cli.cnpj)) {
          errorCount++;
          lastError = `Cliente com CNPJ ${cli.cnpj} já está cadastrado.`;
          return;
        }

        maxNum++;
        const formattedMatricula = String(maxNum).padStart(4, '0');
        const newClient: Client = {
          ...cli,
          id: 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) + '_' + maxNum,
          matricula: formattedMatricula,
          saldoLoja: 0,
          productBalances: {},
          saldoContagem: 0,
          statusEntrega: 'Vazio',
          statusDuranteContagem: 'Vazio',
          statusFinalContagem: 'Vazio'
        };
        newClients.push(newClient);
        newlyAdded.push(newClient);
        existingCnpjs.add(cli.cnpj);
        addedCount++;
      });

      return {
        ...prev,
        clients: [...prev.clients, ...newClients]
      };
    });

    newlyAdded.forEach(c => saveClientToSupabase(c));

    return {
      success: addedCount > 0,
      addedCount,
      errorCount,
      lastError: lastError || undefined
    };
  };

  const updateClient = (updated: Client) => {
    const conflict = activeState.clients.some(c => c.id !== updated.id && c.cnpj === updated.cnpj);
    if (conflict) {
      return { success: false, error: `Outro cliente já está cadastrado com o CNPJ ${updated.cnpj}.` };
    }
    updateActiveStateBySetter(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === updated.id ? updated : c)
    }));
    saveClientToSupabase(updated);
    return { success: true };
  };

  const deleteClient = (id: string) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id)
    }));
    deleteClientFromSupabase(id);
  };

  // SUPPLIERS ACTIONS
  const addSupplier = (sup: Omit<Supplier, 'id'>) => {
    const exists = activeState.suppliers.some(s => s.cnpj === sup.cnpj);
    if (exists) {
      return { success: false, error: `Fornecedor com CNPJ ${sup.cnpj} já cadastrado.` };
    }
    const newSup: Supplier = {
      ...sup,
      id: 'sup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    updateActiveStateBySetter(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSup]
    }));
    saveSupplierToSupabase(newSup);
    return { success: true };
  };

  const updateSupplier = (updated: Supplier) => {
    const conflict = activeState.suppliers.some(s => s.id !== updated.id && s.cnpj === updated.cnpj);
    if (conflict) {
      return { success: false, error: `Outro fornecedor possui o CNPJ ${updated.cnpj}.` };
    }
    updateActiveStateBySetter(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === updated.id ? updated : s)
    }));
    saveSupplierToSupabase(updated);
    return { success: true };
  };

  const deleteSupplier = (id: string) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id)
    }));
    deleteSupplierFromSupabase(id);
  };

  // EMPLOYEES ACTIONS
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const exists = activeState.employees.some(e => e.email.toLowerCase() === emp.email.toLowerCase());
    if (exists) {
      return { success: false, error: `Funcionário com e-mail ${emp.email} já cadastrado.` };
    }
    const newEmp: Employee = {
      ...emp,
      id: 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    updateActiveStateBySetter(prev => ({
      ...prev,
      employees: [...prev.employees, newEmp]
    }));
    saveEmployeeToSupabase(newEmp);
    return { success: true };
  };

  const updateEmployee = (updated: Employee) => {
    const conflict = activeState.employees.some(e => e.id !== updated.id && e.email.toLowerCase() === updated.email.toLowerCase());
    if (conflict) {
      return { success: false, error: `Outro funcionário já possui o e-mail ${updated.email}.` };
    }
    updateActiveStateBySetter(prev => ({
      ...prev,
      employees: prev.employees.map(e => e.id === updated.id ? updated : e)
    }));
    saveEmployeeToSupabase(updated);
    return { success: true };
  };

  const deleteEmployee = (id: string) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      employees: prev.employees.filter(e => e.id !== id)
    }));
    deleteEmployeeFromSupabase(id);
  };

  // VEHICLES ACTIONS
  const addVehicle = (veh: Omit<Vehicle, 'id'>) => {
    const cleanPlaca = veh.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const exists = activeState.vehicles.some(v => v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlaca);
    if (exists) {
      return { success: false, error: `Veículo com placa ${veh.placa} já está cadastrado.` };
    }
    const newVeh: Vehicle = {
      ...veh,
      id: 'veh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    updateActiveStateBySetter(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, newVeh]
    }));
    saveVehicleToSupabase(newVeh);
    return { success: true };
  };

  const updateVehicle = (updated: Vehicle) => {
    const cleanPlaca = updated.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const conflict = activeState.vehicles.some(v => v.id !== updated.id && v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlaca);
    if (conflict) {
      return { success: false, error: `Veículo com placa ${updated.placa} já está cadastrado.` };
    }
    updateActiveStateBySetter(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === updated.id ? updated : v)
    }));
    saveVehicleToSupabase(updated);
    return { success: true };
  };

  const deleteVehicle = (id: string) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id)
    }));
    deleteVehicleFromSupabase(id);
  };

  // DELIVERY ROUTES ACTIONS
  const addDeliveryRoute = (route: Omit<DeliveryRoute, 'id'>) => {
    const exists = (activeState.deliveryRoutes || []).some(r => r.numeroRota === route.numeroRota);
    if (exists) {
      return { success: false, error: `Rota de Entrega Nº ${route.numeroRota} já está cadastrada.` };
    }
    const newRoute: DeliveryRoute = {
      ...route,
      id: 're_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    updateActiveStateBySetter(prev => ({
      ...prev,
      deliveryRoutes: [...(prev.deliveryRoutes || []), newRoute]
    }));
    saveDeliveryRouteToSupabase(newRoute);
    return { success: true };
  };

  const updateDeliveryRoute = (updated: DeliveryRoute) => {
    const conflict = (activeState.deliveryRoutes || []).some(r => r.id !== updated.id && r.numeroRota === updated.numeroRota);
    if (conflict) {
      return { success: false, error: `Rota de Entrega Nº ${updated.numeroRota} já está cadastrada.` };
    }
    updateActiveStateBySetter(prev => ({
      ...prev,
      deliveryRoutes: (prev.deliveryRoutes || []).map(r => r.id === updated.id ? updated : r)
    }));
    saveDeliveryRouteToSupabase(updated);
    return { success: true };
  };

  const deleteDeliveryRoute = (id: string) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      deliveryRoutes: (prev.deliveryRoutes || []).filter(r => r.id !== id)
    }));
    deleteDeliveryRouteFromSupabase(id);
  };

  // COUNTING ROUTES ACTIONS
  const addCountingRoute = (route: Omit<CountingRoute, 'id'>) => {
    const exists = (activeState.countingRoutes || []).some(r => r.numeroRota === route.numeroRota);
    if (exists) {
      return { success: false, error: `Rota de Contagem Nº ${route.numeroRota} já está cadastrada.` };
    }
    const newRoute: CountingRoute = {
      ...route,
      id: 'rc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    updateActiveStateBySetter(prev => ({
      ...prev,
      countingRoutes: [...(prev.countingRoutes || []), newRoute]
    }));
    saveCountingRouteToSupabase(newRoute);
    return { success: true };
  };

  const updateCountingRoute = (updated: CountingRoute) => {
    const conflict = (activeState.countingRoutes || []).some(r => r.id !== updated.id && r.numeroRota === updated.numeroRota);
    if (conflict) {
      return { success: false, error: `Rota de Contagem Nº ${updated.numeroRota} já está cadastrada.` };
    }
    updateActiveStateBySetter(prev => ({
      ...prev,
      countingRoutes: (prev.countingRoutes || []).map(r => r.id === updated.id ? updated : r)
    }));
    saveCountingRouteToSupabase(updated);
    return { success: true };
  };

  const deleteCountingRoute = (id: string) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      countingRoutes: (prev.countingRoutes || []).filter(r => r.id !== id)
    }));
    deleteCountingRouteFromSupabase(id);
  };

  const getLoggedInUserName = () => {
    const emailLower = currentUserEmail.toLowerCase();
    if (emailLower === 'flavio.esteves@movix.com.br') return 'Flavio Esteves';
    if (emailLower === 'jonatan.agostinho@movix.com.br') return 'Jonatan Agostinho';
    const found = activeState.employees.find(e => e.email.toLowerCase() === emailLower);
    if (found) return found.nome;
    if (currentUserEmail === 'exemplo@movix.com.br') return 'Marta TI';
    return 'Marta TI'; // fallback
  };

  const addMovementLog = (log: Omit<MovementLog, 'id'>) => {
    const newLog: MovementLog = {
      ...log,
      id: 'ml_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    updateActiveStateBySetter(prev => ({
      ...prev,
      movementsHistory: [newLog, ...(prev.movementsHistory || [])]
    }));
    saveMovementLogToSupabase(newLog);
  };

  const addSobraCliente = (log: Omit<SobraClienteLog, 'id'>) => {
    const newLog: SobraClienteLog = {
      ...log,
      id: 'sc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    updateActiveStateBySetter(prev => ({
      ...prev,
      sobraClientes: [newLog, ...(prev.sobraClientes || [])]
    }));
    saveSobraClienteToSupabase(newLog);
  };

  const addCountDocument = (doc: CountDocument) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      countDocuments: [doc, ...(prev.countDocuments || [])]
    }));
    saveCountDocumentToSupabase(doc);
  };

  const updateCountDocument = (updated: CountDocument) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      countDocuments: (prev.countDocuments || []).map(d => d.id === updated.id ? updated : d)
    }));
    saveCountDocumentToSupabase(updated);
  };

  const triggerSuporteStatusUpdate = () => {
    updateActiveStateBySetter(prev => {
      const updatedClients = (prev.clients || []).map(c => {
        let statusEntrega = c.statusEntrega || 'Vazio';
        if (statusEntrega === 'Liquidado' || statusEntrega === 'LIQUIDADO') {
          statusEntrega = 'Disponível';
        }
        const updatedCli = {
          ...c,
          statusEntrega,
          statusDuranteContagem: 'Vazio'
        };
        saveClientToSupabase(updatedCli);
        return updatedCli;
      });

      const updatedActiveTransports = (prev.activeTransports || []).map(t => {
        let tipoTransporte = t.tipoTransporte;
        if (tipoTransporte === 'Fechado' || tipoTransporte === 'FECHADO') {
          tipoTransporte = 'Finalizado';
        }
        const updatedTrans = {
          ...t,
          tipoTransporte
        };
        saveTransportToSupabase(updatedTrans);
        return updatedTrans;
      });

      const updatedCountingRoutes = (prev.countingRoutes || []).map(r => {
        let statusRotaContagem = r.statusRotaContagem || 'Disponível';
        if (statusRotaContagem.trim().toLowerCase() === 'finalizada' || statusRotaContagem.trim().toLowerCase() === 'finalizado') {
          statusRotaContagem = 'Disponível';
        }
        const updatedRoute = {
          ...r,
          statusRotaContagem
        };
        saveCountingRouteToSupabase(updatedRoute);
        return updatedRoute;
      });

      return {
        ...prev,
        clients: updatedClients,
        activeTransports: updatedActiveTransports,
        countingRoutes: updatedCountingRoutes
      };
    });
  };

  const addActiveTransport = (transport: Transport) => {
    const decrements: { [productId: string]: number } = {};
    Object.entries(transport.stock).forEach(([prodId, val]) => {
      if (val.veiculo > 0) {
        decrements[prodId] = val.veiculo;
      }
    });

    updateActiveStateBySetter(prev => {
      const updatedProducts = prev.products.map(p => {
        const removed = decrements[p.id] || 0;
        const updatedProd = {
          ...p,
          initialStock: Math.max(0, p.initialStock - removed)
        };
        if (removed > 0) {
          saveProductToSupabase(updatedProd);
        }
        return updatedProd;
      });

      return {
        ...prev,
        products: updatedProducts,
        activeTransports: [...(prev.activeTransports || []), transport]
      };
    });
    saveTransportToSupabase(transport);
  };

  const deleteActiveTransport = (transportId: string) => {
    const transport = (activeState.activeTransports || []).find(t => t.id === transportId);
    if (!transport) return;

    const increments: { [productId: string]: number } = {};
    Object.entries(transport.stock).forEach(([prodId, val]) => {
      if (val.veiculo > 0) {
        increments[prodId] = val.veiculo;
      }
    });

    updateActiveStateBySetter(prev => {
      const updatedProducts = prev.products.map(p => {
        const added = increments[p.id] || 0;
        const updatedProd = {
          ...p,
          initialStock: p.initialStock + added
        };
        if (added > 0) {
          saveProductToSupabase(updatedProd);
        }
        return updatedProd;
      });

      return {
        ...prev,
        products: updatedProducts,
        activeTransports: (prev.activeTransports || []).filter(t => t.id !== transportId)
      };
    });
    deleteTransportFromSupabase(transportId);
  };

  const updateActiveTransport = (transport: Transport) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      activeTransports: (prev.activeTransports || []).map(t => t.id === transport.id ? transport : t)
    }));
    saveTransportToSupabase(transport);
  };

  const addLiquidatedTransport = (transport: TransportLiquidated) => {
    updateActiveStateBySetter(prev => ({
      ...prev,
      transports: [transport, ...(prev.transports || [])]
    }));
    saveTransportLiquidatedToSupabase(transport);
  };

  const zerarSaldosEmTransporte = () => {
    updateActiveStateBySetter(prev => {
      const returnedStocks: { [productId: string]: number } = {};
      const activeTransports = prev.activeTransports || [];
      activeTransports.forEach(t => {
        Object.entries(t.stock || {}).forEach(([productId, s]) => {
          const qty = (s.veiculo || 0) + (s.coleta || 0) + (s.cliente || 0);
          if (qty > 0) {
            returnedStocks[productId] = (returnedStocks[productId] || 0) + qty;
          }
        });
      });

      const updatedProducts = prev.products.map(p => {
        const returned = returnedStocks[p.id] || 0;
        const updatedProd = {
          ...p,
          initialStock: p.initialStock + returned
        };
        saveProductToSupabase(updatedProd);
        return updatedProd;
      });

      const updatedActiveTransports = activeTransports.map(t => {
        const updatedStock: typeof t.stock = {};
        Object.entries(t.stock || {}).forEach(([productId, s]) => {
          updatedStock[productId] = {
            ...s,
            veiculo: 0,
            entrega: 0,
            coleta: 0,
            cliente: 0
          };
        });
        const updatedTrans = {
          ...t,
          statusTransporte: 'Finalizado' as const,
          tipoTransporte: 'Finalizado' as const,
          stock: updatedStock
        };
        saveTransportToSupabase(updatedTrans);
        return updatedTrans;
      });

      const updatedClients = prev.clients.map(c => {
        const updatedCli = {
          ...c,
          saldoLoja: 0,
          productBalances: {}
        };
        saveClientToSupabase(updatedCli);
        return updatedCli;
      });

      const updatedDeliveryRoutes = (prev.deliveryRoutes || []).map(r => {
        const updatedRoute = {
          ...r,
          statusRotaEntrega: 'DISPONÍVEL'
        };
        saveDeliveryRouteToSupabase(updatedRoute);
        return updatedRoute;
      });

      deleteSobraClienteLogsAllFromSupabase();

      return {
        ...prev,
        products: updatedProducts,
        activeTransports: updatedActiveTransports,
        clients: updatedClients,
        deliveryRoutes: updatedDeliveryRoutes,
        sobraClientes: []
      };
    });
  };

  const clearAllTransportsAndHistory = () => {
    updateActiveStateBySetter(prev => {
      const returnedStocks: { [productId: string]: number } = {};
      const activeTransports = prev.activeTransports || [];
      activeTransports.forEach(t => {
        Object.entries(t.stock || {}).forEach(([productId, s]) => {
          const qty = s.veiculo || 0;
          if (qty > 0) {
            returnedStocks[productId] = (returnedStocks[productId] || 0) + qty;
          }
        });
      });

      const updatedProducts = prev.products.map(p => {
        const returned = returnedStocks[p.id] || 0;
        const updatedProd = {
          ...p,
          initialStock: p.initialStock + returned
        };
        saveProductToSupabase(updatedProd);
        return updatedProd;
      });

      const updatedDeliveryRoutes = (prev.deliveryRoutes || []).map(r => {
        const updatedRoute = {
          ...r,
          statusRotaEntrega: 'DISPONÍVEL'
        };
        saveDeliveryRouteToSupabase(updatedRoute);
        return updatedRoute;
      });

      const updatedClients = prev.clients.map(c => {
        const updatedCli = {
          ...c,
          statusEntrega: 'Vazio' as const,
          statusDuranteContagem: 'Vazio' as const,
          statusFinalContagem: 'Vazio' as const
        };
        saveClientToSupabase(updatedCli);
        return updatedCli;
      });

      if (supabase) {
        supabase.from('transports').delete().eq('distributor', activeDistributor).then();
        supabase.from('transports_liquidated').delete().eq('distributor', activeDistributor).then();
        supabase.from('sobra_cliente_logs').delete().eq('distributor', activeDistributor).then();
      }

      return {
        ...prev,
        products: updatedProducts,
        activeTransports: [],
        transports: [],
        deliveryRoutes: updatedDeliveryRoutes,
        clients: updatedClients,
        sobraClientes: []
      };
    });
  };

  const createDistributor = (name: string, cnpj: string): string => {
    const existingIds = distributors.map(d => d.id);
    const alphabet = 'BCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newId = '';
    for (const char of alphabet) {
      if (!existingIds.includes(char)) {
        newId = char;
        break;
      }
    }
    if (!newId) {
      newId = 'Z';
    }

    const newDist = { id: newId, name, cnpj };
    setDistributors(prev => [...prev, newDist]);
    saveDistributorToSupabase(newDist);

    // Initialize state for this distributor
    setDistributorStates(prev => ({
      ...prev,
      [newId]: {
        products: [],
        clients: [],
        suppliers: [],
        employees: [],
        vehicles: [],
        transports: [],
        activeTransports: [],
        deliveryRoutes: [],
        countingRoutes: [],
        movementsHistory: [],
        sobraClientes: [],
        countDocuments: [],
      }
    }));

    return newId;
  };

  const deleteDistributor = (id: string) => {
    setDistributors(prev => {
      const filtered = prev.filter(d => d.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('movix_distributors', JSON.stringify(filtered));
      }
      
      // If we are deleting the active one, select another
      if (activeDistributor === id) {
        if (filtered.length > 0) {
          setActiveDistributor(filtered[0].id);
        } else {
          setActiveDistributor('A');
        }
      }
      
      return filtered;
    });

    setDistributorStates(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    deleteDistributorFromSupabase(id);
  };

  const getDistributorStats = (distId: string) => {
    const state = distributorStates[distId];
    if (!state) return { clientsCount: 0, vehiclesCount: 0, employeesCount: 0, totalStockCount: 0 };
    
    const clientsCount = state.clients?.length || 0;
    const vehiclesCount = state.vehicles?.length || 0;
    const employeesCount = state.employees?.length || 0;
    
    const totalStockCount = (state.products || []).reduce((acc, p) => {
      const armazem = p.initialStock;
      const transporte = (state.activeTransports || []).filter(t => t.statusTransporte !== 'EXCLUIDO').reduce((sum, trp) => {
        return sum + (trp.stock?.[p.id]?.veiculo || 0);
      }, 0);
      const prodLoja = (state.clients || []).reduce((sum, c) => {
        if (c.productBalances && c.productBalances[p.id] !== undefined) {
          return sum + (c.productBalances[p.id] || 0);
        }
        const pIdx = (state.products || []).findIndex(prod => prod.id === p.id);
        const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
        return sum + Math.floor((c.saldoLoja || 0) * pct);
      }, 0);
      return acc + (armazem + transporte + prodLoja);
    }, 0);

    return { clientsCount, vehiclesCount, employeesCount, totalStockCount };
  };

  const activeDistributorName = distributors.find(d => d.id === activeDistributor)?.name || 'ESTEVES E SILVA LTDA';

  return (
    <AppContext.Provider
      value={{
        authenticated,
        login,
        logout,
        activeDistributor,
        activeDistributorName,
        selectDistributor,
        isLoading,
        distributors,
        createDistributor,
        deleteDistributor,
        getDistributorStats,
        
        // Active lists
        products: activeState.products,
        clients: activeState.clients,
        suppliers: activeState.suppliers,
        employees: activeState.employees,
        vehicles: activeState.vehicles,
        transports: activeState.transports,
        activeTransports: activeState.activeTransports || [],
        deliveryRoutes: activeState.deliveryRoutes || [],
        countingRoutes: activeState.countingRoutes || [],
        movementsHistory: activeState.movementsHistory || [],
        sobraClientes: activeState.sobraClientes || [],
        countDocuments: activeState.countDocuments || [],

        // Actions
        addProduct,
        updateProduct,
        deleteProduct,
        incrementProductStocks,
        decrementProductStocks,
        addActiveTransport,
        deleteActiveTransport,
        updateActiveTransport,
        addLiquidatedTransport,
        zerarSaldosEmTransporte,
        clearAllTransportsAndHistory,

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
        deleteCountingRoute,

        addMovementLog,
        addSobraCliente,
        addCountDocument,
        updateCountDocument,
        currentUserEmail,
        getLoggedInUserName,
        triggerSuporteStatusUpdate,
        userRole,
        setUserRole,
        userDistributorId,
        dbStatus,
        dbErrorMessage,
        retryDbConnection,

        // Routing views
        activeView,
        setActiveView,
        activeCadastroTab,
        setActiveCadastroTab,
        selectedAction,
        setSelectedAction,
        isInventoryLocked,
        setInventoryLocked,
        reportsTab,
        setReportsTab,
        telegramRecipients,
        setTelegramRecipients: updateTelegramRecipientsInSupabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
