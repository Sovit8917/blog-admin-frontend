'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Eye, Pencil, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { listPosts, deletePost } from '@/lib/services/posts';
import type { Post, PostStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const STATUS_OPTIONS: PostStatus[] = ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

export default function PostsPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PostStatus | ''>('');
  const [toDelete, setToDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPosts({ page, limit: 12, search: search || undefined, status: status || undefined });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / res.limit)));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load posts'));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deletePost(toDelete.id);
      toast.success('Post deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete post'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as PostStatus | '')} className="sm:w-44">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <Link href="/posts/new">
          <Button>
            <Plus className="h-4 w-4" /> New Post
          </Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading posts…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No posts found"
            description="Try adjusting your filters, or create your first post."
            action={
              <Link href="/posts/new" className="mt-3">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> New Post
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Category</Th>
                  <Th>Author</Th>
                  <Th>Stats</Th>
                  <Th>Updated</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((post) => (
                  <Tr key={post.id}>
                    <Td className="max-w-xs">
                      <div className="flex items-center gap-2">
                        {post.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{post.title}</p>
                          <p className="truncate text-[11.5px] text-slate-400">/{post.slug}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(post.status)}>{post.status}</Badge>
                    </Td>
                    <Td>{post.category?.name || <span className="text-slate-300">—</span>}</Td>
                    <Td>{post.author?.name || post.author?.username || <span className="text-slate-300">—</span>}</Td>
                    <Td>
                      <div className="flex items-center gap-1 text-[12px] text-slate-500">
                        <Eye className="h-3.5 w-3.5" /> {post.viewCount}
                        <span className="mx-1 text-slate-300">·</span>
                        {post.commentCount} comments
                      </div>
                    </Td>
                    <Td>{formatDateTime(post.updatedAt)}</Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/posts/${post.id}`}>
                          <Button variant="outline" size="icon" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="icon" title="Delete" onClick={() => setToDelete(post)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={12} onChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${toDelete?.title}"?`}
        description="This soft-deletes the post. It will no longer appear on the blog."
      />
    </div>
  );
}
