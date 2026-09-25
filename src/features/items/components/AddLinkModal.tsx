import { ArrowRight, Globe, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidWebUrl } from '../../../lib/url';
import { CreateItemInput, Item, ItemType, TagWithCount } from '../../../types/item';
import { itemsRepository } from '../api/localStorageRepository';
import { extractMetadata, FetchedMetadata } from '../api/metadataService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { DuplicateWarningDialog } from './DuplicateWarningDialog';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated?: (item: Item) => void;
}

export function AddLinkModal({ isOpen, onClose, onItemCreated }: AddLinkModalProps) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ItemType>('article');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [availableTags, setAvailableTags] = useState<TagWithCount[]>([]);

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [existingDuplicate, setExistingDuplicate] = useState<Item | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingInput, setPendingInput] = useState<CreateItemInput | null>(null);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setTitle('');
      setDescription('');
      setType('article');
      setTagInput('');
      setTags([]);
      setNotes('');
      setError(null);
      setMetadata(null);
      setIsSubmitting(false);
      setExistingDuplicate(null);
      setShowDuplicateModal(false);
      setPendingInput(null);
      itemsRepository
        .getTags()
        .then(setAvailableTags)
        .catch(() => setAvailableTags([]));
    }
  }, [isOpen]);

  // Handle URL change & auto metadata extraction
  const handleUrlBlur = async () => {
    if (!url.trim() || !isValidWebUrl(url)) {
      if (url.trim() && !isValidWebUrl(url)) {
        setError('Пожалуйста, введите корректный адрес сайта (начинается с http:// или https://)');
      }
      return;
    }

    setError(null);
    setIsLoadingMetadata(true);

    try {
      const meta = await extractMetadata(url);
      setMetadata(meta);
      if (!title) setTitle(meta.title);
      if (!description) setDescription(meta.description);
      setType(meta.type);
    } catch {
      // Never block saving even if metadata fails!
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleAddTag = (rawName: string) => {
    const clean = rawName.replace(/^#/, '').trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagName: string) => {
    setTags(tags.filter((t) => t !== tagName));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const executeSave = async (inputToSave: CreateItemInput) => {
    setIsSubmitting(true);
    try {
      const created = await itemsRepository.createItem(inputToSave);
      onItemCreated?.(created);
      onClose();
    } catch (err) {
      console.error('Save failed', err);
      setError('Не удалось сохранить ссылку. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!url.trim()) {
      setError('Пожалуйста, вставьте или введите ссылку');
      return;
    }

    if (!isValidWebUrl(url)) {
      setError('Неверный формат URL. Ссылка должна начинаться с http:// или https://');
      return;
    }

    setIsSubmitting(true);
    try {
      // Duplicate check
      const existing = await itemsRepository.findByUrl(url);
      const savePayload: CreateItemInput = {
        url: url.trim(),
        title: title.trim() || metadata?.title || 'Без названия',
        description: description.trim() || metadata?.description || '',
        type,
        siteName: metadata?.siteName,
        faviconUrl: metadata?.faviconUrl,
        imageUrl: metadata?.imageUrl,
        tags,
        notes: notes.trim(),
        status: 'inbox',
      };

      if (existing) {
        setExistingDuplicate(existing);
        setPendingInput(savePayload);
        setShowDuplicateModal(true);
        setIsSubmitting(false);
        return;
      }

      await executeSave(savePayload);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Произошла ошибка при проверке ссылки.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Сохранить ссылку"
        description="Материал будет добавлен в Inbox для разбора или чтения позже."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              URL-ссылка
            </label>
            <div className="relative">
              <input
                type="url"
                autoFocus
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={handleUrlBlur}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all pr-10"
              />
              {isLoadingMetadata && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                </div>
              )}
            </div>
            {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}
          </div>

          {/* Metadata preview card */}
          {metadata && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                  <Globe className="w-3.5 h-3.5" />
                  {metadata.siteName}
                </span>
                <span className="capitalize">{metadata.type}</span>
              </div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
                {title || metadata.title}
              </p>
            </div>
          )}

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              label="Название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Заголовок страницы или статьи"
            />

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Тип материала
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ItemType)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 capitalize"
              >
                <option value="article">Статья (Article)</option>
                <option value="video">Видео (Video)</option>
                <option value="github">GitHub</option>
                <option value="documentation">Документация</option>
                <option value="news">Новость</option>
                <option value="post">Пост</option>
                <option value="other">Другое</option>
              </select>
            </div>
          </div>

          <div>
            <Input
              label="Краткое описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткая суть или заметка о материале"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Теги
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 min-h-[42px]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder={tags.length === 0 ? "Введите тег и нажмите Enter (например, go, linux)..." : "Добавить тег..."}
                className="text-xs bg-transparent focus:outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 flex-1 min-w-[120px] px-1 py-0.5"
              />
            </div>

            {/* Quick tag suggestions */}
            {availableTags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                <span className="text-[11px]">Популярные:</span>
                {availableTags.slice(0, 6).map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleAddTag(t.name)}
                    className="font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:underline"
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Личная заметка (необязательно)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Зачем вы сохраняете эту ссылку? Ключевые тезисы..."
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting || !url.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <span>Сохранить в Inbox</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Duplicate warning confirmation modal */}
      <DuplicateWarningDialog
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        existingItem={existingDuplicate}
        onOpenExisting={(id) => {
          setShowDuplicateModal(false);
          onClose();
          navigate(`/item/${id}`);
        }}
        onSaveAnyway={async () => {
          if (pendingInput) {
            await executeSave(pendingInput);
          }
        }}
      />
    </>
  );
}
