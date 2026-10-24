# Plano de integração: Smagnoto (cliente) <-> Biosite Engine

Status: **F5 (lado Smagnoto) implementada na branch `feat/biosite-integracao`, sem aplicar a migration.** A engine (F1 a F4) ainda não existe. Data: 2026-10-24.
D1 resolvida pelo Joaquim: implementação no repositório governado, branch `feat/biosite-integracao`; a pasta `bio-site` fica como legado intocado.

## 1. O que foi verificado (leitura somente)

| Item | Achado |
|---|---|
| `F:\Projetos\cyber-os-solution-docs\bio-site` | É o **código do Smagnoto** (origin `smagnoto-home-broker`, pacote `smagnoto`, Next 16.4.2), parado no commit `9740ffb`. Os 104 arquivos "modificados" só diferem em fim de linha (CRLF): `git diff --ignore-cr-at-eol` fica vazio. **Não tem** governança, hardening, CI nem a home nova. |
| `F:\Projetos\cyber-os-solution-docs\biosite-engine` | `create-next-app` vazio (Next 15.5.28, React 19.1.0, sem Supabase, sem zod). Repositório git **sem nenhum commit**. Sem AGENTS.md, CI ou `.env.example`. |
| Legado (padrões a respeitar) | Multi-tenant por `company_id` + `current_company_id()`; RLS em todas as tabelas; `requireCompany(roles)` em toda página/ação; sem `service_role` no código; papéis `owner/admin/corretor/captador/financeiro`. |
| Banco vivo do legado | `cbgv…` (staging e produção compartilham o mesmo banco). Qualquer migration nele conta como **produção**: backup validado + "pode". |

Consequência: o `bio-site` é uma cópia **antiga** do repositório. A cópia governada é `F:\Projetos\smagnoto-home-broker-staging` (`main` = `b4c5ced`). Ver decisão D1.

## 2. Princípios (do pedido)

1. Dois domínios independentes: dois repositórios, dois projetos Vercel, dois bancos.
2. **Nenhum import** entre repositórios. Toda comunicação é HTTP autenticada.
3. A engine não conhece imóvel: sem `property`, CRECI, `transaction_enum`, lead imobiliário nem colunas de imóvel. O que é específico de nicho vive em `metadata` JSONB.
4. O Smagnoto só **opera** a engine como cliente da API. CRM, imóveis, leads, propostas, visitas e prestadores não mudam.
5. O contrato é um arquivo versionado nos dois lados (OpenAPI/JSON Schema copiado, não importado), com teste de contrato em cada repositório.

## 3. Arquitetura

```
 Navegador (admin do Smagnoto)
        |  1. clica "Abrir painel do biosite"
        v
 Smagnoto (Vercel A, banco cbgv)            Biosite Engine (Vercel B, banco novo)
 server action  --- HTTPS + Bearer key ---> /api/v1/*  (provisiona, publica, handoff)
 requireCompany(owner|admin)                |
 tabela biosite_link (company_id <-> id)    |  /b/[slug]        página pública (sem login)
        |                                   |  /admin           painel (login próprio da engine)
        +-- 2. recebe URL de uso único ---->|  /auth/handoff    troca o código por sessão
 navegador é redirecionado para a engine
```

Só o servidor do Smagnoto fala com a API. A chave de API nunca vai ao navegador.

## 4. Decisões e padrões assumidos

| # | Decisão | Padrão adotado (recomendação) |
|---|---|---|
| D1 | Onde implementar o lado Smagnoto | **Decidido:** repositório governado (`smagnoto-home-broker-staging`), branch `feat/biosite-integracao`. O `bio-site` fica intocado. |
| D2 | Quantos biosites por empresa | Um por `(cliente de API, company_id_externo, niche_key)`. Mesma empresa pode ter nichos diferentes. |
| D3 | Banco da engine | **Projeto Supabase novo e separado.** Risco: o plano Free costuma limitar projetos ativos por organização. Hoje há `cbgv…` e `ustq…` (vazio). Confirmar antes; pode ser preciso pausar o `ustq…` ou usar outra organização. |
| D4 | Autenticação Smagnoto -> engine | Chave de API Bearer por cliente (32 bytes aleatórios; só o hash SHA-256 fica na engine), rotação com 2 chaves ativas. HMAC com timestamp fica como melhoria futura. |
| D5 | Acesso do usuário ao painel da engine | **Handoff de uso único**: a engine emite um código de 60 s que o navegador troca por sessão. O Smagnoto não guarda chave de assinatura. |
| D6 | Login da engine | Supabase Auth do projeto da engine. Usuário vinculado por e-mail em `tenant_members`. |
| D7 | Onde fica a URL pública | Engine: `https://<dominio-engine>/b/[slug]`. O Smagnoto só exibe a URL devolvida pela API. |
| D8 | Escrita de catálogo/seções | Pelo painel da engine. O Smagnoto **não** edita catálogo na v1. |

## 5. Contrato de dados da engine (proposta de DDL, não aplicada)

```sql
-- Clientes de API (ex.: o Smagnoto). Só acessível pelo service_role.
create table api_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  key_prefix text not null,            -- 8 primeiros caracteres, para identificar em log
  key_hash text not null,              -- SHA-256 da chave; a chave em claro nunca é guardada
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table tenant_biosites (
  id uuid primary key default gen_random_uuid(),
  api_client_id uuid not null references api_clients(id),
  company_id_externo text not null,    -- uuid da company do Smagnoto, como texto opaco
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  niche_key text not null,
  title text not null,
  published boolean not null default false,
  theme jsonb not null default '{}',
  settings jsonb not null default '{}', -- NUNCA guardar segredo aqui: é lido pela página pública
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (api_client_id, company_id_externo, niche_key)
);

create table tenant_members (          -- autorização por tenant
  biosite_id uuid not null references tenant_biosites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor')),
  primary key (biosite_id, user_id)
);

create table biosite_sections (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references tenant_biosites(id) on delete cascade,
  section_type text not null,          -- validado na aplicação (hero, texto, catalogo, galeria, contato...)
  position int not null,
  enabled boolean not null default true,
  config jsonb not null default '{}',
  unique (biosite_id, position) deferrable initially deferred
);

create table catalog_items (
  id uuid primary key default gen_random_uuid(),
  biosite_id uuid not null references tenant_biosites(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  price numeric(14,2),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  cover_url text,
  metadata jsonb not null default '{}', -- campos do nicho; esquema por niche_key fica em código da engine
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (biosite_id, slug)
);

-- Suporte à API (todas só service_role)
create table idempotency_keys (
  api_client_id uuid not null references api_clients(id),
  key text not null,
  request_hash text not null,
  status_code int not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (api_client_id, key)     -- limpeza após 24 h
);
create table handoff_codes (
  code_hash text primary key,
  biosite_id uuid not null references tenant_biosites(id) on delete cascade,
  actor jsonb not null,                -- {external_user_id, email, role}
  expires_at timestamptz not null,
  used_at timestamptz
);
create table audit_log (               -- somente inclusão (trigger bloqueia UPDATE/DELETE)
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  api_client_id uuid, biosite_id uuid, action text not null, detail jsonb not null default '{}'
);
```

Decisões do desenho:
- `catalog_items` aponta para `biosite_id` (tenant). O `company_id_externo` é derivável por join e não é duplicado, para não haver duas fontes da verdade.
- `niche_key` é só uma chave. O esquema de `metadata` por nicho fica em um registro no código da engine (por exemplo `niches/imobiliaria.ts`), validado com zod. O nicho imobiliário usa apenas chaves dentro de `metadata`, nunca coluna ou enum.
- Tipos de seção e status são `text` + validação, não enums, para novos nichos não exigirem migration.

## 6. Estratégia de RLS

**Engine (banco novo)**
1. `ENABLE` e `FORCE ROW LEVEL SECURITY` em todas as tabelas. Negação por padrão.
2. **`anon` sem acesso a nenhuma tabela** (`revoke all ... from anon`). A página pública usa só a função `get_public_biosite(slug)`, `SECURITY DEFINER`, `set search_path = public, pg_temp`, que devolve JSON com campos explícitos: biosite publicado, seções ativas e itens `published`. Ela não devolve `company_id_externo` nem `api_client_id`.
3. Função auxiliar `private.my_biosite_ids()`: `SECURITY DEFINER`, `STABLE`, lê `tenant_members` por `(select auth.uid())`. Evita policy que consulta a própria tabela (recursão). Execução só para `authenticated`.
4. `authenticated`:
   - `tenant_biosites`: `select` onde `id in (select private.my_biosite_ids())`; `update` limitado a `title/theme/settings/published`. Trigger bloqueia mudança de `id`, `api_client_id`, `company_id_externo`, `niche_key` e `slug` (mesmo padrão de `bloqueia_troca_tenant` do legado). **Sem** `insert`/`delete`: criar e apagar tenant é só pela API.
   - `biosite_sections` e `catalog_items`: `select/insert/update/delete` com `using` e `with check` em `biosite_id in (select private.my_biosite_ids())`.
   - `tenant_members`: leitura dos próprios vínculos; escrita só pelo `service_role`.
5. `api_clients`, `idempotency_keys`, `handoff_codes`, `audit_log`: RLS ligado e **sem policy**, ou seja, só `service_role`.
6. `service_role` só em módulo `server-only` das rotas `/api/v1/*` e do handoff, **depois** de autenticar o cliente de API. Nunca em arquivo `"use client"`.
7. Teste obrigatório, simulando usuário (`set local role authenticated; set local request.jwt.claims = ...` dentro de transação com `rollback`): usuário do tenant A lê 0 linhas do tenant B em todas as 4 tabelas de conteúdo; `anon` lê 0 linhas direto das tabelas; `anon` obtém só os campos públicos pela função; tentativa de trocar `company_id_externo` falha.

**Smagnoto (banco cbgv, uma tabela nova de vínculo)**
```sql
create table public.biosite_link (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  niche_key text not null,
  engine_biosite_id uuid,
  slug text,
  public_url text,
  published boolean not null default false,
  status text not null default 'pending' check (status in ('pending','active','failed')),
  last_error text,
  provisioned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, niche_key)
);
```
- RLS ligado. `select` com `company_id = public.current_company_id()`. `insert/update` com `public.has_company_role(array['owner','admin']::public.user_role_enum[])` e `with check` no mesmo `company_id`. Sem acesso `anon`. `revoke all ... from anon`.
- Não referencia `property`, `lead` nem nenhuma tabela de negócio além de `company`.
- Se a `company` for apagada, o vínculo some em cascata e o biosite na engine fica órfão (ele guarda o `company_id_externo`); tratado como rotina manual.

## 7. Contrato da API (v1)

Base: `https://<engine>/api/v1`. Cabeçalhos: `Authorization: Bearer <chave>`, `Content-Type: application/json`, `Idempotency-Key: <uuid>` nas escritas. Erros em `application/problem+json` (RFC 9457) com `type`, `title`, `status`, `detail`.

**POST /biosites/provision** (idempotente)
```json
{ "company_id_externo": "uuid-da-company", "niche_key": "imobiliaria",
  "slug_hint": "smagnoto", "title": "Smagnoto Home Broker",
  "owner": { "email": "dono@empresa.com", "name": "Nome" },
  "theme": {}, "settings": {} }
```
Resposta `201` (criou) ou `200` (já existia, mesmo recurso):
```json
{ "id": "uuid", "slug": "smagnoto", "niche_key": "imobiliaria", "title": "...",
  "published": false, "public_url": "https://<engine>/b/smagnoto",
  "created": true }
```
Regras: chave natural `(cliente, company_id_externo, niche_key)`; mesmo `Idempotency-Key` com corpo diferente = `422`; slug ocupado recebe sufixo numérico (`smagnoto-2`); slugs reservados (`admin`, `api`, `b`, `auth`...) recusados; cria a linha e o vínculo do dono em `tenant_members` em uma transação.

**GET /biosites/by-external/{company_id_externo}?niche_key=...** devolve o mesmo objeto, ou `404`.
**PATCH /biosites/{id}** `{ "title"?, "published"?, "theme"?, "settings"? }` devolve o objeto atualizado. Só altera biosite do cliente autenticado; senão `404`.
**POST /biosites/{id}/admin-handoff** `{ "actor": { "external_user_id": "uuid", "email": "x@y.com", "role": "owner" } }` devolve `{ "url": "https://<engine>/auth/handoff?code=...", "expires_in": 60 }`. O código é de uso único, guardado só como hash. Só `owner` e `admin` do Smagnoto viram `owner` na engine.
**GET /health** devolve `{ "status": "ok", "version": "1" }`, sem autenticação e sem dados.
Públicos da engine (fora da API): `GET /b/[slug]` (página), `/auth/handoff`, `/admin`.

Limites: corpo máximo 64 KB; `settings`/`theme` até 16 KB; taxa por chave de API (ex.: 60 req/min).

## 8. Fluxo "abrir painel"
1. Admin clica no botão na tela `/sistema/biosite`. A server action chama `requireCompany(["owner","admin"])`.
2. O servidor lê o `engine_biosite_id` do `biosite_link` (RLS) e chama `POST /admin-handoff`.
3. A action devolve a URL e o navegador vai para a engine.
4. A engine confere o código (hash, validade, não usado), marca como usado, cria ou vincula o usuário pelo e-mail em `tenant_members`, abre a sessão e redireciona para `/admin` (destino fixo: sem redirecionamento aberto).
5. Cada passo escreve em `audit_log`.

## 9. Variáveis de ambiente (somente nomes; valores nunca em chat, git ou doc)

**Smagnoto** (todas só no servidor; nunca `NEXT_PUBLIC_`)
| Variável | Uso |
|---|---|
| `BIOSITE_ENGINE_API_URL` | Base da API (`https://<engine>/api/v1`) |
| `BIOSITE_ENGINE_API_KEY` | Chave Bearer deste cliente |
| `BIOSITE_ENGINE_TIMEOUT_MS` | Timeout (padrão 8000) |
Definir por ambiente na Vercel (Production e Preview, com engine de teste no Preview). Adicionar só os nomes ao `.env.example`.

**Engine**
| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Projeto Supabase da engine (públicas por desenho) |
| `SUPABASE_SERVICE_ROLE_KEY` | Só servidor, só módulo `server-only` da API e do handoff |
| `BIOSITE_PUBLIC_BASE_URL` | Monta `public_url` e a URL do handoff |
| `BIOSITE_HANDOFF_TTL_SECONDS` | Validade do código (padrão 60) |
| `BIOSITE_RATE_LIMIT_PER_MIN` | Limite por chave de API |
As chaves de cliente ficam no banco (`api_clients`), não em variável de ambiente. A chave é gerada por um script da engine e exibida uma única vez.

## 10. Lado Smagnoto: o que muda

Arquivos **novos** (nenhum import da engine; implementados na F5, a migration ainda **não aplicada**):
- `src/lib/biosite-engine/config.ts` (lê e valida as variáveis, `server-only`)
- `src/lib/biosite-engine/contract.ts` (esquemas zod do contrato v1, escritos à mão a partir do OpenAPI)
- `src/lib/biosite-engine/client.ts` (fetch com timeout, `Idempotency-Key`, validação da resposta com zod, erros tipados)
- `src/actions/biosite.ts` (`provisionBiosite`, `setPublished`, `openBiositeAdmin`)
- `src/app/sistema/biosite/page.tsx` e `_components/acoes-biosite.tsx` (status, URL pública copiável, botões). A tela mostra aviso honesto se a integração não estiver configurada ou se a migration ainda não foi aplicada
- `supabase/migrations/20261024110000_biosite_link.sql`

Alteração mínima em arquivos existentes: **um** item de menu "Biosite" na seção Serviços de `src/components/sistema/sidebar.tsx` e 3 nomes de variável em `.env.example`.
Não tocam: `property`, `lead`, `visit`, `proposal`, `service_*`, matching, pipeline, site público atual.

## 11. Falhas e idempotência
- Sem transação distribuída. O vínculo local nasce `pending`, vira `active` após a resposta da engine ou `failed` com `last_error` (sem dados pessoais).
- Repetir a ação é seguro: mesmo `Idempotency-Key` e mesma chave natural devolvem o mesmo recurso.
- Retentativas só em `POST/PATCH` idempotentes, 2 tentativas, espera crescente. Timeout de 8 s. Engine fora do ar: a tela mostra "indisponível" e o resto do Smagnoto segue normal.
- Reconciliação: `GET /biosites/by-external/{id}` refaz o vínculo local se a gravação falhou depois da criação remota.

## 12. Fases, gates e estimativas (estimativas minhas, em tempo de trabalho)

| Fase | Entrega | Estimativa | Gate |
|---|---|---|---|
| F0 | Aprovar este plano e as decisões D1 a D8 | 10 min | "pode" do Joaquim |
| F1 | Fundação da engine: AGENTS.md, CLAUDE.md, padrão de engenharia, `.env.example`, CI, primeiro commit | 30 min | type-check e lint com 0 erros |
| F2 | Projeto Supabase novo; DDL + RLS + testes com usuário simulado | 60 min | testes RLS passam; "pode" para aplicar |
| F3 | API v1: chaves, autenticação, provisionamento idempotente, PATCH, health, testes de contrato | 90 min | testes passam |
| F4 | Página `/b/[slug]`, painel `/admin`, handoff | 120 min | login e isolamento entre 2 tenants testados |
| F5 | Cliente no Smagnoto: migration `biosite_link`, módulo, ações, tela | 90 min | backup validado + "pode" (banco `cbgv…` é o vivo) |
| F6 | Teste ponta a ponta e documentação | 45 min | checklist abaixo |

## 13. Aceite (checklist)
- [ ] Provisionar duas vezes devolve o mesmo biosite (`201`, depois `200`).
- [ ] Empresa A não lê nem altera biosite da empresa B (API e painel).
- [ ] `anon` não lê tabela nenhuma da engine; a função pública só devolve campos públicos.
- [ ] `grep` na engine por `property|creci|transaction_enum|lead` não acha nada fora de `metadata` de nicho.
- [ ] `grep` por `from "../bio-site` ou caminho do outro repositório: 0 resultados nos dois lados.
- [ ] Chave de API ausente, errada ou revogada recebe `401` sem detalhes.
- [ ] Código de handoff usado duas vezes ou vencido é recusado.
- [ ] Nenhum segredo em git, log ou resposta de erro.
- [ ] CRM, imóveis e leads do Smagnoto funcionam como antes.

## 14. Riscos
1. **Limite do plano Free do Supabase** para um terceiro projeto (suspeita, a confirmar antes da F2).
2. `bio-site` é cópia antiga: trabalhar nele perderia hardening, CI e home nova (D1).
3. Banco `cbgv…` é vivo: a migration da F5 exige backup validado e "pode".
4. Repositório do Smagnoto é público: contrato e exemplos não podem conter chave, URL com chave ou dado real.
5. Vercel Hobby: dois projetos separados; limites e termos de uso comercial continuam em aberto (A8 da auditoria).
