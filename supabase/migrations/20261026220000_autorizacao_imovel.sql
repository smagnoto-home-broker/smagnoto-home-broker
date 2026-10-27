-- =====================================================================
-- Smagnoto Home Broker — F2d: autorizacao de venda/locacao do imovel (com vencimento)
-- Data: 2026-10-26 · Plano: docs/PLANO-ENTERPRISE-IMOBILIARIO.md (fase F2)
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado e
-- "pode" do Joaquim antes de aplicar.
-- Decisoes:
--   * So ADICIONA 1 tabela nova. Nao altera tabela existente.
--   * Uma autorizacao por imovel/periodo (historico preservado); alerta de vencimento no app.
--   * RLS por empresa; leem e escrevem owner/admin/corretor/captador; so owner/admin apagam.
--   * O imovel precisa ser da mesma empresa (checado na policy de insert).
-- Como reverter:
--   drop table if exists public.autorizacao_imovel;
-- =====================================================================

begin;

create table if not exists public.autorizacao_imovel (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  property_id uuid not null references public.property(id) on delete cascade,
  tipo text not null default 'exclusiva' check (tipo in ('exclusiva','nao_exclusiva')),
  finalidade text not null default 'venda' check (finalidade in ('venda','locacao','ambas')),
  data_inicio date not null,
  data_vencimento date not null,
  comissao_pct numeric(5,2) check (comissao_pct is null or (comissao_pct >= 0 and comissao_pct <= 100)),
  observacoes text check (length(observacoes) <= 1000),
  status text not null default 'ativa' check (status in ('ativa','encerrada','renovada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (data_vencimento > data_inicio)
);
create index if not exists autorizacao_imovel_company_venc_idx on public.autorizacao_imovel(company_id, status, data_vencimento);
create index if not exists autorizacao_imovel_property_idx on public.autorizacao_imovel(property_id);

drop trigger if exists autorizacao_imovel_updated_at on public.autorizacao_imovel;
create trigger autorizacao_imovel_updated_at before update on public.autorizacao_imovel
  for each row execute function public.update_updated_at_column();

alter table public.autorizacao_imovel enable row level security;
revoke all on public.autorizacao_imovel from anon, authenticated;
grant select, insert, update, delete on public.autorizacao_imovel to authenticated;

drop policy if exists autorizacao_imovel_ler on public.autorizacao_imovel;
create policy autorizacao_imovel_ler on public.autorizacao_imovel for select to authenticated using (
  (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','corretor','captador']::public.user_role_enum[]))
  or public.is_super_admin()
);
drop policy if exists autorizacao_imovel_inserir on public.autorizacao_imovel;
create policy autorizacao_imovel_inserir on public.autorizacao_imovel for insert to authenticated with check (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin','corretor','captador']::public.user_role_enum[])
  and exists (select 1 from public.property p where p.id = property_id and p.company_id = autorizacao_imovel.company_id)
);
drop policy if exists autorizacao_imovel_editar on public.autorizacao_imovel;
create policy autorizacao_imovel_editar on public.autorizacao_imovel for update to authenticated using (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin','corretor','captador']::public.user_role_enum[])
) with check (company_id = public.current_company_id());
drop policy if exists autorizacao_imovel_apagar on public.autorizacao_imovel;
create policy autorizacao_imovel_apagar on public.autorizacao_imovel for delete to authenticated using (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin']::public.user_role_enum[])
);

commit;
