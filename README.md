# Subtitle Studio

Плагин Premiere для распознавания речи и редактируемых субтитров в стиле референсного рилса.

## Начать здесь

- [Текущий статус и следующая задача](docs/STATUS-AND-ROADMAP.md).
- [Требования и правила работы](AGENTS.md) → [замысел владельца](docs/PROJECT-INTENT.md).
- [Продолжение работы](docs/AUTONOMOUS-WORK.md) и [результаты локальной проверки Adobe](docs/LOCAL-NATIVE-QA-063.md).
- [Связь руководителя и исполнителя](.coordination/README.md): задания, отчёты и ревью в [PR #1](https://github.com/sauvignonex/Codex-Repository-v1/pull/1).

## Где что лежит

| Раздел | Содержимое |
| --- | --- |
| [premiere-subtitles-cep/](premiere-subtitles-cep/) | Панель, хост Premiere, шаблоны и отчёты |
| [development-scripts/](development-scripts/) | Сборка AE, проверки и вспомогательные скрипты |
| [docs/](docs/) | [Архитектура и запуск](docs/ARCHITECTURE-AND-SETUP.md), [проверки](docs/VERIFICATION.md), текущие инструкции |
| [examples/](examples/README.md) | Референсный рилс, анимации, интерфейсы и исходные материалы |
| [docs/history/](docs/history/PROJECT-HISTORY.md) | [История](docs/history/PROJECT-HISTORY.md), [пожелания](docs/history/USER-REQUESTS.md), [ошибки и уроки](docs/history/FAILURES-AND-LESSONS.md) |
| [recovery-inputs/](recovery-inputs/) и `visual-check-*` | Снимки восстановления и доказательства проверок по версиям |

`release-*.md`, `plugin-requirements.md` и `development-checkpoint.md` в корне — исторические документы. Актуальные решения читать в статусе и AGENTS.md. Repair-скрипты и снимки восстановления не применять к живому документу без отдельной проверки.

## Сохранность

Пути файлов сохранены: сборка, тесты и локальная разработка используют прежние каталоги. Обычная речь, её тайминги и исходный монтаж защищены требованиями. CI и отчёты не заменяют проверку конкретного изображения/видео в Adobe.

[Ключи.md](Ключи.md) и [Секреты.md](Секреты.md) описывают подключения и хранение секретов; сами секреты в Git не добавлять. [Учёт материалов](docs/MATERIALS-MANIFEST.json) и [внешние зависимости](docs/EXTERNAL-MATERIALS.json).
