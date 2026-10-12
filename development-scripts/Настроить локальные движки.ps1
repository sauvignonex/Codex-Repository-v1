param([string]$EngineRoot = 'D:\Projects Adobe\Разработка плагина\local-ai')
$ErrorActionPreference = 'Stop'
$packageRoot = Split-Path -Parent $PSScriptRoot
$enginePath = [IO.Path]::GetFullPath($EngineRoot)
$config = Get-Content -LiteralPath (Join-Path $packageRoot 'premiere-subtitles-cep\transcription-config.json') -Raw | ConvertFrom-Json
$paths = @{python='python\pythonw.exe';ffmpeg='ffmpeg.exe';whisper='whisper-cpp\Release\whisper-cli.exe';model='ggml-large-v3-turbo.bin';llama='llama-cpp\llama-server.exe';topicsModel='Qwen3-4B-Instruct-2507-Q4_K_M.gguf'}
foreach ($key in $paths.Keys) {
  $candidate = Join-Path $enginePath $paths[$key]
  if (!(Test-Path -LiteralPath $candidate -PathType Leaf)) { throw "Missing local runtime: $candidate. See local-ai.md." }
  $config.$key = $candidate.Replace('\','/')
}
$text = $config | ConvertTo-Json
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $packageRoot 'premiere-subtitles-cep\transcription-config.json'),$text,$utf8)
$installed = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.artem.subtitle-studio\transcription-config.json'
if (Test-Path -LiteralPath $installed) {[IO.File]::WriteAllText($installed,$text,$utf8)}
Write-Host 'Local transcription and topic model configured. Reopen only the subtitle panel.'
