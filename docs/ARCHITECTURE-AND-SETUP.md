# Архитектура и запуск

CEP HTML/CSS/JS → host-loader/bridge → ExtendScript в Premiere. `batch.*` ведут пакет/связь, `test-graphic.*` графику, `host.jsx` секвенцию/кэш. `typography.js`/`motion.js` геометрию/preview, `phrases.js` разбиение. `editorial*`, `review-*`, `workflow*`, `design.js` — сценарий/роли/проверку/этапы.

Транскрипция: CEP → отдельный Python → FFmpeg → whisper.cpp large-v3-turbo. Темы: локальный llama.cpp + Qwen3-4B-Instruct-2507. См. [local-ai.md](../local-ai.md), worker/launcher/config и `development-scripts/Настроить локальные движки.ps1`.

MOGRT строится JSX в AE. Текущий `build-vertical-template-062.jsx` создаёт Adaptive comp, `check-animation-062.jsx` проверяет её. Duplicate guard останавливает повтор в том же проекте. Для следующей версии нужна собственная копия, не чужой проект.

## Локальная установка

CEP устанавливалась в `%APPDATA%/Adobe/CEP/extensions/com.artem.subtitle-studio`, меню расширений Premiere. Нужны локальные лицензированные Bebas Neue Cyrillic, Christopher, Cera Pro Medium. Самих файлов шрифтов здесь нет.

Движки/модели/Python/FFmpeg остаются отдельной `local-ai`; здесь инструкции/настройки/код, не многогигабайтная установка. Машинный transcription-config надо настроить под реальный компьютер.

## Воспроизводимость

Исторические тесты и JSX содержат абсолютные пути машины Артёма; копия сохраняет рабочие исходники, но не обещает переносимость. Часть тестов импортирует Playwright из runtime Codex. Сначала подготовить переносимую конфигурацию/зависимости; не запускать все файлы слепо. Тесты и native-проверки не перезапускались при переносе; отчёты исходные.

`recovery-inputs` — исторические документы и AEP/PRPROJ. Последний PRPROJ в `examples/premiere-project`; пути медиа локальные, может требоваться relink на `examples/audio-and-subtitles`. Снимки не являются живым registry, их нельзя восстанавливать автоматически поверх панели.

## Материалы вне репозитория

Полные сторонние пакеты Reels/SaaS и Adobe auto-save не выдаются за наши разработки: [перечень](EXTERNAL-MATERIALS.json). Текущий собственный Adaptive не требует их повторной загрузки. Историческая инвентаризация/наши результаты сохранены. Шрифты и модели устанавливаются отдельно. Original MP4 125 MB остаётся локально; приложена полная компактная копия, см. examples/README.md.
