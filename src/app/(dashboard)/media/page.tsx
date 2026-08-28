'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, Image as ImageIcon, Trash2, Copy, FileText, Film, File as FileIcon } from 'lucide-react';
import { listMedia, uploadMedia, deleteMedia } from '@/lib/services/media';
import type { MediaItem } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatBytes, formatDate, cn } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

function TypeIcon({ type }: { type: MediaItem['type'] }) {
  if (type === 'VIDEO') return <Film className="h-6 w-6" />;
  if (type === 'DOCUMENT') return <FileText className="h-6 w-6" />;
  return <FileIcon className="h-6 w-6" />;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMedia(page, 24);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / res.limit)));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load media'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    setProgress(0);
    try {
      await uploadMedia(file, '', setProgress);
      toast.success('File uploaded');
      setPage(1);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success('URL copied');
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteMedia(toDelete.id);
      toast.success('File deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete file'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-white hover:border-brand-300 hover:bg-slate-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          accept="image/*,application/pdf,video/*"
        />
        <UploadCloud className="h-7 w-7 text-slate-400" />
        <p className="text-[13.5px] font-medium text-slate-700">
          {uploading ? `Uploading… ${progress}%` : 'Click or drag a file here to upload'}
        </p>
        <p className="text-[11.5px] text-slate-400">Images, documents, and video up to 15MB</p>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading media…" />
        ) : items.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No media yet" description="Upload your first file above." />
        ) : (
          <>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {items.map((m) => (
                  <div key={m.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex aspect-square items-center justify-center overflow-hidden bg-slate-100">
                      {m.type === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.altText || m.originalName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-slate-400">
                          <TypeIcon type={m.type} />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[11.5px] font-medium text-slate-700" title={m.originalName}>
                        {m.originalName}
                      </p>
                      <p className="text-[10.5px] text-slate-400">
                        {formatBytes(m.size)} · {formatDate(m.createdAt)}
                      </p>
                    </div>
                    <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => copyUrl(m.url)}
                        className="rounded-lg bg-white/95 p-1.5 text-slate-600 shadow-soft hover:text-brand-600"
                        title="Copy URL"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setToDelete(m)}
                        className="rounded-lg bg-white/95 p-1.5 text-slate-600 shadow-soft hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
            <Pagination page={page} totalPages={totalPages} total={total} limit={24} onChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${toDelete?.originalName}"?`}
        description="This permanently removes the file from storage."
      />
    </div>
  );
}
