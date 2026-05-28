-- SGE (Sistema de Gestão Empresarial) - Script Oficial de Modelagem de Banco de Dados
-- RESET COMPLETO PARA LIMPEZA DE ESTRUTURAS ANTERIORES E CRIAÇÃO LIMPA INDEPENDENTE

-- Remove com cascade todas as tabelas antigas para evitar divergências ou restos de colunas antigas
drop table if exists public.accounts_receivable cascade;
drop table if exists public.accounts_payable cascade;
drop table if exists public.cash_flow_entries cascade;
drop table if exists public.sale_items cascade;
drop table if exists public.sales cascade;
drop table if exists public.purchase_items cascade;
drop table if exists public.purchases cascade;
drop table if exists public.products cascade;
drop table if exists public.clients cascade;
drop table if exists public.suppliers cascade;

-- Habilita a extensão pg-crypto para geração automática de UUIDs, caso não esteja ativa
create extension if not exists "pgcrypto";

-- ====================================================================
-- RESOLUÇÃO DE ERRO DE PERMISSÃO: "permission denied for schema public"
-- ====================================================================
-- Garante acesso de uso ao schema public para as credenciais de API do Supabase (anon, authenticated) e administrativas
grant usage on schema public to anon, authenticated, postgres, service_role;
grant create on schema public to postgres, service_role;

-- ==========================================
-- 1. TABELA: FORNECEDORES (suppliers)
-- ==========================================
create table public.suppliers (
    id uuid primary key default gen_random_uuid(),
    company_name varchar(255) not null, -- Razão Social ou Nome Fantasia
    document varchar(20) unique,         -- CNPJ (Ex: XX.XXX.XXX/XXXX-XX)
    contact_name varchar(150),          -- Pessoa de contato principal
    phone varchar(20),                  -- Telefone / WhatsApp
    email varchar(255),                 -- E-mail comercial
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.suppliers is 'Cadastro de fornecedores de mercadorias e prestadores de serviços.';

-- ==========================================
-- 2. TABELA: CLIENTES (clients)
-- ==========================================
create table public.clients (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    document varchar(20) unique,         -- CPF ou CNPJ
    phone varchar(20),
    address text,                       -- Endereço completo
    credit_limit numeric(12, 2) not null default 0.00, -- Limite para vendas na modalidade Crediário
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.clients is 'Cadastro de clientes do comércio com controle de limite de crédito.';

-- ==========================================
-- 3. TABELA: PRODUTOS (products)
-- ==========================================
create table public.products (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    code varchar(50) unique not null,    -- Código Interno / Código de Barras (EAN-13)
    category text,                       -- Divisão ou Categoria do produto (suporta serialização de metadados fracionários)
    price numeric(12, 2) not null,       -- Preço de venda unitário
    stock int not null default 0,        -- Quantidade disponível em estoque físico
    supplier_id uuid references public.suppliers(id) on delete set null, -- Associação opcional com fornecedor
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint chk_product_price check (price >= 0),
    constraint chk_product_stock check (stock >= 0)
);

comment on table public.products is 'Catálogo de materiais e produtos cadastrados para comercialização.';

-- ==========================================
-- 4. TABELA: VENDAS (sales)
-- ==========================================
create table public.sales (
    id uuid primary key default gen_random_uuid(),
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null, -- Data/Hora exata do cupom
    subtotal numeric(12, 2) not null,     -- Soma sem descontos
    discount numeric(12, 2) not null default 0.00, -- Abatimentos aplicados
    total numeric(12, 2) not null,        -- Valor efetivamente cobrado líquido do cliente
    payment_method varchar(50) not null,  -- 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Pix' | 'Crediário'
    client_id uuid references public.clients(id) on delete set null, -- ID do cliente se cadastrado/vinculado
    customer_name varchar(255),           -- Nome salvo no momento da venda (permite venda rápida sem cadastro prévio)
    status varchar(30) not null default 'Concluída', -- 'Concluída' | 'Cancelada' | 'Pendente'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint chk_sale_subtotal check (subtotal >= 0),
    constraint chk_sale_discount check (discount >= 0),
    constraint chk_sale_total check (total >= 0),
    constraint chk_sale_status check (status in ('Concluída', 'Cancelada', 'Pendente'))
);

comment on table public.sales is 'Registros históricos de vendas emitidas no terminal PDV.';

-- ==========================================
-- 5. TABELA: ITENS DA VENDA (sale_items)
-- ==========================================
create table public.sale_items (
    id uuid primary key default gen_random_uuid(),
    sale_id uuid not null references public.sales(id) on delete cascade , -- Se a venda for deletada, limpa os itens
    product_id uuid references public.products(id) on delete set null,     -- Não apaga histórico mesmo que o produto suma
    product_name varchar(255) not null, -- Protege no relatório histórico caso o nome do produto sofra alteração posterior
    price numeric(12, 2) not null,      -- Preço unitário fechado no ato da compra
    quantity int not null,              -- Volumes comercializados
    
    constraint chk_item_price check (price >= 0),
    constraint chk_item_qty check (quantity > 0)
);

comment on table public.sale_items is 'Relação de itens inclusos em cada cupom de venda faturado.';

-- ==========================================
-- 6. TABELA: FLUXO DE CAIXA (cash_flow_entries)
-- ==========================================
create table public.cash_flow_entries (
    id uuid primary key default gen_random_uuid(),
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    type varchar(10) not null,           -- 'Entrada' | 'Saída'
    description text not null,           -- Histórico descritivo do lançamento
    value numeric(12, 2) not null,       -- Valor do aporte/retirada
    category varchar(100),               -- Classificação contábil
    sale_id uuid references public.sales(id) on delete set null, -- Link opcional com a venda respectiva
    
    constraint chk_cash_type check (type in ('Entrada', 'Saída')),
    constraint chk_cash_value check (value > 0)
);

comment on table public.cash_flow_entries is 'Livro-caixa do estabelecimento contendo lançamentos diários e sangrias.';

-- ==========================================
-- 7. TABELA: CONTAS A PAGAR (accounts_payable)
-- ==========================================
create table public.accounts_payable (
    id uuid primary key default gen_random_uuid(),
    supplier_id uuid references public.suppliers(id) on delete set null,
    supplier_name text not null,          -- Nome do fornecedor (suporta metadados JSONAP de categoria)
    due_date date not null,               -- Data limite de vencimento (YYYY-MM-DD)
    value numeric(12, 2) not null,        -- Valor do boleto / duplicata
    status varchar(30) not null default 'Pendente', -- 'Pendente' | 'Pago' | 'Atrasado'
    paid_at timestamp with time zone,     -- Data/Hora exata de quitação
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint chk_payable_value check (value > 0),
    constraint chk_payable_status check (status in ('Pendente', 'Pago', 'Atrasado'))
);

comment on table public.accounts_payable is 'Despesas operacionais e duplicatas faturadas a pagar ao mercado produtor.';

-- ==========================================
-- 8. TABELA: CONTAS A RECEBER (accounts_receivable)
-- ==========================================
create table public.accounts_receivable (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete set null,
    customer_name varchar(255) not null,-- Nome do sacado / pagador
    due_date date not null,             -- Data prevista para realização da cobrança (YYYY-MM-DD)
    value numeric(12, 2) not null,      -- Valor do título pendente
    status varchar(30) not null default 'Pendente', -- 'Pendente' | 'Recebido' | 'Atrasado'
    received_at timestamp with time zone, -- Data/Hora exata do recebimento
    sale_id uuid references public.sales(id) on delete set null, -- Se derivou de uma venda em Crediário
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint chk_receivable_value check (value > 0),
    constraint chk_receivable_status check (status in ('Pendente', 'Recebido', 'Atrasado'))
);

comment on table public.accounts_receivable is 'Monitoramento de duplicatas faturadas de clientes, crediários acumulados e termos.';

-- ==========================================
-- 9. TABELA: COMPRAS (purchases)
-- ==========================================
create table public.purchases (
    id uuid primary key default gen_random_uuid(),
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    supplier_id uuid references public.suppliers(id) on delete set null,
    supplier_name varchar(255) not null,
    subtotal numeric(12, 2) not null default 0.00,
    discount numeric(12, 2) not null default 0.00,
    total numeric(12, 2) not null default 0.00,
    payment_method varchar(50) not null, -- 'Dinheiro' | 'A prazo' | 'Pix' | 'Cartão'
    status varchar(30) not null default 'Concluída', -- 'Concluída' | 'Cancelada'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint chk_purchase_subtotal check (subtotal >= 0),
    constraint chk_purchase_discount check (discount >= 0),
    constraint chk_purchase_total check (total >= 0),
    constraint chk_purchase_status check (status in ('Concluída', 'Cancelada'))
);

comment on table public.purchases is 'Registros de compras de mercadorias para entrada de estoque.';

-- ==========================================
-- 10. TABELA: ITENS DA COMPRA (purchase_items)
-- ==========================================
create table public.purchase_items (
    id uuid primary key default gen_random_uuid(),
    purchase_id uuid not null references public.purchases(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    product_name varchar(255) not null,
    quantity numeric(12, 4) not null, -- Quantidade comprada (aceita fracionado)
    cost_price numeric(12, 2) not null, -- Preço de custo pago por item/caixa
    format varchar(20) default 'unit', -- 'unit' | 'box'
    units_per_box int default 12,
    
    constraint chk_pitem_qty check (quantity > 0),
    constraint chk_pitem_cost check (cost_price >= 0)
);

comment on table public.purchase_items is 'Itemização das compras de estoque.';

-- ==========================================
-- ÍNDICES DE DESEMPENHO (Performance)
-- ==========================================
create index if not exists idx_products_code on public.products(code);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_sales_timestamp on public.sales(timestamp);
create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);
create index if not exists idx_cash_flow_timestamp on public.cash_flow_entries(timestamp);
create index if not exists idx_payable_due_date on public.accounts_payable(due_date);
create index if not exists idx_receivable_due_date on public.accounts_receivable(due_date);
create index if not exists idx_purchases_timestamp on public.purchases(timestamp);
create index if not exists idx_purchase_items_purchase_id on public.purchase_items(purchase_id);

-- ====================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS) E PRIVILÉGIOS DE TABELAS
-- ====================================================================
-- Ativação do RLS em todas as tabelas
alter table public.suppliers enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.cash_flow_entries enable row level security;
alter table public.accounts_payable enable row level security;
alter table public.accounts_receivable enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;

-- Criação de Políticas Permissivas para Acesso Público Total (Ideal para fins de teste, desenvolvimento e integração do App)
create policy "Acesso público completo para fornecedores" on public.suppliers for all using (true) with check (true);
create policy "Acesso público completo para clientes" on public.clients for all using (true) with check (true);
create policy "Acesso público completo para produtos" on public.products for all using (true) with check (true);
create policy "Acesso público completo para vendas" on public.sales for all using (true) with check (true);
create policy "Acesso público completo para itens de vendas" on public.sale_items for all using (true) with check (true);
create policy "Acesso público completo para fluxo de caixa" on public.cash_flow_entries for all using (true) with check (true);
create policy "Acesso público completo para contas a pagar" on public.accounts_payable for all using (true) with check (true);
create policy "Acesso público completo para contas a receber" on public.accounts_receivable for all using (true) with check (true);
create policy "Acesso público completo para compras" on public.purchases for all using (true) with check (true);
create policy "Acesso público completo para itens de compras" on public.purchase_items for all using (true) with check (true);

-- ====================================================================
-- CONCESSÃO DE PRIVILÉGIOS GERAIS PARA EVITAR ERROS DE PERMISSÃO "permission denied"
-- ====================================================================
-- Garante acesso a todas as tabelas aos papéis anon e authenticated do Supabase
grant all privileges on all tables in schema public to anon, authenticated, postgres, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, postgres, service_role;
grant all privileges on all functions in schema public to anon, authenticated, postgres, service_role;

-- Garante que privilégios sejam automaticamente concedidos para novas tabelas criadas no futuro
alter default privileges in schema public grant all on tables to anon, authenticated, postgres, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, postgres, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, postgres, service_role;
