import { ArrowRight, Inbox, Plus, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { AddLinkModal } from '../features/items/components/AddLinkModal';
import { ItemList } from '../features/items/components/ItemList';
import { useItems } from '../features/items/hooks/useItems';

export function InboxPage() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    counts,
    setStatus,
    toggleFavorite,
    deleteItem,
    refresh,
  } = useItems({ status: 'inbox' });

  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <AppLayout headerTitle="Inbox" count={counts.inbox}>
      <div className="space-y-6">
        {/* Inbox Processing Hero Bar */}
        {counts.inbox > 0 && (
          <div className="rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {counts.inbox} {counts.inbox === 1 ? 'материал ожидает' : 'материалов ожидают'} разбора
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Быстрый разбор по одному: Читать, Позже, В избранное или Удалить.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/process')}
              className="shrink-0 shadow-xs"
            >
              <span>Разобрать Inbox</span>
              <span className="font-mono text-xs opacity-70 ml-1.5 tabular-nums">
                ({counts.inbox})
              </span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Item List */}
        <ItemList
          items={items}
          loading={loading}
          emptyTitle="Ваш Inbox пуст."
          emptyDescription="Сохраните интересную ссылку из интернета, чтобы изучить или разобрать её позже."
          emptyActionLabel="Добавить первую ссылку"
          onEmptyAction={() => setIsAddOpen(true)}
          onStatusChange={setStatus}
          onToggleFavorite={toggleFavorite}
          onDelete={deleteItem}
          onSelectTag={(tag) => navigate(`/tag/${tag}`)}
        />

        {/* Add Link Modal */}
        <AddLinkModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onItemCreated={() => refresh()}
        />
      </div>
    </AppLayout>
  );
}
