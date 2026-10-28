-- =====================================================================
-- Smagnoto Home Broker — F4d/F5c: contrato de locacao ligado ao proprietario
-- e com CPF/CNPJ do locatario (base do DIMOB e do informe de rendimentos)
-- Data: 2026-10-27 · Depende de: 20261027120000_proprietario.sql (APLICADA)
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado e
-- "pode" do Joaquim antes de aplicar.
-- Decisoes:
--   * So ADICIONA colunas anuladas (nullable) a contrato_locacao; nada e apagado
--     nem reescrito; contratos existentes continuam validos (locador_nome segue
--     sendo o nome exibido).
--   * proprietario_id: vinculo opcional; se o proprietario for apagado, vira null.
--   * Documento do locatario: mesmo esquema do proprietario (cifrado no app,
--     4 ultimos caracteres e hash HMAC); nunca em texto puro.
--   * RLS: as policies existentes de contrato_locacao cobrem as colunas novas.
-- Como reverter:
--   alter table public.contrato_locacao
--     drop column if exists proprietario_id,
--     drop column if exists locatario_tipo_pessoa,
--     drop column if exists locatario_documento_cifrado,
--     drop column if exists locatario_documento_final,
--     drop column if exists locatario_documento_hash;
-- =====================================================================

begin;

alter table public.contrato_locacao
  add column if not exists proprietario_id uuid references public.proprietario(id) on delete set null,
  add column if not exists locatario_tipo_pessoa text not null default 'pf' check (locatario_tipo_pessoa in ('pf','pj')),
  add column if not exists locatario_documento_cifrado text check (locatario_documento_cifrado is null or length(locatario_documento_cifrado) <= 500),
  add column if not exists locatario_documento_final text check (locatario_documento_final is null or locatario_documento_final ~ '^[0-9A-Z]{4}$'),
  add column if not exists locatario_documento_hash text check (locatario_documento_hash is null or locatario_documento_hash ~ '^[0-9a-f]{64}$');

create index if not exists contrato_locacao_proprietario_idx on public.contrato_locacao(proprietario_id) where proprietario_id is not null;

commit;
