import { ArrowUpDown, Layers } from 'lucide-react';
import { useState } from 'react';
import { Item, ItemStatus, ItemType, SortOption } from '../../../types/item';
import { CardSkeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { ItemCard } from './ItemCard';

interface ItemListProps {
  items: Item[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onStatusChange: (id: string, status: ItemStatus) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onSelectTag?: (tagName: string) => void;
  selectedTag?: string;
  onClearTag?: () => void;
}

export function ItemList({
  items,
  loading,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onStatusChange,
  onToggleFavorite,
  onDelete,
  onSelectTag,
  selectedTag,
  onClearTag,
}: ItemListProps) {
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Client-side quick filter for type and sort
  const filtered = items.filter((item) => {
    if (selectedType !== 'all' && item.type !== selectedType) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOption === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortOption === 'recently_updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortOption === 'recently_read') {
      const dateA = a.readAt ? new Date(a.readAt).getTime() : 0;
      const dateB = b.readAt ? new Date(b.readAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  const itemTypes: Array<{ label: string; value: ItemType | 'all' }> = [
    { label: 'Все типы', value: 'all' },
    { label: 'Статьи', value: 'article' },
    { label: 'Документация', value: 'documentation' },
    { label: 'GitHub', value: 'github' },
    { label: 'Видео', value: 'video' },
    { label: 'Новости', value: 'news' },
    { label: 'Посты', value: 'post' },
  ];

  return (
    <div className="space-y-4">
      {/* Control bar: active tag banner, type tabs, and sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {selectedTag && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-mono text-xs mr-2 shrink-0">
              <span>#{selectedTag}</span>
              <button
                onClick={onClearTag}
                className="hover:text-amber-950 dark:hover:text-amber-100 font-bold"
                aria-label="Сбросить фильтр по тегу"
              >
                ×
              </button>
            </div>
          )}

          {itemTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedType === t.value
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="recently_updated">Недавно обновлённые</option>
            <option value="recently_read">Недавно прочитанные</option>
          </select>
        </div>
      </div>

      {/* Item Cards List */}
      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={selectedType !== 'all' || selectedTag ? 'Ничего не найдено' : emptyTitle}
          description={
            selectedType !== 'all' || selectedTag
              ? 'Попробуйте выбрать «Все типы» или сбросить активные фильтры.'
              : emptyDescription
          }
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
          icon={<Layers className="w-6 h-6" />}
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              onSelectTag={onSelectTag}
            />
          ))}
        </div>
      )}
    </div>
  );
}
