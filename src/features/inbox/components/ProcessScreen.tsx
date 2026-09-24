import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode2,
  FileText,
  Globe,
  HelpCircle,
  Newspaper,
  Star,
  Trash2,
  Video
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { formatRelativeDate } from '../../../lib/utils';
import { Item, ItemStatus, ItemType } from '../../../types/item';
import { itemsRepository } from '../../items/api/localStorageRepository';
import { Button } from '../../../components/ui/Button';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { ProcessCompletion, ProcessSessionStats } from './ProcessCompletion';

interface ProcessScreenProps {
  initialItems: Item[];
}

export function ProcessScreen({ initialItems }: ProcessScreenProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [items, setItems] = useState<Item[]>(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const [stats, setStats] = useState<ProcessSessionStats>({
    totalReviewed: 0,
    completedCount: 0,
    laterCount: 0,
    favoriteCount: 0,
    deletedCount: 0,
  });

  const total = items.length;
  const currentItem = items[currentIndex] as Item | undefined;

  // If no items initially, show clear message
  useEffect(() => {
    if (initialItems.length === 0) {
      setIsCompleted(true);
    }
  }, [initialItems]);

  const advanceNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, items.length]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleMarkRead = useCallback(async () => {
    if (!currentItem || isActionPending) return;
    setIsActionPending(true);
    try {
      await itemsRepository.updateItem(currentItem.id, {
        status: 'completed',
        readAt: new Date().toISOString(),
      });
      setStats((prev) => ({
        ...prev,
        totalReviewed: prev.totalReviewed + 1,
        completedCount: prev.completedCount + 1,
      }));
      advanceNext();
    } catch (err) {
      console.error('Failed to mark read', err);
    } finally {
      setIsActionPending(false);
    }
  }, [currentItem, isActionPending, advanceNext]);

  const handleLater = useCallback(() => {
    if (!currentItem || isActionPending) return;
    setStats((prev) => ({
      ...prev,
      totalReviewed: prev.totalReviewed + 1,
      laterCount: prev.laterCount + 1,
    }));
    advanceNext();
  }, [currentItem, isActionPending, advanceNext]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentItem || isActionPending) return;
    setIsActionPending(true);
    const nextVal = !currentItem.isFavorite;
    try {
      const updated = await itemsRepository.updateItem(currentItem.id, {
        isFavorite: nextVal,
      });
      setItems((prev) =>
        prev.map((it) => (it.id === updated.id ? { ...it, isFavorite: nextVal } : it))
      );
      if (nextVal) {
        setStats((prev) => ({ ...prev, favoriteCount: prev.favoriteCount + 1 }));
      }
      showToast({
        message: nextVal ? 'Добавлено в избранное' : 'Удалено из избранного',
      });
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    } finally {
      setIsActionPending(false);
    }
  }, [currentItem, isActionPending, showToast]);

  const handleMoveToReading = useCallback(async () => {
    if (!currentItem || isActionPending) return;
    setIsActionPending(true);
    try {
      await itemsRepository.updateItem(currentItem.id, {
        status: 'reading',
      });
      showToast({ message: 'Перемещено в список «Читаю»' });
      setStats((prev) => ({
        ...prev,
        totalReviewed: prev.totalReviewed + 1,
      }));
      advanceNext();
    } catch (err) {
      console.error('Failed to move to reading', err);
    } finally {
      setIsActionPending(false);
    }
  }, [currentItem, isActionPending, showToast, advanceNext]);

  const handleDelete = useCallback(async () => {
    if (!currentItem || isActionPending) return;
    setIsActionPending(true);
    const targetItem = currentItem;
    try {
      const deleted = await itemsRepository.deleteItem(targetItem.id);
      setStats((prev) => ({
        ...prev,
        totalReviewed: prev.totalReviewed + 1,
        deletedCount: prev.deletedCount + 1,
      }));

      // Remove from active queue
      const nextItems = items.filter((it) => it.id !== targetItem.id);
      setItems(nextItems);

      showToast({
        message: 'Материал удалён',
        actionLabel: 'Отменить',
        onAction: async () => {
          await itemsRepository.restoreItem(deleted);
          setItems((prev) => [deleted, ...prev]);
        },
      });

      if (currentIndex >= nextItems.length) {
        if (nextItems.length === 0) {
          setIsCompleted(true);
        } else {
          setCurrentIndex(nextItems.length - 1);
        }
      }
    } catch (err) {
      console.error('Failed to delete item', err);
    } finally {
      setIsActionPending(false);
    }
  }, [currentItem, isActionPending, items, currentIndex, showToast]);

  const handleOpenOriginal = useCallback(() => {
    if (!currentItem?.url) return;
    const a = document.createElement('a');
    a.href = currentItem.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }, [currentItem]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when shortcuts dialog or input is focused
      if (showShortcuts) {
        if (e.key === 'Escape') setShowShortcuts(false);
        return;
      }

      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'j':
        case 'arrowdown':
          e.preventDefault();
          advanceNext();
          break;
        case 'k':
        case 'arrowup':
          e.preventDefault();
          goPrevious();
          break;
        case 'r':
          e.preventDefault();
          handleMarkRead();
          break;
        case 'l':
          e.preventDefault();
          handleLater();
          break;
        case 'f':
          e.preventDefault();
          handleToggleFavorite();
          break;
        case 'd':
          e.preventDefault();
          handleDelete();
          break;
        case 'o':
          e.preventDefault();
          handleOpenOriginal();
          break;
        case 'escape':
          e.preventDefault();
          navigate('/inbox');
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    advanceNext,
    goPrevious,
    handleMarkRead,
    handleLater,
    handleToggleFavorite,
    handleDelete,
    handleOpenOriginal,
    navigate,
    showShortcuts,
  ]);

  if (isCompleted || !currentItem) {
    return (
      <ProcessCompletion
        stats={stats}
        onBackToLibrary={() => navigate('/inbox')}
      />
    );
  }

  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 100;

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
        return <FileCode2 className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'documentation':
        return <BookOpen className="w-4 h-4" />;
      case 'news':
        return <Newspaper className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          onClick={() => navigate('/inbox')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Выйти в Inbox</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            {currentIndex + 1} / {total}
          </span>
          <button
            onClick={() => setShowShortcuts(true)}
            aria-label="Горячие клавиши"
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1"
            title="Нажмите ? для просмотра горячих клавиш"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden mb-8">
        <div
          className="bg-neutral-900 dark:bg-neutral-100 h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Single Item High-Focus Surface */}
      <div className="bg-white dark:bg-neutral-900/80 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Source metadata */}
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
              {currentItem.faviconUrl ? (
                <img
                  src={currentItem.faviconUrl}
                  alt=""
                  className="w-4 h-4 rounded-xs"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-4 h-4 text-neutral-400" />
              )}
              {currentItem.siteName || 'Сайт'}
            </span>

            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>

            <span className="flex items-center gap-1">
              {getTypeIcon(currentItem.type)}
              <span>{getTypeLabel(currentItem.type)}</span>
            </span>

            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>

            <span className="font-mono text-[11px] tabular-nums">
              {formatRelativeDate(currentItem.createdAt)}
            </span>
          </div>

          <button
            onClick={handleToggleFavorite}
            aria-label="В избранное"
            className={`p-1.5 rounded-lg transition-colors ${
              currentItem.isFavorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
            }`}
          >
            <Star className={`w-5 h-5 ${currentItem.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
            {currentItem.title}
          </h1>
          <a
            href={currentItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline max-w-full truncate font-mono"
          >
            <span className="truncate">{currentItem.url}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>

        {/* Description */}
        {currentItem.description && (
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {currentItem.description}
          </p>
        )}

        {/* Tags */}
        {currentItem.tags && currentItem.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
            {currentItem.tags.map((tag) => (
              <span
                key={tag.id || tag.name}
                className="font-mono text-neutral-600 dark:text-neutral-400"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Personal Notes */}
        {currentItem.notes && (
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
            <span className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1">
              Личная заметка:
            </span>
            <p className="whitespace-pre-line leading-relaxed">{currentItem.notes}</p>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Button
              variant="danger"
              size="lg"
              onClick={handleDelete}
              className="w-full flex-col sm:flex-row py-3 sm:py-2.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono opacity-60 ml-1">
                (D)
              </kbd>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={handleLater}
              className="w-full flex-col sm:flex-row py-3 sm:py-2.5"
            >
              <Clock className="w-4 h-4" />
              <span>Позже</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono opacity-60 ml-1">
                (L)
              </kbd>
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={handleMarkRead}
              className="w-full flex-col sm:flex-row py-3 sm:py-2.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Прочитано</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono opacity-60 ml-1">
                (R)
              </kbd>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleMoveToReading}
              className="w-full flex-col sm:flex-row py-3 sm:py-2.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Читаю</span>
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={goPrevious}
                disabled={currentIndex === 0}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ← Назад (K)
              </button>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <button
                onClick={advanceNext}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Далее (J) →
              </button>
            </div>

            <a
              href={currentItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:underline font-medium"
            >
              <span>Открыть оригинал</span>
              <kbd className="text-[10px] font-mono text-neutral-400">(O)</kbd>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Shortcuts modal */}
      <KeyboardShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
