# Smagnoto Home Broker — Governança para Agentes de IA

## Escopo e autoridade

- Este arquivo governa todo o repositório. Instruções do Joaquim no chat e regras de segurança da plataforma têm precedência.
- O padrão geral de engenharia está em `docs/PADRAO-ENGENHARIA-IA.md` e **vale integralmente** aqui. Este arquivo só traz o que é específico do projeto.
- Git, código, migrations e documentação versionada são a fonte da verdade. Memória de IA é auxiliar.
- Estado inicial e achados abertos: `docs/AUDITORIA-INICIAL.md` (23/10/2026). Ler antes de qualquer mudança.
- Idioma: português do Brasil.

## Ambientes (preencher antes de qualquer mudança)

| Ambiente | Pasta local | Branch | Banco/Backend | Deploy |
|---|---|---|---|---|
| Produção | `F:\Projetos\smagnoto-home-broker` (hoje **vazia**; não é repositório) | `main` | Supabase `ustqwxwdejkfwzfrlitc` (citado na migration; **não verificado**) | Vercel, conta `cybersat201-1250` (Hobby), projeto `smagnoto-home-broker`: **push na `main` publica em Production**, sem checks. Qual Supabase ele usa: **A CONFIRMAR** |
| Staging/dev | `F:\Projetos\smagnoto-home-broker-staging` (único repositório git; remoto `smagnoto-home-broker/smagnoto-home-broker` no GitHub) | hoje também `main` (**desvio**); criar `dev` e usar branches `feat/...` | Supabase `cbgvttxmskwybalefezk` (é o apontado por `.env.local`; **não verificado**) | Preview da Vercel por branch (deve usar variáveis do banco de staging: **A CONFIRMAR**) |

Regras fixas:
1. Nunca editar código na pasta ou branch de produção.
2. Nada vai para produção sem backup validado e sem o "pode" do Joaquim no chat, para cada ação (migration e merge).
3. Nenhum SQL avulso em produção: toda mudança de banco é migration numerada, testada antes em staging.
4. Antes de numerar uma migration, listar a pasta e usar o próximo número livre.
5. Enquanto a tabela acima tiver "A CONFIRMAR", **não aplicar migration**; perguntar ao Joaquim. Push na `main` = deploy em produção: só com "pode".
6. Não trabalhar direto na `main`: criar branch a partir da `main` atualizada.

## Stack e comandos

- Stack: Next.js 16.4.2 (App Router, Turbopack), React 19.3.0, TypeScript 5.9.3, Tailwind 4, Supabase (`@supabase/supabase-js` 2.118.0, `@supabase/ssr` 0.12.7), zod 4.6.7. Gerenciador: `bun@1.4.0` (`bun.lock`). Hospedagem: a confirmar (provável Vercel).
- Validar (zero erros): `bun run type-check` e `bun run lint` (o script `type-check` foi adicionado em 23/10, ainda sem commit). Não há testes automatizados.
- Rodar local: `bun dev` (ou `npm run dev`) em `F:\Projetos\smagnoto-home-broker-staging`, porta 3000.
- Variáveis de ambiente (só nomes; valores ficam em `.env.local`, ignorado pelo Git): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `SITE_COMPANY_SLUG`; usadas no código e ainda não documentadas: `SITE_COMPANY_ID`, `AI_GATEWAY_API_KEY`, `AI_GATEWAY_BASE_URL`, `AI_GATEWAY_MODEL`.
- Migrations: `supabase/migrations/`. Baseline `20261022090000_baseline_smagnoto.sql` e hardening `20261023230000_hardening_auth_storage.sql` (**não aplicada**). Estado em `supabase/migrations/README.md`. Como é aplicada e em qual projeto: **a confirmar** (sem README de estado). Não há ferramenta de aplicação configurada no repo.
- Next.js 16 tem mudanças de API: ler `node_modules/next/dist/docs/` antes de assumir uma API.

## Segurança específica do projeto

- Perfis e permissões: papéis de empresa em `company_user.role` (`owner`, `admin`, `corretor`, `captador`, `financeiro`) e papéis globais em `user_roles.role` (`super_admin`, `demo` etc.). Funções de apoio: `current_company_id()`, `has_company_role()`, `is_admin()`, `is_super_admin()`. As server actions usam `requireCompany()` (src/lib/supabase/server.ts) mas **ainda sem restrição de papel** (achado M2).
- Chave `service_role`: **não é usada em nenhum arquivo**. Manter assim. Se um dia for necessária, só em código de servidor, nunca em arquivo `"use client"`.
- Tabelas sensíveis: `company_user`, `user_roles`, `app_config` (contém `super_admin_emails`), `lead` (nome/telefone/e-mail), `visit`, `proposal`, `commission`, `revenue`, `operational_cost`, `provider_payment`, `service_provider`, `service_request`.
- Multi-tenant: sim, pela coluna `company_id` com `current_company_id()` nas policies e `.eq("company_id", ...)` nas actions.
- Cadastro público (`signUp`) está ativo e o primeiro cadastro sem `super_admin` existente vira `super_admin` (achado A5). Não alterar `handle_new_user` sem "pode".
- Storage: buckets públicos `logos` e `property-photos` com policies sem escopo de empresa (achado A4). Não colocar documento ou foto de pessoa nesses buckets.
- Dados do lead não vão em URL nem em log. O nome do lead hoje é enviado a um gateway de IA externo em `src/actions/matching.ts` (achado M4): não ampliar esse envio.

## Backup

- Comando de backup de produção (não testado): `powershell -ExecutionPolicy Bypass -File "F:\Projetos\smagnoto-home-broker-staging\scripts\backup-producao.ps1" -ProjectRef ustqwxwdejkfwzfrlitc`. Supabase está no plano Free (sem backup diário, a confirmar). Não aplicar nada em produção sem backup validado.
- Onde ficam as cópias: **a definir** (local em `F:\...` e nuvem apenas criptografada com 7-Zip AES-256).
- Storage (`logos`, `property-photos`) não entra no dump do banco: rotina própria a criar.

## Decisões e erros já conhecidos

- 2026-10-23 — Auditoria inicial: 12 commits foram feitos direto na `main`, sem CI, sem testes e sem proteção de branch. Regra resultante: branch + PR + "pode" para qualquer merge.
- 2026-10-23 — A pasta de produção está vazia; o deploy de produção é a Vercel ligada à `main` do GitHub. Regra resultante: a `main` é a produção; não presumir ambiente.
- 2026-10-23 — `user_id` em `company_user`/`user_roles` tem `on delete cascade`: apagar usuário apaga o vínculo e deixa a empresa sem dono. Vincular outro owner antes de apagar.
- 2026-10-23 — O cadastro público estava aberto e o primeiro usuário vira super_admin (produção tinha 0 usuários). Criar o admin primeiro e fechar o cadastro.
- 2026-10-23 — Código legado Lovable/Vite está em `F:\Projetos\smagnoto-home-broker-docs\imobiliária` e `...\smagnoto-codigo-completo_v1`. É histórico, fora do Git; não é o código vivo.
- 2026-10-23 — `.gitignore` ignora `.env*`, inclusive um futuro `.env.example`. Ao criá-lo, liberar com `!.env.example`.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
