# Backup do banco Smagnoto (somente leitura no banco). ASCII puro, sem acentos.
# NAO TESTADO. Requisitos: Supabase CLI (supabase), 7-Zip (7z) no PATH.
# Uso (PowerShell, a partir de qualquer pasta):
#   powershell -ExecutionPolicy Bypass -File "F:\Projetos\smagnoto-home-broker-staging\scripts\backup-producao.ps1" -ProjectRef ustqwxwdejkfwzfrlitc
# A senha do banco e a senha do arquivo .7z sao pedidas no terminal e NUNCA gravadas.
param(
  [Parameter(Mandatory=$true)][string]$ProjectRef,
  [string]$OutDir = "F:\Projetos\backups-smagnoto",
  [string]$DbHost = "db.$ProjectRef.supabase.co",
  [string]$DbUser = "postgres",
  [int]$DbPort = 5432
)
# Se a conexao direta falhar (IPv6), use o "Session pooler" do botao Connect do Supabase:
#   -DbHost aws-...pooler.supabase.com -DbUser postgres.<ref>
$ErrorActionPreference = "Stop"
$p7z = "C:\Program Files\7-Zip"
if (-not (Get-Command 7z -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $p7z "7z.exe"))) { $env:Path += ";$p7z" }
foreach ($t in @("supabase","7z")) {
  if (-not (Get-Command $t -ErrorAction SilentlyContinue)) { Write-Host "ERRO: '$t' nao encontrado no PATH."; exit 1 }
}
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dir = Join-Path $OutDir "$ProjectRef-$stamp"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$sec = Read-Host "Senha do banco (postgres) do projeto $ProjectRef" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$dbpass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
$url = "postgresql://$($DbUser):$([uri]::EscapeDataString($dbpass))@$($DbHost):$($DbPort)/postgres"

supabase db dump --db-url $url -f (Join-Path $dir "schema.sql")
supabase db dump --db-url $url --data-only --use-copy -f (Join-Path $dir "dados.sql")
$dbpass = $null; $url = $null

$ok = $true
foreach ($f in @("schema.sql","dados.sql")) {
  $p = Join-Path $dir $f
  if (-not (Test-Path $p) -or (Get-Item $p).Length -lt 2048) { Write-Host "ERRO: $f ausente ou pequeno demais."; $ok = $false }
}
$schema = Get-Content (Join-Path $dir "schema.sql") -Raw
foreach ($tab in @("company","company_user","property","lead","user_roles")) {
  if ($schema -notmatch "public\.$tab") { Write-Host "ERRO: tabela essencial ausente no dump: $tab"; $ok = $false }
}
if (-not $ok) { Write-Host "BACKUP INVALIDO. Nao prossiga com migration."; exit 2 }

Get-FileHash (Join-Path $dir "schema.sql"), (Join-Path $dir "dados.sql") -Algorithm SHA256 |
  ForEach-Object { "$($_.Hash)  $(Split-Path $_.Path -Leaf)" } | Set-Content (Join-Path $dir "SHA256.txt")

$sec7 = Read-Host "Senha para criptografar o .7z (guarde fora do computador)" -AsSecureString
$b7 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec7)
$p7 = [Runtime.InteropServices.Marshal]::PtrToStringAuto($b7)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b7)
$arq = Join-Path $OutDir "$ProjectRef-$stamp.7z"
7z a -t7z -mhe=on "-p$p7" $arq (Join-Path $dir "*") | Out-Null
$p7 = $null
if (-not (Test-Path $arq)) { Write-Host "ERRO: .7z nao foi criado."; exit 3 }

Write-Host "BACKUP VALIDO."
Write-Host "Arquivo criptografado: $arq"
Write-Host "ATENCAO: apague a pasta em claro depois de copiar o .7z para fora da maquina: $dir"
Write-Host "Copias antigas em $OutDir (apenas listadas, apague voce):"
Get-ChildItem $OutDir -Filter "*.7z" | Sort-Object LastWriteTime | Select-Object Name, Length, LastWriteTime | Format-Table
