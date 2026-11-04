-- =====================================================================
-- Smagnoto Home Broker — Condominios (cadastro unico herdado pelos imoveis)
-- Data: 2026-11-04 · Depende de: baseline (property, company) e funcoes
--   current_company_id(), has_company_role(), is_super_admin(), update_updated_at_column().
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado,
-- teste no staging e "pode" do Joaquim (apos aprovacao do Anderson).
-- Decisoes:
--   * ADICIONA 1 tabela (condominio) e 1 coluna anulavel em property
--     (condominio_id). Nada e apagado nem reescrito.
--   * Se o condominio for apagado, o vinculo do imovel vira null.
--   * A mesma empresa e garantida pela action (FK nao checa company_id).
--   * RLS por empresa: leem owner/admin/corretor/captador; escrevem so owner/admin
--     (igual a matriz de permissoes: modulo "condominios").
--   * Sem backfill automatico: o vinculo e feito pela tela (botao "Vincular imoveis").
-- Como reverter:
--   alter table public.property drop column if exists condominio_id;
--   drop table if exists public.condominio;
-- =====================================================================

begin;

create table if not exists public.condominio (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  nome text not null check (length(nome) between 2 and 200),
  bairro text check (bairro is null or length(bairro) <= 200),
  cidade text check (cidade is null or length(cidade) <= 120),
  lote_tipico_m2 numeric check (lote_tipico_m2 is null or lote_tipico_m2 > 0),
  lazer text[] not null default '{}',
  descricao text check (descricao is null or length(descricao) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists condominio_company_nome_uidx on public.condominio(company_id, lower(nome));

drop trigger if exists condominio_updated_at on public.condominio;
create trigger condominio_updated_at before update on public.condominio
  for each row execute function public.update_updated_at_column();

alter table public.condominio enable row level security;
revoke all on public.condominio from anon, authenticated;
grant select, insert, update, delete on public.condominio to authenticated;

drop policy if exists condominio_ler on public.condominio;
create policy condominio_ler on public.condominio for select to authenticated using (
  (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','corretor','captador']::public.user_role_enum[]))
  or public.is_super_admin()
);
drop policy if exists condominio_inserir on public.condominio;
create policy condominio_inserir on public.condominio for insert to authenticated with check (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin']::public.user_role_enum[])
);
drop policy if exists condominio_editar on public.condominio;
create policy condominio_editar on public.condominio for update to authenticated using (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin']::public.user_role_enum[])
) with check (company_id = public.current_company_id());
drop policy if exists condominio_apagar on public.condominio;
create policy condominio_apagar on public.condominio for delete to authenticated using (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin']::public.user_role_enum[])
);

alter table public.property
  add column if not exists condominio_id uuid references public.condominio(id) on delete set null;
create index if not exists property_condominio_idx on public.property(condominio_id) where condominio_id is not null;

commit;
