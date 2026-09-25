import { useEffect, useState } from 'react';
import { ProcessScreen } from '../features/inbox/components/ProcessScreen';
import { itemsRepository } from '../features/items/api/localStorageRepository';
import { Item } from '../types/item';

export function ProcessingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    itemsRepository
      .getItems({ status: 'inbox' })
      .then((res) => {
        if (cancelled) return;
        setItems(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load inbox queue', err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf9] dark:bg-[#121417]">
        <div className="animate-pulse font-mono text-xs text-neutral-400">
          Загрузка очереди Inbox...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf9] dark:bg-[#121417] text-neutral-900 dark:text-neutral-100 selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-200">
      <ProcessScreen initialItems={items} />
    </div>
  );
}
