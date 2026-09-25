import {
  Archive,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  FileText,
  Globe,
  MoreVertical,
  Newspaper,
  Star,
  Trash2,
  Video
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeDate } from '../../../lib/utils';
import { Item, ItemStatus, ItemType } from '../../../types/item';

interface ItemCardProps {
  item: Item;
  onStatusChange: (id: string, status: ItemStatus) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onSelectTag?: (tagName: string) => void;
}

export function ItemCard({
  item,
  onStatusChange,
  onToggleFavorite,
  onDelete,
  onSelectTag,
}: ItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

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

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'github':
        return <FileCode2 className="w-3.5 h-3.5 text-neutral-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-neutral-500" />;
      case 'documentation':
        return <BookOpen className="w-3.5 h-3.5 text-neutral-500" />;
      case 'news':
        return <Newspaper className="w-3.5 h-3.5 text-neutral-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  return (
    <div className="group relative rounded-xl border border-neutral-200/90 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/70 p-4 transition-all duration-150 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs">
      <div className="flex items-start justify-between gap-3">
        {/* Source metadata header */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {item.faviconUrl ? (
              <img
                src={item.faviconUrl}
                alt=""
                className="w-3.5 h-3.5 rounded-xs shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
            )}
            <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[140px] sm:max-w-[200px]">
              {item.siteName || 'Сайт'}
            </span>
          </div>

          <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>

          <div className="flex items-center gap-1 shrink-0">
            {getTypeIcon(item.type)}
            <span>{getTypeLabel(item.type)}</span>
          </div>

          <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>

          <span className="shrink-0 font-mono text-[11px] tabular-nums">
            {item.status === 'completed' && item.readAt
              ? `Прочитано ${formatRelativeDate(item.readAt)}`
              : formatRelativeDate(item.createdAt)}
          </span>
        </div>

        {/* Quick actions: favorite & external link */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFavorite(item.id, item.isFavorite)}
            aria-label={item.isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            className={`p-1.5 rounded-md transition-colors ${
              item.isFavorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
            }`}
          >
            <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Открыть оригинальную ссылку"
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Title & Link */}
      <div className="mt-2.5">
        <Link
          to={`/item/${item.id}`}
          className="group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors block"
        >
          <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 leading-snug tracking-tight">
            {item.title}
          </h3>
        </Link>

        {item.description && (
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* Tags (Zero-Pill: Clean unboxed text) */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          {item.tags.map((tag) => (
            <button
              key={tag.id || tag.name}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTag?.(tag.name);
              }}
              className="font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Notes preview if exists */}
      {item.notes && (
        <div className="mt-3 pt-2.5 border-t border-dashed border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 italic font-sans">
          "{item.notes.slice(0, 100)}{item.notes.length > 100 ? '...' : ''}"
        </div>
      )}

      {/* Footer bar with progressive disclosure actions */}
      <div className="mt-3.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {item.status !== 'completed' ? (
            <button
              onClick={() => onStatusChange(item.id, 'completed')}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 py-1 px-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Прочитано</span>
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(item.id, 'inbox')}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 py-1 px-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <span>В Inbox</span>
            </button>
          )}

          {item.status === 'inbox' && (
            <button
              onClick={() => onStatusChange(item.id, 'reading')}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 py-1 px-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Начать читать</span>
            </button>
          )}
        </div>

        {/* More Actions dropdown menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Дополнительные действия"
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 bottom-full mb-1 z-30 w-48 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <Link
                  to={`/item/${item.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Детали и заметки</span>
                </Link>

                {item.status !== 'archived' && (
                  <button
                    onClick={() => {
                      onStatusChange(item.id, 'archived');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 text-left"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>В архив</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onDelete(item.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
