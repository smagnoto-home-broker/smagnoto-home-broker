-- =====================================================================
-- Smagnoto Home Broker — F4a: Locacao (contratos, cobrancas, repasses)
-- Data: 2026-10-26 · Plano: docs/PLANO-ENTERPRISE-IMOBILIARIO.md (fase F4)
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado e
-- "pode" do Joaquim antes de aplicar.
-- Decisoes:
--   * So ADICIONA 5 tabelas novas. Nao altera tabela existente.
--   * Dinheiro em centavos (integer); taxa de administracao em basis points (1000 = 10%).
--   * RLS por empresa; papeis owner/admin/financeiro leem e escrevem; so owner/admin apagam.
--   * Cobranca: uma por contrato e competencia (unique). Itens detalham o boleto.
--   * Repasse: um por cobranca paga (unique); calculo feito no app (src/lib/locacao/repasse.ts).
-- Como reverter (nesta ordem):
--   drop table if exists public.repasse;
--   drop table if exists public.cobranca_item;
--   drop table if exists public.cobranca;
--   drop table if exists public.contrato_locacao;
-- =====================================================================

begin;

create table if not exists public.contrato_locacao (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  property_id uuid not null references public.property(id) on delete restrict,
  locador_nome text not null check (length(locador_nome) between 2 and 200),
  locatario_nome text not null check (length(locatario_nome) between 2 and 200),
  locatario_telefone text check (length(locatario_telefone) <= 30),
  locatario_email text check (length(locatario_email) <= 200),
  valor_aluguel integer not null check (valor_aluguel > 0),
  valor_condominio integer not null default 0 check (valor_condominio >= 0),
  valor_iptu integer not null default 0 check (valor_iptu >= 0),
  valor_seguro integer not null default 0 check (valor_seguro >= 0),
  taxa_adm_bps integer not null default 1000 check (taxa_adm_bps between 0 and 5000),
  irrf_centavos integer not null default 0 check (irrf_centavos >= 0),
  indice_reajuste text not null default 'igpm' check (indice_reajuste in ('igpm','ipca','inpc')),
  dia_vencimento smallint not null default 5 check (dia_vencimento between 1 and 28),
  data_inicio date not null,
  data_fim date not null,
  garantia text check (garantia in ('fiador','caucao','seguro_fianca','titulo_capitalizacao','sem_garantia')),
  beneficiarios jsonb not null default '[]'::jsonb check (jsonb_typeof(beneficiarios) = 'array' and jsonb_array_length(beneficiarios) <= 20),
  status text not null default 'ativo' check (status in ('ativo','encerrado','rescindido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (data_fim > data_inicio)
);
create index if not exists contrato_locacao_company_idx on public.contrato_locacao(company_id, status);
create index if not exists contrato_locacao_property_idx on public.contrato_locacao(property_id);

create table if not exists public.cobranca (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  contrato_id uuid not null references public.contrato_locacao(id) on delete restrict,
  competencia date not null check (extract(day from competencia) = 1),
  vencimento date not null,
  total_centavos integer not null check (total_centavos >= 0),
  status text not null default 'aberta' check (status in ('aberta','paga','cancelada')),
  pago_em date,
  pago_centavos integer check (pago_centavos is null or pago_centavos >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contrato_id, competencia)
);
create index if not exists cobranca_company_venc_idx on public.cobranca(company_id, status, vencimento);

create table if not exists public.cobranca_item (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  cobranca_id uuid not null references public.cobranca(id) on delete cascade,
  tipo text not null check (tipo in ('aluguel','condominio','iptu','seguro','multa','juros','outro')),
  descricao text check (length(descricao) <= 200),
  valor_centavos integer not null check (valor_centavos >= 0)
);
create index if not exists cobranca_item_cobranca_idx on public.cobranca_item(cobranca_id);

create table if not exists public.repasse (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  contrato_id uuid not null references public.contrato_locacao(id) on delete restrict,
  cobranca_id uuid not null unique references public.cobranca(id) on delete restrict,
  aluguel_recebido integer not null check (aluguel_recebido >= 0),
  taxa_adm integer not null check (taxa_adm >= 0),
  irrf integer not null default 0 check (irrf >= 0),
  reembolsos integer not null default 0,
  liquido integer not null,
  distribuicao jsonb not null default '[]'::jsonb check (jsonb_typeof(distribuicao) = 'array'),
  status text not null default 'pendente' check (status in ('pendente','pago')),
  pago_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists repasse_company_idx on public.repasse(company_id, status);

-- updated_at (funcao ja existente no baseline)
do $$
declare t text;
begin
  foreach t in array array['contrato_locacao','cobranca','repasse'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.update_updated_at_column()', t || '_updated_at', t);
  end loop;
end $$;

-- RLS: papel + empresa
do $$
declare t text;
begin
  foreach t in array array['contrato_locacao','cobranca','cobranca_item','repasse'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_ler', t);
    execute format('drop policy if exists %I on public.%I', t || '_inserir', t);
    execute format('drop policy if exists %I on public.%I', t || '_editar', t);
    execute format('drop policy if exists %I on public.%I', t || '_apagar', t);
    execute format($p$create policy %I on public.%I for select to authenticated using (
      (company_id = public.current_company_id() and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]))
      or public.is_super_admin())$p$, t || '_ler', t);
    execute format($p$create policy %I on public.%I for insert to authenticated with check (
      company_id = public.current_company_id() and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]))$p$, t || '_inserir', t);
    execute format($p$create policy %I on public.%I for update to authenticated using (
      company_id = public.current_company_id() and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[]))
      with check (company_id = public.current_company_id())$p$, t || '_editar', t);
    execute format($p$create policy %I on public.%I for delete to authenticated using (
      company_id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]))$p$, t || '_apagar', t);
  end loop;
end $$;

-- O imovel do contrato precisa ser da mesma empresa
drop policy if exists contrato_locacao_inserir on public.contrato_locacao;
create policy contrato_locacao_inserir on public.contrato_locacao for insert to authenticated with check (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin','financeiro']::public.user_role_enum[])
  and exists (select 1 from public.property p where p.id = property_id and p.company_id = contrato_locacao.company_id)
);

commit;
