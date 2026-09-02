'use client';

import { useEffect, useRef, useState } from 'react';
import { Briefcase, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { listJobs } from '@/lib/services/jobs';
import type { Job } from '@/lib/types';

/**
 * Search-and-select picker for editorially linking specific jobs to a piece
 * of content (Article -> Job / Resource -> Job linking, P1). Mirrors the tag
 * input pattern in PostForm, but backed by a live `/cms/jobs` search instead
 * of a fixed datalist since the job catalog is far larger than the tag list.
 *
 * `value` / `onChange` carry job ids (what the API wants); `initialJobs`
 * seeds the display labels for ids the form already had selected on load
 * (e.g. editing a post that already has linked jobs) so we don't need a
 * separate "get jobs by id" call just to render chips.
 */
export function JobLinkPicker({
  value,
  onChange,
  initialJobs = [],
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  initialJobs?: Job[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Label cache so removing/re-adding a chip, or a job dropping out of the
  // current search results, still renders a readable name instead of a bare id.
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialJobs.map((j) => [j.id, j.title])),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      listJobs({ search: trimmed, limit: 8 })
        .then((page) => setResults(page.items))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function addJob(job: Job) {
    setLabels((l) => ({ ...l, [job.id]: job.title }));
    if (!value.includes(job.id)) onChange([...value, job.id]);
    setQuery('');
    setResults([]);
  }

  function removeJob(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 && (
          <p className="text-[12.5px] text-slate-400">No jobs linked yet — search below to add some.</p>
        )}
        {value.map((id) => (
          <Badge key={id} tone="green" className="gap-1">
            <Briefcase className="h-3 w-3" />
            {labels[id] || id}
            <button type="button" onClick={() => removeJob(id)} className="hover:text-green-900">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-8"
          placeholder="Search jobs by title…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && query.trim() && (
        <div className="absolute z-20 mt-0.5 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-[12.5px] text-slate-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-[12.5px] text-slate-400">No matching open jobs</p>
          ) : (
            results.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => addJob(job)}
                disabled={value.includes(job.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <span className="truncate">{job.title}</span>
                {job.companyName && (
                  <span className="shrink-0 truncate text-[11.5px] text-slate-400">{job.companyName}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
