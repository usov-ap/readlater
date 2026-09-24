# ReadLater

> **Save first. Process later.**

ReadLater is a fast, keyboard-first, distraction-free personal Inbox for articles, videos, GitHub repositories, and developer documentation found across the web. Instead of accumulating 150 dead browser bookmarks, ReadLater provides an actionable triage workflow to process links into a clean, curated personal library.

---

## Architecture Overview

ReadLater is built with a modular, clean frontend architecture adhering to strict software engineering standards:

```text
src/
├── app/                  # Application bootstrap, routing & global providers
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
├── components/           # Accessible UI primitives & layout shells
│   ├── common/           # Domain empty states, helpers
│   ├── layout/           # Responsive AppLayout, Sidebar, Header, MobileNav
│   └── ui/               # Button, Input, Modal, Skeleton, Toast
├── context/              # Global React Contexts
│   ├── ThemeContext.tsx  # Light, Dark, System theme synchronization
│   └── ToastContext.tsx  # Unobtrusive notifications with Undo action
├── features/             # Feature-driven slices
│   ├── inbox/            # Rapid Inbox Processing engine & keyboard shortcuts
│   │   ├── components/   # ProcessScreen, ProcessCompletion, ShortcutsDialog
│   │   └── types.ts
│   ├── items/            # Items domain, card, list, metadata & persistence
│   │   ├── api/          # Repository interface, LocalStorageRepository, Metadata
│   │   ├── components/   # ItemCard, ItemList, AddLinkModal, DuplicateDialog
│   │   ├── hooks/        # useItems, useItem
│   │   └── seedData.ts   # Curated starter materials
│   └── search/           # Global Command Palette (⌘K) & query filtering
├── lib/                  # Pure utility functions
│   ├── url.ts            # URL normalization, validation, automatic type inference
│   └── utils.ts          # Relative date formatting, IDs, typography helpers
├── pages/                # Route page views
│   ├── InboxPage.tsx
│   ├── ProcessingPage.tsx
│   ├── ReadingPage.tsx
│   ├── CompletedPage.tsx
│   ├── FavoritesPage.tsx
│   ├── ArchivePage.tsx
│   ├── TagFilterPage.tsx
│   └── ItemDetailsPage.tsx
└── types/                # Domain entities (Item, ItemType, ItemStatus, Tag)
    └── item.ts
```

---

## Repository & API Abstraction

The UI never couples directly to storage or raw fetch calls. All data operations flow through the `ItemsRepository` interface:

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
  getStatusCounts(): Promise<Record<string, number>>;
  resetToDefaults(): Promise<void>;
  subscribe(callback: () => void): () => void;
}
```

- **Persistence**: Implemented via `LocalStorageItemsRepository` (`readlater_items_v2`), which survives reloads and tabs via broadcast subscriptions.
- **Backend Migration Path**: When replacing with a real Go + PostgreSQL backend, only an `HttpItemsRepository` implementing `ItemsRepository` needs to be provided. Zero UI components require modification.

---

## Key Features

1. **Fast Link Saving**:
   - URL validation (strict `http`/`https` scheme enforcement).
   - Duplicate detection with options to open existing or save anyway.
   - Non-blocking metadata extraction: title, description, domain, favicon, and automatic type inference.
2. **Inbox Processing Mode** (`/process`):
   - Review materials one-by-one in a high-focus view.
   - Instant keyboard shortcuts (`J`/`K` navigate, `R` mark read, `L` later, `F` favorite, `D` delete with Undo, `O` open original, `?` help).
   - Touch-friendly large action buttons on mobile.
   - Summary completion screen displaying reviewed counts.
3. **Core UX Workflow**:
   - `Save` → `Inbox` → `Process` → `Reading` / `Completed` / `Later` / `Archived`.
   - Independent `isFavorite` flag.
4. **Lightweight Organization**:
   - Plain `#tags` (inline unboxed text, no heavy pill sandwiches).
   - Personal notes with automatic saving on blur.
5. **Global Search**:
   - Fast `⌘K` / `Ctrl+K` command palette across title, description, URL, source, tags, and personal notes.
6. **Design System & Aesthetics**:
   - Typography-first, minimal, calm aesthetic following Linear/Raycast design principles.
   - Dark, Light, and System theme support without flashing.
   - Full mobile and desktop responsiveness.

---

## How to Run

```bash
# Install dependencies
npm install

# Run Vite dev server
npm run dev

# Build for production
npm run build

# Run TypeScript type check
npm run lint
```

---

## Roadmap & Next Steps (TODO)

- [ ] Browser extension (`Save to ReadLater` in 1 click)
- [ ] Mobile Share Sheet integration (PWA Web Share Target)
- [ ] Reader mode text extraction for offline reading
- [ ] Snooze timing for `Later` (e.g. "Snooze until tomorrow", "Snooze for 1 week")
- [ ] Import from Chrome bookmarks, Pocket, and Raindrop (HTML/CSV import)
- [ ] Real Go + PostgreSQL REST backend implementation
