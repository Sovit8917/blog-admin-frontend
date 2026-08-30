'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { listTags, createTag, deleteTag } from '@/lib/services/tags';
import type { Tag } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';
import { usePermissions } from '@/lib/permissions-store';

export default function TagsPage() {
  const { can } = usePermissions();
  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listTags());
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load tags'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createTag(name.trim());
      toast.success('Tag created');
      setName('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create tag'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteTag(toDelete.id);
      toast.success('Tag deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete tag'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {can('tags', 'create') && (
        <Card>
          <CardBody>
            <form onSubmit={handleCreate} className="flex gap-2">
              <Input
                placeholder="New tag name…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-xs"
              />
              <Button type="submit" loading={creating}>
                <Plus className="h-4 w-4" /> Add tag
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          {loading ? (
            <PageSpinner label="Loading tags…" />
          ) : items.length === 0 ? (
            <EmptyState icon={TagIcon} title="No tags yet" description="Add your first tag above." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((t) => (
                <Badge key={t.id} tone="blue" className="gap-2 px-3 py-1.5 text-[12.5px]">
                  {t.name}
                  {typeof t._count?.posts === 'number' && (
                    <span className="text-blue-400">· {t._count.posts}</span>
                  )}
                  {can('tags', 'delete') && (
                    <button onClick={() => setToDelete(t)} className="text-blue-400 hover:text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete tag "${toDelete?.name}"?`}
        description="This tag will be removed from all posts using it."
      />
    </div>
  );
}
