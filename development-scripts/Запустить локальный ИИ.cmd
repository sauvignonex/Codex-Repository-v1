@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-LocalAI.ps1"
if errorlevel 1 pause
