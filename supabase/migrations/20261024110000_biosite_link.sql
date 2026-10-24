-- =====================================================================
-- Smagnoto Home Broker — vinculo company <-> biosite (Biosite Engine)
-- Data: 2026-10-24 · Pedido: docs/PLANO-INTEGRACAO-BIOSITE-ENGINE.md (secao 6)
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado e
-- "pode" do Joaquim antes de aplicar.
-- Decisoes:
--   * Tabela isolada: referencia somente public.company. Nao toca property,
--     lead nem outras tabelas de negocio.
--   * O biosite em si mora no Biosite Engine (outro banco). Aqui fica apenas o
--     vinculo e o estado da integracao.
--   * RLS: membros da empresa leem; so owner/admin gravam. Sem acesso anonimo.
-- Como reverter: drop table if exists public.biosite_link;
-- (o biosite na engine permanece; ele guarda o company_id como texto opaco)
-- =====================================================================

create table if not exists public.biosite_link (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  niche_key text not null check (char_length(niche_key) between 1 and 40),
  engine_biosite_id uuid,
  slug text check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  public_url text check (public_url is null or public_url ~ '^https://|^http://(localhost|127\.0\.0\.1)'),
  published boolean not null default false,
  status text not null default 'pending' check (status in ('pending','active','failed')),
  last_error text check (last_error is null or char_length(last_error) <= 300),
  provisioned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, niche_key),
  check (status <> 'active' or engine_biosite_id is not null)
);

create index if not exists biosite_link_company_idx on public.biosite_link (company_id);

alter table public.biosite_link enable row level security;

drop policy if exists biosite_link_leitura on public.biosite_link;
create policy biosite_link_leitura on public.biosite_link for select to authenticated
  using (company_id = public.current_company_id());

drop policy if exists biosite_link_insere on public.biosite_link;
create policy biosite_link_insere on public.biosite_link for insert to authenticated
  with check (
    company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin']::public.user_role_enum[])
  );

drop policy if exists biosite_link_atualiza on public.biosite_link;
create policy biosite_link_atualiza on public.biosite_link for update to authenticated
  using (
    company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin']::public.user_role_enum[])
  )
  with check (
    company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin']::public.user_role_enum[])
  );
-- Sem policy de delete: ninguem apaga o vinculo pelo app.

revoke all on public.biosite_link from anon, public;
revoke delete on public.biosite_link from authenticated;
grant select, insert, update on public.biosite_link to authenticated;

drop trigger if exists set_updated_at_biosite_link on public.biosite_link;
create trigger set_updated_at_biosite_link before update on public.biosite_link
  for each row execute function public.update_updated_at_column();

drop trigger if exists bloqueia_tenant_biosite_link on public.biosite_link;
create trigger bloqueia_tenant_biosite_link before update on public.biosite_link
  for each row execute function public.bloqueia_troca_tenant();
