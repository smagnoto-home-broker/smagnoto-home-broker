-- =====================================================================
-- Smagnoto Home Broker — F2f: imovel ligado ao proprietario cadastrado
-- (base do DIMOB e do informe: o contrato herda o dono do imovel)
-- Data: 2026-10-28 · Depende de: 20261027120000_proprietario.sql (APLICADA)
-- ESTADO: NAO APLICADA. O banco cbgv... e o vivo: exige backup validado e
-- "pode" do Joaquim antes de aplicar.
-- Decisoes:
--   * So ADICIONA uma coluna anulavel a property; nada e apagado nem
--     reescrito. owner_name/owner_phone/owner_email continuam como estao.
--   * Se o proprietario for apagado, o vinculo vira null.
--   * A mesma empresa e garantida pela action (FK nao checa company_id).
--   * RLS: as policies existentes de property cobrem a coluna nova.
-- Como reverter:
--   alter table public.property drop column if exists proprietario_id;
-- =====================================================================

begin;

alter table public.property
  add column if not exists proprietario_id uuid references public.proprietario(id) on delete set null;

create index if not exists property_proprietario_idx on public.property(proprietario_id) where proprietario_id is not null;

commit;
