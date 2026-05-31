# Copia os MP3 da meditação para public/audio/meditacao/ com nomes curtos.
# Uso: .\scripts\setup-meditation-audio.ps1
#      .\scripts\setup-meditation-audio.ps1 -SourceFolder "C:\Users\JOAO\Downloads\MinhaPasta"

param(
  [string]$SourceFolder = ""
)

$dest = Join-Path $PSScriptRoot "..\public\audio\meditacao"
$dest = [System.IO.Path]::GetFullPath($dest)
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$maps = @(
  @{ Out = "hans-zimmer-inception-time.mp3"; Pattern = "Hans Zimmer.*Inception|Inception Time.*Hans Zimmer" },
  @{ Out = "einaudi-experience-live-milano.mp3"; Pattern = "Einaudi.*Experience.*Milano|Experience.*Teatro dal Verme" },
  @{ Out = "einaudi-experience-solo-piano.mp3"; Pattern = "Einaudi.*Experience.*Solo Piano|Experience.*Solo Piano.*Einaudi" },
  @{ Out = "einaudi-tiny-desk.mp3"; Pattern = "Einaudi.*Tiny Desk|Tiny Desk.*Einaudi" },
  @{ Out = "passacaglia-handel-halvorsen.mp3"; Pattern = "Passacaglia|Handel.*Halvorsen|Halvorsen" },
  @{ Out = "tony-ann-icarus.mp3"; Pattern = "Tony Ann.*ICARUS|ICARUS.*Tony Ann" }
)

$searchRoots = @()
if ($SourceFolder -and (Test-Path $SourceFolder)) {
  $searchRoots += $SourceFolder
} else {
  $searchRoots += @(
    (Join-Path $env:USERPROFILE "Downloads"),
    (Join-Path $env:USERPROFILE "Desktop"),
    (Join-Path $env:USERPROFILE "Music"),
    (Join-Path $env:USERPROFILE "Documents")
  )
}

$allMp3 = @()
foreach ($root in $searchRoots) {
  if (-not (Test-Path $root)) { continue }
  $allMp3 += Get-ChildItem -Path $root -Filter "*.mp3" -Recurse -ErrorAction SilentlyContinue
}

Write-Host "Destino: $dest"
Write-Host "MP3 encontrados: $($allMp3.Count)"
Write-Host ""

$copied = 0
foreach ($map in $maps) {
  $match = $allMp3 | Where-Object { $_.Name -match $map.Pattern } | Select-Object -First 1
  $target = Join-Path $dest $map.Out
  if ($match) {
    Copy-Item -LiteralPath $match.FullName -Destination $target -Force
    Write-Host "[OK] $($map.Out) <- $($match.Name)"
    $copied++
  } else {
    Write-Host "[--] $($map.Out) - ficheiro nao encontrado"
  }
}

Write-Host ""
Write-Host "Copiados: $copied / $($maps.Count)"
if ($copied -lt $maps.Count) {
  Write-Host "Copie manualmente para: $dest"
  foreach ($m in $maps) {
    Write-Host "  - $($m.Out)"
  }
}
