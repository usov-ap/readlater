import {
  Archive,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  FileText,
  Globe,
  Newspaper,
  Plus,
  Star,
  Trash2,
  Video,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { useItem } from '../features/items/hooks/useItem';
import { itemsRepository } from '../features/items/api/localStorageRepository';
import { formatFullDate, formatRelativeDate } from '../lib/utils';
import { ItemStatus, ItemType, TagWithCount } from '../types/item';

export function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { item, loading, update, toggleFavorite, setStatus, deleteItem } = useItem(id);

  const [notes, setNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<TagWithCount[]>([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (item) {
      setNotes(item.notes || '');
    }
    itemsRepository.getTags().then(setAvailableTags);
  }, [item]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    setIsSavingNotes(true);
  };

  const handleNotesBlur = async () => {
    if (!item) return;
    try {
      await update({ notes: notes.trim() });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddTag = async (rawTag: string) => {
    if (!item) return;
    const clean = rawTag.replace(/^#/, '').trim().toLowerCase();
    if (!clean) return;
    if (item.tags.some((t) => t.name.toLowerCase() === clean)) {
      setNewTag('');
      return;
    }

    const updatedTags = [...item.tags, { id: `tag-${clean}`, name: clean }];
    await update({ tags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = async (tagName: string) => {
    if (!item) return;
    const updatedTags = item.tags.filter((t) => t.name !== tagName);
    await update({ tags: updatedTags });
  };

  const handleDelete = async () => {
    await deleteItem();
    navigate('/inbox');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-16 text-center text-xs text-neutral-400 font-mono">
          Загрузка информации о материале...
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="py-16 text-center max-w-sm mx-auto">
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Материал не найден
          </p>
          <p className="text-xs text-neutral-500 mt-1 mb-6">
            Возможно, ссылка была удалена или перемещена.
          </p>
          <Button variant="primary" onClick={() => navigate('/inbox')}>
            Вернуться в Inbox
          </Button>
        </div>
      </AppLayout>
    );
  }

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
    <AppLayout headerTitle="Детали материала">
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              aria-label={item.isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              className={`p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors ${
                item.isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleDelete}
              aria-label="Удалить материал"
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Box */}
        <div className="bg-white dark:bg-neutral-900/80 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xs">
          {/* Metadata top bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
              {item.faviconUrl ? (
                <img
                  src={item.faviconUrl}
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
              <span>{item.siteName || 'Сайт'}</span>
            </div>

            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>

            <span className="flex items-center gap-1">
              {getTypeIcon(item.type)}
              <span>{getTypeLabel(item.type)}</span>
            </span>

            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>

            <span className="font-mono text-[11px] tabular-nums">
              Добавлено {formatFullDate(item.createdAt)}
            </span>

            {item.readAt && (
              <>
                <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
                <span className="font-mono text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">
                  Прочитано {formatFullDate(item.readAt)}
                </span>
              </>
            )}
          </div>

          {/* Title and original link */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
              {item.title}
            </h1>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline max-w-full break-all"
            >
              <span>{item.url}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs sm:text-sm font-medium shadow-xs transition-colors"
            >
              <span>Открыть оригинал</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {item.status !== 'completed' ? (
              <Button
                variant="secondary"
                onClick={() => setStatus('completed')}
                className="gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Отметить как прочитанное</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setStatus('inbox')}
                className="gap-1.5"
              >
                <span>Вернуть в Inbox</span>
              </Button>
            )}

            {item.status !== 'reading' && item.status !== 'completed' && (
              <Button
                variant="outline"
                onClick={() => setStatus('reading')}
                className="gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Начать читать</span>
              </Button>
            )}

            {item.status !== 'archived' && (
              <Button
                variant="ghost"
                onClick={() => setStatus('archived')}
                className="gap-1.5"
              >
                <Archive className="w-4 h-4" />
                <span>В архив</span>
              </Button>
            )}
          </div>

          {/* Tags Manager */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Теги
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag.id || tag.name}
                  className="inline-flex items-center gap-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded"
                >
                  #{tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.name)}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 ml-0.5"
                    aria-label={`Удалить тег ${tag.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Добавить тег..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(newTag);
                    }
                  }}
                  className="w-28 text-xs bg-transparent border-b border-neutral-300 dark:border-neutral-700 px-1 py-1 focus:outline-none focus:border-amber-500 font-mono text-neutral-800 dark:text-neutral-200"
                />
                {newTag && (
                  <button
                    onClick={() => handleAddTag(newTag)}
                    className="text-xs p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {availableTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 pt-1">
                <span className="text-[11px]">Рекомендации:</span>
                {availableTags
                  .filter((t) => !item.tags.some((it) => it.name === t.name))
                  .slice(0, 8)
                  .map((t) => (
                    <button
                      key={t.name}
                      onClick={() => handleAddTag(t.name)}
                      className="font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:underline"
                    >
                      +{t.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Notes Section with Auto-Save */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Личные заметки и выводы
              </label>
              <span className="text-[11px] text-neutral-400">
                {isSavingNotes ? 'Сохранение...' : 'Сохраняется автоматически'}
              </span>
            </div>
            <textarea
              rows={6}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Запишите, почему вы сохранили этот материал, важные вопросы, цитаты или идеи..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed font-sans"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
