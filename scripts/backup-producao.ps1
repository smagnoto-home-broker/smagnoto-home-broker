# Backup do banco Smagnoto (somente leitura no banco). ASCII puro, sem acentos.
# Requisitos: pg_dump (PostgreSQL client 17 ou maior) e 7-Zip. NAO precisa de Docker.
# Uso (PowerShell):
#   powershell -ExecutionPolicy Bypass -File "F:\Projetos\smagnoto-home-broker-staging\scripts\backup-producao.ps1" -ProjectRef cbgvttxmskwybalefezk
# A senha do banco e a senha do arquivo .7z sao pedidas no terminal e NUNCA gravadas.
# Se a conexao direta falhar (IPv6), use o "Session pooler" do botao Connect do Supabase:
#   -DbHost aws-...pooler.supabase.com -DbUser postgres.<ref>
param(
  [Parameter(Mandatory=$true)][string]$ProjectRef,
  [string]$OutDir = "F:\Projetos\backups-smagnoto",
  [string]$DbHost = "db.$ProjectRef.supabase.co",
  [string]$DbUser = "postgres",
  [int]$DbPort = 5432
)
$ErrorActionPreference = "Stop"

$p7z = "C:\Program Files\7-Zip"
if (-not (Get-Command 7z -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $p7z "7z.exe"))) { $env:Path += ";$p7z" }
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  $bin = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName "bin" } |
    Where-Object { Test-Path (Join-Path $_ "pg_dump.exe") } |
    Select-Object -First 1
  if ($bin) { $env:Path += ";$bin" }
}
foreach ($t in @("pg_dump","7z")) {
  if (-not (Get-Command $t -ErrorAction SilentlyContinue)) { Write-Host "ERRO: '$t' nao encontrado."; exit 1 }
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dir = Join-Path $OutDir "$ProjectRef-$stamp"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$sec = Read-Host "Senha do banco (postgres) do projeto $ProjectRef" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
$env:PGSSLMODE = "require"

$ok = $true
try {
  Write-Host "Exportando estrutura (schema public)..."
  & pg_dump -h $DbHost -p $DbPort -U $DbUser -d postgres --schema-only --no-owner --no-privileges -n public -f (Join-Path $dir "schema.sql")
  if ($LASTEXITCODE -ne 0) { Write-Host "ERRO: pg_dump da estrutura falhou (codigo $LASTEXITCODE)."; $ok = $false }
  Write-Host "Exportando dados (schemas public e auth)..."
  & pg_dump -h $DbHost -p $DbPort -U $DbUser -d postgres --data-only --no-owner --no-privileges -n public -n auth -f (Join-Path $dir "dados.sql")
  if ($LASTEXITCODE -ne 0) { Write-Host "ERRO: pg_dump dos dados falhou (codigo $LASTEXITCODE)."; $ok = $false }
} finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

foreach ($f in @("schema.sql","dados.sql")) {
  $p = Join-Path $dir $f
  if (-not (Test-Path $p) -or (Get-Item $p).Length -lt 2048) { Write-Host "ERRO: $f ausente ou pequeno demais."; $ok = $false }
}
if ($ok) {
  $schema = Get-Content (Join-Path $dir "schema.sql") -Raw
  foreach ($tab in @("company","company_user","property","lead","user_roles")) {
    if ($schema -notmatch "public\.$tab") { Write-Host "ERRO: tabela essencial ausente no dump: $tab"; $ok = $false }
  }
}
if (-not $ok) { Write-Host "BACKUP INVALIDO. Nao prossiga com migration."; exit 2 }

Get-FileHash (Join-Path $dir "schema.sql"), (Join-Path $dir "dados.sql") -Algorithm SHA256 |
  ForEach-Object { "$($_.Hash)  $(Split-Path $_.Path -Leaf)" } | Set-Content (Join-Path $dir "SHA256.txt")

$sec7 = Read-Host "Senha para criptografar o .7z (guarde fora do computador)" -AsSecureString
$b7 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec7)
$p7 = [Runtime.InteropServices.Marshal]::PtrToStringAuto($b7)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b7)
$arq = Join-Path $OutDir "$ProjectRef-$stamp.7z"
& 7z a -t7z -mhe=on "-p$p7" $arq (Join-Path $dir "*") | Out-Null
$p7 = $null
if (-not (Test-Path $arq)) { Write-Host "ERRO: .7z nao foi criado."; exit 3 }

Write-Host "BACKUP VALIDO."
Write-Host "Arquivo criptografado: $arq"
Write-Host "ATENCAO: o dump em claro (inclui dados de usuarios) esta em: $dir"
Write-Host "Copie o .7z para fora da maquina e depois apague essa pasta."
Write-Host "Copias antigas em $OutDir (apenas listadas; apague voce):"
Get-ChildItem $OutDir -Filter "*.7z" | Sort-Object LastWriteTime | Select-Object Name, Length, LastWriteTime | Format-Table
