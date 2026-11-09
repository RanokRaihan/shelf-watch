import { ArrowLeft, ScanBarcode } from "lucide-react";
import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found | ShelfWatch",
};

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const DISPLAY =
  "font-(family-name:--font-display) font-extrabold tracking-tight leading-[0.95]";

const PACK_SHAPES = {
  carton:
    "h-[88%] rounded-b-sm [clip-path:polygon(0_12%,50%_0,100%_12%,100%_100%,0_100%)]",
  bottle: "h-full rounded-t-[1.75rem] rounded-b-sm",
  loaf: "h-[58%] rounded-t-[2rem] rounded-b-sm",
  box: "h-[74%] rounded-t-sm rounded-b-sm",
  tub: "h-[42%] rounded-t-lg rounded-b-sm",
};

type Pack = {
  name: string;
  shape: keyof typeof PACK_SHAPES;
  tone: string;
};

const TOP_SHELF: Pack[] = [
  { name: "Orange juice", shape: "carton", tone: "bg-foreground/25" },
  { name: "Cold brew", shape: "bottle", tone: "bg-foreground/15" },
  { name: "Butter", shape: "tub", tone: "bg-foreground/30" },
  { name: "Granola", shape: "box", tone: "bg-foreground/20" },
  { name: "Salsa", shape: "loaf", tone: "bg-foreground/15" },
];

// `null` is the empty spot, in the middle of the shelf.
const BOTTOM_SHELF: (Pack | null)[] = [
  { name: "Oat milk", shape: "carton", tone: "bg-foreground/15" },
  { name: "Greek yogurt", shape: "tub", tone: "bg-foreground/30" },
  null,
  { name: "Sliced bread", shape: "loaf", tone: "bg-foreground/20" },
  { name: "Hummus", shape: "tub", tone: "bg-foreground/25" },
];

const SHELF_ROW = "grid grid-cols-5 gap-1.5 px-2 sm:gap-2.5 sm:px-3";
const TAG = "rounded-sm px-1 py-1 text-center text-[0.65rem] leading-tight sm:text-xs";

function PackShape({ pack }: { pack: Pack }) {
  return (
    <div
      className={cn("relative w-full", PACK_SHAPES[pack.shape], pack.tone)}
    >
      <span className="absolute inset-x-1 top-1/2 h-1/4 -translate-y-1/2 rounded-xs bg-background/50" />
    </div>
  );
}

function Shelf({
  packs,
  className,
}: {
  packs: (Pack | null)[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div className={cn(SHELF_ROW, "relative h-36 items-end overflow-hidden sm:h-44")}>
        {packs.map((pack) =>
          pack ? (
            <PackShape key={pack.name} pack={pack} />
          ) : (
            <div
              key="empty"
              className="h-full rounded-t-md border-2 border-b-0 border-dashed border-primary/60"
            />
          ),
        )}
        {packs.includes(null) && (
          <span className="absolute inset-y-0 left-0 w-full border-r-4 border-primary duration-4000 ease-[linear(0,0.04_8%,0.16_16%,0.32_25%,0.42_33%,0.47_42%,0.5_50%,0.53_58%,0.58_67%,0.68_75%,0.84_84%,0.96_92%,1)] animate-in repeat-infinite direction-alternate slide-in-from-left-full motion-reduce:hidden" />
        )}
      </div>
      <div className="h-2 bg-foreground/30" />
      <div className={cn(SHELF_ROW, "items-stretch bg-card py-1.5")}>
        {packs.map((pack) =>
          pack ? (
            <span
              key={pack.name}
              className={cn(TAG, "bg-muted text-muted-foreground")}
            >
              {pack.name}
            </span>
          ) : (
            <span
              key="empty"
              className={cn(
                TAG,
                "grid place-items-center bg-primary text-sm font-extrabold text-primary-foreground duration-300 animate-in fill-mode-backwards delay-300 fade-in sm:text-base motion-reduce:animate-none",
              )}
            >
              404
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <div
      className={cn(
        display.variable,
        "flex flex-1 flex-col overflow-x-clip bg-background text-foreground",
      )}
    >
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className={cn(
            "inline-flex items-center gap-2 text-2xl tracking-tight",
            DISPLAY,
          )}
        >
          <ScanBarcode className="size-7" aria-hidden="true" />
          ShelfWatch
        </Link>
        <ModeToggle />
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 pt-6 pb-12 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-20">
        <div className="flex flex-col items-start gap-6">
          <h1 className={cn("text-5xl sm:text-7xl", DISPLAY)}>
            This page isn&rsquo;t on the shelf
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            The link may be old or mistyped. Check the address, or go back to
            the home page.
          </p>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "h-14 w-full px-7 text-lg font-bold sm:w-auto",
            )}
          >
            <ArrowLeft data-icon="inline-start" className="size-5" aria-hidden="true" />
            Go to home page
          </Link>
        </div>

        <div
          className="flex flex-col gap-4 overflow-hidden rounded-xl bg-muted py-4 ring-1 ring-foreground/10"
          aria-hidden="true"
        >
          <Shelf packs={TOP_SHELF} className="hidden lg:block" />
          <Shelf packs={BOTTOM_SHELF} />
        </div>
      </main>
    </div>
  );
}
