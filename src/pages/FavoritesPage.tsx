import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AddLinkModal } from '../features/items/components/AddLinkModal';
import { ItemList } from '../features/items/components/ItemList';
import { useItems } from '../features/items/hooks/useItems';

export function FavoritesPage() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    counts,
    setStatus,
    toggleFavorite,
    deleteItem,
    refresh,
  } = useItems({ isFavorite: true });

  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <AppLayout headerTitle="Избранное" count={counts.favorites}>
      <ItemList
        items={items}
        loading={loading}
        emptyTitle="В избранном пока пусто."
        emptyDescription="Отмечайте звёздочкой самые важные статьи, ценные репозитории и заметки, к которым часто возвращаетесь."
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
