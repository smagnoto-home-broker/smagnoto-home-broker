-- =====================================================================
-- Smagnoto Home Broker — F5b: plano de contas e lancamentos (dois caixas)
-- Data: 2026-10-26 · Plano: docs/PLANO-ENTERPRISE-IMOBILIARIO.md (fase F5)
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado e
-- "pode" do Joaquim antes de aplicar.
-- Decisoes:
--   * So ADICIONA 2 tabelas novas. Nao altera tabela existente (revenue/operational_cost seguem).
--   * Natureza da conta separa dinheiro da imobiliaria de dinheiro de terceiros.
--   * Cada lancamento pertence a UM caixa: 'imobiliaria' ou 'terceiros' (nunca misturados);
--     a natureza da conta tem de ser coerente com o caixa (check abaixo, via trigger).
--   * Valores em centavos (integer, > 0); o sinal vem de 'sentido' (entrada/saida).
--   * Lancamento e append-only para quem nao e owner/admin: so owner/admin editam ou apagam.
--   * RLS por empresa; owner/admin/financeiro leem e inserem.
-- Como reverter (nesta ordem):
--   drop table if exists public.lancamento;
--   drop table if exists public.plano_conta;
--   drop function if exists public.validar_lancamento_caixa();
-- =====================================================================

begin;

create table if not exists public.plano_conta (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  codigo text not null check (length(codigo) between 1 and 20),
  nome text not null check (length(nome) between 2 and 120),
  natureza text not null check (natureza in ('receita_propria','despesa','repasse_terceiro','tributo_terceiro','reembolso')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, codigo)
);

create table if not exists public.lancamento (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  conta_id uuid not null references public.plano_conta(id) on delete restrict,
  data date not null,
  valor_centavos integer not null check (valor_centavos > 0),
  sentido text not null check (sentido in ('entrada','saida')),
  caixa text not null check (caixa in ('imobiliaria','terceiros')),
  descricao text not null check (length(descricao) between 2 and 200),
  origem text not null default 'manual' check (origem in ('manual','cobranca','repasse','comissao')),
  origem_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists lancamento_company_data_idx on public.lancamento(company_id, data);
create index if not exists lancamento_conta_idx on public.lancamento(conta_id);

-- Coerencia caixa x natureza: receita propria e despesa so no caixa da imobiliaria;
-- repasse, tributo de terceiro e reembolso so no caixa de terceiros.
create or replace function public.validar_lancamento_caixa()
returns trigger language plpgsql set search_path = public as $$
declare _nat text; _emp uuid;
begin
  select natureza, company_id into _nat, _emp from public.plano_conta where id = new.conta_id;
  if _emp is distinct from new.company_id then
    raise exception 'conta de outra empresa' using errcode = '42501';
  end if;
  if (_nat in ('receita_propria','despesa') and new.caixa <> 'imobiliaria')
     or (_nat in ('repasse_terceiro','tributo_terceiro','reembolso') and new.caixa <> 'terceiros') then
    raise exception 'caixa % incompativel com a natureza % da conta', new.caixa, _nat using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists lancamento_valida_caixa on public.lancamento;
create trigger lancamento_valida_caixa before insert or update on public.lancamento
  for each row execute function public.validar_lancamento_caixa();

-- RLS
alter table public.plano_conta enable row level security;
alter table public.lancamento enable row level security;
revoke all on public.plano_conta, public.lancamento from anon, authenticated;
grant select, insert, update, delete on public.plano_conta, public.lancamento to authenticated;

do $$
declare t text;
begin
  foreach t in array array['plano_conta','lancamento'] loop
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
      company_id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]))
      with check (company_id = public.current_company_id())$p$, t || '_editar', t);
    execute format($p$create policy %I on public.%I for delete to authenticated using (
      company_id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]))$p$, t || '_apagar', t);
  end loop;
end $$;

commit;
