import { ArrowLeft, CheckCircle2, Clock, Plus, Star, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { AddLinkModal } from '../../items/components/AddLinkModal';

export interface ProcessSessionStats {
  totalReviewed: number;
  completedCount: number;
  laterCount: number;
  favoriteCount: number;
  deletedCount: number;
}

interface ProcessCompletionProps {
  stats: ProcessSessionStats;
  onBackToLibrary: () => void;
}

export function ProcessCompletion({ stats, onBackToLibrary }: ProcessCompletionProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Когда в Inbox изначально не было материалов
  if (stats.totalReviewed === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Inbox пуст
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Отличная работа. Нет материалов, требующих внимания.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onBackToLibrary}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>В библиотеку</span>
          </Button>

          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Добавить ссылку</span>
          </Button>
        </div>

        <AddLinkModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onItemCreated={onBackToLibrary}
        />
      </div>
    );
  }

  // Когда материалы были обработаны
  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-900/60">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
        Inbox разобран
      </h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-mono tabular-nums">
        Обработано материалов: {stats.totalReviewed}
      </p>

      {/* Structured stats breakdown */}
      <div className="mt-8 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-left divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Прочитано (Completed)</span>
          </span>
          <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
            {stats.completedCount}
          </span>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Оставлено на потом (Later)</span>
          </span>
          <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
            {stats.laterCount}
          </span>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Добавлено в избранное</span>
          </span>
          <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
            {stats.favoriteCount}
          </span>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Удалено</span>
          </span>
          <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
            {stats.deletedCount}
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Button variant="primary" size="lg" onClick={onBackToLibrary}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Вернуться в библиотеку</span>
        </Button>
      </div>
    </div>
  );
}
