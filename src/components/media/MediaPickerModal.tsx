'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, Image as ImageIcon, Check, Search } from 'lucide-react';
import { listMedia, uploadMedia } from '@/lib/services/media';
import type { MediaItem } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = 'Select Image from Media Library',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const res = await listMedia(page, 20);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / res.limit)));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load media'));
    } finally {
      setLoading(false);
    }
  }, [open, page]);

  useEffect(() => {
    if (open) {
      load();
    } else {
      setSelectedUrl('');
    }
  }, [open, load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadMedia(file, '', setProgress);
      toast.success('File uploaded');
      setPage(1);
      await load();
      if (uploaded?.url) {
        setSelectedUrl(uploaded.url);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleConfirm() {
    if (!selectedUrl) return;
    onSelect(selectedUrl);
    onClose();
  }

  const imageItems = items.filter((m) => {
    if (m.type !== 'IMAGE') return false;
    if (!search.trim()) return true;
    return m.originalName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Modal open={open} onClose={onClose} title={title} width="xl">
      <div className="space-y-4">
        {/* Upload & Search Area */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              'flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-3 text-center transition-colors',
              dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:border-brand-300 hover:bg-slate-100/70',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              accept="image/*"
            />
            <UploadCloud className="h-5 w-5 text-slate-400" />
            <span className="text-[13px] font-medium text-slate-700">
              {uploading ? `Uploading… ${progress}%` : 'Upload image file'}
            </span>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search images…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="min-h-[280px] rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          {loading ? (
            <PageSpinner label="Loading images…" />
          ) : imageItems.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No images found" description="Upload an image or adjust your search." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {imageItems.map((m) => {
                const isSelected = selectedUrl === m.url;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedUrl(m.url)}
                    onDoubleClick={() => {
                      onSelect(m.url);
                      onClose();
                    }}
                    className={cn(
                      'group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-brand-600 bg-brand-50 shadow-md ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.altText || m.originalName} className="h-full w-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-brand-600/30 backdrop-blur-[1px]">
                        <div className="rounded-full bg-brand-600 p-1.5 text-white shadow-lg">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-[11px] font-medium">{m.originalName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onChange={setPage} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button onClick={handleConfirm} disabled={!selectedUrl}>
              Select Image
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
