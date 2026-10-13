# Локальный handoff: канал руководства

Дата: 13.10.2026. Исполнитель — чат «Основная разработка».

## Подтверждённый канал

По прямому указанию владельца прочитан чат «Руководитель Subtitle Studio» через `list_threads` и `read_thread`, host `durable`, thread ID `01a1326a-085a-7348-8014-7d8835d53058`. Чтение успешно; это реальный канал получения поручений и ревью. Прямая отправка сообщений руководителю этим чтением не выполнялась. Автоматическую двустороннюю связь или подтверждение получения отчёта не заявляем.

Руководитель сейчас готовит общий канал заданий/отчётов в GitHub PR #1. Его готовность и конкретные новые сообщения необходимо проверить перед использованием; намерение создать канал не является доказательством завершённой настройки. Только локальный исполнитель меняет код и установку; руководитель проводит ревью.

## Прочитанное поручение и текущий этап

Первый приоритет — разнообразные красивые хайлайты по референсу, настоящее видео-сравнение и сохранение уже одобренной неподвижной речи. Это совпадает с выбранной задачей в `LOCAL-NATIVE-QA-063.md`. Установку 0.6.3 QA r2 повторять не требуется; подтверждённые native-доказательства находятся в `visual-check-0.6.3/`. Художественная приёмка хайлайтов остаётся открытой.

Следующий результат: отдельные native-этюды разных семейств раскрытия и композиции, с чёткой паузой чтения и motion blur. Существующие 103 блока, обычная речь, исходный монтаж и тайминги сохраняются. Новые этюды пока не реализованы и не проверены в Adobe.

## Открытое замечание руководителя

В предыдущем ревью руководитель сообщил о воспроизведении дефекта в `style-advisor.js`: смысловой контекст обрывается на пунктуации и может исключить соседний хайлайт всего за 100 мс до блока; ограничение расстояния тогда пропускает предложение нового title. Его проверка была синтетической, без настоящей модели/Adobe. Локально это замечание ещё не воспроизведено; не считать исправленным.

При проверке отделить смысловой контекст от защиты по полной временной шкале, учесть защиту в stale-response key и сохранить тексты/тайминги/роли до явного применения. Проверить близкий хайлайт за границей предложения и допустимый далёкий. Эта задача не заменяет художественный приоритет владельца.

## Правило следующего этапа

Перед новой задачей читать свежие поручения и ревью руководителя доступными инструментами; после этапа записывать результат, доказательства, ограничения и открытые проблемы в handoff. Если чтение действительно недоступно, сообщать об этом без выдуманного поручения или одобрения. Не выполнять merge/финальный релиз.

## SS-CONNECT-001: подтверждено исполнителем

Прочитаны CONNECT и TASK SS-ART-001 в PR #1, полный протокол/привязки/шаблон draft PR #2 на b064b93c68dee14110171bcbedc7e90b8ac8f284. Рабочая ветка не переключалась, PR #2 не merged. ACK опубликован и прочитан обратно: https://github.com/sauvignonex/Codex-Repository-v1/pull/1#issuecomment-6142673463. Base HEAD исполнителя — 9ec50a683f759069ccb6534f65bce218901ec2e3. Основной канал теперь PR #1; чтение чата — дополнительное. Публикация отчётов явно разрешена владельцем.

## SS-ART-001: промежуточный native-этап

Добавлен build-highlight-studies-art001.jsx: три отдельные копии собственной 063 comp, четыре слоя, принятые формулы размеров Bebas/Christopher; направление/порядок/цвет изучаются отдельно. Референсы: 00.50–02.50 и 24–27 секунды (рукописная строка ведущая), 04–05.50 (ведущая малая строка и крупный корпус), 19–23 (красный контрастный акцент). Это творческие этюды, не точное воспроизведение всех композиций референса.

Локальный собственный проект dist/art001/Subtitle Studio ART001 Studies.aep сохранён; в нём три этюда. AE проверил 108 кадров, 1296 чтений затронутых свойств без expressionError, прямоугольные пределы размещения. Эти проверки не покрывают полностью тени/blur/вырез безопасной зоны, длинные тексты и короткие длительности.

При визуальной проверке обнаружены несоответствия первого расчёта: у A горизонтальное раскрытие вместо ожидаемого вертикального, у B белый вместо жёлтого. Переименована переменная spec для исключения конфликта с выражениями; повторный расчёт прошёл без expressionError, однако соответствие фактических выражений и свежих PNG ещё необходимо проверить. Причина не доказана, дефект не объявляется устранённым. В журнале сохранены обе попытки и первоначальный отказ проверки имени URI; исправлен decodeURI имени проекта.

Запущен отдельный экспорт трёх study MOGRT через существующий After Effects. Завершение ещё не подтверждено: возможно ручное OK предупреждения шрифтов; запрос владельцу отправлен. Не повторять экспорт до чтения результата BridgeTalk и проверки файлов. Не делать импорт в Premiere до проверки выражений/цветов этюдов. Native-приёмка в Premiere, видео-сравнение, длинные/короткие кейсы и художественная приёмка остаются открытыми.

Установленная CEP/063 MOGRT, живой документ и Premiere-клипы этим этапом не изменялись. Full-set/cache повторно не запускались, потому что итоговый runtime не менялся. dist остаётся локальным; не публиковать сырые пользовательские резервные копии.

### Продолжение: подтверждённый r3

После ручного OK оба экспорта подтвердились чтением ответа BridgeTalk (`exported=3`, затем `r3 exported=3`). Несоответствия направлений/цвета устранены применением готовых буквальных выражений из art001-motion-specs.json с точным readback. apply-highlight-study-specs-art001.jsx выполнен в собственном study-проекте: 108 кадров, 1080 чтений свойств, noExpressionError. Свежие AE PNG подтвердили вертикальное раскрытие A и жёлтый Christopher B. Исходный builder дополнен этим readback; полный builder с последней вставкой с нуля ещё не повторялся.

В Premiere создана отдельная секвенция `[Subtitle Studio] SS-ART-001 — три этюда r3`, ID c4f43473-d57d-4153-a868-997826aacd63, 1080×1920/30 fps. Три клипа по 1.2 сек начинаются в 0, 1.5, 3 сек, ID 000f48f6/000f48f7/000f48f8. Первичный прямой importMGT оставил параметры нулевыми и текст пустым; пустые первые кадры не признаны успехом. Параметры и тексты записаны в те же три клипа без повторного импорта; настоящий Program-экспорт подтвердил текст/цвет/шрифты.

126 настоящих PNG после записи параметров собраны в Premiere-SS-ART-001-written.mp4. Выгрузка прервалась после 99 кадров по тайм-ауту клиента; после восстановления соединения сохранены только оставшиеся 27, клипы не импортировались заново. Пиксельная проверка check-highlight-study-frames.py проходит: все три входа меняются, пауза чтения на кадрах 14–32 (19 кадров) неподвижна полностью, stable bounds проверены. Видео Compare-A/B/C: слева исходный рилс с 4/24/19 сек, справа соответствующий этюд. Эти отрезки — сравнение выбранных эпизодов, не точная синхронизация начала анимаций; художественное соответствие не доказано.

Preview-кэш study-секвенции: `ok|c4f43473-d57d-4153-a868-997826aacd63|3|17.084`. Проект сохранён. Живые 103 cues точно равны резервной копии до установки. Пять исходных секвенций с прежними ID/количеством клипов присутствуют. При текущем аудите ранее созданная полная 0.6.3 QA-секвенция отсутствует в открытом проекте; причины этого этим этапом не установлены, она не удалялась исполнителем. Не заявлять проверку её текущей сохранности или повторного полного кэша. Кэш полного набора принят ранее, не распространяется на новые этюды.

SS-ART-001 остаётся working: открыты короткие/длинные тексты, адаптация темпа к длине, полный контур с blur/тенью, точное сравнение движения и художественная оценка владельца; в runtime новые семейства не интегрированы. Простая маска Christopher не является прорисовкой штрихов. Полные факты/видео промежуточного этапа публикуются отдельным REPORT, не как accepted.

## REVIEW-01: начало второго прохода и локальное расписание

REVIEW SS-ART-001-REVIEW-01 (6143535998) прочитан; ACK опубликован (6143624355). Подготовлены art001-pass2-motion.cjs и literal JSON: A малая ведущая Cera над Bebas, B Christopher над подписью Cera, C красный Bebas над компактной подстрокой. Это новые предложенные композиции, ещё не Adobe-сборка/не одобрение пропорций. Старые принятые runtime-шрифты/размеры не менялись. Новые позиции ниже и учитывают вырез безопасной зоны. A prototype допускает delay до 24% вместо исторических 12%; это явно открытая художественная проверка, не установленное изменение.

24 source/VM timing кейса (три семейства × короткий/длинный текст × 0.25/0.5/1.2/3 сек) проходят: длина влияет на темп, недостаток reading hold включает immediate без изменения длительности. Сохранены dist/art001-pass2/timing-matrix-source.json и локальные contact sheets входов reference A/B/C. Первые видимые reference кадры по анализу: A около 88/30, B около 708/30, C около 564/30; точное сопоставление/окна выхода и native-видео второго прохода ещё открыты. Свежий builder второго прохода не написан/не запускался. Не повторять REPORT-01 как завершение REVIEW-01.

Read-only аудит gzip PRPROJ нашёл sequenceID 898bde27-30ca-4683-8387-dcb9fd69c2cf и имя полного QA 063 в автосохранении 13.10.2026 11:46:50, SHA c1c06a4b3c7a31ae825ca8cb495c04ad2eb94505066f97e3a4af72a4f5e80448. В автосохранении 12:07:37 они уже отсутствуют (SHA 7da93162b89af872b7cb3fe53023d67b029e0c2cad06dabe9c30ca0ff17a1dba), до создания этюдов. Копия с QA сохранена вне Git в «Локальные резервные копии/SS-ART-001-review02/full-QA-063-autosave-114650.prproj», живой проект скопирован отдельно, не восстанавливался. Причина изменения неизвестна; сохранённый QA найден, не потерян безвозвратно. Текущий открытый проект — тот же путь, активный новый пользовательский SRT-набор; его нельзя заменять историческим QA.

По новому запросу владельца создан штатный локальный hourly heartbeat subtitle-studio-pr-1 в этом чате. CLI установлен/ChatGPT-authorized, но второй Windows/CLI scheduler не активирован. config.toml сохранён с совпадающим SHA-256 вне Git; настройки не менялись. Инструкция docs/LOCAL-SCHEDULED-WORK.md, общий cooperative writer lock вне Git. Реальный acquire прошёл; второй acquire и release с чужим token отклонены. Windows отображает эти ненулевые exits как 1, хотя скрипт использует 3/4; содержимое JSON подтверждает причины. Lock не снимается автоматически.

Владелец нажал Run now во время текущего хода, приложение отклонило запуск: Heartbeat thread is busy right now. Это подтверждённая защита от параллельного heartbeat, не успешный scheduler-ход. После безопасного сохранения/освобождения текущего lock следует завершить ход, затем повторить Run now в idle-чате; первый scheduler-ход должен выполнить реальную проверку и опубликовать REPORT SS-SCHEDULE-001-REPORT-01. Проверка успешного расписания пока открыта; не обещать обход лимитов. Продолжение SS-ART-001 сохранено и не отменено.

## Первый реальный heartbeat подтверждён

13.10.2026 13:53:43 МСК: пришёл heartbeat subtitle-studio-pr-1 (UTC 10:53:43.723Z). Выполнена предусмотренная первая end-to-end проверка на HEAD 2879752d5158b27240e5290e0544376175202fc5: свежие комментарии PR прочитаны, HEAD совпал, ordinaryUsageAllowed=true, lock получен, 24 source/VM теста проходят, CLI config hash равен backup. REPORT SS-SCHEDULE-001-REPORT-01 опубликован и прочитан обратно: https://github.com/sauvignonex/Codex-Repository-v1/pull/1#issuecomment-6143995073. Receipt вне Git completed, своя блокировка освобождена. Это успешный scheduler-run (тип Run now/таймер не различается), а не Adobe-приёмка. Автоматизация остаётся ACTIVE/hourly, обхода лимитов нет.

SS-ART-001/REVIEW-01 остаётся открытым. Следующий ограниченный этап — свежий отдельный builder pass2 с literal readback и native-матрицей; после него синхронизированные видео. Живой документ/монтаж/установка этим первым scheduler-ходом не менялись. Не повторять первый scheduler-тест, если completed receipt уже существует.

## SS-ART-001: свежий builder Pass2 выполнен в Adobe

13.10.2026 по прямому продолжению владельца: PR перечитан, общий lock получен. build-art001-pass2.jsx создал с нуля три отдельные comp SS ART001 Pass2 A/B/C в собственном AE-проекте (не duplicate/repair старой comp), по четыре слоя, 180°/−90°/8/16. Literal readback source/position/mask совпал. 24 кейса: короткий/длинный текст с выносными буквами и переносом × 0.25/0.5/1.2/3 сек × три семейства; 10 728 чтений свойств во временной сетке без expressionError. Собственный проект сохранён в dist/art001-pass2/native/Subtitle Studio ART001 Pass2.aep.

Сохранены 96 выборочных кадров матрицы и три reference-hold. На 99 настоящих RGBA PNG check-art001-pass2-safe.py подтвердил контур M72,234 H1018 V1348 H864 V1600 H72, включая alpha тени/blur выше 2/255. Все 0.25-секундные случаи видны с первого кадра. Это выборочная пиксельная проверка; все промежуточные blur-кадры не экспортированы, full_motion_path_verified=false. Начальный checker ошибочно требовал немедленного показа всех 0.5-секундных случаев; B/C short имеют достаточную паузу и правомерно анимируются, поэтому тест исправлен, продукт не менялся ради теста.

A main поднят до y1440 для нижней границы; B подпись перенесена на y1504, при двух строках вся группа поднимается по реальной высоте подписи без уменьшения Cera. Это изменения только новых прототипов. Обычная речь/установка 063/живые Premiere-клипы не изменялись. Перед QA сохранён текущий живой документ локально; исторический документ не восстанавливался.

Экспорт трёх новых MOGRT начат через BridgeTalk, ответ pending; отправлен владельцу запрос OK предупреждений шрифтов. Не повторять экспорт, пока результат не прочитан и файлы не проверены. Открыты: корректные controls/Program после импорта, настоящие видео Pass2, полная траектория/паузы чтения по пикселям, сравнимые подложки и синхронизация reference начала/выхода. Reference anchors с погрешностью ±1 кадр сохранены в art001-pass2-reference-map.json; окна hold/выхода ещё не определены точно. REVIEW-01 не закрыт, семейства в runtime не включены.

### Pass2 проверен в Premiere после экспорта

Владелец нажал OK; BridgeTalk подтвердил pass2 exported=3, три файла проверены. Создана отдельная секвенция `[Subtitle Studio] SS-ART-001 Pass2 — сравнение`, ID 09c35df0-c3ee-454a-8111-14e27bc91b26. Три 3-секундных клипа в 0/3.5/7 сек. Перед QA проект сохранён и скопирован вне Git. Controls (duration/две строки) явно инициализированы сразу после импорта; пустой Program не объявлялся успехом. Шаблоны не устанавливались в runtime.

Экспортированы все 270 настоящих кадров Premiere, по 90 на вариант. check-art001-pass2-premiere.py проходит: первый видимый кадр 1; видимый RGB текст/blur в контуре на всех кадрах, 39 полностью одинаковых кадров hold 45–83. Чёрная тень на чёрном Premiere-фоне не измеряется этим тестом: отдельные 99 AE RGBA samples учитывают её alpha; полная alpha-траектория остаётся открытой. Кэш 3/3: ok|09c35df0-c3ee-454a-8111-14e27bc91b26|3|45.248. Проект сохранён. Все 103 текущих cues точно равны снимку перед этой QA.

Premiere-A/B/C.mp4 — native-видео входа/hold/выхода. Compare-A/B/C-onset.mp4: начало рилса 87/30,707/30,563/30, native кадр1 совмещён с выбранными first-visible anchors 88/708/564. Погрешность ручного выбора ±1 кадр. Справа native-видео через FFmpeg colorkey наложено на чистый freeze-frame перед текстом из того же эпизода. Это сравнимая сцена, не одинаковый движущийся фон и не native-композит с подложкой. Blur/чёрная тень в таком сравнении могут отличаться от исходных RGBA; измерения выше относятся к оригинальным экспортам. Выход по рилсу ещё не синхронизирован: этюды по3сек, reference B/C длиннее. Эти ограничения не скрывать; REVIEW-01 остаётся changes_requested до полноценной художественной доводки.

Собственная визуальная проверка compare на0.65сек выявила следующие художественные расхождения: A раскрывает крупный корпус раньше рилса; B рукописный заголовок уже и подпись появляется раньше; C композиционно ближе, но ход появления/выхода всё ещё не принят. Для B первоначальный freeze-frame попал в предыдущий план до склейки; заменён на23.5667сек (снежная сцена перед входом). Дальше калибровать задержку и видимую ширину B, последовательность корпуса A по словам/частям, и точные окна выхода. Не объявлять этот Pass2 финальным сходством только по зелёным тестам.


## SS-ART-001 / REVIEW-02: Pass3, 13.10.2026

ACK6144783145 опубликован после завершения предыдущих операций. Pass3 отдельно: A задержка корпуса0.70/горизонтальная маска, B smoothstep/видимая высота155/отложенная подпись, C высота62 и позиция246/1483. Reference intervals89/135/144кадра, A hardcut, B/C fade7/9. 24source/VM и24native cases/10728чтений проходят;99sample alpha,368full RGBA reference paths,368Premiere PNG. Hold A41–88/B30–127/C15–134 неподвижен. Подробнее visual-check-art001-pass3/README.md; файлы содержат ограничения, не accepted.

Исправлен QA duration A: ExtendScript nested conditional даёт неожиданную135ветку, теперь numeric frame metadata. Initial fresh builder + targeted verification реальных шрифтов/текстов/scale/durations, окончательный builder целиком повторно не запускался. Export3 завершён после ручного OK. Premiere QA beac06de-c454-4110-afe0-5f30372daebd, три клипа0/3.5/8.5с. QE требует File.fsName; первый смешанный путь не создал секвенцию, факт проверен до корректного вызова. Тайм-аут render не вызвал повтор; host responsive, green ranges0–2.9667/3.5–8/8.5–13.3 покрывают3/3, marks sentinel восстановлены. Документ103cues точь-в-точь равен снимку до QA;5старых sequence IDs/names/counts сохранены. Документ/installed runtime не менялся, старые QA отсутствовали уже в before. Проект сохранён; исторический QA не восстановлен поверх живого.

Сравнения используют настоящую AE alpha поверх явно offline freeze-frame, безcolorkey; отдельно Premiere видео всей анимации. C измерено427×62 против reference424×62 (ROI approximate). Открыто: A на.65 ещё опаздывает относительно начала корпуса reference, высота корпуса отличается, настоящие отдельные word-reveal pauses не сделаны. Не закрывать REVIEW-02/SS-ART-001. Нужны следующая художественная калибровка A и оценка B/C/выходов на moving native подложке; runtime integration/owner acceptance позднее. Исходные клипы проверены поID/количеству, не полным XML/property аудитом. Все пути alpha проверены только для3reference-length этюдов, матрица sample. Полный runtime103/cache заново не проверялся: runtime unchanged.


## SS-ART-001 Pass4 A / scheduler bounded calibration

# SS-ART-001 Pass4 A — bounded AE calibration / working

Heartbeat 2026-10-13T12:21:42.042Z. PR#1 reread: latest REVIEW-02 and REPORT-03; no newer task/review. Only A changed, B/C and installed063 protected.

Pass3 inherited tracking−24 from AE user defaults. Width cap forced uniform scale75.314%, visible body726×126. Explicit body tracking−84 now permits uniform86.5889%, body713×145 at110/1440. Reference manually isolated white body ROI715×143 at111/1440; this is approximate threshold segmentation on baked footage, not exact font attribution. No one-axis stretching. Leading Cera remains tracking−24 explicitly pinned; its italic appearance/proportions relative to reference remain open. Trial−90 yielded701×145; revised fresh r2 uses−84.

Body delay0.60 instead0.70. First word measured once with the existing disabled reserve layer, then its source cleared. Boundary slider0.35736778 controls a staged mask: first word, pause, remainder. Native frame25 shows complete ВКУС without the second word. Stable first-word frames25–27, full reading hold36–88. Motion blur transition frame24 excluded from the interior-pause equality assertion; the first checker incorrectly included it. Duration89/30 unchanged, hardcut at clip-out.

New own comp SS ART001 Pass4 A r2 A, own saved AEP, four layers. Two native trials completed; final fresh r2 matrix8cases short/long ×.25/.5/1.2/3,3576property reads without expressionError. 33sample RGBA frames and all89reference-length alpha frames pass actual safe polygon with shadow/blur >2/255. Eight source/VM cases check immediate short clips, boundary pause, full hold, uniform scale and explicit tracking. No unchanged B/C re-export/tests.

AE-A-full.mp4 uses real RGBA frames plus10generated transparent tail frames to represent clip-out. Compare-A-full-alpha.mp4: left moving reference, right true AE alpha over explicitly offline frozen plate, no chromakey. Not Premiere/comparable moving native background. Live document exactly equal before/after. No Premiere mutation, MOGRT export, installation or live migration this stage. New A **not checked in Premiere**; task not accepted. Need native MOGRT/Premiere on separate QA next, plus earliest reference hold anchor and artistic review. Boundary is prepared per input by builder: future runtime text edits must recompute the boundary; not yet a generic editable product control.

Previous Pass3/release archives preserved. Source and own AEP archived locally; do not mistake source/study archive for an installer. Untracked pre-existing auto-save/template log not committed.


## Pass5 A / REVIEW-03

# SS-ART-001 Pass5 A / REVIEW-03 — working, not artistic acceptance

ACK6145838252. Neutral explicit body tracking0 replaces−84; first-word and hold pauses retained. Source test now guards nonnegative spacing rather than treating a negative magic number as visual acceptance. Native pixel test: before ВКУС was one8-connected component; after four separate glyphs with box gaps11/5/7px. Native full-word gap35px. Same checks also pass actual Premiere frame25. This targets the rendered phrase, not a generic language segmentation test.

Actual AE fontObject: Bebas Neue Cyrillic Regular / PS BebasNeueCyrillic, substitute=false, fauxBold=false,fauxItalic=false. Uniform scaleX=scaleY71.18122016%. Reference approximate body ROI715×143, native726×119; remaining height difference is disclosed, no glyph squeezing/one-axis stretch. Leading Cera typography difference remains. typography-crops.png is reference/before/after at identical pixel scale1:1; full-frame hold/pause PNGs are also included.

Fresh own Pass5 A comp fourlayers, native8cases short/long ×.25/.5/1.2/3,3576property reads/noExpressionError. 33matrix sample alpha and all89reference-length alpha/shadow/blur frames safe. First-word pause25–27 and hold36–88 stable. Eight source/VM timing cases passed. Boundary prepared once per input, reserve text cleared; fourth Essential control added targeted before export. Corrected builder includes its registration, fresh rebuild with that registration not rerun (geometry unchanged).

Export completed Pass5 export=true after manual OK. Separate Premiere sequence9f9e564e-bf2d-4016-83bb-b3b3c4195723, oneclip89/30seconds. All fourcontrols initialized/read back: two text values, duration2.9666666667, measured boundary. Cache ok|ID|1|28.677,89actualPremiere PNG and Premiere-A-full.mp4. RGB safe contour, first-word pause, full hold and four separated glyphs pass. Black shadow on black Premiere background is covered separately by native AE RGBA, not by RGB checker.

Compare-A-full-alpha.mp4 uses explicitly offline frozen plate with trueAEalpha, actualmovingreference onleft, no chromakey. AE-A-full.mp4 adds10generated transparent tailframes for clip-out, excluded from89proof. Premiere video uses actual89exports without generatedtail. Moving native background/earliest reference hold/artistic equivalence open.

Live document exactly equal before/after. Six previous sequence IDs/names/video/audio counts preserved (includes earlier QA), new isolated A only. Not fullXML property audit. Project saved, runtime063/live cues/word times/roles untouched. B/C not re-exported. Boundary must be recomputed for arbitrary runtime text edits; integration not implemented. Source/study archive is not an installer. Previous versions preserved. REVIEW-03 and SS-ART-001 remain open for reviewer assessment.


## Reference A timing / remaining REVIEW-02

# SS-ART-001 — reference timing evidence (no new native variant)

HEAD base ec6f54cfbd329706c1fe3c6f17211735e6ad9379. ACK6146172032. Fresh PR after REPORT-05 contained no newerreview; manager chat idle. Remaining REVIEW-02 timing question examined read-only. No user footage/frames/video added here: frames remain local dist. No Adobe export/import/edit, runtime or cue update.

A source interval89analysisframes from2.9s at30fps. Hold samplelocal48, bodyROI110/1438/830/1585; near-white mask eroded7px,33269letter-core pixels. Firstword core10540pixels; wordgap15px in manually constrained boundary351..366. Earliest3consecutive frames with95% and98% observedwhitecore coverage agree: firstwordanalysis109 (3.6333s, local22/.7333s); body121 (4.0333s, local34/1.1333s). Native Pass5 interior wordpause beginslocal25, readinghold36; those are stable-window samples and not identical detectors, so do not claim exact onset error from their difference.

Heuristic data from baked moving footage, not keyframe/alpha reconstruction. Threshold/ROI, possible whitephoto contamination, ±1analysisframe sampling remain limitations; identical95/98% results provide threshold sensitivity evidence only. Full rawnumeric rows included, no sourceframes published. Does not independently accept native variants or prove artistic equivalence. REPORT-05 spacing/native proofs remain unchanged; B/C unchanged. Six/103 preservation checks not repeated because no Adobe mutation this stage. REVIEW-03 and SS-ART-001 open, awaiting reviewerresponse.


## REVIEW-04 / common readability detector and typography study

# SS-ART-001 / REVIEW-04 — comparison before next artistic pass

ACK6146285027. Collision closure REVIEW-03 received from reviewer; full task still open. Same white-core/readability algorithm applied to89baked reference frames and89unchanged actual Pass5Premiere exports, each source own hold mask. Erosion7/minRGB235/3consecutive/95% and98%: reference firstword22/body34, Pass5 firstword24/body35. Differences2/1frames≈67/33ms, within stated threshold/ROI/±1frame analysis uncertainties. RGB stability separately: movingreference has no three identical crops even when readable; empty native crop is stable at0 but not readable, readable stable nativebody begins36. Do not equate stability and legibility.

Largest known mismatch is typography: Pass5body119vs143px height(−16.8%), wordgap33vs15px under this common ROI. Gap previously35 came from a different bodyROI; do not hide sensitivity. No reference frames/media uploaded, only numerical rows and methods. Existing Pass5 unchanged, no export/import repeated.

After comparison selected bounded next-direction study: spacing versus height. Three own duplicates, tracking−24/−36/−48, same BebasNeueCyrillic Regular/no substitute, fourlayers/uniform scale. Firstwordboundary remeasured once and reserve cleared. Two actual AE RGBA snapshots each(firstword25,hold1.6), not full motion or Premiere. Visible heights126/130/134, width726, wordgaps29/26/23. Connected groups4/3/3 are diagnostic, not universal acceptance metric. Six snapshot alpha/shadow renders within safe polygon; no full path check for these new variants. −48 is a proposed next candidate for full motion/native QA, not accepted/default/runtime. No return−84, no one-axis stretch, no font change.

Live document exactly equal to preserved snapshot. No Premiere mutation in this stage, source montage/runtime063/wordtimes/roles protected; old comp not changed, own duplicates saved as separate studyAEP. Userunsaved activeproject preserved in newcopy, no historicalrestore. All priorversions retained. Leading Cera/artistic B/C/movingnative background remain open. Need review of these snapshot candidates then targeted full89path and short/long native checks plus Premiere before integration. No merge/release/migration.
