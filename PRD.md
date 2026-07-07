# Documento de Requisitos de Produto (PRD) — Sistema MOVIX
### Guia de Especificação Técnica para Testes Automatizados, Verificação de Bugs e Auditoria de Segurança

Este documento descreve detalhadamente o funcionamento, a arquitetura, o modelo de banco de dados e as regras de negócios da aplicação **MOVIX (Gestão de Estoque e Transporte)**. Ele foi projetado especificamente para servir de insumo para ferramentas de testes automatizados (E2E, unitários, fuzzing) e ferramentas de análise de segurança (SAST/DAST, auditorias de banco de dados).

---

## 1. Visão Geral do Produto e Objetivos
O **MOVIX** é uma plataforma full-stack voltada à gestão logística de distribuição de mercadorias. Ele atende de forma multi-tenant distribuidores regionais e centraliza processos cruciais:
- **Gestão de Cargas e Transportes**: Planejamento, carregamento, acompanhamento e liquidação de rotas de entrega.
- **Controle de Estoque e Movimentação de Mercadorias**: Registro de notas fiscais de entrada/saída, conciliação e histórico de inventário.
- **Auditoria de Clientes (Contagem de Estoque)**: Auditorias periódicas em clientes cadastrados, com histórico temporal e cálculo de variações físicas de estoque.
- **Relatórios Automatizados**: Integração com APIs externas para envio de métricas de desempenho diretamente para canais e grupos de suporte via **Telegram Bot**.

---

## 2. Arquitetura do Sistema e Fluxo de Dados
A aplicação adota uma arquitetura moderna e reativa:
- **Client-Side/Frontend**: Next.js 15+ (App Router) utilizando React (`use client` para gerenciamento dinâmico de estados) e estilizado exclusivamente com Tailwind CSS.
- **Gerenciador de Estado**: `AppContext.tsx`. Controla todos os estados globais da aplicação (distribuidor ativo, produtos carregados, clientes, rotas, transportes ativos, permissões e histórico de auditoria). Os dados são mantidos em cache com reidratação offline via `localStorage` e sincronização assíncronas bidirecionais com o banco de dados.
- **Database e Backend-as-a-Service (BaaS)**: **Supabase** (PostgreSQL). Toda a persistência é feita via chamadas HTTP (PostgREST) geradas pelo cliente Supabase (`/lib/supabase.ts`) usando credenciais públicas anônimas.
- **Multi-Tenant (Isolamento de Dados)**: Quase todas as tabelas possuem uma coluna `distributor` (geralmente representada por `char(1)` ou `text`). O estado de execução filtra dinamicamente todos os dados com base no distribuidor selecionado pelo operador ativo.

---

## 3. Modelo de Dados Completo (Esquema Supabase/PostgreSQL)
Abaixo está o mapeamento detalhado das **14 tabelas** do banco de dados configurado no Supabase para guiar testes de injeção de dados (SQL Injection) e fuzzing de dados inválidos:

### 3.1 `distributors` (Tabela de Distribuidores Operativos)
- `id` (`text`, PRIMARY KEY): Identificador do distribuidor (ex: 'A', 'B', etc.).
- `name` (`text`, NOT NULL): Razão social do distribuidor.
- `cnpj` (`text`, NULL): CNPJ do distribuidor.
- `created_at` (`timestamp with time zone`, DEFAULT now()): Data de criação do registro.

### 3.2 `products` (Catálogo de Produtos)
- `id` (`text`, PRIMARY KEY): ID universal único (UUID).
- `distributor` (`char(1)`, NOT NULL, DEFAULT 'A'): Chave de tenant.
- `code` (`text`, NOT NULL): Código físico/comercial do produto (ex: '1001').
- `description` (`text`, NOT NULL): Descrição descritiva do item.
- `unit` (`text`, NOT NULL): Unidade de medida (ex: 'UN', 'CX', 'PÇ').
- `initial_stock` (`integer`, NOT NULL, DEFAULT 0): Saldo físico inicial.
- `necessity_qty` (`integer`, NULL): Quantidade de necessidade calculada.
- `value_rs` (`numeric`, NULL): Preço unitário em Reais.
- *Constraints*: `UNIQUE (distributor, code)`.

### 3.3 `clients` (Cadastro de Pontos de Entrega / Clientes)
- `id` (`text`, PRIMARY KEY).
- `distributor` (`char(1)`, NOT NULL, DEFAULT 'A').
- `matricula` (`text`, NOT NULL): Matrícula identificadora interna.
- `razao_social` (`text`, NOT NULL).
- `cnpj` (`text`, NOT NULL).
- `responsavel_nome` / `responsavel_sobrenome` / `responsavel_contato` (`text`, NOT NULL).
- `endereco` / `numero` / `bairro` / `cep` / `estado` / `cidade` (`text`, NOT NULL).
- `rota_entrega` / `rota_contagem` (`text`, NOT NULL): IDs ou números de rotas associadas.
- `saldo_loja` / `saldo_contagem` (`numeric`, NOT NULL, DEFAULT 0).
- `product_balances` (`jsonb`, DEFAULT '{}'): Mapa JSONB contendo o saldo de cada produto no estabelecimento `{ "PROD_CODE": QUANTIDADE }`.
- `inativo` (`boolean`, DEFAULT false).
- `status_entrega` / `status_durante_contagem` / `status_final_contagem` (`text`): Status de controle logístico ('Vazio', 'Pendente', 'Concluído').
- `pickup_quantities` / `delivery_quantities` / `contagem_estoque` (`jsonb`): Dados transitórios de auditoria e rotas de entrega ativa.
- *Constraints*: `UNIQUE (distributor, matricula)`, `UNIQUE (distributor, cnpj)`.

### 3.4 `delivery_routes` & `counting_routes` (Rotas Logísticas)
- `id` (`text`, PRIMARY KEY).
- `distributor` (`char(1)`, NOT NULL).
- `numero_rota` (`integer`, NOT NULL).
- `cidade` / `bairro_regiao` (`text`, NOT NULL).
- `complemento` (`text`, NULL).
- `status_rota_entrega` / `status_rota_contagem` (`text`): Estado da rota ('DISPONÍVEL', 'BLOQUEADO').
- *Constraints*: `UNIQUE (distributor, numero_rota)`.

### 3.5 `suppliers` (Fornecedores de Produtos)
- `id` (`text`, PRIMARY KEY).
- `distributor` (`char(1)`, NOT NULL).
- `razao_social` / `cnpj` / `responsavel_nome` / `responsavel_contato` / `estado` / `cidade` (`text`).
- *Constraints*: `UNIQUE (distributor, cnpj)`.

### 3.6 `employees` (Colaboradores e Controle de Acesso)
- `id` (`text`, PRIMARY KEY).
- `distributor` (`char(1)`, NOT NULL).
- `empresa` / `nome` / `cargo` / `email` / `perfil_tipo` (`text`, NOT NULL).
- `telegram_chat_id` (`text`, NULL): ID do chat do Telegram para relatórios individuais.
- `enable_telegram` (`boolean`, DEFAULT true).
- *Constraints*: `UNIQUE (distributor, email)`.

### 3.7 `vehicles` (Frotas de Entrega)
- `id` (`text`, PRIMARY KEY).
- `distributor` (`char(1)`, NOT NULL).
- `placa` / `transportadora` (`text`, NOT NULL).
- *Constraints*: `UNIQUE (distributor, placa)`.

### 3.8 `transports` (Registros de Carga Ativos)
- `id` (`text`, PRIMARY KEY).
- `distributor` (`char(1)`, NOT NULL).
- `number` (`text`): Número incremental do carregamento.
- `date` (`text`): Data do transporte.
- `placa` / `driver` / `route` (`text`, NOT NULL).
- `is_fora_de_rota` / `is_multi_rota` (`boolean`, DEFAULT false).
- `selected_route_ids` (`jsonb`): Lista de IDs de rotas associadas a esta carga se for multi-rota.
- `selected_client_ids` (`jsonb`): Lista de IDs dos clientes afetados nesta viagem.
- `tipo_transporte` (`text`): Ex: 'Carga Comercial', 'Transferência'.
- `status_transporte` (`text`): Estado da carga ('EM DIGITAÇÃO', 'EM ROTA', 'LIQUIDADO').
- `stock` (`jsonb`): Mapa de produtos carregados no veículo `{ "PROD_CODE": QTD_CARREGADA }`.
- `client_withdrawals` (`jsonb`): Retiradas e devoluções declaradas por cliente.
- `sobras` (`jsonb`): Sobras ou divergências registradas na volta da rota.

### 3.9 `transports_liquidated` (Histórico de Cargas Liquidadas)
- Armazena as estatísticas de desempenho consolidadas e consolidações financeiras de transportes concluídos para histórico rápido (desacoplado para performance).

### 3.10 `movement_logs` (Histórico de Entradas/Saídas de Estoque Central)
- Registra notas fiscais (NF), tipo de movimentação ('ENTRADA', 'SAÍDA', 'AJUSTE'), responsável, fornecedor e o JSONB `items` de produtos e quantidades afetadas.

### 3.11 `sobra_cliente_logs` (Registro de Divergências Logísticas)
- Registra divergências ou sobras devolvidas por clientes específicos durante as rotas de entrega física.

### 3.12 `count_documents` (Documentos de Auditoria / Inventários)
- `id` (`text`, PRIMARY KEY).
- `distributor` (`char(1)`, NOT NULL).
- `date` / `employee_name` / `route` (`text`).
- `total_clients` (`integer`).
- `status` (`text`): Status geral do inventário ('Aberto', 'Fechado', 'Bloqueado').
- `client_statuses` / `client_counts` / `client_closed_flags` / `client_contagem_timing` / `counts_summary` (`jsonb`): Estruturas JSONB complexas registrando em tempo de execução o progresso e dados coletados por cliente nesta rota.

### 3.13 `telegram_recipients` (Lista de Destinatários Globais do Bot do Telegram)
- `id` (`text`, PRIMARY KEY): ID do Chat ID no Telegram.
- `name` (`text`): Nome identificador do recipiente.
- `checked` (`boolean`): Controle de habilitação do recebimento.

---

## 4. Fluxos de Negócio e Casos de Uso Críticos (E2E Test Matrix)

As ferramentas de testes automatizados de interface (como Cypress ou Playwright) devem validar rigorosamente os seguintes fluxos interativos:

### 4.1 Criação de Registro de Carga (Transporte)
1. **Entrada de dados**: Seleção de motorista, veículo (placa) e rota. O sistema aceita digitação livre com busca incremental de cadastrados e autocompleta os clientes pertencentes àquela rota de forma dinâmica.
2. **Preenchimento de quantidades**: Exibe a lista de produtos. O usuário insere a quantidade carregada em cada veículo.
3. **Persistência**: Ao clicar em **"Gravar transporte"**:
   - Cria o registro no Supabase (tabela `transports`).
   - Apresenta mensagem de sucesso: *"Sucesso, transporte gravado com sucesso"*.
4. **Fluxo de Confirmação Interativa (Novo Requisito)**:
   - Logo após o sucesso, o sistema abre uma janela de confirmação modal contendo a pergunta: **"Deseja criar novo Transporte?"**
   - **Cenário de Sucesso "Sim" (Gravar mais uma carga)**:
     - O usuário clica em **"Sim"**.
     - A aplicação limpa completamente todos os campos do formulário (placa, motorista, rotas, quantidades e estados temporários), fecha o modal de confirmação e permanece na tela de cadastro de transporte ("CRIAR NOVO REGISTRO DE CARGA") permitindo o registro imediato do próximo caminhão.
   - **Cenário de Sucesso "Não" (Encerrar cadastro)**:
     - O usuário clica em **"Não"**.
     - A aplicação fecha o modal de confirmação.
     - Redireciona imediatamente a interface para a aba **"Movimentações"** (`activeView = 'movements'`).
     - Executa uma rolagem de tela suave (`smooth scroll`) para o topo absoluto da tela de movimentações para visualização do histórico.

### 4.2 Fluxo de Auditoria e Contagem Física de Clientes
1. O auditor seleciona uma rota de contagem aberta.
2. Abre a interface de contagem por estabelecimento. O status do cliente passa para **"Em Contagem"** no banco e na interface local.
3. Insere a contagem de estoque real física de cada produto.
4. Ao fechar a contagem do cliente, o saldo é consolidado. O status final do cliente passa para **"Concluído"**.

### 4.3 Multi-Distribuidores (Isolamento de Tenant)
1. No menu lateral ou no Painel Administrativo, o usuário pode selecionar o distribuidor ativo.
2. Ao alterar o distribuidor ativo, o estado da aplicação limpa os caches antigos da tela e dispara uma consulta ao Supabase filtrando exclusivamente pela chave correspondente (ex: `distributor = 'B'`).
3. **Casos de Exclusão**: No "Painel ADM", sob o quadrante de distribuidores operantes, o operador pode excluir um distribuidor. O ícone de exclusão (lixeira) foi estilizado para ocupar um tamanho reduzido (30% menor) para evitar cliques acidentais e manter a harmonia do layout administrativo.

---

## 5. Mapeamento de Segurança e Vulnerabilidades (Security Testing Guide)

Esta seção lista os principais pontos de auditoria de segurança (vulnerabilidades arquiteturais ou de configuração) que os testadores de intrusão e ferramentas de segurança automatizada (como OWASP ZAP) tentarão explorar.

### 5.1 RLS (Row Level Security) Permissivo no Banco de Dados (CRÍTICO)
No arquivo `supabase_schema.sql`, o banco está configurado com regras de segurança extremamente permissivas:
```sql
alter table public.products enable row level security;
create policy "Allow public read-write for all" on public.products for all using (true) with check (true);
```
- **Risco**: Esta política ativa o RLS mas, na prática, o anula ao permitir qualquer operação (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) para requisições anônimas (`using (true) with check (true)`).
- **Vetor de Teste**: Qualquer ferramenta que extrair a `NEXT_PUBLIC_SUPABASE_ANON_KEY` das requisições HTTP do browser poderá emitir comandos DML de manipulação direta via PostgREST para apagar dados de clientes, produtos e faturamento de qualquer distribuidor, sem restrição de privilégio.

### 5.2 Dependência de Filtro de Tenant no Lado do Cliente (Client-Side Tenant Enforcement)
- **Risco**: O isolamento entre diferentes distribuidores é executado e controlado no frontend (parâmetro `distributor` passado nas cláusulas `.eq('distributor', activeDistributor)`).
- **Vetor de Teste**: Um atacante interceptando a requisição HTTP ou manipulando o estado do React no navegador pode trocar o parâmetro de busca de `'A'` para `'B'` ou `'C'` e, devido ao RLS vulnerável citado acima, ler ou sobrescrever registros confidenciais de outros distribuidores.

### 5.3 Exposição de Dados Sensíveis e Tokens Externos
- **Risco**: O bot do Telegram para notificações do sistema funciona através de envio direto de chaves ou chamadas a partir das variáveis de ambiente. Se chaves privadas como o `TELEGRAM_BOT_TOKEN` ou o script do Google Apps Script forem expostos no bundle do cliente, atacantes podem usá-lo para spam ou vazamento de dados.
- **Prevenção nos testes**: Garantir que as variáveis que não começam com `NEXT_PUBLIC_` não vazem no bundle do Javascript enviado ao browser.

### 5.4 Falta de Validação de Input e Prevenção de Estoques Negativos
- **Risco**: O processamento de baixas ou sobras de carga ocorre via inserções diretas do usuário. Não há verificação rígida ao nível de banco de dados (constraints `CHECK`) impedindo que as quantidades de inventário ou valores de faturamento sejam gravados como números negativos absurdos.
- **Vetor de Teste (Fuzzing)**: Enviar números de carregamento negativos ou strings malformadas nos campos de quantidade do formulário de criação de transporte e verificar se o sistema rejeita as entradas antes de persistir no banco.

---

## 6. Configuração dos Testes Automatizados

### 6.1 Testes Funcionais de Interface (E2E) - Sugestão de Cenário para Cypress/Playwright
```javascript
// Exemplo de roteiro de teste automatizado para o fluxo de Gravação de Transporte

describe('Fluxo de Cadastro de Transporte e Redirecionamento', () => {
  beforeEach(() => {
    // Configura o estado inicial e realiza o bypass de login fictício
    cy.visit('/login');
    cy.get('#input-email').type('operador@esteves.com');
    cy.get('#btn-login').click();
  });

  it('Deve cadastrar carga com sucesso, clicar em "Não" no modal de confirmação e ir para Movimentações', () => {
    cy.get('#btn-criar-transporte-view').click();
    
    // Preenche cabeçalho
    cy.get('#input-placa').type('ABC-1234');
    cy.get('#input-motorista').type('Motorista de Teste');
    cy.get('#input-rota').type('Rota 10');
    
    // Preenche quantidade de algum item
    cy.get('.input-produto-qtd').first().clear().type('50');
    
    // Grava transporte
    cy.get('#btn-gravar-transporte').click();
    
    // Valida mensagem de sucesso intermediária
    cy.contains('sucesso', { matchCase: false }).should('be.visible');
    
    // Valida surgimento do novo modal de confirmação interativa
    cy.get('.fixed').contains('Deseja criar novo Transporte?').should('be.visible');
    
    // Clica em "Não" para fechar fluxo
    cy.get('button').contains('Não').click();
    
    // Valida se o modal fechou, redirecionou para movimentos e rolou para o topo
    cy.get('#title-movimentacoes-estoque').should('be.visible');
    cy.window().its('scrollY').should('equal', 0);
  });

  it('Deve cadastrar carga com sucesso, clicar em "Sim" no modal de confirmação e resetar o formulário', () => {
    cy.get('#btn-criar-transporte-view').click();
    cy.get('#input-placa').type('XYZ-9876');
    cy.get('#input-motorista').type('Outro Motorista');
    cy.get('#input-rota').type('Rota 20');
    cy.get('.input-produto-qtd').first().clear().type('150');
    
    cy.get('#btn-gravar-transporte').click();
    cy.get('.fixed').contains('Deseja criar novo Transporte?').should('be.visible');
    
    // Clica em "Sim" para cadastrar outra carga
    cy.get('button').contains('Sim').click();
    
    // Valida se os campos foram completamente resetados para permitir nova digitação
    cy.get('#input-placa').should('have.value', '');
    cy.get('#input-motorista').should('have.value', '');
    cy.get('#input-rota').should('have.value', '');
  });
});
```

---

## 7. Próximos Passos Recomendados para Reforço da Aplicação
Para eliminar os bugs estruturais e falhas de segurança mapeados, as seguintes tarefas de desenvolvimento devem ser implementadas:
1. **Refatorar Políticas RLS do Supabase**: Substituir o `Allow public read-write for all` por políticas baseadas em `auth.uid()` ou chaves de autenticação JWT assinadas, garantindo que usuários logados só consigam interagir com o distribuidor ao qual estão filiados.
2. **Implementar Validação Server-Side**: Criar middlewares ou restrições Postgres (`CHECK constraints`) para impedir que dados logísticos assumam estados inconsistentes (ex: quantidades negativas de produtos ou saldos duplicados).
3. **Escrita de Testes de Integração de API**: Rodar conjuntos de testes Postman/Newman ou scripts customizados simulando chamadas diretas HTTP para a API REST do Supabase tentando quebrar o isolamento de tenant.
