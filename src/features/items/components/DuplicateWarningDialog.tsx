import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { Item } from '../../../types/item';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

interface DuplicateWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingItem: Item | null;
  onOpenExisting: (id: string) => void;
  onSaveAnyway: () => void;
}

export function DuplicateWarningDialog({
  isOpen,
  onClose,
  existingItem,
  onOpenExisting,
  onSaveAnyway,
}: DuplicateWarningDialogProps) {
  if (!existingItem) return null;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'inbox':
        return 'в Inbox';
      case 'reading':
        return 'в Читаю';
      case 'completed':
        return 'прочитано';
      case 'archived':
        return 'в архиве';
      default:
        return status;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ссылка уже существует" maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-amber-900 dark:text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold">Этот материал уже есть в вашей библиотеке.</p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400 line-clamp-2">
              «{existingItem.title}» ({getStatusLabel(existingItem.status)})
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            onClick={() => {
              onOpenExisting(existingItem.id);
              onClose();
            }}
            className="w-full justify-between"
          >
            <span>Открыть существующий</span>
            <ArrowUpRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              onSaveAnyway();
              onClose();
            }}
            className="w-full"
          >
            Сохранить всё равно
          </Button>

          <Button variant="ghost" onClick={onClose} className="w-full">
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  );
}
