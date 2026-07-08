-- SQL Script for Supabase Database Initialization
-- This script contains all DDL table definitions, keys, indexes, and default schema mappings
-- compatible with the MOVIX (Gestão de Estoque e Transporte) app models.
-- Paste this script directly into the SQL Editor of your Supabase Dashboard.

-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  distributor char(1) not null default 'A',
  code text not null,
  description text not null,
  unit text not null, -- 'UN', 'CX', 'PÇ'
  initial_stock integer not null default 0,
  necessity_qty integer,
  value_rs numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (distributor, code)
);

-- 2. CLIENTS TABLE
create table if not exists public.clients (
  id text primary key,
  distributor char(1) not null default 'A',
  matricula text not null,
  razao_social text not null,
  cnpj text not null,
  responsavel_nome text not null,
  responsavel_sobrenome text not null,
  responsavel_contato text not null,
  endereco text not null,
  numero text not null,
  bairro text not null,
  cep text not null,
  estado text not null,
  cidade text not null,
  rota_entrega text not null,
  rota_contagem text not null,
  saldo_loja numeric not null default 0,
  saldo_contagem numeric not null default 0,
  product_balances jsonb not null default '{}'::jsonb,
  inativo boolean not null default false,
  status_entrega text not null default 'Vazio',
  status_durante_contagem text not null default 'Vazio',
  status_final_contagem text not null default 'Vazio',
  pickup_quantities jsonb not null default '{}'::jsonb,
  delivery_quantities jsonb not null default '{}'::jsonb,
  contagem_estoque jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (distributor, matricula),
  unique (distributor, cnpj)
);

-- 3. DELIVERY ROUTES TABLE
create table if not exists public.delivery_routes (
  id text primary key,
  distributor char(1) not null default 'A',
  numero_rota integer not null,
  cidade text not null,
  bairro_regiao text not null,
  complemento text,
  status_rota_entrega text not null default 'DISPONÍVEL',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (distributor, numero_rota)
);

-- 4. COUNTING ROUTES TABLE
create table if not exists public.counting_routes (
  id text primary key,
  distributor char(1) not null default 'A',
  numero_rota integer not null,
  cidade text not null,
  bairro_regiao text not null,
  complemento text,
  status_rota_contagem text not null default 'Disponível',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (distributor, numero_rota)
);

-- 5. SUPPLIERS TABLE
create table if not exists public.suppliers (
  id text primary key,
  distributor char(1) not null default 'A',
  razao_social text not null,
  cnpj text not null,
  responsavel_nome text not null,
  responsavel_contato text not null,
  estado text not null,
  cidade text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (distributor, cnpj)
);

-- 6. EMPLOYEES TABLE
create table if not exists public.employees (
  id text primary key,
  distributor char(1) not null default 'A',
  empresa text not null,
  nome text not null,
  cargo text not null,
  email text not null,
  perfil_tipo text not null,
  telegram_chat_id text,
  enable_telegram boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (distributor, email)
);

-- 7. VEHICLES TABLE
create table if not exists public.vehicles (
  id text primary key,
  distributor char(1) not null default 'A',
  placa text not null,
  transportadora text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (distributor, placa)
);

-- 8. TRANSPORTS LIQUIDATED TABLE (Historic/Closed)
create table if not exists public.transports_liquidated (
  id text primary key,
  distributor char(1) not null default 'A',
  number text not null,
  date text not null,
  placa text not null,
  driver text not null,
  route text not null,
  clients_count integer not null default 0,
  delivered integer not null default 0,
  not_delivered integer not null default 0,
  retirados integer,
  effectiveness numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. MOVEMENT LOGS TABLE
create table if not exists public.movement_logs (
  id text primary key,
  distributor char(1) not null default 'A',
  nf_number text not null,
  date text not null,
  supplier text not null,
  responsible text not null,
  observation text not null,
  type text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ACTIVE TRANSPORTS TABLE
create table if not exists public.transports (
  id text primary key,
  distributor char(1) not null default 'A',
  number text not null,
  date text not null,
  placa text not null,
  driver text not null,
  route text not null,
  is_fora_de_rota boolean not null default false,
  is_multi_rota boolean not null default false,
  selected_route_ids jsonb not null default '[]'::jsonb,
  selected_client_ids jsonb not null default '[]'::jsonb,
  tipo_transporte text not null,
  status_transporte text not null,
  cliente_total integer not null default 0,
  cliente_entregue integer not null default 0,
  cliente_nao_entregue integer not null default 0,
  cliente_em_entrega integer not null default 0,
  clientes_retirados integer,
  stock jsonb not null default '{}'::jsonb,
  observation text,
  client_withdrawals jsonb not null default '{}'::jsonb,
  sobras jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. SOBRAS LOG TABLE
create table if not exists public.sobra_cliente_logs (
  id text primary key,
  distributor char(1) not null default 'A',
  matricula text not null,
  razao_social text not null,
  data_transporte text not null,
  numero_transporte text not null,
  codigo_produto text not null,
  descricao_produto text not null,
  quantidade_sobra integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. COUNT DOCUMENTS (Inventories)
create table if not exists public.count_documents (
  id text primary key,
  distributor char(1) not null default 'A',
  date text not null,
  employee_name text not null,
  route text not null,
  total_clients integer not null default 0,
  status text not null,
  client_statuses jsonb not null default '{}'::jsonb,
  client_counts jsonb not null default '{}'::jsonb,
  client_closed_flags jsonb not null default '{}'::jsonb,
  client_contagem_timing jsonb,
  counts_summary jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. TELEGRAM RECIPIENTS (Global support notifications)
create table if not exists public.telegram_recipients (
  id text primary key,
  name text not null,
  checked boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. DISTRIBUTORS TABLE
create table if not exists public.distributors (
  id text primary key,
  name text not null,
  cnpj text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------------------------------------------
-- CREATE INDEXES FOR OPTIMAL PERFORMANCE
-- -------------------------------------------------------------
create index if not exists idx_products_distributor on public.products(distributor);
create index if not exists idx_clients_distributor on public.clients(distributor);
create index if not exists idx_delivery_routes_distributor on public.delivery_routes(distributor);
create index if not exists idx_counting_routes_distributor on public.counting_routes(distributor);
create index if not exists idx_suppliers_distributor on public.suppliers(distributor);
create index if not exists idx_employees_distributor on public.employees(distributor);
create index if not exists idx_vehicles_distributor on public.vehicles(distributor);
create index if not exists idx_transports_liquidated_distributor on public.transports_liquidated(distributor);
create index if not exists idx_movement_logs_distributor on public.movement_logs(distributor);
create index if not exists idx_transports_distributor on public.transports(distributor);
create index if not exists idx_sobra_cliente_logs_distributor on public.sobra_cliente_logs(distributor);
create index if not exists idx_count_documents_distributor on public.count_documents(distributor);

-- RLS (Row Level Security) Guidelines:
-- By default, you can enable RLS or keep tables public during the initial development phase.
-- To enable RLS and allow public anonymous access for standard key access (read, write, update, delete):
-- Run the following commands in your Supabase SQL Editor:

-- 1. Products
alter table public.products enable row level security;
drop policy if exists "Allow public read-write for all" on public.products;
create policy "Allow public read-write for all" on public.products for all using (true) with check (true);

-- 2. Clients
alter table public.clients enable row level security;
drop policy if exists "Allow public read-write for all" on public.clients;
create policy "Allow public read-write for all" on public.clients for all using (true) with check (true);

-- 3. Delivery Routes
alter table public.delivery_routes enable row level security;
drop policy if exists "Allow public read-write for all" on public.delivery_routes;
create policy "Allow public read-write for all" on public.delivery_routes for all using (true) with check (true);

-- 4. Counting Routes
alter table public.counting_routes enable row level security;
drop policy if exists "Allow public read-write for all" on public.counting_routes;
create policy "Allow public read-write for all" on public.counting_routes for all using (true) with check (true);

-- 5. Suppliers
alter table public.suppliers enable row level security;
drop policy if exists "Allow public read-write for all" on public.suppliers;
create policy "Allow public read-write for all" on public.suppliers for all using (true) with check (true);

-- 6. Employees
alter table public.employees enable row level security;
drop policy if exists "Allow public read-write for all" on public.employees;
create policy "Allow public read-write for all" on public.employees for all using (true) with check (true);

-- 7. Vehicles
alter table public.vehicles enable row level security;
drop policy if exists "Allow public read-write for all" on public.vehicles;
create policy "Allow public read-write for all" on public.vehicles for all using (true) with check (true);

-- 8. Transports
alter table public.transports enable row level security;
drop policy if exists "Allow public read-write for all" on public.transports;
create policy "Allow public read-write for all" on public.transports for all using (true) with check (true);

-- 9. Transports Liquidated
alter table public.transports_liquidated enable row level security;
drop policy if exists "Allow public read-write for all" on public.transports_liquidated;
create policy "Allow public read-write for all" on public.transports_liquidated for all using (true) with check (true);

-- 10. Movement Logs
alter table public.movement_logs enable row level security;
drop policy if exists "Allow public read-write for all" on public.movement_logs;
create policy "Allow public read-write for all" on public.movement_logs for all using (true) with check (true);

-- 11. Sobra Cliente Logs
alter table public.sobra_cliente_logs enable row level security;
drop policy if exists "Allow public read-write for all" on public.sobra_cliente_logs;
create policy "Allow public read-write for all" on public.sobra_cliente_logs for all using (true) with check (true);

-- 12. Count Documents
alter table public.count_documents enable row level security;
drop policy if exists "Allow public read-write for all" on public.count_documents;
create policy "Allow public read-write for all" on public.count_documents for all using (true) with check (true);

-- 13. Telegram Recipients
alter table public.telegram_recipients enable row level security;
drop policy if exists "Allow public read-write for all" on public.telegram_recipients;
create policy "Allow public read-write for all" on public.telegram_recipients for all using (true) with check (true);

-- 14. Distributors
alter table public.distributors enable row level security;
drop policy if exists "Allow public read-write for all" on public.distributors;
create policy "Allow public read-write for all" on public.distributors for all using (true) with check (true);

