'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="" width="sm">
      <div className="flex flex-col items-center py-2 text-center">
        <div
          className={
            danger
              ? 'flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600'
              : 'flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600'
          }
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-[15px] font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-1.5 text-[13px] text-slate-500">{description}</p>}
        <div className="mt-5 flex w-full gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
