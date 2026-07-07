import { Product, Client, Supplier, Employee, Vehicle, TransportLiquidated, DeliveryRoute, CountingRoute } from './types';

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const STATE_CITIES: Record<string, string[]> = {
  SP: ['São Paulo', 'Campinas', 'Guarulhos', 'São Bernardo do Campo', 'Santo André', 'Santos', 'São José dos Campos', 'Ribeirão Preto', 'Sorocaba', 'Osasco', 'Mogi das Cruzes', 'Jundiaí'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu', 'São Gonçalo', 'Petrópolis', 'Volta Redonda', 'Campos dos Goytacazes', 'Belford Roxo', 'Cabo Frio'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria', 'Gravataí', 'Novo Hamburgo', 'Viamão', 'São Leopoldo', 'Passo Fundo'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó', 'Criciúma', 'Itajaí', 'Jaraguá do Sul', 'Lages', 'Palhoça'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna', 'Juazeiro', 'Ilhéus', 'Lauro de Freitas', 'Jequié', 'Teixeira de Freitas'],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape'],
  DF: ['Brasília', 'Ceilândia', 'Taguatinga', 'Samambaia', 'Guará', 'Sobradinho', 'Águas Claras']
};

export const INITIAL_DELIVERY_ROUTES: DeliveryRoute[] = [
  { id: 're1', numeroRota: 1, cidade: 'São Paulo', bairroRegiao: 'Centro', complemento: 'Rota Principal Centro', statusRotaEntrega: 'DISPONÍVEL' },
  { id: 're2', numeroRota: 2, cidade: 'São Paulo', bairroRegiao: 'Zona Sul', complemento: 'Rota Vila Mariana', statusRotaEntrega: 'DISPONÍVEL' },
  { id: 're3', numeroRota: 3, cidade: 'São Paulo', bairroRegiao: 'Zona Leste', complemento: 'Rota Itaquera', statusRotaEntrega: 'DISPONÍVEL' },
  { id: 're4', numeroRota: 4, cidade: 'Rio de Janeiro', bairroRegiao: 'Zona Sul', complemento: 'Rota Copacabana', statusRotaEntrega: 'DISPONÍVEL' },
  { id: 're5', numeroRota: 5, cidade: 'Campinas', bairroRegiao: 'Norte', complemento: 'Rota Taquaral', statusRotaEntrega: 'DISPONÍVEL' },
  { id: 're6', numeroRota: 6, cidade: 'Belo Horizonte', bairroRegiao: 'Centro', complemento: 'Rota Savassi', statusRotaEntrega: 'DISPONÍVEL' }
];

export const INITIAL_COUNTING_ROUTES: CountingRoute[] = [
  { id: 'rc101', numeroRota: 101, cidade: 'São Paulo', bairroRegiao: 'Setor A', complemento: 'Contagem Central', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc102', numeroRota: 102, cidade: 'São Paulo', bairroRegiao: 'Setor B', complemento: 'Contagem Sul', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc103', numeroRota: 103, cidade: 'São Paulo', bairroRegiao: 'Setor C', complemento: 'Contagem Leste', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc104', numeroRota: 104, cidade: 'Rio de Janeiro', bairroRegiao: 'Setor Sul', complemento: 'Contagem Copacabana', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc105', numeroRota: 105, cidade: 'Campinas', bairroRegiao: 'Setor Norte', complemento: 'Contagem Taquaral', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc106', numeroRota: 106, cidade: 'Belo Horizonte', bairroRegiao: 'Setor Centro', complemento: 'Contagem Savassi', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc107', numeroRota: 107, cidade: 'Porto Alegre', bairroRegiao: 'Setor Sul', complemento: 'Contagem Ipanema', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc108', numeroRota: 108, cidade: 'Curitiba', bairroRegiao: 'Setor Oeste', complemento: 'Contagem Batel', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc109', numeroRota: 109, cidade: 'Salvador', bairroRegiao: 'Setor Norte', complemento: 'Contagem Pituba', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc110', numeroRota: 110, cidade: 'Recife', bairroRegiao: 'Setor Sul', complemento: 'Contagem Boa Viagem', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc111', numeroRota: 111, cidade: 'Fortaleza', bairroRegiao: 'Setor Leste', complemento: 'Contagem Aldeota', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc112', numeroRota: 112, cidade: 'Brasília', bairroRegiao: 'Setor Central', complemento: 'Contagem Asa Sul', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc113', numeroRota: 113, cidade: 'Niterói', bairroRegiao: 'Setor Icaraí', complemento: 'Contagem Icaraí', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc114', numeroRota: 114, cidade: 'Uberlândia', bairroRegiao: 'Setor Centro', complemento: 'Contagem Tibery', statusRotaContagem: 'DISPONÍVEL' },
  { id: 'rc115', numeroRota: 115, cidade: 'Joinville', bairroRegiao: 'Setor América', complemento: 'Contagem América', statusRotaContagem: 'DISPONÍVEL' }
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', code: 'PRD-001', description: 'CESTO PLASTICO', unit: 'UN', initialStock: 1500 },
  { id: 'p2', code: 'PRD-002', description: 'CARRINHO DOLLY', unit: 'UN', initialStock: 300 },
  { id: 'p3', code: 'PRD-003', description: 'PALLET PBRI', unit: 'UN', initialStock: 200 }
];

const RAZOES_SOCIAIS = [
  'Supermercado Silva e Filhos', 'Hortifruti da Família', 'Mercado Popular Ltda', 'Padaria Pão Quente',
  'Comércio de Alimentos Ideal', 'Hipermercado Preço Baixo', 'Armazém das Frutas', 'Empório do Sabor',
  'Supermercado Compre Bem', 'Mini Mercado Sol de Verão', 'Distribuidora Aliança', 'Hortifruti Verde Vale',
  'Panificadora central', 'Mercado São Jorge', 'Supermercado Progresso', 'Armazém do Trigo',
  'Quitanda Dona Maria', 'Mini Mercado O Baratão', 'Mercado Mar Azul', 'Empório Santo Antônio',
  'Supermercado Bom Preço', 'Comercial Mineira Ltda', 'Hortifruti Pomar', 'Supermercado Real',
  'Padaria Pão de Mel', 'Mercado Nosso Lar', 'Mini Mercado Econômico', 'Quitanda Central',
  'Armazém do Chefe', 'Supermercado Vila Rica', 'Hortifruti Natural', 'Comercial Silva',
  'Mercadinho Nova Era', 'Mini Mercado Unidade', 'Empório Gourmet', 'Supermercado Premium',
  'Panificadora Estrela', 'Hortifruti Estrela do Norte', 'Supermercado Serrano', 'Mercado de Canto'
];

const RESPONSAVEIS_NOMES = [
  'Claudio', 'Marcos', 'Aline', 'Carlos', 'Mariana', 'Roberto', 'Juliana', 'Fernando', 'Patrícia', 'Ricardo',
  'Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Lucas', 'Larissa', 'Mateus', 'Natália', 'Otávio', 'Priscila', 'Rafael', 'Sofia', 'Thiago', 'Vanessa',
  'William', 'Yara', 'Zeca', 'Beatriz', 'Caio', 'Débora', 'Estevão', 'Fernanda', 'Gustavo', 'Helena'
];

const RESPONSAVEIS_SOBRENOMES = [
  'Souza', 'Ferreira', 'Silva', 'Santos', 'Oliveira', 'Lima', 'Pereira', 'Costa', 'Rodrigues', 'Almeida',
  'Nascimento', 'Carvalho', 'Araújo', 'Melo', 'Barbosa', 'Ribeiro', 'Martins', 'Cardoso', 'Teixeira', 'Gomes',
  'Rocha', 'Marques', 'Sousa', 'Pinto', 'Dias', 'Castro', 'Mendes', 'Freitas', 'Vieira', 'Ramos',
  'Lopes', 'Santana', 'Moreira', 'Neves', 'Moura', 'Vargas', 'Borges', 'Machado', 'Pires', 'Duarte'
];

// Generate 40 clients with random routes
export const INITIAL_CLIENTS: Client[] = Array.from({ length: 40 }).map((_, index) => {
  const stateKeys = Object.keys(STATE_CITIES);
  const state = stateKeys[index % stateKeys.length];
  const cities = STATE_CITIES[state];
  const city = cities[index % cities.length];
  const routeEnt = String((index % 6) + 1); // 1 to 6
  const routeCont = String((index % 15) + 101); // 101 to 115

  const randomSaldoLoja = Math.floor(Math.random() * 20);
  const p1Bal = Math.floor(randomSaldoLoja * 0.5);
  const p2Bal = Math.floor(randomSaldoLoja * 0.35);
  const p3Bal = randomSaldoLoja - p1Bal - p2Bal;

  return {
    id: `c_${index + 1}`,
    matricula: String(index + 1).padStart(4, '0'),
    razaoSocial: RAZOES_SOCIAIS[index],
    cnpj: String(10000000000000 + index * 22334455).padStart(14, '0'),
    responsavelNome: RESPONSAVEIS_NOMES[index],
    responsavelSobrenome: RESPONSAVEIS_SOBRENOMES[index],
    responsavelContato: `119${String(99000000 + index * 12345).slice(0, 8)}`,
    endereco: `Rua das Oliveiras, Nº ${index * 7 + 12}`,
    numero: String(index * 7 + 12),
    bairro: 'Bairro Novo',
    cep: String(1000000 + index * 999).padStart(8, '0'),
    estado: state,
    cidade: city,
    rotaEntrega: routeEnt,
    rotaContagem: routeCont,
    saldoLoja: randomSaldoLoja,
    productBalances: {
      'p1': p1Bal,
      'p2': p2Bal,
      'p3': p3Bal
    },
    saldoContagem: Math.floor(Math.random() * 30),
    inativo: false,
    statusEntrega: 'Vazio',
    statusDuranteContagem: 'Vazio',
    statusFinalContagem: 'Vazio'
  };
});

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    razaoSocial: 'Metalúrgica União Imperial S/A',
    cnpj: '44555666000122',
    responsavelNome: 'Aline Pinheiro',
    responsavelContato: '31977776666',
    estado: 'MG',
    cidade: 'Belo Horizonte'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'e_master_1',
    empresa: 'MOVIX CENTRAL',
    nome: 'Flavio Esteves',
    cargo: 'ADM Master',
    email: 'flavio.esteves@movix.com.br',
    perfilTipo: 'TI Admin',
    telegramChatId: '8987478627',
    enableTelegram: true
  },
  {
    id: 'e_master_2',
    empresa: 'MOVIX CENTRAL',
    nome: 'Jonatan Agostinho',
    cargo: 'ADM Master',
    email: 'jonatan.agostinho@movix.com.br',
    perfilTipo: 'TI Admin',
    telegramChatId: '',
    enableTelegram: true
  },
  {
    id: 'e1',
    empresa: 'Distribuidor A',
    nome: 'Carlos Eduardo Oliveira',
    cargo: 'Gerente Logístico',
    email: 'carlos.eduardo@movix.com',
    perfilTipo: 'Administrador'
  },
  {
    id: 'e2',
    empresa: 'Distribuidor A',
    nome: 'Mariana Medeiros',
    cargo: 'Operadora de Inventário',
    email: 'mariana.m@movix.com',
    perfilTipo: 'Operador'
  },
  {
    id: 'e3',
    empresa: 'Distribuidor A',
    nome: 'João Silva de Souza',
    cargo: 'Motorista',
    email: 'joao.silva@movix.com',
    perfilTipo: 'Motorista'
  },
  {
    id: 'e4',
    empresa: 'Distribuidor A',
    nome: 'Valdir Rodrigues Pereira',
    cargo: 'Motorista',
    email: 'valdir.rodrigues@movix.com',
    perfilTipo: 'Motorista'
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', placa: 'ABC1C34', transportadora: 'Expresso Rápido S/A' },
  { id: 'v2', placa: 'XYZ5Y78', transportadora: 'Logística TransBrasil' }
];

export const INITIAL_TRANSPORTS: TransportLiquidated[] = [];
