"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/** Collapsed by default; the summary shows what's saved so it rarely needs opening. */
export function LocationFields({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <Collapsible className="flex flex-col gap-3 rounded-lg border px-3 py-2">
      <CollapsibleTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="group h-12 w-full justify-between px-0 text-base hover:bg-transparent"
          />
        }
      >
        <span className="flex flex-col items-start">
          <span className="font-medium">Location (optional)</span>
          <span className="text-sm font-normal text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="transition-transform group-data-panel-open:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid grid-cols-3 gap-3 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
