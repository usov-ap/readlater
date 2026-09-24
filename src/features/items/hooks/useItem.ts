import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { Item, ItemStatus, UpdateItemInput } from '../../../types/item';
import { itemsRepository } from '../api/localStorageRepository';

export function useItem(id?: string) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const loadItem = useCallback(async () => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }
    try {
      const fetched = await itemsRepository.getItem(id);
      setItem(fetched);
    } catch (err) {
      console.error('Error fetching item', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadItem();
    const unsubscribe = itemsRepository.subscribe(() => {
      loadItem();
    });
    return () => unsubscribe();
  }, [loadItem]);

  const update = async (input: UpdateItemInput) => {
    if (!id) return;
    const updated = await itemsRepository.updateItem(id, input);
    setItem(updated);
    return updated;
  };

  const toggleFavorite = async () => {
    if (!item) return;
    const nextVal = !item.isFavorite;
    await update({ isFavorite: nextVal });
    showToast({
      message: nextVal ? 'Добавлено в избранное' : 'Удалено из избранного',
    });
  };

  const setStatus = async (status: ItemStatus) => {
    if (!item) return;
    await update({ status });
    const statusLabels: Record<ItemStatus, string> = {
      inbox: 'Перемещено в Inbox',
      reading: 'Перемещено в Читаю',
      completed: 'Отмечено как прочитанное',
      archived: 'В архиве',
    };
    showToast({ message: statusLabels[status] });
  };

  const deleteItem = async () => {
    if (!item) return;
    const deleted = await itemsRepository.deleteItem(item.id);
    showToast({
      message: 'Материал удалён',
      actionLabel: 'Отменить',
      onAction: async () => {
        await itemsRepository.restoreItem(deleted);
      },
    });
  };

  return {
    item,
    loading,
    update,
    toggleFavorite,
    setStatus,
    deleteItem,
    reload: loadItem,
  };
}
