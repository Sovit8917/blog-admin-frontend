'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Check, X, ShieldAlert, Trash2, Edit2 } from 'lucide-react';
import { listCommentsForModeration, moderateComment, deleteComment, updateComment } from '@/lib/services/comments';
import type { Comment, CommentStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { formatDateTime, cn } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { usePermissions } from '@/lib/permissions-store';

const TABS: { label: string; value: CommentStatus | '' }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Spam', value: 'SPAM' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: '' },
];

export default function CommentsPage() {
  const { can } = usePermissions();
  const [tab, setTab] = useState<CommentStatus | ''>('PENDING');
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCommentsForModeration(tab, page, 20);
      setItems(res.items);
      setMeta(res.meta);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load comments'));
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  async function handleModerate(id: string, status: CommentStatus) {
    setBusyId(id);
    try {
      await moderateComment(id, status);
      toast.success(`Comment ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update comment'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteComment(toDelete.id);
      toast.success('Comment deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete comment'));
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(c: Comment) {
    setEditingComment(c);
    setEditContent(c.content);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingComment || !editContent.trim()) return;
    setSavingEdit(true);
    try {
      await updateComment(editingComment.id, editContent.trim());
      toast.success('Comment updated');
      setEditingComment(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to edit comment'));
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-soft w-fit">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.value)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              tab === t.value ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading comments…" />
        ) : items.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No comments here" description="Nothing to moderate in this view." />
        ) : (
          <>
            <ul className="divide-y divide-slate-50">
              {items.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-slate-800">
                          {c.user?.name || c.user?.username || 'Unknown user'}
                        </p>
                        <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                        <span className="text-[11.5px] text-slate-400">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-700">{c.content}</p>
                      {c.post && (
                        <p className="mt-1.5 text-[11.5px] text-slate-400">
                          On: <span className="font-medium text-slate-500">{c.post.title}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {can('comments', 'update') && (
                        <Button
                          variant="outline"
                          size="icon"
                          title="Edit content"
                          disabled={busyId === c.id}
                          onClick={() => openEdit(c)}
                        >
                          <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                      )}
                      {can('comments', 'update') && c.status !== 'APPROVED' && (
                        <Button
                          variant="outline"
                          size="icon"
                          title="Approve"
                          disabled={busyId === c.id}
                          onClick={() => handleModerate(c.id, 'APPROVED')}
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      )}
                      {can('comments', 'update') && c.status !== 'REJECTED' && (
                        <Button
                          variant="outline"
                          size="icon"
                          title="Reject"
                          disabled={busyId === c.id}
                          onClick={() => handleModerate(c.id, 'REJECTED')}
                        >
                          <X className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                      )}
                      {can('comments', 'update') && c.status !== 'SPAM' && (
                        <Button
                          variant="outline"
                          size="icon"
                          title="Mark as spam"
                          disabled={busyId === c.id}
                          onClick={() => handleModerate(c.id, 'SPAM')}
                        >
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        </Button>
                      )}
                      {can('comments', 'delete') && (
                        <Button variant="outline" size="icon" title="Delete" onClick={() => setToDelete(c)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Edit Comment Modal */}
      {editingComment && (
        <Modal
          open={!!editingComment}
          onClose={() => setEditingComment(null)}
          title="Edit Comment"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Comment Content</label>
              <Textarea
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit comment text..."
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setEditingComment(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={savingEdit} disabled={!editContent.trim()}>
                Save changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this comment?"
        description="This action cannot be undone."
      />
    </div>
  );
}

