"use client";

import { useState } from "react";
import { toast } from "sonner";

import { markPullItemAction, undoPullItemAction } from "@/actions/pulls.action";
import { PullItemCard, type PullItemCardData } from "@/components/pulls/pull-item-card";
import type { MarkPullStatus } from "@/lib/pulls/pull-items";

type PullListProps = {
  items: PullItemCardData[];
  actionable: boolean;
  empty: React.ReactNode;
};

// Marked items hide right away; the action's refresh() then drops them from `items`.
export function PullList({ items, actionable, empty }: PullListProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  function setHiddenId(id: string, hide: boolean) {
    setHidden((current) => {
      const next = new Set(current);
      if (hide) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function undo(id: string) {
    const result = await undoPullItemAction({ id });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setHiddenId(id, false);
    toast.success(result.message);
  }

  async function mark(item: PullItemCardData, status: MarkPullStatus) {
    setHiddenId(item.id, true);
    const result = await markPullItemAction({ id: item.id, status });
    if (!result.ok) {
      setHiddenId(item.id, false);
      toast.error(result.error.message);
      return;
    }
    toast.success(result.message, {
      description: item.name,
      action: { label: "Undo", onClick: () => void undo(item.id) },
    });
  }

  const visible = items.filter((item) => !hidden.has(item.id));
  if (visible.length === 0) return empty;

  return (
    <ul className="flex flex-col gap-3">
      {visible.map((item) => (
        <li key={item.id}>
          <PullItemCard
            item={item}
            onMark={actionable ? (status) => void mark(item, status) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
