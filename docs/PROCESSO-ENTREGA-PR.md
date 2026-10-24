# Processo de entrega: do comando ao PR e à produção (Smagnoto)

Adaptado do roteiro do portal-teologico-os. **Vale integralmente** neste repositório, junto com `docs/PADRAO-ENGENHARIA-IA.md`.
Pasta de trabalho: `F:\Projetos\smagnoto-home-broker-staging`. Repositório: `smagnoto-home-broker/smagnoto-home-broker`. Troque `NUMERO` pelo número do PR.

## Diferenças em relação ao roteiro original (leia antes)

| Assunto | No Smagnoto |
|---|---|
| Staging de banco | **Não existe.** Staging e produção usam o mesmo Supabase (`cbgvttxmskwybalefezk`). Enquanto isso for verdade, o banco `cbgv…` é tratado como **produção**: toda migration nele exige backup validado e "pode", e o passo "aplicar primeiro em staging" é substituído por "revisar o SQL + backup validado + conferência de leitura depois". Projetos novos (ex.: Biosite Engine) nascem com banco de teste separado. |
| Gerenciador | `bun` (CI usa `bun`). Localmente `npm run type-check` e `npm run lint` equivalem. |
| Aplicar migration | A IA não tem acesso ao Supabase deste projeto: entrega o comando que copia o SQL para a área de transferência; o Joaquim cola no SQL Editor; a IA confere com consulta de leitura. |
| Envio do PR | `scripts\enviar-pr.ps1` (push + PR, **nunca merge**). A IA grava a descrição completa em `.pr-body.md` (ignorado pelo git) antes. |
| Vercel | Dashboard (sem Vercel CLI). Logs: Deployments, deploy, Runtime/Build Logs. Production = `main`. O ambiente Preview ainda não tem variáveis de ambiente: um Preview com erro 500 pode ser isso, **só afirmar depois de ver o log**. |
| Conta GitHub | `gh auth switch --user smagnoto-home-broker` se houver mais de uma conta logada. |

## Prompt (colar no início de uma tarefa)

```
Você vai entregar uma mudança no Smagnoto seguindo, nesta ordem, o roteiro abaixo. Responda em
português do Brasil. Aviso antes, comando depois. Nunca invente resultado: verifique o estado real
antes de dizer que algo está feito. Nunca escreva em produção sem o meu "pode" no chat para aquela
ação específica (migration em produção e merge são ações separadas, cada uma pede o seu "pode").
Nunca registre segredos em chat, commit ou documentação.

TAREFA: <descreva a mudança>

A. PREPARAR
 1. Confirme pasta e branch. Trabalhe só em F:\Projetos\smagnoto-home-broker-staging, nunca na main.
 2. Se a mudança altera tela ou regra, mostre o desenho (mockup/fluxo) e espere minha aprovação.
 3. Implemente. Se houver migration: liste supabase/migrations, use o próximo número livre, escreva
    idempotente. O banco cbgv é o vivo: a migration só é aplicada depois do passo 11 e do meu "pode".
    Se mexer em RLS, teste com usuário simulado (não basta service_role).
B. VALIDAR
 4. type-check e lint com ZERO erros (erro novo bloqueia).
 5. Teste de verdade o fluxo alterado, não só compile.
C. VERSIONAR E ABRIR O PR
 6. Branch nova a partir da main atualizada (ou empilhada em outra branch, dizendo qual).
 7. Commit atômico: tipo(escopo): descrição, tipo em feat|fix|chore|docs|refactor|test|style.
 8. Grave a descrição completa (modelo abaixo) em .pr-body.md e me entregue o comando do enviar-pr.ps1.
 9. Documentação da mudança (README de migrations, AGENTS.md) entra no mesmo PR.
D. CONFERIR O PR
10. Checks verdes (CI e Vercel). Se o Preview falhar, leia o log real antes de concluir.
E. PRODUÇÃO (só com o meu "pode" em cada passo, nesta ordem)
11. Backup validado com rótulo da mudança. Espere "BACKUP VALIDO".
12. Migration no banco vivo, se houver: ANTES do merge. Confira só com consultas de leitura e relate.
13. Merge do PR: o clique é meu. Nunca peça nem assuma o merge sem o meu "pode".
F. FECHAR
14. Confirme que o deploy de Production ficou Ready e abra o site.
15. Atualize o README de migrations (data, backup que antecedeu).
16. Relate em poucas linhas: o que mudou, como foi verificado, o que ficou pendente, quem faz o próximo passo.

REGRAS: nenhum SQL avulso em produção; "urgente" não pula etapa; reset --hard, clean e push --force
só com minha autorização; após 3 tentativas iguais sem sucesso, pare e diagnostique; comandos com caminho
absoluto, prontos para colar no PowerShell; scripts .ps1 só ASCII; se não conseguir executar algo, diga e
entregue o comando.
```

## Roteiro com comandos (PowerShell)

### 1. Validar
```powershell
Set-Location F:\Projetos\smagnoto-home-broker-staging
npm run type-check
npm run lint
```
Só siga com **0 erros** nos dois.

### 2. Branch, commit e PR (a IA prepara; você envia)
```powershell
Set-Location F:\Projetos\smagnoto-home-broker-staging
powershell -ExecutionPolicy Bypass -File "F:\Projetos\smagnoto-home-broker-staging\scripts\enviar-pr.ps1"
```
Para um PR empilhado em outra branch: acrescente `-Base nome-da-branch-base`.

### 3. Conferir o PR
```powershell
gh pr checks NUMERO --repo smagnoto-home-broker/smagnoto-home-broker
```

### 4. Backup do banco vivo (antes de migration/SQL)
```powershell
powershell -ExecutionPolicy Bypass -File "F:\Projetos\smagnoto-home-broker-staging\scripts\backup-producao.ps1" -ProjectRef cbgvttxmskwybalefezk -DbHost "aws-1-sa-east-1.pooler.supabase.com" -DbUser "postgres.cbgvttxmskwybalefezk"
```
Digite a senha do banco (cole com clique direito; um `*` por caractere) e depois a senha do `.7z`. Espere **BACKUP VALIDO**. Copie o `.7z` para fora do computador e só então apague a pasta em claro.

### 5. Migration no banco vivo (só com o "pode")
A IA entrega `Get-Content -Raw "<arquivo.sql>" | Set-Clipboard`. Você cola no SQL Editor do projeto `cbgv…` e roda uma vez. Se der erro, **não rode de novo**: mande o texto.

### 6. Merge (só com o "pode")
```powershell
gh pr merge NUMERO --repo smagnoto-home-broker/smagnoto-home-broker --merge
```
Responda **N** se perguntar sobre apagar a branch local. Depois confira no Vercel que o deploy de Production ficou **Ready** e abra o site.

## Descrição do PR (modelo)
O mesmo texto está em `.github/pull_request_template.md`. A IA o preenche em `.pr-body.md` (começa com `## O que muda`).

## Quando há migration: ordem
1. Migration com o próximo número livre, escrita idempotente.
2. O PR leva o `.sql` e a atualização do README de migrations.
3. CI verde, depois: **backup** → **"pode"** → **migration** → conferência de leitura → **"pode"** → **merge**. A migration vem antes do merge porque o código novo pode chamar objetos do banco que precisam já existir. Exceção consciente: código que **tolera** a tabela ausente (como `/sistema/biosite`) pode ser mesclado antes.
