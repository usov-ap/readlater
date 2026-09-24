import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessScreen } from '../features/inbox/components/ProcessScreen';
import { itemsRepository } from '../features/items/api/localStorageRepository';
import { Item } from '../types/item';

export function ProcessingPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    itemsRepository.getItems({ status: 'inbox' }).then((res) => {
      setItems(res);
      setLoading(false);
    });
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
