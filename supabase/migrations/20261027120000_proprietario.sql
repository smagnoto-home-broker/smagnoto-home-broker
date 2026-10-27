-- =====================================================================
-- Smagnoto Home Broker — F2e: cadastro de proprietario (CPF/CNPJ cifrado)
-- Data: 2026-10-27 · Plano: docs/PLANO-ENTERPRISE-IMOBILIARIO.md (F2/F5: base do DIMOB/informe)
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado e
-- "pode" do Joaquim antes de aplicar.
-- Decisoes:
--   * So ADICIONA 1 tabela nova. Nao altera property nem contrato_locacao
--     (o vinculo imovel/contrato -> proprietario vem em migration propria).
--   * O CPF/CNPJ NUNCA fica em texto puro: o app cifra (AES-256-GCM) com a chave
--     DADOS_SENSIVEIS_KEY (fora do banco). Aqui ficam: documento_cifrado,
--     documento_final (4 ultimos digitos, para exibir mascarado) e documento_hash
--     (HMAC com a mesma chave, so para impedir duplicidade; nao reversivel sem a chave).
--   * RLS por empresa: leem owner/admin/corretor/captador/financeiro; escrevem
--     owner/admin/captador/financeiro; so owner/admin apagam. Quem ve o documento
--     completo e decidido no app (permissao "dados_sensiveis") e fica na auditoria.
-- Como reverter:
--   drop table if exists public.proprietario;
-- =====================================================================

begin;

create table if not exists public.proprietario (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  nome text not null check (length(nome) between 2 and 200),
  tipo_pessoa text not null default 'pf' check (tipo_pessoa in ('pf','pj')),
  documento_cifrado text check (documento_cifrado is null or length(documento_cifrado) <= 500),
  documento_final text check (documento_final is null or documento_final ~ '^[0-9A-Z]{4}$'),
  documento_hash text check (documento_hash is null or documento_hash ~ '^[0-9a-f]{64}$'),
  telefone text check (length(telefone) <= 40),
  email text check (length(email) <= 200),
  observacoes text check (length(observacoes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((documento_cifrado is null) = (documento_hash is null))
);
create unique index if not exists proprietario_company_documento_uidx
  on public.proprietario(company_id, documento_hash) where documento_hash is not null;
create index if not exists proprietario_company_nome_idx on public.proprietario(company_id, nome);

drop trigger if exists proprietario_updated_at on public.proprietario;
create trigger proprietario_updated_at before update on public.proprietario
  for each row execute function public.update_updated_at_column();

alter table public.proprietario enable row level security;
revoke all on public.proprietario from anon, authenticated;
grant select, insert, update, delete on public.proprietario to authenticated;

drop policy if exists proprietario_ler on public.proprietario;
create policy proprietario_ler on public.proprietario for select to authenticated using (
  (company_id = public.current_company_id()
    and public.has_company_role(array['owner','admin','corretor','captador','financeiro']::public.user_role_enum[]))
  or public.is_super_admin()
);
drop policy if exists proprietario_inserir on public.proprietario;
create policy proprietario_inserir on public.proprietario for insert to authenticated with check (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin','captador','financeiro']::public.user_role_enum[])
);
drop policy if exists proprietario_editar on public.proprietario;
create policy proprietario_editar on public.proprietario for update to authenticated using (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin','captador','financeiro']::public.user_role_enum[])
) with check (company_id = public.current_company_id());
drop policy if exists proprietario_apagar on public.proprietario;
create policy proprietario_apagar on public.proprietario for delete to authenticated using (
  company_id = public.current_company_id()
  and public.has_company_role(array['owner','admin']::public.user_role_enum[])
);

commit;
