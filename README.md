# ReadLater

> **Save first. Process later.** (Сначала сохрани. Разбери потом.)

**ReadLater** — быстрое, минималистичное и ориентированное на клавиатурное управление веб-приложение для сохранения и разбора материалов из интернета (статей, видео, GitHub-репозиториев, документации и постов). Вместо сотен забытых закладок в браузере, ReadLater предлагает строгий рабочий процесс (triage workflow) для последовательного превращения входящих ссылок в структурированную личную библиотеку.

---

## Архитектура проекта

Проект спроектирован по модульному принципу с разделением ответственности и изоляцией уровня данных от представления:

```text
public/
└── favicon.ico           # Иконка сайта

src/
├── App.tsx               # Корневой компонент
├── app/                  # Инициализация приложения, роутер и глобальные провайдеры
│   ├── router.tsx        # Маршрутизация на базе React Router
│   └── providers.tsx     # ErrorBoundary, ThemeProvider, ToastProvider
├── components/           # Переиспользуемые UI-компоненты и лейауты
│   ├── auth/             # AuthGate, LoginScreen (простой экран ввода пароля)
│   ├── common/           # ErrorBoundary, EmptyState
│   ├── layout/           # AppLayout, Sidebar, Header, MobileNav
│   └── ui/               # Button, Input, Modal, Skeleton
├── context/              # Глобальные контексты приложения
│   ├── AuthContext.tsx   # Проверка пароля и состояние входа (APP_PASSWORD)
│   ├── ThemeContext.tsx  # Переключение и синхронизация тем (Светлая / Тёмная / Системная)
│   └── ToastContext.tsx  # Всплывающие уведомления с поддержкой Undo (отмены действий)
├── features/             # Предметные модули (Feature-driven slices)
│   ├── inbox/            # Механизм быстрого разбора Inbox и горячие клавиши
│   │   └── components/   # ProcessScreen, ProcessCompletion, KeyboardShortcutsDialog
│   ├── items/            # Управление материалами, карточки, списки, метаданные и хранение
│   │   ├── api/          # ItemsRepository, LocalStorageItemsRepository, HttpItemsRepository, MetadataService
│   │   ├── components/   # ItemCard, ItemList, AddLinkModal, DuplicateWarningDialog
│   │   ├── hooks/        # useItems, useItem
│   │   └── seedData.ts   # Начальный набор демонстрационных материалов
│   └── search/           # Командная строка глобального поиска (⌘K / Ctrl+K)
├── lib/                  # Чистые утилиты и хелперы
│   ├── auth.ts           # Хранение пароля и заголовки Authorization
│   ├── url.ts            # Валидация протоколов, нормализация URL, автоопределение типов
│   └── utils.ts          # Форматирование дат и генерация ID
├── pages/                # Страницы разделов приложения
│   ├── InboxPage.tsx     # Входящие материалы, требующие разбора
│   ├── ProcessingPage.tsx# Экран пошаговой обработки Inbox
│   ├── ReadingPage.tsx   # Материалы в процессе чтения («Читаю»)
│   ├── CompletedPage.tsx # Прочитанные материалы («Прочитано»)
│   ├── FavoritesPage.tsx # Избранное («Избранное»)
│   ├── ArchivePage.tsx   # Архив («Архив»)
│   ├── TagFilterPage.tsx # Фильтрация по конкретному тегу
│   └── ItemDetailsPage.tsx # Страница деталей, заметок и редактирования
└── types/                # Строгая типизация TypeScript (Item, ItemType, ItemStatus, Tag)
    └── item.ts
```

---

## Абстракция API и слоя репозитория (Repository Pattern)

Интерфейс пользователя полностью изолирован от деталей сохранения данных. Все операции выполняются исключительно через контракт интерфейса `ItemsRepository`:

```typescript
export interface ItemsRepository {
  getItems(filter?: ItemFilter): Promise<Item[]>;
  getItem(id: string): Promise<Item | null>;
  createItem(input: CreateItemInput): Promise<Item>;
  updateItem(id: string, input: UpdateItemInput): Promise<Item>;
  deleteItem(id: string): Promise<Item>;
  restoreItem(item: Item): Promise<void>;
  findByUrl(url: string): Promise<Item | null>;
  getTags(): Promise<TagWithCount[]>;
  getStatusCounts(): Promise<{
    inbox: number;
    reading: number;
    completed: number;
    favorites: number;
    archived: number;
    all: number;
  }>;
  resetToDefaults(): Promise<void>;
  subscribe(callback: () => void): () => void;
}
```

* **LocalStorage-режим**: `LocalStorageItemsRepository` (ключ `readlater_items_v3`) — используется при запуске без переменной `VITE_API_BASE_URL` (standalone/offline). Поддерживает валидацию и санитаризацию данных при загрузке, отказоустойчивость при переполнении квоты, а также реактивную синхронизацию между вкладками браузера через событие `storage` и внутреннюю подписку (`subscribe`).
* **Серверный режим**: `HttpItemsRepository` — используется автоматически, когда задана `VITE_API_BASE_URL` (в Docker Compose это `/api`). Обращается к REST API на Go + PostgreSQL (`/api/items`, `/api/items/:id`, `/api/items/by-url`, `/api/items/restore`, `/api/items/reset`, `/api/tags`, `/api/counts`). Интерфейс `ItemsRepository` полностью изолирует UI от источника данных, поэтому переключение режимов не требует изменений в компонентах.

---

## Ключевые возможности

### 1. Быстрое сохранение ссылок (Add Link)
* **Строгая валидация URL**: Разрешены только протоколы `http://` и `https://`, предотвращаются уязвимости (XSS через `javascript:` или `data:`). Проверка выполняется и в UI, и на сервере (Go API), поэтому некорректный URL нельзя сохранить в обход клиента.
* **Очистка от трекинга**: Автоматическое вырезание маркетинговых параметров (`utm_*`, `fbclid`, `gclid`, `yclid`, `ref` и др.).
* **Проверка дубликатов**: Мгновенный поиск совпадений по нормализованному URL с возможностью перейти к существующей карточке или сохранить повторно.
* **Автоматическое извлечение метаданных**: Определение названия, описания, домена, фавиконки и типа контента (статья, видео, документация, репозиторий GitHub, новость, пост). Процесс не блокирует сохранение даже при сетевых сбоях.

### 2. Режим разбора очереди (Inbox Processing Mode) — `/process`
* Фокусированный просмотр материалов по одному без отвлекающих элементов.
* **Горячие клавиши для скоростного разбора**:
  * `J` / `↓` — Следующий материал
  * `K` / `↑` — Предыдущий материал
  * `R` — Отметить как прочитанное (`Completed`)
  * `L` — Оставить на потом (`Later` / отложить)
  * `F` — Добавить / удалить из «Избранного»
  * `D` — Удалить с возможностью отмены (`Undo`)
  * `O` — Открыть оригинальную ссылку в новой вкладке
  * `Esc` — Выйти в Inbox
  * `?` — Показать / скрыть панель горячих клавиш
* Защита от дребезга и повторных нажатий (`isActionPending`).
* Крупные сенсорные области для комфортной работы на смартфонах и планшетах ($\ge 44 \times 44$px).
* Итоговый экран разбора с наглядной статистикой сессии.

### 3. Основной жизненный цикл материала
```text
Сохранение ссылки
      ↓
    Inbox
      ↓
Разбор Inbox
      ↓
[ Читаю ]   [ Прочитано ]   [ Избранное ]   [ Удалить ]
      ↓           ↓
    Архив   История чтения
```
* Флаг «Избранное» независим от статуса (можно добавить в избранное как материал в очереди, так и уже прочитанный).

### 4. Организация и заметки
* **Дисциплина Zero-Pill**: Теги отображаются аккуратным моноширинным текстом с `#` без массивных визуальных плашек.
* **Личные заметки**: Полноценное поле для конспектов и тезисов с автоматическим сохранением по потере фокуса (`blur`).
* **Безопасное отображение**: Заметки выводятся как чистый текст (`whitespace-pre-line`), исключая возможность инъекций кода.

### 5. Глобальный поиск (`⌘K` / `Ctrl+K`)
* Полнотекстовый поиск по заголовкам, URL, доменам, кратким описаниям, тегам и личным заметкам.
* Мгновенный переход к карточке по клику; закрытие по `Esc`. Шорткат `⌘K` / `Ctrl+K` переключает палитру глобально (`AppLayout`).

### 6. Дизайн и доступность
* Гарнитура `Plus Jakarta Sans` в паре с `JetBrains Mono` для табличных цифр и метаданных.
* Тёмная, светлая и системная темы оформления.
* Доступность: атрибуты `role="dialog"`, `aria-modal="true"`, русскоязычные `aria-label`, перехват клавиши `Escape`.
* Отказоустойчивость: глобальный `ErrorBoundary` перехватывает ошибки рендеринга и предлагает перезагрузку или возврат в библиотеку.

---

## Защита паролем (опционально)

Самая простая защита входа: один общий пароль, без пользователей, регистрации и сессий.

Включение — задайте пароль в `.env` и перезапустите бэкенд:

```bash
# .env
APP_PASSWORD=ваш-пароль

docker compose up -d backend
```

Как это работает:

* При открытии сайта показывается экран ввода пароля.
* Пароль хранится в `localStorage` браузера и отправляется к API в заголовке
  `Authorization: Bearer <пароль>`.
* Защищены все маршруты `/api/*`, кроме `/api/auth/status`. Проверка `/health`
  и `/api/health` тоже остаётся публичной — она нужна для healthcheck и мониторинга.
* Кнопка «Выйти» в футере сайдбара удаляет сохранённый пароль.
* Если `APP_PASSWORD` пуст — защита выключена (поведение по умолчанию).

Важно: пароль передаётся в заголовке, поэтому открывайте сайт только по HTTPS.
Это лёгкая защита «от посторонних глаз», а не полноценная аутентификация:
пользователей нет, сессии не сохраняются, ограничения на число попыток входа нет.

---

## Локальная разработка

### Только фронтенд (LocalStorage, без бэкенда)

```bash
npm install
npm run dev          # http://localhost:3000
```

Если переменная `VITE_API_BASE_URL` не задана, приложение автоматически использует
`LocalStorageItemsRepository` и работает полностью в браузере (данные хранятся в
`localStorage` под ключом `readlater_items_v3`).

### Полный стек (Go + PostgreSQL + фронтенд)

```bash
# 1. Бэкенд (нужен доступный PostgreSQL)
cd backend
DATABASE_URL='postgres://readlater:secret@127.0.0.1:5432/readlater?sslmode=disable' \
  PORT=8080 go run .

# 2. Фронтенд: VITE_API_BASE_URL=/api включает HttpItemsRepository,
#    а Vite проксирует /api на бэкенд (см. vite.config.ts).
VITE_API_BASE_URL=/api npm run dev
```

Цель прокси по умолчанию — `http://127.0.0.1:8080`, её можно переопределить
переменной `VITE_API_PROXY_TARGET`.

### Полезные команды

```bash
npm run lint     # tsc --noEmit
npm run build    # production-сборка в dist/
```

---

## REST API (Go)

Бэкенд слушает `/api` (по умолчанию порт `8080`) и отдаёт JSON. Health-check
доступен как по `/health`, так и по `/api/health`.

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/api/auth/status` | Требуется ли пароль и принят ли текущий токен (публичный) |
| `GET` | `/api/items` | Список материалов. Query: `status`, `isFavorite`, `type`, `tag`, `search`, `sort` (`newest` / `oldest` / `recently_updated` / `recently_read`) |
| `POST` | `/api/items` | Создать материал (URL обязателен; допускаются только `http://` и `https://`) |
| `GET` | `/api/items/by-url?url=...` | Найти материал по нормализованному URL (проверка дубликатов) |
| `POST` | `/api/items/restore` | Восстановить удалённый материал (Undo) |
| `POST` | `/api/items/reset` | Сбросить библиотеку и заново создать стартовый материал |
| `GET` | `/api/items/:id` | Получить материал по ID |
| `PUT` / `PATCH` | `/api/items/:id` | Частично обновить материал |
| `DELETE` | `/api/items/:id` | Удалить материал (возвращает удалённую запись для Undo) |
| `GET` | `/api/tags` | Теги с количеством (без учёта архивных) |
| `GET` | `/api/counts` | Счётчики по статусам и избранному |

При создании URL нормализуется: удаляются трекинг-параметры (`utm_*`, `fbclid`,
`gclid`, `yclid`, `ref`, `source`, `mc_*` и др.), хвостовой слэш и фрагмент, а хост
приводится к нижнему регистру. Схема БД создаётся автоматически при старте.

---

## Развёртывание через Docker Compose (Self-Hosted)

Архитектура развёртывания:

```text
External Reverse Proxy (Nginx / Caddy / Traefik на хосте)
        │ HTTPS
        ▼
   Docker Host
   ├── frontend   (BIND_ADDR:3000 -> React/Vite SPA через Nginx + прокси /api/)
   ├── backend    (127.0.0.1:8080 -> Go API, доступен и через /api/ фронтенда)
   └── postgres   (изолированная внутренняя сеть, порт наружу НЕ пробрасывается)
```

### Быстрый старт

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/usov-ap/readlater.git
cd readlater

# 2. Скопируйте файл конфигурации, задайте надёжный пароль БД
#    и (при желании) пароль для входа в APP_PASSWORD
cp .env.example .env
nano .env

# 3. Соберите и запустите контейнеры
docker compose up -d
```

### Управление контейнерами

```bash
# Проверка статуса контейнеров и healthcheck
docker compose ps

# Просмотр логов в реальном времени
docker compose logs -f

# Перезапуск сервисов
docker compose restart

# Остановка с сохранением данных
docker compose down

# Пересборка после обновлений
docker compose build --no-cache
docker compose up -d
```

---

## Сетевые порты и доступ

По умолчанию фронтенд публикуется только на `127.0.0.1` — это безопасный вариант,
когда перед приложением стоит внешний reverse proxy. За это отвечает переменная
`BIND_ADDR` в `.env`:

| `BIND_ADDR` | Что получается |
|---|---|
| `127.0.0.1` (по умолчанию) | Доступ только с самого хоста — для внешнего reverse proxy |
| `0.0.0.0` | Доступ из локальной сети напрямую по `http://<ip-хоста>:3000` (обязательно задайте `APP_PASSWORD`) |

Nginx фронтенда сам проксирует `/api/` во внутренний backend, поэтому приложение
работает на одном порту и без внешнего reverse proxy. Бэкенд при этом остаётся
опубликованным только на `127.0.0.1` (для healthcheck/администрирования).

```bash
# Открыть доступ из локальной сети
echo 'BIND_ADDR=0.0.0.0' >> .env
docker compose up -d
```

| Сервис | Внутренний порт | Публикация на хосте | Назначение |
|---|---|---|---|
| **frontend** | `80` | `${BIND_ADDR}:${FRONTEND_PORT:-3000}` | Статика SPA + проксирование `/api/` в backend |
| **backend** | `8080` | `127.0.0.1:${BACKEND_PORT:-8080}` | REST API (Go + PostgreSQL); также доступен через `/api/` фронтенда |
| **postgres** | `5432` | *Не публикуется* | Доступен только внутри Docker-сети `readlater-network` |

Если порт открыт наружу, не забудьте про firewall хоста (например, `ufw allow 3000/tcp`)
и обязательно задайте `APP_PASSWORD` из раздела «Защита паролем».

### Пример конфигурации внешнего Nginx на хосте:

```nginx
server {
    listen 80;
    server_name readlater.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name readlater.example.com;

    # SSL сертификаты (Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/readlater.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/readlater.example.com/privkey.pem;

    # Всё (SPA + /api/) идёт через фронтенд-контейнер
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # (Необязательно) Прямой маршрут к API в обход фронтенда.
    # Этот блок можно удалить — тогда /api/ уйдёт через location / выше.
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Проверка здоровья бэкенда для мониторинга.
    # Необязательно: если этот блок не добавлять, /health попадёт в location /
    # выше и nginx фронтенда отдаст index.html с кодом 200 (SPA-fallback),
    # поэтому для мониторинга маршрут нужен только если вы его опрашиваете.
    location = /health {
        proxy_pass http://127.0.0.1:8080/health;
    }
}
```

---

## Резервное копирование и восстановление (Backup & Restore)

Данные хранятся в постоянном томе Docker `readlater_postgres_data` и сохраняются при любых перезапусках `docker compose down`.

### Создание резервной копии:
```bash
# Дамп базы данных в сжатый файл с датой
docker compose exec -T postgres pg_dump -U readlater readlater | gzip > readlater_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Восстановление из резервной копии:
```bash
# 1. Распаковка и восстановление в базу данных
gunzip -c readlater_backup_20260924.sql.gz | docker compose exec -T postgres psql -U readlater -d readlater
```

---

## Обновление приложения

```bash
# 1. Получите свежий код
git pull origin main

# 2. Пересоберите контейнеры
docker compose build

# 3. Перезапустите приложение без простоя данных
docker compose up -d
```

---

## Восстановление после сбоев

1. **База данных не отвечает**:
   Проверьте статус healthcheck:
   ```bash
   docker compose ps
   docker compose logs postgres
   ```
2. **Бэкенд не запускается**:
   Убедитесь, что логин и пароль в `.env` совпадают с `POSTGRES_USER` и `POSTGRES_PASSWORD`:
   ```bash
   docker compose logs backend
   ```
3. **Очистка и чистый перезапуск (в крайнем случае)**:
   ```bash
   docker compose restart backend frontend
   ```

---

## Поддерживаемые типы материалов

| Тип | Обозначение | Примеры автоопределения |
|---|---|---|
| **Статья** | Статья | Обычные веб-страницы, блоги, Medium, Substack |
| **Документация** | Документация | docs.*, go.dev/doc, MDN Web Docs, devdocs.io |
| **GitHub** | GitHub | github.com, gist.github.com, gitlab.com |
| **Видео** | Видео | youtube.com, youtu.be, vimeo.com, loom.com |
| **Новость** | Новость | Hacker News, BBC, The Verge, Reuters, Wired |
| **Пост** | Пост | X / Twitter, Threads, Bluesky, Reddit |
| **Другое** | Другое | Прочие интернет-ресурсы |

---

## План развития (Roadmap)

- [ ] Браузерное расширение (сохранение в ReadLater в 1 клик).
- [ ] Интеграция с системным диалогом «Поделиться» на смартфонах (Web Share Target API в PWA).
- [ ] Режим чтения (Reader View) с извлечением чистого текста для чтения оффлайн.
- [ ] Откладывание на заданный срок (Snooze: «Напомнить завтра», «Напомнить через неделю»).
- [ ] Импорт закладок из Chrome, Pocket и Raindrop (форматы HTML / CSV).
- [x] Бэкенд на Go + PostgreSQL (`backend/`) с переключением фронтенда через `VITE_API_BASE_URL`.
- [ ] Аутентификация и синхронизация между устройствами/пользователями.
