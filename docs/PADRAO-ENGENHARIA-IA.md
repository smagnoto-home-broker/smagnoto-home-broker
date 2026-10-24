# Padrão de engenharia para IAs de código (Joaquim / Igrejas)

Documento portátil. Vale para qualquer projeto do Joaquim, em qualquer máquina e com qualquer IA de código. Foi destilado do trabalho real no `portal-teologico-os` (CETADP), incluindo os erros que já aconteceram. Se algo aqui conflitar com o `AGENTS.md` do projeto, vale o do projeto; se conflitar com uma instrução do Joaquim no chat, vale o chat.

Idioma: sempre português do Brasil.

---

## 1. Regras inegociáveis

1. **Nunca escrever em produção sem o "pode" do Joaquim, dado no chat, para aquela ação.** Isso vale para banco, merge, deploy, variáveis de ambiente e qualquer SQL avulso. Um "pode" não vale para a ação seguinte.
2. **Nunca editar código na pasta ou branch de produção.** Todo trabalho acontece na pasta/branch de desenvolvimento (staging).
3. **Nunca registrar segredos** (senhas, tokens, chaves `service_role`, `.env`, URLs com senha) no chat, em documentação, em commit ou em log. Se um segredo aparecer, avise o Joaquim e recomende rotacionar.
4. **Nunca inventar resultado.** Antes de dizer "feito", "funciona" ou "aplicado", verificar o estado real (banco, build, terminal, deploy) e reportar o que foi visto.
5. **Aviso antes, comando depois.** Qualquer ação com efeito relevante é anunciada antes de ser executada ou antes de o comando ser entregue ao Joaquim.
6. **"Urgente" não pula etapa.** Hotfix também passa por staging, backup e "pode".

---

## 2. Ambientes e versionamento

Todo projeto precisa ter, no `AGENTS.md`, esta tabela preenchida. Se não tiver, a primeira tarefa é criá-la (antes de qualquer mudança de código).

| Ambiente | Pasta local | Branch | Banco/Backend | Deploy |
|---|---|---|---|---|
| Produção | (preencher) | `main` | (preencher) | automático no merge em `main` |
| Staging/dev | (preencher) | qualquer branch que não seja `main` | (preencher) | preview automático por branch |

Antes de escrever qualquer arquivo ou aplicar qualquer migration, confirmar em qual pasta e em qual projeto de banco a ação vai cair. Em dúvida, parar e perguntar.

### Fluxo de uma entrega (nesta ordem)

1. Criar uma branch nova a partir da `main` atualizada (nunca trabalhar direto na `main`).
2. Implementar e validar localmente.
3. Rodar `npm run type-check` e `npm run lint`: **zero erros** (avisos antigos não bloqueiam, erros novos sim).
4. Commit atômico, mensagem no padrão Conventional Commits: `tipo(escopo): descrição` com `tipo` em `feat|fix|chore|docs|refactor|test|style`.
5. `git push origin <branch>` e abrir o PR (`gh pr create ...`).
6. Conferir o CI e o preview (`gh pr checks <número>`). Se o preview falhar, ler o log real antes de qualquer conclusão (já houve falha pontual de cache do Vercel que se resolveu com *Redeploy* sem cache; a causa só foi confirmada olhando o log).
7. Se houver migration: backup de produção validado, depois aplicar em produção (com "pode"), depois conferir o resultado.
8. Merge **só com o "pode" do Joaquim**. Depois do merge, conferir se o deploy de produção ficou *Ready*.
9. Documentação da mudança entra **no mesmo PR**, não num pedido separado.

Regras de Git:
- `main` com "Require a pull request before merging".
- Nunca `git reset --hard`, `git clean` ou `push --force` sem autorização explícita e um ponto de retorno recuperável.
- Após 3 tentativas malsucedidas da mesma correção, parar, diagnosticar a causa e relatar, em vez de insistir.
- Registrar falhas repetidas da própria IA num arquivo de erros comuns (`staging/governance/ERROS-COMUNS-IA.md` ou equivalente).

---

## 3. Banco de dados

- Toda mudança de estrutura ou dado em produção é uma **migration numerada** em `supabase/migrations/` (ou pasta equivalente), testada antes em staging. Nada de `UPDATE`/`DELETE`/`ALTER` avulso colado no SQL Editor de produção.
- Antes de numerar uma migration, listar a pasta da branch de trabalho e usar o próximo número livre. Não confiar em memória de sessão anterior.
- Migrations idempotentes sempre que possível (`create or replace`, `if not exists`).
- Cada migration tem um cabeçalho em comentário: data, pedido, decisões e como reverter.
- Manter um README das migrations com o estado real de cada uma (aplicada só em staging / aplicada em produção em DD/MM/AAAA, após qual backup).
- **Backup validado antes de qualquer migration em produção** (seção 6).
- Depois de aplicar em produção: consulta **somente de leitura** confirmando o resultado (objetos criados, RLS ligado, permissões, dados intactos) e relatar ao Joaquim.

### RLS e permissões

- RLS ligado em todas as tabelas com dados de usuários.
- Preferir **RLS só de leitura** e fazer toda escrita sensível por função `SECURITY DEFINER` executável apenas pelo `service_role`, chamada por server action depois de checar a permissão do usuário.
- Em funções, `set search_path = public, pg_temp` e `revoke all ... from public, anon, authenticated`; dar `grant execute` só a quem precisa.
- **Nunca** policy que consulta a própria tabela dentro dela (causa `infinite recursion detected in policy`). Usar função `SECURITY DEFINER` intermediária.
- Testar RLS de verdade simulando um usuário autenticado (`set local role authenticated; set local request.jwt.claims = ...` dentro de uma transação com `rollback`). Rodar como `service_role` ignora RLS e não prova nada. `tsc` também não pega erro de RLS.
- Dados de auditoria e histórico: tabela somente-inclusão, com trigger bloqueando `UPDATE` e `DELETE`.
- Horário e data sempre do servidor, nunca do aparelho do usuário.

---

## 4. Segurança da aplicação

- A chave `service_role` fica **só no servidor** e nunca é importada em arquivo `"use client"`.
- Server actions e rotas de API **re-validam quem é o usuário e se ele tem escopo** sobre o dado, mesmo que a tela já tenha filtrado. A interface não é barreira de segurança.
- Validar toda entrada (tipos, tamanho, formato) no servidor. Nunca concatenar texto do usuário em SQL.
- Menor privilégio: cada perfil só vê e altera o necessário. Em ambientes multi-tenant, toda consulta filtra pelo tenant da sessão.
- Dados pessoais: coletar o mínimo, não colocar em URL, em log ou em documentação. Documentos e fotos ficam em bucket privado.
- Segredos fora do repositório (`.env.local` no `.gitignore`, `.env.example` sem valores reais).
- Dependências: não adicionar pacote sem necessidade; revisar atualizações automáticas (Dependabot) antes de integrar.
- Ação irreversível ou em massa (apagar, zerar, migrar dados): backup antes, simulação (`dry-run`) quando possível, e confirmação do Joaquim.

Gate de liberação: vulnerabilidade crítica ou alta conhecida = 0, segredo exposto = 0, erro de type-check/lint = 0.

---

## 5. Qualidade de código

- Seguir as convenções do próprio projeto (design system, utilitários existentes, estrutura de pastas) em vez de criar padrões novos. Reutilizar antes de duplicar.
- Server Components por padrão; `"use client"` só quando necessário.
- Mudança pequena e focada. Não misturar objetivos independentes no mesmo commit.
- Ler a documentação da versão instalada do framework antes de assumir uma API (versões novas quebram o que a IA "lembra").
- Para scripts de PowerShell (`.ps1`, `.bat`): **somente caracteres ASCII** (sem acentos), para não corromper no PowerShell 5.1.
- Comandos entregues ao Joaquim: sempre com o diretório de execução ou caminho absoluto, completos e prontos para colar, sem depender de mensagem anterior.

---

## 6. Backup

- **Antes de migration/SQL em produção:** dump completo do banco de produção, validado (tamanho mínimo, tabelas essenciais presentes, SHA256), cópia fora da máquina **criptografada** (7-Zip AES-256). Dump em claro nunca vai para a nuvem.
- Esperar a mensagem final de sucesso do script e ler qualquer ERRO/AVISO antes de seguir.
- Política de retenção: o script só **lista** cópias antigas; apagar é decisão do Joaquim.
- Arquivos do Storage e configurações do painel (modelos de e-mail, SMTP) **não** entram no dump do banco: ter rotina própria ou documentar o passo manual.
- Registrar no README de migrations qual backup antecedeu qual mudança.

---

## 7. Como a IA se comunica

- Começar pela próxima ação concreta. Sem preâmbulo vazio, sem resumo repetido.
- Quando algo falhar, mostrar a causa real (log, mensagem, consulta), separar **o que foi confirmado** do que é **suspeita** e dizer qual é o próximo passo.
- Quando houver decisão do Joaquim a tomar, fazer **uma pergunta objetiva** e já indicar a recomendação.
- Mostrar o desenho (mockup ou fluxo) antes de implementar mudança de tela ou de regra, se o Joaquim pedir.
- Ao terminar: o que mudou, como foi verificado, o que ficou pendente e quem faz o próximo passo. Sem recontar todas as etapas.
- Se a IA não consegue executar algo (sem terminal, sem acesso), dizer isso e entregar o comando completo para o Joaquim rodar, em vez de fingir que rodou.

---

## 8. Definição de pronto (checklist)

- [ ] Está na pasta/branch de desenvolvimento, não na de produção.
- [ ] `type-check` e `lint` com zero erros.
- [ ] Testado de verdade (tela, consulta, fluxo), não só compilado.
- [ ] Se tocou em RLS/permissões: testado com usuário simulado.
- [ ] Se tocou no banco: migration numerada, aplicada primeiro em staging, README atualizado.
- [ ] Backup de produção validado antes de aplicar em produção.
- [ ] "pode" do Joaquim para cada escrita em produção (migration e merge).
- [ ] Verificação pós-aplicação feita e relatada (somente leitura).
- [ ] Deploy de produção conferido (*Ready*).
- [ ] Documentação atualizada no mesmo PR; nenhum segredo nela.
