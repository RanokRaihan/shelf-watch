"use client";

import { Check, ChevronDown, Package, SkipForward } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDay } from "@/lib/format/calendar-day";
import type { MarkPullStatus, PullItemCard as PullItem } from "@/lib/pulls/pull-items";

// `barcodeSvg` is rendered on the server; null when the value couldn't be encoded.
export type PullItemCardData = PullItem & { barcodeSvg: string | null };

type PullItemCardProps = {
  item: PullItemCardData;
  // Without it the card has no buttons (Upcoming).
  onMark?: (status: MarkPullStatus) => void;
};

function locationText({ aisle, section, shelf }: PullItem): string {
  return [aisle && `Aisle ${aisle}`, section && `Section ${section}`, shelf && `Shelf ${shelf}`]
    .filter(Boolean)
    .join(" · ");
}

function ProductImage({ src, name }: { src: string | null; name: string }) {
  if (!src) {
    return (
      <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
        <Package aria-hidden="true" className="size-8" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={name}
      width={80}
      height={80}
      className="size-20 shrink-0 rounded-lg border bg-muted object-contain"
    />
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-base break-words">{value ?? "Not set"}</dd>
    </div>
  );
}

function MoreDetails({ item }: { item: PullItem }) {
  return (
    <Collapsible className="rounded-lg border px-3">
      <CollapsibleTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="group h-11 w-full justify-between px-0 text-base hover:bg-transparent"
          />
        }
      >
        More details
        <ChevronDown
          aria-hidden="true"
          className="transition-transform group-data-panel-open:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <dl className="grid grid-cols-2 gap-3 pb-3">
          <Detail label="Category" value={item.category} />
          <Detail label="Item number" value={item.itemNumber} />
          <Detail label="Added by" value={item.addedBy} />
          <Detail label="Added on" value={formatDay(item.addedOn)} />
        </dl>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PullItemCard({ item, onMark }: PullItemCardProps) {
  const details = [item.brand, item.size].filter(Boolean).join(" · ");
  const location = locationText(item);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-3">
          <ProductImage src={item.imageUrl} name={item.name} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-base font-medium break-words">{item.name}</p>
            {details && <p className="text-sm text-muted-foreground break-words">{details}</p>}
            {location && <p className="text-sm break-words">{location}</p>}
          </div>
        </div>
        <MoreDetails item={item} />
        {item.barcodeSvg ? (
          <div
            role="img"
            aria-label={`Barcode ${item.barcodeValue}`}
            className="flex justify-center rounded-lg bg-white p-3 [&_svg]:h-24 [&_svg]:w-auto"
            dangerouslySetInnerHTML={{ __html: item.barcodeSvg }}
          />
        ) : (
          <p className="text-center font-mono text-base tracking-wider">{item.barcodeValue}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Expires</span>
            <span className="text-base">
              {item.expiryDate ? formatDay(item.expiryDate) : "Not set"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Pull on</span>
            <span className="text-base font-medium">{formatDay(item.pullDate)}</span>
          </div>
        </div>
      </CardContent>
      {onMark && (
        <CardFooter className="grid grid-cols-2 gap-3">
          <Button onClick={() => onMark("PULLED")} className="h-12 text-base">
            <Check aria-hidden="true" />
            Pulled
          </Button>
          <Button variant="outline" onClick={() => onMark("SKIPPED")} className="h-12 text-base">
            <SkipForward aria-hidden="true" />
            Skip
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
