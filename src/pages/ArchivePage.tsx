import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AddLinkModal } from '../features/items/components/AddLinkModal';
import { ItemList } from '../features/items/components/ItemList';
import { useItems } from '../features/items/hooks/useItems';

export function ArchivePage() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    counts,
    setStatus,
    toggleFavorite,
    deleteItem,
    refresh,
  } = useItems({ status: 'archived' });

  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <AppLayout headerTitle="Архив" count={counts.archived}>
      <ItemList
        items={items}
        loading={loading}
        emptyTitle="Архив пуст."
        emptyDescription="Материалы, убранные из активных очередей, сохраняются здесь, не захламляя ваш Inbox."
        emptyActionLabel="Вернуться в Inbox"
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
