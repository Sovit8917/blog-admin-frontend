'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Star,
  Send,
  CheckCircle2,
  XCircle,
  Archive,
  FileEdit,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  listPosts,
  deletePost,
  submitPostForReview,
  approvePost,
  rejectPost,
  bulkPostAction,
  type PostBulkAction,
} from '@/lib/services/posts';
import type { Post, PostStatus, PostType } from '@/lib/types';
import { CAREER_CONTENT_TYPES } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea, Field } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { usePermissions } from '@/lib/permissions-store';

const STATUS_OPTIONS: PostStatus[] = ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

const POST_TYPE_LABELS: Record<PostType, string> = {
  ARTICLE: 'Article',
  TUTORIAL: 'Tutorial',
  NEWS: 'News',
  CAREER_ADVICE: 'Career Advice',
  INTERVIEW_PREP: 'Interview Prep',
  RESUME_TIPS: 'Resume Tips',
  SALARY_GUIDE: 'Salary Guide',
};

const GENERAL_TYPES: PostType[] = ['ARTICLE', 'TUTORIAL', 'NEWS'];

export default function PostsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canReview = role === 'EDITOR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  const { can } = usePermissions();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as PostStatus | null) || '';

  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PostStatus | ''>(initialStatus);
  const [postType, setPostType] = useState<PostType | ''>('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [toDelete, setToDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Post | 'bulk' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPosts({
        page,
        limit: 12,
        search: search || undefined,
        status: status || undefined,
        postType: postType || undefined,
        sortBy,
        sortOrder,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / res.limit)));
      setSelected(new Set());
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load posts'));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, postType, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, postType, sortBy, sortOrder]);

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(items.map((i) => i.id)) : new Set());
  }
  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

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

  async function handleSubmit(post: Post) {
    setBusyId(post.id);
    try {
      await submitPostForReview(post.id);
      toast.success('Submitted for review');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to submit'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleApprove(post: Post) {
    setBusyId(post.id);
    try {
      await approvePost(post.id);
      toast.success('Post approved & published');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to approve'));
    } finally {
      setBusyId(null);
    }
  }

  async function submitReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    setBulkBusy(true);
    try {
      if (rejectTarget === 'bulk') {
        const res = await bulkPostAction([...selected], 'reject', rejectReason.trim());
        toast.success(`Rejected ${res.updated} post(s)`);
      } else {
        await rejectPost(rejectTarget.id, rejectReason.trim());
        toast.success('Post sent back to author');
      }
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to reject'));
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulk(action: PostBulkAction) {
    if (action === 'reject') {
      setRejectTarget('bulk');
      return;
    }
    setBulkBusy(true);
    try {
      const res = await bulkPostAction([...selected], action);
      toast.success(`Updated ${res.updated} post(s)`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Bulk action failed'));
    } finally {
      setBulkBusy(false);
    }
  }

  const activeSort = { sortBy, sortOrder };
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

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
          <Select value={postType} onChange={(e) => setPostType(e.target.value as PostType | '')} className="sm:w-52">
            <option value="">All content types</option>
            <optgroup label="Career Content">
              {CAREER_CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_LABELS[t]}
                </option>
              ))}
            </optgroup>
            <optgroup label="General">
              {GENERAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_LABELS[t]}
                </option>
              ))}
            </optgroup>
          </Select>
          {canReview && (
            <Button
              variant={status === 'IN_REVIEW' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setStatus(status === 'IN_REVIEW' ? '' : 'IN_REVIEW')}
            >
              Pending review
            </Button>
          )}
        </div>
        {can('posts', 'create') && (
          <Link href="/posts/new">
            <Button>
              <Plus className="h-4 w-4" /> New Post
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={[
            { label: 'Publish', icon: CheckCircle2, onClick: () => handleBulk('publish'), loading: bulkBusy },
            { label: 'Archive', icon: Archive, onClick: () => handleBulk('archive'), loading: bulkBusy },
            { label: 'Move to draft', icon: FileEdit, onClick: () => handleBulk('draft'), loading: bulkBusy },
            ...(canReview
              ? [
                  { label: 'Approve', icon: CheckCircle2, onClick: () => handleBulk('approve'), loading: bulkBusy },
                  {
                    label: 'Reject',
                    icon: XCircle,
                    variant: 'outline' as const,
                    onClick: () => handleBulk('reject'),
                    loading: bulkBusy,
                  },
                ]
              : []),
            ...(can('posts', 'delete')
              ? [{ label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => handleBulk('delete'), loading: bulkBusy }]
              : []),
          ]}
        />
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
                  <Th className="w-10">
                    <Checkbox checked={allSelected} onChange={toggleAll} ariaLabel="Select all" />
                  </Th>
                  <Th sortKey="title" activeSort={activeSort} onSort={handleSort}>
                    Title
                  </Th>
                  <Th sortKey="status" activeSort={activeSort} onSort={handleSort}>
                    Status
                  </Th>
                  <Th>Type</Th>
                  <Th>Category</Th>
                  <Th>Author</Th>
                  <Th sortKey="viewCount" activeSort={activeSort} onSort={handleSort}>
                    Stats
                  </Th>
                  <Th sortKey="updatedAt" activeSort={activeSort} onSort={handleSort}>
                    Updated
                  </Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((post) => (
                  <Tr key={post.id}>
                    <Td>
                      <Checkbox
                        checked={selected.has(post.id)}
                        onChange={(c) => toggleOne(post.id, c)}
                        ariaLabel={`Select ${post.title}`}
                      />
                    </Td>
                    <Td className="max-w-xs">
                      <div className="flex items-center gap-2">
                        {post.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{post.title}</p>
                          <p className="truncate text-[11.5px] text-slate-400">/{post.slug}</p>
                          {post.status === 'DRAFT' && post.rejectionReason && (
                            <p className="mt-0.5 truncate text-[11px] text-red-500" title={post.rejectionReason}>
                              Rejected: {post.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(post.status)}>{post.status}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={CAREER_CONTENT_TYPES.includes(post.postType) ? 'violet' : 'slate'}>
                        {POST_TYPE_LABELS[post.postType] || post.postType}
                      </Badge>
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
                        {post.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="icon"
                            title="Submit for review"
                            onClick={() => handleSubmit(post)}
                            loading={busyId === post.id}
                          >
                            <Send className="h-3.5 w-3.5 text-blue-500" />
                          </Button>
                        )}
                        {canReview && post.status === 'IN_REVIEW' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Approve & publish"
                              onClick={() => handleApprove(post)}
                              loading={busyId === post.id}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Reject"
                              onClick={() => setRejectTarget(post)}
                            >
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                        {can('posts', 'update') && (
                          <Link href={`/posts/${post.id}`}>
                            <Button variant="outline" size="icon" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        {can('posts', 'delete') && (
                          <Button variant="outline" size="icon" title="Delete" onClick={() => setToDelete(post)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        )}
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

      <Modal
        open={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        title={rejectTarget === 'bulk' ? `Reject ${selected.size} post(s)` : `Reject "${(rejectTarget as Post)?.title}"`}
        description="This sends the post back to the author as a draft with your note."
        width="sm"
      >
        <div className="space-y-3">
          <Field label="Reason" required>
            <Textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="What needs to change before this can be approved?"
            />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={submitReject}
              loading={bulkBusy}
              disabled={!rejectReason.trim()}
            >
              Send back to author
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
