'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { PostForm } from '@/components/posts/PostForm';
import { getPost, deletePost } from '@/lib/services/posts';
import type { Post } from '@/lib/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPost(id)
      .then(setPost)
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load post')))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePost(id);
      toast.success('Post deleted');
      router.replace('/posts');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete post'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageSpinner label="Loading post…" />;
  if (!post) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/posts" className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to posts
        </Link>
        <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete
        </Button>
      </div>
      <PostForm post={post} />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${post.title}"?`}
        description="This soft-deletes the post. It will no longer appear on the blog."
      />
    </div>
  );
}
