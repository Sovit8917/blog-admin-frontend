'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpenText, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { listDeveloperResources } from '@/lib/services/developerResources';
import type { DeveloperResource } from '@/lib/types';
import type { LearningPathItemInput } from '@/lib/services/learningPaths';

/**
 * Search-and-select picker for building an ordered Learning Path out of
 * existing Developer Resources. Mirrors JobLinkPicker's live-search pattern,
 * but the selection is an ordered list (array order = walk-through order)
 * rather than an unordered set, so each row also gets move up/down controls
 * and an optional per-step note.
 *
 * `value` / `onChange` carry the ordered `{ resourceId, note }[]` the API
 * wants; `initialResources` seeds display labels for resources the form
 * already had selected on load (e.g. editing a path that already has steps)
 * so we don't need a separate "get resources by id" call just to render rows.
 */
export function ResourceStepPicker({
  value,
  onChange,
  initialResources = [],
}: {
  value: LearningPathItemInput[];
  onChange: (items: LearningPathItemInput[]) => void;
  initialResources?: DeveloperResource[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeveloperResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [resources, setResources] = useState<Record<string, DeveloperResource>>(() =>
    Object.fromEntries(initialResources.map((r) => [r.id, r])),
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
      listDeveloperResources({ search: trimmed, limit: 8 })
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

  function addResource(resource: DeveloperResource) {
    setResources((r) => ({ ...r, [resource.id]: resource }));
    if (!value.some((v) => v.resourceId === resource.id)) {
      onChange([...value, { resourceId: resource.id }]);
    }
    setQuery('');
    setResults([]);
  }

  function removeStep(resourceId: string) {
    onChange(value.filter((v) => v.resourceId !== resourceId));
  }

  function setNote(resourceId: string, note: string) {
    onChange(value.map((v) => (v.resourceId === resourceId ? { ...v, note: note || undefined } : v)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="space-y-1.5">
        {value.length === 0 && (
          <p className="text-[12.5px] text-slate-400">No steps yet — search below to add resources, in order.</p>
        )}
        {value.map((step, index) => {
          const resource = resources[step.resourceId];
          return (
            <div
              key={step.resourceId}
              className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
            >
              <div className="flex flex-col pt-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  className="text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <Badge tone="green" className="mt-0.5 shrink-0">
                {index + 1}
              </Badge>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <BookOpenText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-[13px] font-medium text-slate-700">
                    {resource?.title || step.resourceId}
                  </span>
                </div>
                <Input
                  className="h-7 text-[12.5px]"
                  placeholder="Optional note for this step…"
                  value={step.note || ''}
                  onChange={(e) => setNote(step.resourceId, e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeStep(step.resourceId)}
                className="mt-0.5 shrink-0 text-slate-400 hover:text-red-600"
                title="Remove step"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-8"
          placeholder="Search developer resources to add…"
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
            <p className="px-3 py-2 text-[12.5px] text-slate-400">No matching resources</p>
          ) : (
            results.map((resource) => {
              const already = value.some((v) => v.resourceId === resource.id);
              return (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => addResource(resource)}
                  disabled={already}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <span className="truncate">{resource.title}</span>
                  <span className="shrink-0 truncate text-[11.5px] text-slate-400">
                    {resource.resourceType.charAt(0) + resource.resourceType.slice(1).toLowerCase()}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
