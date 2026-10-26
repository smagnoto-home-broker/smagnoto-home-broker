-- =====================================================================
-- Smagnoto Home Broker — F1b: auditoria imutavel + consentimento LGPD + expurgo
-- Data: 2026-10-26 · Plano: docs/PLANO-ENTERPRISE-IMOBILIARIO.md (fase F1)
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado e
-- "pode" do Joaquim antes de aplicar.
-- Decisoes:
--   * So ADICIONA objetos novos (2 tabelas, 3 funcoes). Nao altera tabela existente.
--   * audit_log e lgpd_consent sao append-only: trigger bloqueia UPDATE, DELETE e
--     TRUNCATE (ate para service_role). Sem FK para company (o registro sobrevive).
--   * Ninguem grava em audit_log direto: so pela funcao registrar_auditoria(), que
--     preenche usuario, papel e empresa a partir da sessao (nao da para forjar autor).
--   * Leitura do audit_log: so owner/admin da empresa e super_admin.
--   * Expurgo: propostas recusadas ha mais de N dias (padrao 180) perdem dados
--     pessoais; so service_role executa (rotina agendada).
-- Como reverter (nesta ordem):
--   drop function if exists public.lgpd_expurgar_propostas(int);
--   drop function if exists public.registrar_auditoria(text,text,text,jsonb);
--   drop table if exists public.lgpd_consent;
--   drop table if exists public.audit_log;
--   drop function if exists public.bloquear_alteracao_imutavel();
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Funcao de imutabilidade (compartilhada)
-- ---------------------------------------------------------------------
create or replace function public.bloquear_alteracao_imutavel()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'registro imutavel: % bloqueado em %', tg_op, tg_table_name
    using errcode = '42501';
end;
$$;

-- ---------------------------------------------------------------------
-- 1. audit_log
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  actor_user_id uuid not null,
  actor_role text,
  acao text not null check (char_length(acao) between 1 and 80),
  entidade text not null check (char_length(entidade) between 1 and 60),
  entidade_id text check (entidade_id is null or char_length(entidade_id) <= 80),
  metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 4096),
  created_at timestamptz not null default now()
);
create index if not exists audit_log_company_created_idx on public.audit_log (company_id, created_at desc);
create index if not exists audit_log_company_entidade_idx on public.audit_log (company_id, entidade, entidade_id);

drop trigger if exists audit_log_sem_update_delete on public.audit_log;
create trigger audit_log_sem_update_delete before update or delete on public.audit_log
  for each row execute function public.bloquear_alteracao_imutavel();
drop trigger if exists audit_log_sem_truncate on public.audit_log;
create trigger audit_log_sem_truncate before truncate on public.audit_log
  for each statement execute function public.bloquear_alteracao_imutavel();

alter table public.audit_log enable row level security;
drop policy if exists audit_log_leitura_admin on public.audit_log;
create policy audit_log_leitura_admin on public.audit_log for select to authenticated
  using (
    (company_id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]))
    or public.is_super_admin()
  );
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

-- ---------------------------------------------------------------------
-- 2. registrar_auditoria(): unica porta de escrita
-- ---------------------------------------------------------------------
create or replace function public.registrar_auditoria(
  _acao text,
  _entidade text,
  _entidade_id text default null,
  _metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  _cid uuid;
  _role text;
  _id uuid;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;
  _cid := public.current_company_id();
  if _cid is null then
    raise exception 'usuario sem empresa ativa' using errcode = '42501';
  end if;
  select cu.role::text into _role
    from public.company_user cu
    where cu.user_id = auth.uid() and cu.ativo = true and cu.company_id = _cid
    limit 1;
  insert into public.audit_log (company_id, actor_user_id, actor_role, acao, entidade, entidade_id, metadata)
  values (_cid, auth.uid(), _role, _acao, _entidade, _entidade_id, coalesce(_metadata, '{}'::jsonb))
  returning id into _id;
  return _id;
end;
$$;
revoke all on function public.registrar_auditoria(text,text,text,jsonb) from public, anon;
grant execute on function public.registrar_auditoria(text,text,text,jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 3. lgpd_consent (evidencia de consentimento, sem dado pessoal em claro)
-- ---------------------------------------------------------------------
create table if not exists public.lgpd_consent (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id),
  lead_id uuid,
  titular_hash text not null check (titular_hash ~ '^[0-9a-f]{64}$'), -- sha256 do telefone (so digitos)
  finalidade text not null check (finalidade in
    ('contato_comercial','compartilhar_parceiros_financeiros','compartilhar_seguradoras','marketing')),
  concedido boolean not null,
  versao_texto text not null check (char_length(versao_texto) between 1 and 40),
  origem text not null check (origem in ('site','crm','whatsapp')),
  created_at timestamptz not null default now()
);
create index if not exists lgpd_consent_company_titular_idx on public.lgpd_consent (company_id, titular_hash);

drop trigger if exists lgpd_consent_sem_update_delete on public.lgpd_consent;
create trigger lgpd_consent_sem_update_delete before update or delete on public.lgpd_consent
  for each row execute function public.bloquear_alteracao_imutavel();
drop trigger if exists lgpd_consent_sem_truncate on public.lgpd_consent;
create trigger lgpd_consent_sem_truncate before truncate on public.lgpd_consent
  for each statement execute function public.bloquear_alteracao_imutavel();

alter table public.lgpd_consent enable row level security;
drop policy if exists lgpd_consent_leitura_admin on public.lgpd_consent;
create policy lgpd_consent_leitura_admin on public.lgpd_consent for select to authenticated
  using (
    (company_id = public.current_company_id() and public.has_company_role(array['owner','admin']::public.user_role_enum[]))
    or public.is_super_admin()
  );
-- Formulario publico (anon) e CRM (authenticated) registram; a empresa precisa existir.
drop policy if exists lgpd_consent_insert on public.lgpd_consent;
create policy lgpd_consent_insert on public.lgpd_consent for insert to anon, authenticated
  with check (exists (select 1 from public.company c where c.id = company_id));
revoke all on public.lgpd_consent from anon, authenticated;
grant select on public.lgpd_consent to authenticated;
grant insert on public.lgpd_consent to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Expurgo de propostas recusadas (LGPD: reprovadas em ate 180 dias)
--    Limpa so campos pessoais; valor, status e datas ficam para o historico.
-- ---------------------------------------------------------------------
create or replace function public.lgpd_expurgar_propostas(_dias int default 180)
returns int
language plpgsql security definer set search_path = public as $$
declare
  _total int;
begin
  if _dias < 30 then
    raise exception 'prazo minimo de expurgo e 30 dias' using errcode = '22023';
  end if;
  -- CTEs com DML executam uma unica vez, mesmo a ultima nao lendo "ins".
  with alvo as (
    update public.proposal p
       set lead_name = null, payment_terms = null, observations = null, contract_url = null
     where p.status = 'recusada'
       and p.updated_at < now() - make_interval(days => _dias)
       and (p.lead_name is not null or p.payment_terms is not null
            or p.observations is not null or p.contract_url is not null)
    returning p.company_id
  ),
  resumo as (
    select company_id, count(*)::int as n from alvo group by company_id
  ),
  ins as (
    insert into public.audit_log (company_id, actor_user_id, actor_role, acao, entidade, metadata)
    select company_id, '00000000-0000-0000-0000-000000000000'::uuid, 'sistema',
           'lgpd.expurgo_propostas', 'proposal', jsonb_build_object('registros', n, 'dias', _dias)
      from resumo
    returning 1
  )
  select coalesce(sum(n), 0)::int into _total from resumo;
  return _total;
end;
$$;
revoke all on function public.lgpd_expurgar_propostas(int) from public, anon, authenticated;
grant execute on function public.lgpd_expurgar_propostas(int) to service_role;

commit;
