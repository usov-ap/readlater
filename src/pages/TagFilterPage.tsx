import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AddLinkModal } from '../features/items/components/AddLinkModal';
import { ItemList } from '../features/items/components/ItemList';
import { useItems } from '../features/items/hooks/useItems';

export function TagFilterPage() {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const cleanTag = (tagName || '').replace(/^#/, '');

  const {
    items,
    loading,
    setStatus,
    toggleFavorite,
    deleteItem,
    refresh,
  } = useItems({ tag: cleanTag });

  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <AppLayout headerTitle={`#${cleanTag}`} count={items.length}>
      <ItemList
        items={items}
        loading={loading}
        selectedTag={cleanTag}
        onClearTag={() => navigate('/inbox')}
        emptyTitle={`Нет материалов с тегом #${cleanTag}`}
        emptyDescription="Добавьте этот тег к ссылкам, чтобы группировать материалы по темам."
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
