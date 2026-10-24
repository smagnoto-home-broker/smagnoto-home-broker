# Envia a branch atual ao GitHub e abre o Pull Request (sem mesclar).
# Uso (na raiz do projeto ou de qualquer pasta):
#   powershell -ExecutionPolicy Bypass -File "F:\Projetos\smagnoto-home-broker-staging\scripts\enviar-pr.ps1"
# Requisitos: Git e GitHub CLI (winget install --id GitHub.cli -e) e um login unico: gh auth login
# A descricao completa do PR vem do arquivo .pr-body.md na raiz (gravado pela IA; ignorado pelo git).
# Sem esse arquivo o script para, a menos que voce use -Minimo (descricao curta).
# PR empilhado em outra branch: acrescente -Base nome-da-branch-base
# O script NAO faz merge. Merge so com o "pode" do Joaquim, na pagina do PR.
# Somente caracteres ASCII neste arquivo (PowerShell 5.1).
param(
  [string]$Base = "main",
  [string]$CorpoArquivo = ".pr-body.md",
  [switch]$Minimo
)

# Continue: no PowerShell 5.1, "Stop" transforma qualquer texto em stderr de comando nativo em erro fatal.
$ErrorActionPreference = "Continue"
Set-Location (Split-Path -Parent $PSScriptRoot)

# --- GitHub CLI ---------------------------------------------------------
$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  $cand = "C:\Program Files\GitHub CLI\gh.exe"
  if (Test-Path $cand) { $env:Path += ";C:\Program Files\GitHub CLI" }
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "ERRO: GitHub CLI (gh) nao encontrado."
  Write-Host "Instale com: winget install --id GitHub.cli -e"
  Write-Host "Depois feche e abra o PowerShell e rode: gh auth login"
  exit 1
}
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERRO: voce ainda nao fez login no GitHub CLI. Rode uma vez: gh auth login"
  exit 1
}

# --- Branch -------------------------------------------------------------
$branch = & git branch --show-current
if (-not $branch) { Write-Host "ERRO: nao ha branch ativa (HEAD solto)."; exit 1 }
$branch = "$branch".Trim()
if ($branch -eq $Base -or $branch -eq "main" -or $branch -eq "master") {
  Write-Host "ERRO: voce esta na branch '$branch'. Nunca envie direto para ela. Crie uma branch nova."
  exit 1
}

$sujo = (& git status --porcelain --untracked-files=no)
if ($sujo) {
  Write-Host "AVISO: ha arquivos modificados e NAO commitados (nao irao no PR):"
  $sujo | ForEach-Object { Write-Host "  $_" }
}

# --- Descricao do PR ----------------------------------------------------
$corpoPath = Join-Path (Get-Location).Path $CorpoArquivo
$temCorpo = Test-Path $corpoPath
if ($temCorpo) {
  $primeira = (Get-Content -Path $corpoPath -TotalCount 1)
  if ("$primeira" -notlike "## O que muda*") {
    Write-Host "ERRO: $CorpoArquivo existe, mas nao comeca com '## O que muda' (arquivo velho ou errado). Apague-o ou peca a IA para regrava-lo."
    exit 1
  }
} elseif (-not $Minimo) {
  Write-Host "ERRO: falta a descricao completa do PR ($CorpoArquivo). Peca a IA para grava-la, ou use -Minimo para uma descricao curta."
  exit 1
}

# --- Push ---------------------------------------------------------------
Write-Host "Enviando a branch '$branch' ao GitHub..."
& git push -u origin $branch
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO: git push falhou (codigo $LASTEXITCODE). Nada foi mesclado."; exit 1 }

# --- Pull Request -------------------------------------------------------
$url = (& gh pr view $branch --json url --jq ".url" 2>$null)
if ($LASTEXITCODE -eq 0 -and $url) {
  Write-Host "O PR desta branch ja existe e foi atualizado pelo push:"
  Write-Host $url
} else {
  $titulo = "$(& git log -1 --pretty=%s)".Trim()
  if ($temCorpo) {
    & gh pr create --base $Base --head $branch --title $titulo --body-file $corpoPath
  } else {
    $corpo = "Branch $branch. O CI e o Preview da Vercel rodam automaticamente. NAO mesclar sem o pode do Joaquim: o merge na main publica na Producao."
    & gh pr create --base $Base --head $branch --title $titulo --body $corpo
  }
  if ($LASTEXITCODE -ne 0) { Write-Host "ERRO: nao consegui criar o PR (codigo $LASTEXITCODE). A branch foi enviada."; exit 1 }
  if ($temCorpo) { Remove-Item -Path $corpoPath -Force -ErrorAction SilentlyContinue }
}

Write-Host ""
Write-Host "PRONTO. Proximo passo: espere o CI ficar verde na pagina do PR."
Write-Host "NAO clique em Merge antes do seu pode."
