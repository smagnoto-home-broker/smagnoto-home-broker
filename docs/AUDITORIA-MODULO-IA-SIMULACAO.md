# Auditoria: módulo "Simulação IA + SDR WhatsApp" (anexos 001, 002 e 003)

Data: 27/10/2026 · Origem: conversas do Joaquim com outra IA (projeto `VaultMindOS`) · Base: `AGENTS.md`, `docs/PADRAO-ENGENHARIA-IA.md`, `docs/PLANO-ENTERPRISE-IMOBILIARIO.md`.
Os 3 anexos repetem o mesmo material (SQL, env, árvore de arquivos e 4 trechos de código: `actions.ts`, `StagingButton`, `ImageCompareSlider`, `ConstructionCostEstimator`). Os demais arquivos citados (webhook, socialActions, PDF, canvas) **não foram entregues**: só existem como lista.

## 1. Veredito
**Não colar o código nem rodar o SQL.** O material serve como ideia de produto; a implementação tem de ser refeita na nossa estrutura. Dois achados são críticos e já impedem o uso como está (itens 2.1 e 2.2).

## 2. Achados (ordem de gravidade)
| # | Gravidade | Achado | Regra nossa violada |
|---|---|---|---|
| 2.1 | CRÍTICO | `leads` e `chat_messages`: policy `for all using (true) with check (true)` **sem** `to authenticated` vale também para o papel `anon`: qualquer pessoa com a chave pública lê e altera todos os leads e conversas (telefone, nome, orçamento). | RLS por empresa; dado pessoal só mascarado/auditado (LGPD) |
| 2.2 | CRÍTICO | Nenhuma tabela tem `company_id`; `property_simulations` permite insert/update/delete a qualquer usuário autenticado de **qualquer** empresa. | Multi-tenant: `current_company_id()` + `has_company_role()` em toda tabela |
| 2.3 | ALTO | Tabela `leads` duplica a nossa `lead` (CRM já em produção; `phone unique` global quebraria o multi-tenant). | Não duplicar entidade; estender a existente |
| 2.4 | ALTO | Server action chama a IA paga **sem checar login/permissão**: qualquer um dispara custo no Replicate. Sem cota, sem auditoria. | `requirePermissao()` em toda action; trilha em `registrar_auditoria` |
| 2.5 | ALTO | `originalImageUrl` vem do cliente e vai direto ao Replicate (URL arbitrária). | Aceitar só URLs do nosso bucket `property-photos` |
| 2.6 | ALTO | Webhook do WhatsApp sem verificação de assinatura/segredo, sem idempotência, sem limite de taxa: qualquer um forja mensagens e gasta IA. | Segredo no cabeçalho + HMAC; deduplicar por id da mensagem |
| 2.7 | ALTO | SDR envia nome, telefone e conversa do lead à OpenAI. Já decidimos o contrário (PR #9 `fix/ia-sem-dados-pessoais`; `src/lib/anonimizar.ts`). | LGPD; IA sem dado pessoal |
| 2.8 | ALTO | `SUPABASE_SERVICE_ROLE_KEY` nas actions e no webhook. Hoje a chave **não é usada em nenhum arquivo** (AGENTS.md). | Manter assim; webhook entra por RPC restrita ou rota com segredo, não com service role solta |
| 2.9 | ALTO (jurídico) | Imagem gerada por IA de casa em terreno/cômodo vazio exibida ao cliente sem aviso = risco de publicidade enganosa (CDC) e de reprovação nos portais. | Sempre rotular "Imagem ilustrativa gerada por IA"; nunca substituir a foto real; **fora do feed dos portais** (`feed-vivareal.ts` só usa fotos do imóvel) |
| 2.10 | ALTO (jurídico) | Calculadora de VGV/ROI para "investidor" com custo/m² e preço/m² fixos no código, sem fonte nem aviso. | Dinheiro em centavos (`dinheiro.ts`); parâmetros configuráveis por empresa; aviso "estimativa, não garantia"; fonte (CUB) citada |
| 2.11 | MÉDIO | `replicate.run` dentro da action: a geração leva dezenas de segundos e estoura o tempo da função na Vercel. Falta `maxDuration` ou fluxo assíncrono (criar previsão + consultar status). | Operação longa não bloqueia a action |
| 2.12 | MÉDIO | Modelo de inpainting (`flux-fill-dev`) é descrito como "pinte uma parte da imagem": indica que precisa de **máscara**, que o código não envia. Confirmar o esquema na aba API do modelo antes de implementar. | Zero alucinação (padrão de engenharia) |
| 2.13 | MÉDIO | `ConstructionCostEstimator.tsx` começa com uma linha inválida (`import { useState } from 'lucide-react' in lucide-react...`): não compila. Usa `number` para dinheiro. | tsc/eslint verdes; centavos |
| 2.14 | MÉDIO | `ImageCompareSlider` lê `containerRef.current.clientWidth` durante o render (quebra a regra `react-hooks` do nosso eslint e causa descompasso na hidratação); usa `<img>`; sem teclado/ARIA. | Lint verde; acessibilidade |
| 2.15 | MÉDIO | Gateway não oficial de WhatsApp (Evolution/Z-API): risco de banimento do número. SDR sem aviso de que é IA, sem repasse a humano, sem consentimento/opt-out. | LGPD (consentimento) e plano "Atendimento" (F3 pendente) |
| 2.16 | BAIXO | Caminhos `C:\Projetos\VaultMindOS\web`, `app/portal/imoveis`, `components/admin|public`, `utils/`; env `NEXT_PUBLIC_SUPABASE_ANON_KEY`; Next 15; `npm install`; `any`; tema escuro `slate/amber`. | Nosso: `src/app/sistema/...`, `src/actions/`, `src/lib/`, `PUBLISHABLE_KEY`, Next 16.4.2, bun, TS estrito, tokens navy/gold |

Observação a favor: o conceito (antes/depois, viabilidade, copy de anúncio, qualificação por WhatsApp) combina com o plano (Marketing/Blog com IA em F6; Atendimento em F3).

## 3. Como entra na nossa estrutura (fatias independentes, 1 PR cada)
| Fatia | O que é | Banco | Env novo | Risco |
|---|---|---|---|---|
| M1 | Comparador antes/depois (`src/components/ui/comparador-imagens.tsx`), sem nova tabela | nenhum | nenhum | baixo |
| M2 | Estimador de viabilidade para terrenos (`src/lib/viabilidade.ts` em centavos + testes; tela em Gestão/Imóveis); parâmetros em arquivo, depois por empresa | nenhum (1ª versão) | nenhum | médio (aviso legal) |
| M3 | Copy de anúncio para Instagram via AI Gateway que já usamos (`AI_GATEWAY_*`), só com dados públicos do imóvel | nenhum | nenhum | baixo |
| M4 | Simulação por IA (staging/terreno): tabela `simulacao_imovel` (company_id, RLS, status, custo), action com `requirePermissao("imoveis","editar")`, cota diária, fluxo assíncrono, rótulo obrigatório | 1 tabela nova (migration própria, backup + "pode") | `REPLICATE_API_TOKEN` (Production, sensível) | alto (custo e jurídico) |
| M5 | PDF do relatório (depois de M2), com os mesmos avisos | nenhum | nenhum | baixo |
| M6 | Atendimento WhatsApp + SDR IA: tabelas `conversa`/`mensagem` ligadas à `lead`, webhook com segredo, consentimento, repasse a humano | 2 tabelas novas | token do provedor oficial | muito alto: fazer por último |

## 4. Decisões que dependem do Joaquim
1. M4: aceita custo por imagem do Replicate (teto diário) e rótulo "gerada por IA" em toda exibição? Recomendado: sim, com teto.
2. M6: usar API oficial do WhatsApp (provedor aprovado pela Meta) em vez de gateway não oficial? Recomendado: sim.
3. Ordem sugerida: M1 → M3 → M2 → M5 → M4 → M6.

## 5. O que NÃO fazer
- Rodar o SQL dos anexos no banco vivo `cbgv…`.
- Criar `SUPABASE_SERVICE_ROLE_KEY` na Vercel.
- Publicar imagem gerada por IA nos portais ou no site sem rótulo.
- Enviar dados do lead ao modelo de IA.

Fontes externas consultadas: página do modelo `black-forest-labs/flux-fill-dev` no Replicate (27/10/2026: uso comercial das imagens geradas na própria Replicate permitido; esquema de entrada não confirmado na página).
