'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { listSkills, createSkill, deleteSkill } from '@/lib/services/skills';
import type { Skill } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';

export default function SkillsPage() {
  const [items, setItems] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Skill | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listSkills());
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load skills'));
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
      await createSkill(name.trim());
      toast.success('Skill added');
      setName('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to add skill'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteSkill(toDelete.id);
      toast.success('Skill deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete skill'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="New skill name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" loading={creating}>
              <Plus className="h-4 w-4" /> Add skill
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <PageSpinner label="Loading skills…" />
          ) : items.length === 0 ? (
            <EmptyState icon={Sparkles} title="No skills yet" description="Add your first skill above — job postings can tag skills to help candidates find them." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((s) => (
                <Badge key={s.id} tone="violet" className="gap-2 px-3 py-1.5 text-[12.5px]">
                  {s.name}
                  {typeof s._count?.jobs === 'number' && <span className="text-violet-400">· {s._count.jobs}</span>}
                  <button onClick={() => setToDelete(s)} className="text-violet-400 hover:text-red-600">
                    <Trash2 className="h-3 w-3" />
                  </button>
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
        title={`Delete skill "${toDelete?.name}"?`}
        description="This skill will be removed from all job listings using it."
      />
    </div>
  );
}
