# Plano: Smagnoto como ERP/CRM imobiliário enterprise

Base: telas do demo https://smagnoto-demo.vercel.app/sistema (referência visual, sem código disponível) + especificação técnica "Arquitetura de software enterprise imobiliária" + leis citadas (8.245/1991, 6.530/1978, LGPD 13.709/2018, COFECI 1.432/2019, ABNT NBR 14653).
Regra: cada fase = 1 ou mais PRs independentes (código + testes). Migration só com backup validado e "pode" do Joaquim. Não depende de infraestrutura nova: monolito modular em Next.js + Supabase (RLS por `company_id`, já existente).

## 1. Decisões de arquitetura (já alinhadas ao que existe)

| Tema | Spec enterprise | Decisão Smagnoto |
|---|---|---|
| Multi-tenant | `tenant_id` + RLS | Já existe: `company_id` + `current_company_id()`. Toda tabela nova segue o mesmo padrão. |
| Dinheiro | NUMERIC | `numeric(15,2)` no banco; no TypeScript, centavos inteiros (`bigint`/`number`), nunca `float`. |
| Fila/eventos | RabbitMQ/Kafka | Hobby/Vercel: tabela `evento_fila` (outbox) + Vercel Cron + Supabase Edge Function. Sem broker novo até haver volume. |
| Feeds de portais | XML em CDN | Route handler `/feeds/{portal}.xml` gerado do banco, cache por ETag; reprocessa por evento de mudança. |
| Assinatura | ClickSign/DocuSign/ZapSign | Adapter único `assinatura/` + webhook `/api/webhooks/assinatura` com HMAC; PDF + hash SHA-256 no Storage privado. |
| Auditoria | Log imutável | Tabela `auditoria` append-only (trigger bloqueia UPDATE/DELETE), grava quem viu/exportou dado sensível. |
| LGPD | Mascarar, expurgar | Máscara por papel na UI/export; consentimento no lead; job de expurgo de propostas reprovadas em 180 dias. |
| PLD/COAF | Res. COFECI 1.432/2019 | Flag de operação atípica (espécie > R$ 10.000 ou incompatível com renda) + fila de revisão do diretor. |

## 2. Mapa de módulos (demo → repositório)

Legenda: OK = já existe no repositório · NOVO = construir.

| Menu | Telas | Estado | Fase |
|---|---|---|---|
| Visão geral | Painel (diretoria), Relatórios | parcial | F6 |
| Carteira | Imóveis, Condomínios, Qualidade do cadastro, Proprietários, Portais e site | Imóveis OK; restante NOVO | F2 |
| Comercial | Atendimento (chat + IA), Funil, Leads, Agenda de visitas, Propostas, Contratos de venda, Automação de e-mails | Leads/Funil/Visitas/Propostas OK; restante NOVO | F3 |
| Locação | Painel, Contratos, Cobranças, Recebimentos, Repasses, Prestação de contas, Reajustes, Inadimplência, Vistorias | NOVO | F4 |
| Financeiro | Painel, Caixa diário, Composição, Conciliação bancária, Contas a pagar, Comissões, Plano de contas, Fiscal e informes (DIMOB) | NOVO (existem `commission`, `revenue`, `operational_cost`) | F5 |
| Gestão | Marketing, Blog com IA, Equipe, Configurações | NOVO | F6 |
| Transversal | Papéis, auditoria, LGPD, PLD, assinatura, feeds | parcial (`user_roles`) | F1 |

## 3. Fases e entregas

**F1 — Segurança e governança (primeiro, base de tudo)**
1. Papéis e permissões por módulo (administrador, gerente, corretor, financeiro, locação) em `user_roles` + guarda em todas as rotas `/sistema`.
2. Tabela `auditoria` imutável + helper `registrarAuditoria()` em toda leitura/exportação de dado sensível.
3. Máscara de CPF/CNPJ/renda por papel (`src/lib/anonimizar.ts` já existe: estender).
4. Consentimento LGPD no lead + rotina de expurgo.
5. Flag PLD em operações atípicas.

**F2 — Carteira**
Qualidade do cadastro (regras: sem geolocalização, título x preço, URL x finalidade, sem descrição, sem captador, sem vídeo) com nota 0-100; Condomínios (cadastro herdado pelos imóveis); Proprietários (autorização com prazo e alerta de vencimento 30 dias); Portais e site (feeds XML ZAP/VivaReal/OLX, limite de anúncios, custo por lead).

**F3 — Comercial**
Atendimento unificado (WhatsApp + assistente IA), Funil com régua de e-mail por etapa, Contratos de venda com assinatura digital, comissão dividida por regra da casa (20% captação / 20% venda / 60% casa).

**F4 — Locação (motor financeiro)**
Contrato (vencimento, índice, taxa de administração, garantia) → cobrança item a item (aluguel, condomínio, IPTU, seguro) → baixa por retorno CNAB → repasse dia 15 com taxa e IRRF → prestação de contas dia 16 → reajuste automático (IGP-M/IPCA/INPC via API do Banco Central, `Decimal`) → régua de inadimplência de 5 etapas → vistorias com foto e assinatura.

**F5 — Financeiro e fiscal**
Plano de contas (natureza: receita própria, repasse a terceiro, tributo de terceiro, reembolso, despesa), Caixa diário com dois caixas (Smagnoto x terceiros, nunca misturados), Conciliação bancária, Contas a pagar, Comissões, DIMOB (arquivo texto no layout da Receita), informe de rendimentos por proprietário.

**F6 — Gestão e visão executiva**
Painel da diretoria (VGV, funil, metas), Relatórios exportáveis, Marketing (custo por lead por canal), Blog com IA, Equipe (metas, distribuição de leads), Configurações (empresa, identidade, integrações, regras da operação).

## 4. Modelo de dados novo (resumo, cada tabela com `company_id` + RLS)

`pessoa`, `proprietario`, `autorizacao_imovel`, `condominio`, `contrato_locacao`, `cobranca`, `cobranca_item`, `recebimento`, `repasse`, `prestacao_contas`, `reajuste`, `inadimplencia_evento`, `vistoria`, `vistoria_ambiente`, `plano_conta`, `lancamento`, `conciliacao_movimento`, `conta_pagar`, `comissao_rateio`, `assinatura_envelope`, `evento_fila`, `auditoria`, `consentimento_lgpd`, `alerta_pld`. Detalhe de colunas entra em cada PR de fase, junto com a migration.

## 5. Regras de cálculo (testadas por unidade antes de qualquer tela)

- Repasse = aluguel − taxa de administração − IRRF (quando aplicável) ± reembolsos; condomínio, IPTU e seguro passam direto a terceiros e **não** entram como receita.
- Arredondamento em centavos, soma dos itens do boleto sempre igual ao total.
- Reajuste = aluguel × (1 + índice acumulado 12 meses), aplicado no aniversário do contrato; aviso 60 dias antes.
- Multa 2% + juros 1% ao mês na inadimplência (conforme demo; ajustar ao contrato).

## 6. O que NÃO está neste plano

Broker de mensagens externo, microsserviços e CDN própria (S3/R2): só quando o volume exigir. Integração bancária real (CNAB/Pix) e assinatura real dependem de contrato com banco/provedor: entram como adapters com modo simulado até haver credenciais.
