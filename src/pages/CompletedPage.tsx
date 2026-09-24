import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AddLinkModal } from '../features/items/components/AddLinkModal';
import { ItemList } from '../features/items/components/ItemList';
import { useItems } from '../features/items/hooks/useItems';

export function CompletedPage() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    counts,
    setStatus,
    toggleFavorite,
    deleteItem,
    refresh,
  } = useItems({ status: 'completed' });

  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <AppLayout headerTitle="Прочитано" count={counts.completed}>
      <ItemList
        items={items}
        loading={loading}
        emptyTitle="Пока ничего не прочитано."
        emptyDescription="После прочтения статьи или просмотра видео отметьте его как прочитанное, чтобы сохранить историю освоенных материалов."
        emptyActionLabel="Перейти в Inbox"
        onEmptyAction={() => navigate('/inbox')}
        onStatusChange={setStatus}
        onToggleFavorite={toggleFavorite}
        onDelete={deleteItem}
        onSelectTag={(tag) => navigate(`/tag/${tag}`)}
      />

      <AddLinkModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onItemCreated={() => refresh()}
      />
    </AppLayout>
  );
}
