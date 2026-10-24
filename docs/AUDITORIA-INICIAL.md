# Auditoria inicial — Smagnoto Home Broker

Data: 23/10/2026 (noite) · Auditor: Claude · Modo: somente leitura (nenhum código alterado, nenhuma migration, nenhum commit/push, nenhuma escrita em banco).
Base verificada: pasta `F:\Projetos\smagnoto-home-broker-staging`, branch `main`, commit `9740ffb` (igual ao `origin/main` no GitHub, conferido por `git ls-remote`).
Nenhum segredo está neste relatório: só nomes de variáveis, arquivo e linha.

---

## 1. Resumo para quem não é técnico (10 linhas)

1. O sistema (site público + painel de CRM + portal de prestadores) existe, compila e não tem erro de programação detectável (0 erros de tipo, 0 erros/avisos de lint, 0 vulnerabilidades conhecidas nas bibliotecas).
2. Não encontrei senha nem chave secreta no código nem no histórico do Git.
3. O banco foi desenhado com cuidado: todas as 15 tabelas têm proteção por linha e cada imobiliária só enxerga os próprios dados.
4. O problema principal é de **processo**, não de código: todo o trabalho foi feito direto na `main`, sem branch separada, sem revisão, sem testes automáticos e sem proteção de branch.
5. Não consegui provar que existe separação real entre produção e desenvolvimento: a pasta "smagnoto-home-broker" está vazia, a Vercel não mostra projeto nenhum e não tenho acesso aos dois bancos citados na migration.
6. Não existe rotina de backup de nada (banco ou fotos). Antes de qualquer mudança em produção isso precisa existir.
7. Há 3 falhas de segurança no banco que merecem correção antes de abrir o sistema ao público: arquivos de fotos que qualquer usuário logado pode apagar, uma regra de "primeiro cadastro vira administrador geral" e uma tabela de configuração legível por qualquer logado.
8. Existem alterações locais ainda não salvas no Git (2 arquivos alterados e 2 novos).
9. A documentação deixada pela IA anterior está dispersa (Lovable/Vite no legado, Next.js no atual) e o `AGENTS.md` atual é só um bloco automático do Next.js.
10. Recomendação: parar de mexer na `main`, criar a separação de ambientes e o backup (aprox. 1h30 no total), e só então corrigir os 3 pontos de segurança do banco.

---

## 2. Mapa do projeto (verificado)

| Item | Valor |
|---|---|
| Framework | Next.js 16.4.2 (App Router, Turbopack), React 19.3.0, TypeScript 5.9.3 |
| Banco/Auth | Supabase (`@supabase/supabase-js` 2.118.0, `@supabase/ssr` 0.12.7) |
| UI | Tailwind 4, lucide-react, sonner, react-hook-form + zod 4.6.7, @hello-pangea/dnd, playcanvas 2.23.3 |
| Gerenciador | `bun@1.4.0` (campo `packageManager`; `bun.lock`). Bun **não** está instalado no ambiente de auditoria; type-check e lint rodaram com Node 22 |
| Tamanho | 98 arquivos em `src/` (~14,3 mil linhas), 12 commits, 1 autor |
| Pastas | `src/app/(site)` vitrine pública · `src/app/(auth)` login/reset · `src/app/sistema` painel (imoveis, leads, pipeline, visitas, propostas, matching, prestadores) · `src/actions` server actions · `src/lib/supabase` clientes · `src/proxy.ts` · `supabase/migrations` |
| Rodar local | `bun dev` ou `npm run dev` (script `dev`) |
| Validar | `lint` existe. **`type-check` não existe** no `package.json` (o padrão exige). **Não há script `test`** nem arquivo de teste |
| Deploy | Nenhum arquivo de deploy (`vercel.json`, `.vercel`, `.github`) no repositório. Pelo código/commits o alvo é Vercel (commit `22390cb` fala em "painel" e "deploy"), mas **não consegui confirmar** (ver seção 3) |
| Variáveis em `.env.local` (só nomes) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `SITE_COMPANY_SLUG` |
| Variáveis usadas no código mas **ausentes** do `.env.local` e de qualquer exemplo | `AI_GATEWAY_API_KEY`, `AI_GATEWAY_BASE_URL`, `AI_GATEWAY_MODEL` (src/actions/matching.ts:227-231), `SITE_COMPANY_ID` (src/lib/site-company.ts) |
| Dois projetos Supabase citados na migration | "Staging" `cbgvttxmskwybalefezk` e "Produção" `ustqwxwdejkfwzfrlitc` (supabase/migrations/20261022090000_baseline_smagnoto.sql:2-3). O `.env.local` aponta para o de **staging**, com site em `localhost:3000` |

---

## 3. Ambientes

| Pergunta | Resposta verificada |
|---|---|
| Existe pasta de produção separada? | **Não comprovado.** `F:\Projetos\smagnoto-home-broker` está **vazia** (`ls -la`: só `.` e `..`). Não é repositório git. |
| Existe branch de desenvolvimento? | **Não.** Só existe `main` (local e remota). Todos os 12 commits foram direto nela. |
| Banco dev x produção? | **Por desenho sim** (dois refs distintos na migration), **mas não verificável**: o conector Supabase desta sessão lista só o projeto `portal-teologico-os` (outro sistema, CETADP) e devolveu "sem permissão" ao consultar `cbgv…` e `ustq…`. |
| Qual branch dispara deploy de produção? | **Desconhecido.** A equipe Vercel acessível (`igrejasweboss-projects`) tem **0 projetos**. O deploy provavelmente está em outra conta/equipe. |
| Há proteção de branch / CI / PRs? | **CI: não existe** (sem `.github/`). **Proteção de branch e PRs abertos: não verifiquei** (`gh` não instalado e sem token). Dado o histórico (só commits diretos), presumo que não há. |

Proposta para criar a separação (aguardando sua decisão, nada foi feito):
1. Definir `main` = produção e criar a branch `dev` (ou `staging`) a partir dela, e trabalhar só em branches `feat/...` saindo de `dev`. (5 min)
2. No GitHub: proteger `main` (exigir PR, bloquear push direto e force-push). (5 min)
3. Na Vercel: um projeto ligado ao repositório; `main` = Production; demais branches = Preview, cada um com as variáveis do banco de staging. (15 min)
4. Preencher a tabela de ambientes no `AGENTS.md` (feito na etapa 9, com lacunas marcadas).
5. Mover a pasta de produção para um clone limpo da `main` (sem edição direta). (5 min)

---

## 4. Versionamento

- Branch atual: `main`, igual à remota (`9740ffb`, 23/10/2026 18:53).
- **Não commitado**: `src/app/(site)/page.tsx` (M), `src/components/site/hero.tsx` (M), `src/components/site/tipo-carousel.tsx` (novo), `supabase/migrations/20261022090000_baseline_smagnoto1.txt` (novo, cópia idêntica do `.sql`, confirmada com `cmp`).
- Branches antigas: nenhuma. Tags: nenhuma. Stash: vazio.
- Mensagens: 7 dos 12 commits fora do padrão Conventional Commits (ex.: `home: ...`, `prestadores: ...`, `supabase: ...`, `build: ...`); vários com mais de 250 caracteres e misturando assuntos.
- Commits direto na `main`: 12 de 12.
- CI: inexistente. PRs: não verificado.

---

## 5. Tabela de achados

Legenda: não encontrei nenhum achado **Crítico confirmado**. O item A5 vira Crítico se a condição descrita for verdadeira.

| ID | Severidade | Onde | Evidência | Risco | Correção sugerida |
|---|---|---|---|---|---|
| A1 | Alta | Repositório inteiro | `git branch -a`: só `main`; 12/12 commits diretos; `git status`: 2 M + 2 ?? | Perda de trabalho, deploy acidental, impossível reverter com segurança | Salvar/descartar as alterações locais com sua decisão, criar `dev`, trabalhar só em branches e PR |
| A2 | Alta | Ambientes | Pasta principal vazia; Vercel sem projetos; Supabase sem permissão em `cbgv…`/`ustq…`; `AGENTS.md` sem tabela de ambientes | Ninguém sabe com certeza onde cai um deploy ou uma migration | Seção 3 acima; você informar qual é a produção real |
| A3 | Alta | `.github/` ausente | `ls .github`: não existe | Nada barra erro antes de produção | CI mínimo: install + type-check + lint + build em PR |
| A4 | Alta | supabase/migrations/20261022090000_baseline_smagnoto.sql:756-764 (+ cadastro aberto em src/app/(auth)/entrar/page.tsx:55 e supabase/config.toml:220-225) | Policies `midia_upload/update/delete` valem para **qualquer** usuário autenticado nos buckets públicos `logos` e `property-photos`, sem filtro de empresa; o app permite `signUp` e o config local não exige confirmação de e-mail | Qualquer pessoa que se cadastre pode apagar ou sobrescrever fotos e logos de **todas** as imobiliárias | Restringir por pasta com `company_id` no caminho (`(storage.foldername(name))[1] = current_company_id()::text`) e exigir confirmação de e-mail |
| A5 | **Crítica (confirmado em 23/10 22:58)** | …baseline_smagnoto.sql:351-394 (linha 387) | `handle_new_user`: se não existe `super_admin`, o **próximo cadastro qualquer** vira `super_admin` | **Produção tem 0 usuários (captura do painel) e cadastro aberto: o primeiro visitante que se cadastrar vira super_admin e toma o sistema** | Conferir hoje (consulta somente leitura) se já existe super_admin; trocar a regra por lista fixa de e-mails ou criação manual |
| A6 | Alta | Backup | `grep backup|pg_dump` no repositório: 0 resultados; sem script, sem registro de cópia | Perda irrecuperável de dados de clientes | Seção 8 |
| M1 | Média | …baseline_smagnoto.sql:502 | `app_config_leitura … using (true)` para `authenticated`; a tabela guarda `super_admin_emails` | Qualquer usuário logado (cadastro é aberto) lê os e-mails dos administradores | Limitar leitura a `is_super_admin()` ou separar a coluna |
| M2 | Média | src/actions/* (38 chamadas `requireCompany()` sem lista de papéis) e policies `*_membro … for all` (linhas 555-600) | Nenhuma action restringe papel; no RLS, lead/imóvel/visita/proposta/zona permitem tudo a qualquer membro | Um `captador` ou `financeiro` pode excluir leads e imóveis | Definir matriz de permissões por papel e aplicar em actions e policies |
| M3 | Média | …baseline_smagnoto.sql:569, 585, 682 | Policies de INSERT anônimo validam tamanho de texto mas **não** o `company_id`/`property_id`; sem captcha nem limite de taxa | Spam ou poluição do CRM de qualquer empresa pelo formulário público | Validar `company_id` da vitrine e imóvel disponível; adicionar limite de taxa/captcha |
| M4 | Média | src/actions/matching.ts:223-256 | Nome do lead e preferências são enviados a um gateway de IA externo (padrão `ai-gateway.vercel.sh`) | Dado pessoal a terceiro (LGPD); variáveis `AI_GATEWAY_*` não documentadas | Decidir se o nome precisa ir; anonimizar (enviar só preferências); documentar |
| M5 | Média | package.json | Sem script `type-check`, sem `test`; 0 arquivos de teste | Regressões só aparecem em produção; viola o padrão (seção 2, passo 3) | Adicionar `"type-check": "tsc --noEmit"` e testes mínimos de regra e RLS |
| M6 | Média | supabase/migrations | Uma única baseline; sem README de estado; cabeçalho sem "como reverter"; duplicata `…smagnoto1.txt` não rastreada; estado aplicado em cada projeto é desconhecido | Risco de reaplicar ou divergir entre staging e produção | README de migrations com estado real; apagar duplicata (com seu "pode") |
| B1 | Baixa | …baseline_smagnoto.sql:302-463 | Funções `SECURITY DEFINER` usam `set search_path = public` (o padrão pede `public, pg_temp`); as 6 funções de gatilho não têm `revoke execute` (só 5 têm, linhas 731-735). Gatilhos não são chamáveis por RPC, então o risco real é pequeno | Desvio do padrão | Ajustar em migration nova, não editar a baseline |
| B2 | Baixa | `.gitignore` | `.env*` também ignora um futuro `.env.example` | Ninguém sabe quais variáveis configurar | Adicionar `!.env.example` e criar o arquivo sem valores |
| B3 | Baixa | public/videos (7 arquivos > 1 MB), `.git` = 35 MB | 25 MB de vídeos e 3,7 MB de fotos versionados | Repositório pesado, clone lento | Mover mídia para Storage/CDN |
| B4 | Baixa | supabase/.temp/cli-latest | Artefato do CLI versionado | Ruído | Remover do índice e ignorar |
| B5 | Baixa | src/components/site/3d/playcanvas-viewer.tsx | Nenhum import encontrado (varredura por nome); dependência `playcanvas` instalada | Código morto/inacabado ("Módulo 1" no commit `3fc0e05`) | Confirmar com você se o 3D continua no escopo |
| B6 | Baixa | `AGENTS.md`, `README.md` | AGENTS.md só tem o bloco automático do Next; README é o do create-next-app | IA futura sem contexto | Etapa 9 |
| B7 | Baixa | `F:\Projetos\smagnoto-home-broker-docs\imobiliária\` e `smagnoto-codigo-completo_v1\` | Código legado Lovable/Vite fora do Git; existe um arquivo `.env` real nessa pasta (só li os **nomes**: URL/ID/chave publicável do Supabase) | Confusão sobre qual é o código vivo; arquivo de ambiente solto | Arquivar fora do projeto; não versionar |
| B8 | Baixa | package.json | `next` 16.4.2 → 16.4.3 e `react`/`react-dom` 19.3.0 → 19.3.1 disponíveis | Atualizações de patch pendentes | Atualizar em branch própria, após ler o changelog |
| B9 | Baixa | src/app/sistema/imoveis/imovel-form.tsx | 706 linhas num arquivo | Manutenção difícil | Dividir quando for mexer nele |

---

## 6. Qualidade — números medidos

| Verificação | Comando | Resultado |
|---|---|---|
| Type-check | `tsc --noEmit --incremental false` (TypeScript 5.9.3 do projeto) | **0 erros** |
| Lint | `eslint .` (ESLint 9.39.5, 96 arquivos) | **0 erros, 0 avisos** (os 4 `eslint-disable` existentes têm justificativa escrita) |
| Vulnerabilidades | `npm audit` numa cópia temporária do `package.json` (`--legacy-peer-deps`) | **0** (crítica 0, alta 0, média 0, baixa 0). Limite: o projeto usa `bun.lock`; o npm resolveu pelas faixas do `package.json`, não pelo lock exato |
| TODO/FIXME/HACK | `grep` em `src/` | **0** |
| `console.*` | `grep` | 6 chamadas, só com código/mensagem de erro, sem dados pessoais |
| `dangerouslySetInnerHTML`, `eval`, SQL cru | `grep` | **0** |
| Build | **não rodei** (`next build` grava em `.next/` do seu projeto) | Pendente: rodar numa cópia temporária se você autorizar |
| Testes | não existem | — |

---

## 7. O que está bom e deve ser mantido

- RLS ligado nas 15 tabelas, sem exceção (linhas 487-499), com isolamento por `current_company_id()`.
- Nenhuma policy consulta a própria tabela diretamente; a recursão é evitada por funções `SECURITY DEFINER` (`current_company_id`, `has_company_role`).
- Anônimo com superfície mínima: `revoke all` + `grant` por coluna (PII de proprietário e documento de prestador ficam de fora, linhas 694-728) e inserção só com validação de tamanho.
- Gatilhos anti-escalada de privilégio (`protege_membro`, `protege_company`, `bloqueia_troca_tenant`).
- Sem `service_role` em nenhum arquivo do código (`grep`: só um comentário do `config.toml`); o servidor usa a sessão do usuário (src/lib/supabase/server.ts).
- Todas as server actions privadas chamam `requireCompany()` e filtram por `company_id`; todas validam entrada com zod; layout `/sistema` e `proxy.ts` também barram sem sessão.
- Sem segredo na HEAD nem no histórico (varredura por padrões de JWT, `sbp_`, `sk_`, `ghp_`, chaves privadas, `.env*` em qualquer commit). Limite: não varre senha em formato livre.
- `.env.local` ignorado pelo Git e nunca versionado.
- Migration idempotente, com cabeçalho explicando as decisões.
- Datas tratadas no fuso de Brasília no servidor.
- Código limpo: 0 erros de tipo/lint, 0 TODO, 0 vulnerabilidades.

---

## 8. Backup (etapa 7)

Situação: **não existe** rotina de backup de banco nem de Storage, nenhum script, nenhum registro de "última cópia". O backup automático do próprio Supabase depende do plano do projeto e **não consegui verificar** (sem acesso aos projetos).

Proposta:
1. Conferir no painel do Supabase de produção: plano, PITR e backups diários. (5 min)
2. Criar um `scripts/backup-producao.ps1` (ASCII, caminho absoluto) que roda `supabase db dump`, valida tamanho mínimo, tabelas essenciais e SHA256, e gera `.7z` AES-256. Dump em claro nunca vai para a nuvem. (30 min)
3. Rotina separada para os buckets `logos` e `property-photos` (cópia dos arquivos; não entram no dump). (20 min)
4. Registrar no README de migrations qual backup antecedeu cada mudança. (5 min)
5. Teste de restauração em um projeto vazio uma vez. (20 min)

---

## 9. Ordem recomendada de correção

| # | O que fazer | Tempo | Depende de você? |
|---|---|---|---|
| 1 | Informar qual é a produção real (pasta, Supabase, Vercel) e dar acesso de leitura aos dois projetos Supabase | 5 min | **Sim** |
| 2 | Consulta somente leitura: existe `super_admin` em produção? (A5) | 5 min | "pode" para a consulta |
| 3 | Decidir o destino das alterações locais e criar a branch `dev` + proteção da `main` (A1) | 10 min | **Sim** |
| 4 | Backup validado de produção (A6) antes de qualquer mudança no banco | 60 min | "pode" |
| 5 | Migration nova (testada em staging): Storage por empresa, `app_config`, regra do super_admin, `search_path` (A4, A5, M1, B1) | 60 min | "pode" por migration |
| 6 | CI mínimo e scripts `type-check`/`test` (A3, M5) | 30 min | Não |
| 7 | Matriz de papéis e validação das inserções públicas (M2, M3) | 90 min | **Sim** (a matriz) |
| 8 | Demais itens Baixa | 60 min | Não |

## 10. Decisões que preciso de você

1. Qual é a produção real e onde está o deploy (A2)?
2. O cadastro (`signUp`) deve continuar aberto ao público ou só por convite (A4, A5)?
3. Quais ações cada papel (`owner`, `admin`, `corretor`, `captador`, `financeiro`) pode fazer (M2)?
4. O nome do lead pode ser enviado à IA externa (M4)?
5. Salvar ou descartar as alterações locais da home/hero (A1)?
6. O 3D (PlayCanvas) continua no escopo (B5)?
7. Vídeos continuam no Git ou vão para Storage/CDN (B3)?

## 11. Limites desta auditoria

Não verificado: estado real dos bancos (sem acesso), configuração do GitHub (proteção de branch, PRs), projeto e variáveis na Vercel, `next build`, funcionamento ponta a ponta das telas, configuração remota de autenticação do Supabase (só li o `config.toml` local).

---

## 12. Atualização — 23/10/2026 22:58 (com as capturas e dados que você enviou)

**Ambientes agora confirmados (por captura de tela, não por consulta minha):**

| Item | Confirmado |
|---|---|
| GitHub | `smagnoto-home-broker/smagnoto-home-broker`, **repositório público**, 1 branch (`main`), 12 commits, 1 colaborador |
| Vercel | Projeto `smagnoto-home-broker` na conta pessoal `cybersat201-1250` (plano **Hobby**), **Production = branch `main`**, deploy automático, último deploy `9740ffb` *Ready*, "No checks configured" |
| Supabase | Organização "smagnoto-home-broker Org" (plano **Free**), dois projetos: `smagnoto-home-broker` (produção, `ustq…`, **0 usuários**) e `smagnoto-home-broker-staging` (`cbgv…`, 3 usuários: 1 real e 2 de teste E2E) |
| Local | `localhost:3000` usa `.env.local` apontando para o **staging** |
| Ainda não confirmado | Qual Supabase o deploy de produção da Vercel usa (variáveis de ambiente da Vercel) |

**Novos achados**

| ID | Severidade | Onde | Evidência | Risco | Correção |
|---|---|---|---|---|---|
| A7 | Média | GitHub | Captura: repositório "Public" | Todo o código e o esquema do banco ficam visíveis a qualquer pessoa. Não há segredo no histórico (verificado), mas o desenho de segurança fica exposto | Confirmar se é intencional; se não, tornar privado |
| A8 | Média | Vercel | Plano Hobby na conta pessoal | Os termos do plano Hobby são para uso pessoal e não comercial; site de imobiliária é uso comercial. Sem colaboração nem proteção de branch por equipe | Migrar para plano Pro/equipe (confirmar nos termos da Vercel) |
| A9 | Alta | Supabase Free | Captura: plano Free | Pelo meu conhecimento, o plano Free não inclui backups diários e pausa projetos inativos. **Confirmar no painel** | Plano Pro ou rotina própria (`scripts/backup-producao.ps1`) |
| A10 | Alta | Deploy | "No checks configured" + `main` = Production | Qualquer push na `main` publica em produção sem nenhuma verificação | CI (`.github/workflows/ci.yml`) + proteção da `main` |
| A11 | Média | Staging x produção | `company_user.user_id` e `user_roles.user_id` com `on delete cascade` (baseline l.75 e l.92) | **Apagar os usuários do staging apaga os vínculos; a empresa Smagnoto e seus imóveis ficam sem dono e ninguém acessa o painel** | Vincular o novo admin como `owner` da empresa existente **antes** de apagar os usuários antigos |

**Sobre o pedido de apagar usuários e deixar só `admin@smagnoto.com.br`**
- Produção (0 usuários): não há o que apagar. Criar o admin ali **fecha o A5**, porque o primeiro usuário vira super_admin pela regra atual.
- Staging (3 usuários): precisa do passo de religação (A11) antes de apagar.
- A senha que você enviou no chat **não foi gravada em nenhum arquivo, relatório nem memória**. Como ela passou pelo chat, troque no primeiro acesso, e use uma senha longa e única (esta é curta e previsível).
- Um único admin para "tudo" (produção, staging, painel) concentra o risco; recomendo, no mínimo, senhas diferentes por ambiente. Decisão sua.

**Preparado, sem aplicar e sem commit (para você revisar com `git status`):**
- `supabase/migrations/20261023230000_hardening_auth_storage.sql`: fecha A4, A5, M1, B1. **Não aplicada em nenhum banco. Testar antes em staging com usuário simulado.**
- `supabase/migrations/README.md`: estado de cada migration (com "NÃO VERIFICADO" onde não consegui confirmar).
- `.github/workflows/ci.yml`: type-check + lint em PR.
- `package.json`: script `type-check`.
- `.env.example` e `.gitignore` (`!.env.example`).
- `scripts/backup-producao.ps1`: backup com validação, SHA256 e 7-Zip AES-256 (senhas pedidas no terminal, nunca gravadas). **Não testado.**
- `AGENTS.md`, `CLAUDE.md`, `docs/PADRAO-ENGENHARIA-IA.md`.

**Não executei (exigem seu "pode" por ação, conforme o padrão, seção 1, regra 1):** criar ou apagar usuários, aplicar migration em qualquer banco, push, merge, mudar configuração da Vercel ou do Supabase.

---

## 13. Atualização — 23/10/2026 23:57 (variáveis da Vercel e consultas no Supabase)

- **Confirmado:** a Vercel Production usa `NEXT_PUBLIC_SUPABASE_URL` apontando para `cbgvttxmskwybalefezk` (o banco chamado "staging"). **Não existe separação de banco entre staging e produção.** O projeto `ustqwxwdejkfwzfrlitc` está sem schema (a tabela `public.user_roles` não existe).
- A variável só existe no ambiente **Production** da Vercel; **Preview não tem variáveis**, então previews de branch tendem a falhar no build.
- Dados no `cbgv…`: empresa `smagnoto` com 1 imóvel, 3 leads e 1 prestador; as empresas `smagnoto-home-broker` e `zz-imob-e2e-staging` estão vazias. O número "235 imóveis" exibido na home é texto fixo do código, não contagem do banco.
- Resultado: A2 (ambientes) fica **Alta confirmada**; todo SQL e migration no `cbgv…` exige backup validado e "pode".
- Foram criados os admins `admin@smagnoto.com.br` em `ustq…` e `cbgv…` (senhas diferentes, conforme combinado); cadastro público desligado em `ustq…`.
