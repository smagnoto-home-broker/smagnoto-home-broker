-- =====================================================================
-- Smagnoto Home Broker — HARDENING (auditoria de 23/10/2026)
-- Data: 2026-10-23 · Pedido: docs/AUDITORIA-INICIAL.md (A4, A5, M1, B1)
-- ESTADO: APLICADA em 24/10/2026 no projeto cbgvttxmskwybalefezk (banco vivo), apos backup validado e "pode" do Joaquim.
-- (projeto cbgvttxmskwybalefezk) com usuario simulado; backup validado e
-- "pode" do Joaquim antes de aplicar em producao (ustqwxwdejkfwzfrlitc).
-- Decisoes:
--   A5: ninguem vira super_admin automaticamente por cadastro. O
--       super_admin e concedido manualmente (ver supabase/migrations/README.md).
--   A4: o app nao usa Storage hoje (grep sem .storage em src/); escrita em
--       logos/property-photos por usuario comum e removida. Leitura publica
--       continua. Quando o upload for implementado, criar policy por
--       pasta da empresa.
--   M1: app_config so para super_admin (o app nao le essa tabela).
--   B1: search_path com pg_temp; funcoes de gatilho sem EXECUTE para API.
-- Como reverter: recriar handle_new_user a partir da baseline (linhas
--   351-394), recriar app_config_leitura (using (true)) e as policies
--   midia_upload/update/delete da baseline (secao 8).
-- =====================================================================

-- A5 + B1: cadastro cria empresa + owner; NAO concede super_admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
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

  return new;
end;
$$;

-- M1: configuracao global so para super_admin.
drop policy if exists app_config_leitura on public.app_config;
create policy app_config_leitura on public.app_config for select to authenticated
  using (public.is_super_admin());

-- B1: search_path com pg_temp nas demais funcoes SECURITY DEFINER.
alter function public.current_company_id() set search_path = public, pg_temp;
alter function public.has_company_role(public.user_role_enum[]) set search_path = public, pg_temp;
alter function public.has_global_role(public.global_role_enum) set search_path = public, pg_temp;
alter function public.is_admin() set search_path = public, pg_temp;
alter function public.is_super_admin() set search_path = public, pg_temp;
alter function public.bloqueia_troca_tenant() set search_path = public, pg_temp;
alter function public.protege_membro() set search_path = public, pg_temp;
alter function public.protege_company() set search_path = public, pg_temp;
-- updated_at nao precisa de privilegio elevado.
alter function public.update_updated_at_column() security invoker;
alter function public.update_updated_at_column() set search_path = public, pg_temp;

-- B1: funcoes de gatilho nao sao API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.bloqueia_troca_tenant() from public, anon, authenticated;
revoke execute on function public.protege_membro() from public, anon, authenticated;
revoke execute on function public.protege_company() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;

-- A4: sem escrita em Storage por usuario comum (leitura publica mantida).
do $$
begin
  execute 'drop policy if exists midia_upload on storage.objects';
  execute 'drop policy if exists midia_update on storage.objects';
  execute 'drop policy if exists midia_delete on storage.objects';
exception when others then
  raise warning 'Storage nao ajustado automaticamente (%). Rodar este bloco como dono do schema storage.', sqlerrm;
end $$;
