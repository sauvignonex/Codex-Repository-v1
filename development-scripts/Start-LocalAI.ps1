$ErrorActionPreference = 'Stop'
$taskRoot = 'D:\Projects Adobe\Разработка плагина\local-ai'
$taskModel = Join-Path $taskRoot 'Qwen3-4B-Instruct-2507-Q4_K_M.gguf'
$taskRuntime = Join-Path $taskRoot 'llama-cpp\llama-server.exe'
$taskBaseURL = 'http://127.0.0.1:18767'
try {
    $taskModels = Invoke-RestMethod -Uri ($taskBaseURL + '/v1/models') -TimeoutSec 3
    if (($taskModels.data | ConvertTo-Json -Depth 5) -like '*Qwen3-4B-Instruct-2507*') {
        Write-Output 'Локальный API уже работает: http://127.0.0.1:18767'
        exit 0
    }
    throw 'Порт 18767 занят другой моделью. Не запускаю второй процесс.'
} catch {
    if ($_.Exception.Message -like '*занят другой моделью*') { throw }
}
if (!(Test-Path -LiteralPath $taskModel) -or !(Test-Path -LiteralPath $taskRuntime)) {
    throw 'Не найдены модель или llama-server в папке проекта local-ai.'
}
if ((Get-FileHash -LiteralPath $taskModel -Algorithm SHA256).Hash -ne '3605803B982CB64AEAD44F6C1B2AE36E3ACDB41D8E46C8A94C6533BC4C67E597') {
    throw 'Контрольная сумма модели не совпадает.'
}
if ((Get-FileHash -LiteralPath $taskRuntime -Algorithm SHA256).Hash -ne '7E3547F7AEAF4F72611517235C11B020270DC5B0DC898589A90979EF720E8502') {
    throw 'Контрольная сумма llama-server не совпадает.'
}
$taskProcess = Start-Process -FilePath $taskRuntime -ArgumentList @('-m', ('"' + $taskModel + '"'), '-ngl', '99', '-c', '8192', '--host', '127.0.0.1', '--port', '18767', '--no-webui') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'subtitle-api.stdout.log') -RedirectStandardError (Join-Path $taskRoot 'subtitle-api.stderr.log') -PassThru
@{ pid = $taskProcess.Id; executable = $taskRuntime; model = $taskModel } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskRoot 'subtitle-api-process.json') -Encoding UTF8
for ($taskAttempt = 0; $taskAttempt -lt 45; $taskAttempt++) {
    Start-Sleep -Seconds 1
    try {
        $taskHealth = Invoke-RestMethod -Uri ($taskBaseURL + '/health') -TimeoutSec 1
        if ($taskHealth.status -eq 'ok') { Write-Output 'Локальный API готов: http://127.0.0.1:18767'; exit 0 }
    } catch {}
    if ($taskProcess.HasExited) { throw 'llama-server остановился. Проверь subtitle-api.stderr.log.' }
}
throw 'Модель ещё загружается. Проверь журнал в local-ai.'
