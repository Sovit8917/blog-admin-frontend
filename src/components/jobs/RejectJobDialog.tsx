'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea, Label } from '@/components/ui/Input';

export function RejectJobDialog({
  open,
  jobTitle,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  jobTitle?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState('');

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reject "${jobTitle ?? ''}"`}
      description="Let the poster know what to fix. This is shown on their listing."
      width="sm"
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="reject-reason">Reason (optional)</Label>
          <Textarea
            id="reject-reason"
            rows={4}
            placeholder="e.g. Missing salary range, external apply link is broken…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={loading}
            onClick={() => {
              onConfirm(reason.trim() || undefined as any);
              setReason('');
            }}
          >
            Reject listing
          </Button>
        </div>
      </div>
    </Modal>
  );
}
