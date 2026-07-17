export interface Product {
  id: string; // unique internal id
  code: string; // Material Code / Código do Material
  description: string; // Material Description / Descrição do Material
  unit: 'UN' | 'CX' | 'PÇ'; // Unit of Measure / Unidade de Medida
  initialStock: number; // Estoque Inicial por Contagem
  necessityQty?: number; // Quantidade de Necessidade
  valueR$?: number;      // Valor R$
}

export interface Client {
  id: string;
  matricula: string; // Sequential matricula e.g. "0001", "0002"
  razaoSocial: string;
  cnpj: string; // 14 numerical digits
  responsavelNome: string;
  responsavelSobrenome: string;
  responsavelContato: string;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  estado: string; // Acronym
  cidade: string;
  rotaEntrega: string;
  rotaContagem: string;
  // Specific client stocks
  saldoLoja: number; // default 0
  saldoContagem: number; // default 0
  productBalances?: { [productId: string]: number };
  inativo?: boolean; // Block/inactive flag
  statusEntrega?: string;
  statusDuranteContagem?: string;
  statusFinalContagem?: string;
  motivoNaoEntrega?: string;
  pickupQuantities?: { [productId: string]: number };
  deliveryQuantities?: { [productId: string]: number };
  contagemEstoque?: {
    [productId: string]: {
      cheio: number;
      vazio: number;
      dataContagem?: string;
    };
  };
}

export interface DeliveryRoute {
  id: string;
  numeroRota: number; // numbers only
  cidade: string;
  bairroRegiao: string;
  complemento?: string;
  statusRotaEntrega?: string;
}

export interface CountingRoute {
  id: string;
  numeroRota: number; // numbers only
  cidade: string;
  bairroRegiao: string;
  complemento?: string;
  statusRotaContagem?: string;
}

export interface Supplier {
  id: string;
  razaoSocial: string;
  cnpj: string; // 14 digits
  responsavelNome: string;
  responsavelContato: string;
  estado: string;
  cidade: string;
}

export interface Employee {
  id: string;
  empresa: string; // Auto-filled with selected distributor layout name
  nome: string;
  cargo: string;
  email: string;
  perfilTipo: string;
  telegramChatId?: string;
  enableTelegram?: boolean;
}

export interface Vehicle {
  id: string;
  placa: string;
  transportadora: string;
}

export interface TransportLiquidated {
  id: string;
  number: string;
  date: string;
  placa: string;
  driver: string;
  route: string;
  clientsCount: number;
  delivered: number;
  notDelivered: number;
  retirados?: number;
  effectiveness: number; // %
}

export interface MovementLog {
  id: string;
  nfNumber: string;
  date: string;
  supplier: string;
  responsible: string;
  observation: string;
  type: string; // e.g. "101 – ENTRADA POR NOTA FISCAL"
  items: {
    productCode: string;
    productDescription: string;
    qty: number;
    unit: string;
  }[];
}

export interface Transport {
  id: string;
  number: string;
  date: string;
  placa: string;
  driver: string;
  route: string;
  isForaDeRota: boolean;
  isMultiRota: boolean;
  selectedRouteIds: string[];
  selectedClientIds: string[];
  tipoTransporte: 'ABERTO' | 'FECHADO' | 'Aberto' | 'Fechado' | 'Finalizado';
  statusTransporte: 'CRIADO' | 'EM_ENTREGA' | 'LIQUIDADO' | 'EM_LIQUIDACAO' | 'EXCLUIDO' | 'Finalizado' | 'SAIDA' | 'SAÍDA';
  
  // Contadores
  clienteTotal: number;
  clienteEntregue: number;
  clienteNaoEntregue: number;
  clienteEmEntrega: number;
  clientesRetirados?: number;

  // Estoque temporário "TRANSPORTE"
  stock: {
    [productId: string]: {
      veiculo: number;
      entrega?: number;
      coleta: number;
      cliente: number;
      saidaEntrega?: number;
    }
  };
  observation?: string;
  clientWithdrawals?: {
    [clientId: string]: {
      [productId: string]: number;
    };
  };
  sobras?: {
    matricula: string;
    razaoSocial: string;
    codigoProduto: string;
    descricaoProduto: string;
    quantidadeSobra: number;
  }[];
}

export interface SobraClienteLog {
  id: string;
  matricula: string;
  razaoSocial: string;
  dataTransporte: string;
  numeroTransporte: string;
  codigoProduto: string;
  descricaoProduto: string;
  quantidadeSobra: number;
}

export interface CountDocument {
  id: string; // standard number format: DDMMYYYY-ROUTE, e.g. "29062026-50"
  date: string; // DD/MM/YYYY
  employeeName: string;
  route: string; // e.g. "50"
  totalClients: number;
  status: 'Aberto' | 'Finalizado';
  clientStatuses: {
    [clientId: string]: 'NÃO CONTADO' | 'CONTADO' | 'FECHADO';
  };
  clientCounts: {
    [clientId: string]: {
      [productId: string]: {
        cheio: number;
        vazio: number;
      };
    };
  };
  clientClosedFlags: {
    [clientId: string]: boolean;
  };
  clientContagemTiming?: {
    [clientId: string]: string;
  };
  // For summary/history:
  countsSummary?: {
    totalClients: number;
    contados: number;
    naoContados: number;
    fechados: number;
    aderencia: number; // percentage
    fechadosPerc: number; // percentage
  };
}

export interface TelegramRecipient {
  id: string;
  name: string;
  checked: boolean;
}


