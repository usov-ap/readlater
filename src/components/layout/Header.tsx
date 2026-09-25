import { Menu, Plus, Search } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAddModal: () => void;
  onToggleMobileMenu?: () => void;
  title?: string;
  count?: number;
}

export function Header({
  onOpenSearch,
  onOpenAddModal,
  onToggleMobileMenu,
  title = 'Inbox',
  count,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#fcfbf9]/90 dark:bg-[#121417]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      {/* Zone 1: Brand / Context Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Открыть меню навигации"
          className="md:hidden p-1.5 -ml-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-baseline gap-2 truncate">
          <h1 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
            {title}
          </h1>
          {count !== undefined && (
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
              · {count}
            </span>
          )}
        </div>
      </div>

      {/* Zone 2: Fast Quick Search Bar */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 text-xs text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-left shadow-2xs"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Поиск по библиотеке...</span>
          </span>
          <kbd className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          aria-label="Поиск"
          className="sm:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <Search className="w-4 h-4" />
        </button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenAddModal}
          className="text-xs px-3 py-1.5"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Добавить</span>
        </Button>
      </div>
    </header>
  );
}
