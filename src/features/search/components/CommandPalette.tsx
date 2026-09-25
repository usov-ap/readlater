import { ExternalLink, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item, ItemStatus, ItemType } from '../../../types/item';
import { itemsRepository } from '../../items/api/localStorageRepository';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setQuery('');
    setLoading(true);
    itemsRepository
      .getItems()
      .then((res) => {
        if (cancelled) return;
        setItems(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load library for search', err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Close on Escape. Opening/closing on ⌘K / Ctrl+K is handled by AppLayout,
  // which owns the palette's open state.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8); // show recent 8
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q) ||
        item.siteName?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.name.toLowerCase().includes(q))
      );
    });
  }, [items, query]);

  const getStatusLabel = (status: ItemStatus) => {
    switch (status) {
      case 'inbox':
        return 'Inbox';
      case 'reading':
        return 'Читаю';
      case 'completed':
        return 'Прочитано';
      case 'archived':
        return 'Архив';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: ItemType) => {
    switch (type) {
      case 'github':
        return 'GitHub';
      case 'video':
        return 'Видео';
      case 'documentation':
        return 'Документация';
      case 'news':
        return 'Новость';
      case 'post':
        return 'Пост';
      case 'article':
        return 'Статья';
      default:
        return 'Другое';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, описанию, ссылке, тегам или заметкам..."
            className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {loading ? (
            <div className="p-8 text-center text-xs text-neutral-400">Загрузка библиотеки...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Ничего не найдено
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                По запросу «{query}» совпадений не обнаружено.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  navigate(`/item/${item.id}`);
                  onClose();
                }}
                className="p-3 rounded-lg hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {item.siteName || 'Сайт'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{getTypeLabel(item.type)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-700 dark:text-amber-400">
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 truncate">
                    {item.title}
                  </h4>

                  {item.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}

                  {item.tags.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      {item.tags.map((t) => (
                        <span key={t.name}>#{t.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0"
                  aria-label="Открыть в новой вкладке"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Найдено: {filteredItems.length}</span>
          <span className="hidden sm:inline">Нажмите Esc для закрытия</span>
        </div>
      </div>
    </div>
  );
}
