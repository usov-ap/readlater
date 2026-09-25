import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AddLinkModal } from '../features/items/components/AddLinkModal';
import { ItemList } from '../features/items/components/ItemList';
import { useItems } from '../features/items/hooks/useItems';

export function ReadingPage() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    counts,
    setStatus,
    toggleFavorite,
    deleteItem,
    refresh,
  } = useItems({ status: 'reading' });

  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <AppLayout headerTitle="Читаю" count={counts.reading}>
      <ItemList
        items={items}
        loading={loading}
        emptyTitle="В списке чтения пока ничего нет."
        emptyDescription="Материалы, которые вы сейчас читаете или изучаете, появятся здесь. Нажмите «Начать читать» в карточке любого материала."
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
