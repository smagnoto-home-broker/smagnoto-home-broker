-- =====================================================================
-- Smagnoto Home Broker — BASELINE do schema
-- Estaging: cbgvttxmskwybalefezk · Produção: ustqwxwdejkfwzfrlitc
--
-- Projeto: banco VAZIO (nenhuma tabela existia). Este script cria o
-- schema completo do CRM + vitrine pública com segurança por design:
--   * RLS habilitado em TODAS as tabelas (nenhuma exceção).
--   * Anônimo: le apenas o necessário da vitrine (colunas seguras via
--     GRANT de colunas — PII de proprietário e documento de prestador
--     ficam fora) e insere apenas lead/visita/solicitação com status
--     'novo' e validações de comprimento (anti-abuso básico).
--   * Autenticado: isolamento por empresa (current_company_id()).
--   * Gatilho handle_new_user(): cria empresa + vínculo owner no signup
--     (o primeiro usuário do banco vira super_admin, como no app legado).
--   * Gatilhos "protege_*": impedem escalada de privilégio por UPDATE
--     (trocar próprio role, trocar company_id/plano de tenant).
--   * Sem dados fictícios: nenhum imóvel/lead fake é criado.
-- Re-executável: todos os objetos usam IF NOT EXISTS / CREATE OR
-- REPLACE / DROP policy IF EXISTS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------
do $$ begin create type public.company_status_enum as enum ('active','trial','blocked'); exception when duplicate_object then null; end $$;
do $$ begin create type public.plano_enum as enum ('starter','pro','enterprise'); exception when duplicate_object then null; end $$;
do $$ begin create type public.user_role_enum as enum ('owner','admin','corretor','captador','financeiro'); exception when duplicate_object then null; end $$;
do $$ begin create type public.global_role_enum as enum ('super_admin','admin','corretor','captador','financeiro','demo'); exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_source_enum as enum ('site','instagram','facebook','google','indicacao','whatsapp','outro'); exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_status_enum as enum ('novo','em_atendimento','qualificado','visita_marcada','proposta','fechado','perdido'); exception when duplicate_object then null; end $$;
do $$ begin create type public.property_type_enum as enum ('casa','apartamento','terreno','comercial','rural'); exception when duplicate_object then null; end $$;
do $$ begin create type public.property_status_enum as enum ('disponivel','reservado','vendido','alugado','inativo'); exception when duplicate_object then null; end $$;
do $$ begin create type public.transaction_enum as enum ('venda','aluguel','temporada'); exception when duplicate_object then null; end $$;
do $$ begin create type public.visit_status_enum as enum ('agendada','realizada','cancelada','no_show'); exception when duplicate_object then null; end $$;
do $$ begin create type public.proposal_status_enum as enum ('em_analise','aceita','recusada','contra_proposta'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status_enum as enum ('pendente','pago'); exception when duplicate_object then null; end $$;
do $$ begin create type public.provider_sub_status as enum ('ativo','pendente','inadimplente','cancelado'); exception when duplicate_object then null; end $$;
do $$ begin create type public.service_request_status as enum ('novo','em_contato','agendado','concluido','cancelado'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. TABELAS
-- ---------------------------------------------------------------------
create table if not exists public.app_config (
  id uuid primary key default gen_random_uuid(),
  app_name text not null default 'Smagnoto Home Broker',
  super_admin_emails text[] not null default '{}',
  system_settings jsonb not null default '{}'::jsonb
);

create table if not exists public.company (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  cnpj text,
  creci text,
  cor_primaria text not null default '#012439',
  email text,
  telefone text,
  owner_email text,
  owner_nome text,
  owner_telefone text,
  logo_url text,
  endereco jsonb not null default '{}'::jsonb,
  plano public.plano_enum not null default 'starter',
  status public.company_status_enum not null default 'active',
  trial_ate timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_user (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  role public.user_role_enum not null default 'corretor',
  ativo boolean not null default true,
  comissao_pct numeric,
  creci text,
  must_change_password boolean not null default false,
  ultimo_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists company_user_company_email_key on public.company_user (company_id, email);
create index if not exists company_user_user_id_idx on public.company_user (user_id);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.company(id) on delete cascade,
  role public.global_role_enum not null,
  created_at timestamptz not null default now()
);
create index if not exists user_roles_user_id_idx on public.user_roles (user_id);

create table if not exists public.zone (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  name text not null,
  city text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  title text not null,
  code text,
  slug text,
  description text,
  type public.property_type_enum not null,
  transaction public.transaction_enum not null,
  status public.property_status_enum not null default 'disponivel',
  price numeric not null,
  bedrooms int,
  suites int,
  bathrooms int,
  parking int,
  area_total numeric,
  area_useful numeric,
  condo_fee numeric,
  iptu numeric,
  zip_code text,
  address jsonb not null default '{}'::jsonb,
  neighborhood text,
  city text,
  state text,
  features text[] not null default '{}',
  photos text[] not null default '{}',
  video_url text,
  tour_360_url text,
  model_3d_url text,
  panorama_url text,
  owner_name text,
  owner_phone text,
  owner_email text,
  captado_por uuid,
  listed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists property_company_status_idx on public.property (company_id, status);
create unique index if not exists property_company_slug_key on public.property (company_id, slug);

create table if not exists public.lead (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  source public.lead_source_enum not null default 'outro',
  interest_type public.transaction_enum,
  status public.lead_status_enum not null default 'novo',
  budget_max numeric,
  bedrooms_min int,
  neighborhoods text[] not null default '{}',
  notes text,
  assigned_to uuid references public.company_user(id) on delete set null,
  interest_property_id uuid references public.property(id) on delete set null,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lead_company_status_idx on public.lead (company_id, status);
create index if not exists lead_company_created_idx on public.lead (company_id, created_at desc);

create table if not exists public.visit (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  property_id uuid not null references public.property(id) on delete cascade,
  lead_id uuid references public.lead(id) on delete set null,
  scheduled_at timestamptz not null,
  status public.visit_status_enum not null default 'agendada',
  corretor_id uuid references public.company_user(id) on delete set null,
  lead_name text,
  lead_phone text,
  property_title text,
  corretor_nome text,
  notes text,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists visit_company_scheduled_idx on public.visit (company_id, scheduled_at);

create table if not exists public.proposal (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  lead_id uuid not null references public.lead(id) on delete cascade,
  property_id uuid not null references public.property(id) on delete cascade,
  corretor_id uuid references public.company_user(id) on delete set null,
  lead_name text,
  property_title text,
  value numeric not null,
  payment_terms text,
  observations text,
  contract_url text,
  status public.proposal_status_enum not null default 'em_analise',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists proposal_company_status_idx on public.proposal (company_id, status);

create table if not exists public.commission (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  corretor_id uuid not null references public.company_user(id) on delete cascade,
  property_id uuid references public.property(id) on delete set null,
  proposal_id uuid references public.proposal(id) on delete set null,
  corretor_nome text,
  date date not null default current_date,
  value numeric not null,
  percentage numeric,
  payment_status public.payment_status_enum not null default 'pendente',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  date date not null default current_date,
  description text not null,
  amount numeric not null,
  category text,
  payment_status public.payment_status_enum,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operational_cost (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  date date not null default current_date,
  description text not null,
  amount numeric not null,
  category text,
  recurring boolean not null default false,
  payment_status public.payment_status_enum,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_provider (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  phone text,
  whatsapp text,
  email text,
  document text,
  service_area text,
  monthly_fee numeric not null default 0,
  due_day int not null default 10 check (due_day between 1 and 28),
  paid_until date,
  subscription_status public.provider_sub_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_provider_company_status_idx on public.service_provider (company_id, subscription_status);

create table if not exists public.provider_payment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  provider_id uuid not null references public.service_provider(id) on delete cascade,
  amount numeric not null,
  reference_month date not null,
  paid_at timestamptz not null default now()
);
-- Idempotência de cobrança no nível do banco (um pagamento por mês/prestador).
create unique index if not exists provider_payment_mes_unico on public.provider_payment (provider_id, reference_month);

create table if not exists public.service_request (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  provider_id uuid references public.service_provider(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  client_email text,
  address text,
  category text,
  description text not null,
  status public.service_request_status not null default 'novo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_request_company_status_idx on public.service_request (company_id, status);

-- ---------------------------------------------------------------------
-- 3. FUNÇÕES AUXILIARES E DE AUTORIZAÇÃO
-- ---------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select cu.company_id
  from public.company_user cu
  where cu.user_id = auth.uid() and cu.ativo = true
  order by cu.created_at
  limit 1;
$$;

create or replace function public.has_company_role(_roles public.user_role_enum[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.company_user cu
    where cu.user_id = auth.uid()
      and cu.ativo = true
      and cu.company_id = public.current_company_id()
      and cu.role = any(_roles)
  );
$$;

create or replace function public.has_global_role(_role public.global_role_enum)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_company_role(array['owner','admin']::public.user_role_enum[])
      or public.has_global_role('super_admin');
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_global_role('super_admin');
$$;

-- ---------------------------------------------------------------------
-- 4. GATILHO DE CADASTRO (nunca remover — cria empresa + owner)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome text;
  v_empresa text;
  v_slug_base text;
  v_slug text;
  v_empresa_id uuid;
begin
  v_nome := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), '')
  );
  v_empresa := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), ''),
    coalesce(v_nome, 'Nova imobiliária')
  );
  v_slug_base := lower(trim(regexp_replace(v_empresa, '[^a-zA-Z0-9]+', '-', 'g')));
  v_slug_base := trim(both '-' from v_slug_base);
  if v_slug_base = '' then v_slug_base := 'empresa'; end if;
  v_slug := v_slug_base;
  if exists (select 1 from public.company c where c.slug = v_slug) then
    v_slug := v_slug || '-' || substr(md5(new.id::text), 1, 6);
  end if;

  insert into public.company (name, slug, owner_email, owner_nome, status)
  values (v_empresa, v_slug, new.email, v_nome, 'active')
  returning id into v_empresa_id;

  insert into public.company_user (company_id, user_id, email, nome, role, ativo)
  values (v_empresa_id, new.id, new.email, v_nome, 'owner', true);

  -- Primeiro usuário do banco (nenhum super_admin existente ainda) vira super_admin.
  -- Sempre que não houver super_admin algum, o signup em andamento assume (semântica
  -- do bootstrap_super_admin_if_empty legado; não depende de contagem de usuários,
  -- que é sensível ao agrupamento do INSERT).
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. GATILHOS updated_at + PROTEÇÕES ANTI-ESCALADA
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['company','company_user','zone','property','lead','visit','proposal','commission','revenue','operational_cost','service_provider','service_request']
  loop
    execute format('drop trigger if exists %I on public.%I', 'set_updated_at_' || t, t);
    execute format('create trigger %I before update on public.%I for each row execute function public.update_updated_at_column()',
                   'set_updated_at_' || t, t);
  end loop;
end $$;

-- company_id nunca muda por UPDATE (transferência de tenant proibida).
create or replace function public.bloqueia_troca_tenant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'company_id não pode ser alterado';
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['company_user','zone','property','lead','visit','proposal','commission','revenue','operational_cost','service_provider','service_request','provider_payment']
  loop
    execute format('drop trigger if exists %I on public.%I', 'bloqueia_tenant_' || t, t);
    execute format('create trigger %I before update on public.%I for each row execute function public.bloqueia_troca_tenant()',
                   'bloqueia_tenant_' || t, t);
  end loop;
end $$;

-- Membro não altera o próprio papel/permissões (escala de privilégio).
create or replace function public.protege_membro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Acesso direto ao banco (SQL editor/CLI, sem JWT: auth.uid nulo) é
  -- administração e não passa por aqui. Sessões da API (JWT) são verificadas.
  if auth.uid() is null then
    return new;
  end if;
  if new.email is distinct from old.email then
    raise exception 'e-mail do membro não pode ser alterado';
  end if;
  if (new.role is distinct from old.role
      or new.ativo is distinct from old.ativo
      or new.comissao_pct is distinct from old.comissao_pct)
     and not public.has_company_role(array['owner','admin']::public.user_role_enum[]) then
    raise exception 'somente admins alteram papel, ativo e comissão de membros';
  end if;
  return new;
end;
$$;
drop trigger if exists protege_membro on public.company_user;
create trigger protege_membro before update on public.company_user
  for each row execute function public.protege_membro();

-- Plano/status só a administração do sistema; slug/nome/branding = owner/admin.
create or replace function public.protege_company()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.id is distinct from old.id then
    raise exception 'id da empresa não pode ser alterado';
  end if;
  -- Acesso direto ao banco (SQL editor/CLI, sem JWT) = administração: libera.
  if auth.uid() is null then
    return new;
  end if;
  if (new.plano is distinct from old.plano or new.status is distinct from old.status)
     and not public.is_super_admin() then
    raise exception 'plano e status da empresa são alterados apenas pela administração do sistema';
  end if;
  if (new.slug is distinct from old.slug
      or new.owner_email is distinct from old.owner_email)
     and not (public.is_super_admin() or public.has_company_role(array['owner','admin']::public.user_role_enum[])) then
    raise exception 'somente admins alteram identificação da empresa';
  end if;
  return new;
end;
$$;
drop trigger if exists protege_company on public.company;
create trigger protege_company before update on public.company
  for each row execute function public.protege_company();

-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (todas as tabelas) + POLICIES
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['app_config','company','company_user','user_roles','zone','property','lead','visit','proposal','commission','revenue','operational_cost','service_provider','provider_payment','service_request']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- 6.1 app_config (sem anônimo)
drop policy if exists app_config_leitura on public.app_config;
create policy app_config_leitura on public.app_config for select to authenticated using (true);
drop policy if exists app_config_escrita on public.app_config;
create policy app_config_escrita on public.app_config for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- 6.2 company
drop policy if exists company_leitura_membro on public.company;
create policy company_leitura_membro on public.company for select to authenticated
  using (id = public.current_company_id() or public.is_super_admin());
-- Vitrine pública lê APENAS colunas seguras (ver GRANT de colunas na seção 7).
drop policy if exists company_leitura_publica on public.company;
create policy company_leitura_publica on public.company for select to anon using (true);
-- Nota: não existe policy de INSERT de company para authenticated — empresa nasce
-- apenas pelo gatilho handle_new_user (security definer) ou pela administração.
-- Escrita do dono/admin (branding, telefone, endereço…): gatilho protege_company
-- mantém plano/status e id fora do alcance de não-super-admin.
drop policy if exists company_update_admin on public.company;
create policy company_update_admin on public.company for update to authenticated
  using (id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]))
  with check (id = public.current_company_id());

-- 6.3 company_user
drop policy if exists company_user_leitura on public.company_user;
create policy company_user_leitura on public.company_user for select to authenticated
  using (company_id = public.current_company_id() or public.is_super_admin());
drop policy if exists company_user_insert on public.company_user;
create policy company_user_insert on public.company_user for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]));
drop policy if exists company_user_update on public.company_user;
create policy company_user_update on public.company_user for update to authenticated
  using (company_id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]))
  with check (company_id = public.current_company_id());
drop policy if exists company_user_self_update on public.company_user;
create policy company_user_self_update on public.company_user for update to authenticated
  using (company_id = public.current_company_id() and user_id = auth.uid())
  with check (company_id = public.current_company_id() and user_id = auth.uid());
drop policy if exists company_user_delete on public.company_user;
create policy company_user_delete on public.company_user for delete to authenticated
  using (company_id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]));

-- 6.4 user_roles
drop policy if exists user_roles_leitura on public.user_roles;
create policy user_roles_leitura on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists user_roles_escrita on public.user_roles;
create policy user_roles_escrita on public.user_roles for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists user_roles_insert on public.user_roles;
create policy user_roles_insert on public.user_roles for insert to authenticated
  with check (public.is_super_admin());

-- 6.5 property
drop policy if exists property_membro on public.property;
create policy property_membro on public.property for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
-- Vitrine pública: qualquer imóvel disponível (colunas seguras via GRANT).
drop policy if exists property_publico on public.property;
create policy property_publico on public.property for select to anon using (status = 'disponivel');

-- 6.6 lead
drop policy if exists lead_membro on public.lead;
create policy lead_membro on public.lead for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
-- Formulários públicos do site inserem lead novo para a empresa da vitrine.
drop policy if exists lead_publico_insert on public.lead;
create policy lead_publico_insert on public.lead for insert to anon
  with check (
    status = 'novo'
    and source = 'site'
    and length(trim(name)) between 2 and 120
    and length(trim(phone)) between 8 and 30
    and coalesce(length(notes), 0) <= 2000
    and assigned_to is null
  );

-- 6.7 visit
drop policy if exists visit_membro on public.visit;
create policy visit_membro on public.visit for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
drop policy if exists visit_publico_insert on public.visit;
create policy visit_publico_insert on public.visit for insert to anon
  with check (
    status = 'agendada'
    and property_id is not null
    and length(coalesce(lead_name, '')) between 2 and 120
    and coalesce(length(lead_phone), 0) between 8 and 30
  );

-- 6.8 proposal (só autenticado)
drop policy if exists proposal_membro on public.proposal;
create policy proposal_membro on public.proposal for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- 6.9 financeiro: leitura de membro; escrita owner/admin/financeiro
drop policy if exists commission_leitura on public.commission;
create policy commission_leitura on public.commission for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists commission_escrita on public.commission;
create policy commission_escrita on public.commission for insert to authenticated
  with check (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]));
drop policy if exists commission_update on public.commission;
create policy commission_update on public.commission for update to authenticated
  using (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]))
  with check (company_id = public.current_company_id());
drop policy if exists commission_delete on public.commission;
create policy commission_delete on public.commission for delete to authenticated
  using (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]));

drop policy if exists revenue_leitura on public.revenue;
create policy revenue_leitura on public.revenue for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists revenue_escrita on public.revenue;
create policy revenue_escrita on public.revenue for insert to authenticated
  with check (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]));
drop policy if exists revenue_update on public.revenue;
create policy revenue_update on public.revenue for update to authenticated
  using (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]))
  with check (company_id = public.current_company_id());
drop policy if exists revenue_delete on public.revenue;
create policy revenue_delete on public.revenue for delete to authenticated
  using (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]));

drop policy if exists cost_leitura on public.operational_cost;
create policy cost_leitura on public.operational_cost for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists cost_escrita on public.operational_cost;
create policy cost_escrita on public.operational_cost for insert to authenticated
  with check (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]));
drop policy if exists cost_update on public.operational_cost;
create policy cost_update on public.operational_cost for update to authenticated
  using (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]))
  with check (company_id = public.current_company_id());
drop policy if exists cost_delete on public.operational_cost;
create policy cost_delete on public.operational_cost for delete to authenticated
  using (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]));

-- 6.10 zone
drop policy if exists zone_membro on public.zone;
create policy zone_membro on public.zone for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- 6.11 service_provider (portal público vê ativos com colunas seguras)
drop policy if exists provider_membro on public.service_provider;
create policy provider_membro on public.service_provider for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
drop policy if exists provider_publico on public.service_provider;
create policy provider_publico on public.service_provider for select to anon
  using (subscription_status = 'ativo');

-- 6.12 provider_payment (somente administração da empresa)
drop policy if exists payment_admin on public.provider_payment;
create policy payment_admin on public.provider_payment for select to authenticated
  using (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin']::public.user_role_enum[]));
drop policy if exists payment_insert on public.provider_payment;
create policy payment_insert on public.provider_payment for insert to authenticated
  with check (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin']::public.user_role_enum[]));

-- 6.13 service_request (portal público insere; empresa lê/gerencia)
drop policy if exists request_membro on public.service_request;
create policy request_membro on public.service_request for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
drop policy if exists request_publico_insert on public.service_request;
create policy request_publico_insert on public.service_request for insert to anon
  with check (
    status = 'novo'
    and length(trim(client_name)) between 2 and 120
    and length(trim(client_phone)) between 8 and 30
    and length(trim(description)) between 5 and 4000
  );

-- ---------------------------------------------------------------------
-- 7. GRANTS — superfície mínima do anônimo (colunas seguras)
-- ---------------------------------------------------------------------
-- Anônimo não opera nada além destas policies:
revoke all on public.app_config from anon;
revoke all on public.company_user from anon;
revoke all on public.user_roles from anon;
revoke all on public.zone from anon;
revoke all on public.proposal from anon;
revoke all on public.commission from anon;
revoke all on public.revenue from anon;
revoke all on public.operational_cost from anon;
revoke all on public.provider_payment from anon;

-- company: anônimo lê só identificação pública da agência.
revoke all on public.company from anon;
grant select (id, slug, name, logo_url, cor_primaria) on public.company to anon;

-- property: anônimo lê tudo EXCETO PII do proprietário e dados internos.
revoke all on public.property from anon;
grant select (
  id, company_id, title, code, slug, description, type, transaction, status, price,
  bedrooms, suites, bathrooms, parking, area_total, area_useful, condo_fee, iptu,
  address, neighborhood, city, state, features, photos, video_url,
  tour_360_url, model_3d_url, panorama_url, listed_at, created_at
) on public.property to anon;

-- lead/visit/service_request: anônimo só INSERE (sem leitura, sem update/delete).
revoke all on public.lead from anon;
grant insert on public.lead to anon;
revoke all on public.visit from anon;
grant insert on public.visit to anon;
revoke all on public.service_request from anon;
grant insert on public.service_request to anon;

-- service_provider: anônimo lê só contatos públicos de prestadores ativos.
revoke all on public.service_provider from anon;
grant select (id, company_id, name, category, description, phone, whatsapp, service_area)
  on public.service_provider to anon;

-- Funções de autorização: só autenticado (nenhum anônimo).
revoke execute on function public.current_company_id() from public, anon;
revoke execute on function public.has_company_role(public.user_role_enum[]) from public, anon;
revoke execute on function public.has_global_role(public.global_role_enum) from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.has_company_role(public.user_role_enum[]) to authenticated;
grant execute on function public.has_global_role(public.global_role_enum) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 8. STORAGE (logos e fotos de imóveis) — seção resiliente:
--    buckets são opcionais (o app usa URLs); falha de privilégio aqui
--    NÃO pode prender o núcleo do schema/RLS. O aviso fica no log.
-- ---------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('logos', 'logos', true), ('property-photos', 'property-photos', true)
  on conflict (id) do nothing;

  execute 'drop policy if exists midia_leitura_publica on storage.objects';
  execute 'create policy midia_leitura_publica on storage.objects for select to public using (bucket_id in (''logos'', ''property-photos''))';

  execute 'drop policy if exists midia_upload on storage.objects';
  execute 'create policy midia_upload on storage.objects for insert to authenticated with check (bucket_id in (''logos'', ''property-photos''))';

  execute 'drop policy if exists midia_update on storage.objects';
  execute 'create policy midia_update on storage.objects for update to authenticated using (bucket_id in (''logos'', ''property-photos'')) with check (bucket_id in (''logos'', ''property-photos''))';

  execute 'drop policy if exists midia_delete on storage.objects';
  execute 'create policy midia_delete on storage.objects for delete to authenticated using (bucket_id in (''logos'', ''property-photos''))';
exception when others then
  raise warning 'Storage não configurado automaticamente (%). Buckets são opcionais — se precisar, rode a seção 8 manualmente como dono do schema storage.', sqlerrm;
end $$;

-- Fim do baseline.
