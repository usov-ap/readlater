import { Modal } from '../../../components/ui/Modal';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    { key: 'J / ↓', label: 'Следующий материал' },
    { key: 'K / ↑', label: 'Предыдущий материал' },
    { key: 'R', label: 'Отметить как прочитанное (Completed)' },
    { key: 'L', label: 'Оставить на потом (Later)' },
    { key: 'F', label: 'В избранное / убрать' },
    { key: 'D', label: 'Удалить материал (с возможностью Undo)' },
    { key: 'O', label: 'Открыть оригинальную ссылку' },
    { key: 'Esc', label: 'Вернуться в Inbox' },
    { key: '?', label: 'Показать / скрыть горячие клавиши' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Горячие клавиши"
      description="Разбирайте Inbox с молниеносной скоростью без помощи мыши."
      maxWidth="sm"
    >
      <div className="space-y-2 py-1">
        {shortcuts.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0"
          >
            <span className="text-neutral-600 dark:text-neutral-400">{s.label}</span>
            <kbd className="font-mono font-medium px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
