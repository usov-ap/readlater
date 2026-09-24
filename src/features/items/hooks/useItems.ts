import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { CreateItemInput, Item, ItemFilter, ItemStatus, TagWithCount, UpdateItemInput } from '../../../types/item';
import { itemsRepository } from '../api/localStorageRepository';

export function useItems(filter?: ItemFilter) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [counts, setCounts] = useState<{
    inbox: number;
    reading: number;
    completed: number;
    favorites: number;
    archived: number;
    all: number;
  }>({ inbox: 0, reading: 0, completed: 0, favorites: 0, archived: 0, all: 0 });
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [fetchedItems, fetchedCounts, fetchedTags] = await Promise.all([
        itemsRepository.getItems(filter),
        itemsRepository.getStatusCounts(),
        itemsRepository.getTags(),
      ]);
      setItems(fetchedItems);
      setCounts(fetchedCounts);
      setTags(fetchedTags);
    } catch (err) {
      console.error('Error loading items', err);
    } finally {
      setLoading(false);
    }
  }, [
    filter?.status,
    filter?.isFavorite,
    filter?.type,
    filter?.tag,
    filter?.search,
    filter?.sort,
  ]);

  useEffect(() => {
    loadData();
    const unsubscribe = itemsRepository.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const createItem = async (input: CreateItemInput): Promise<Item> => {
    const newItem = await itemsRepository.createItem(input);
    showToast({ message: 'Сохранено в библиотеку' });
    return newItem;
  };

  const updateItem = async (id: string, input: UpdateItemInput): Promise<Item> => {
    const updated = await itemsRepository.updateItem(id, input);
    return updated;
  };

  const toggleFavorite = async (id: string, currentVal: boolean) => {
    await itemsRepository.updateItem(id, { isFavorite: !currentVal });
    showToast({
      message: !currentVal ? 'Добавлено в избранное' : 'Удалено из избранного',
    });
  };

  const setStatus = async (id: string, status: ItemStatus) => {
    await itemsRepository.updateItem(id, { status });
    const statusLabels: Record<ItemStatus, string> = {
      inbox: 'Перемещено в Inbox',
      reading: 'Перемещено в Читаю',
      completed: 'Отмечено как прочитанное',
      archived: 'В архиве',
    };
    showToast({ message: statusLabels[status] });
  };

  const deleteItem = async (id: string) => {
    const deleted = await itemsRepository.deleteItem(id);
    showToast({
      message: 'Материал удалён',
      actionLabel: 'Отменить',
      onAction: async () => {
        await itemsRepository.restoreItem(deleted);
      },
    });
  };

  return {
    items,
    loading,
    counts,
    tags,
    refresh: loadData,
    createItem,
    updateItem,
    toggleFavorite,
    setStatus,
    deleteItem,
  };
}
