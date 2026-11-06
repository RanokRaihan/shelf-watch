import { Check, KeyRound, ScanBarcode, Smartphone, Users } from "lucide-react";
import { Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const CONTAINER = "mx-auto w-full max-w-7xl px-5 sm:px-8";
const DISPLAY =
  "font-(family-name:--font-display) font-extrabold tracking-tight leading-[0.95]";
const CTA_SIZE = "h-14 px-7 text-lg font-bold";

const STEPS = [
  { title: "Scan", text: "Point your phone at the barcode on the product." },
  { title: "Date", text: "Set the date it has to come off the shelf." },
  { title: "Pull", text: "Open the home screen and see what to pull today." },
];

const SAMPLE_LIST = [
  { name: "Oat milk", done: true },
  { name: "Greek yogurt", done: false },
  { name: "Sliced bread", done: false },
  { name: "Hummus", done: false },
];

// Alternating bar and gap widths for the decorative hero barcode.
const BARCODE_WIDTHS = [
  3, 2, 1, 1, 2, 1, 4, 1, 1, 3, 2, 2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 2, 1, 1,
  4, 2, 1, 3, 1, 1, 2, 2, 3, 1, 1, 2, 1, 4, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 4,
  1, 2, 2, 1, 1, 3, 2, 1, 1, 2, 4, 1, 1, 3, 2, 1, 3, 1, 2, 1, 1, 4, 2, 2, 1, 1,
];

function buildBars() {
  const bars: { x: number; width: number }[] = [];
  let x = 0;
  BARCODE_WIDTHS.forEach((width, index) => {
    if (index % 2 === 0) bars.push({ x, width });
    x += width;
  });
  return { bars, total: x };
}

const barcode = buildBars();

function Barcode() {
  return (
    <div
      className="relative h-20 overflow-hidden text-foreground/20 sm:h-28 lg:h-32"
      aria-hidden="true"
    >
      <svg
        className="size-full"
        viewBox={`0 0 ${barcode.total} 10`}
        preserveAspectRatio="none"
      >
        {barcode.bars.map((bar) => (
          <rect
            key={bar.x}
            x={bar.x}
            width={bar.width}
            height="10"
            fill="currentColor"
          />
        ))}
      </svg>
      {/* The one animated moment: a scan line crosses the barcode once on load. */}
      <span className="absolute inset-0 border-r-4 border-primary opacity-0 duration-1900 ease-in-out animate-in fill-mode-backwards delay-300 fade-in-100 slide-in-from-left-full motion-reduce:hidden" />
    </div>
  );
}

function Wordmark() {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-2xl tracking-tight",
        DISPLAY,
      )}
    >
      <ScanBarcode className="size-7" aria-hidden="true" />
      ShelfWatch
    </span>
  );
}

function PhoneMock() {
  return (
    <figure className="mx-auto w-full max-w-sm lg:rotate-2">
      <div
        className="relative rounded-[2.5rem] bg-muted p-3 shadow-xl ring-1 ring-foreground/10"
        aria-hidden="true"
      >
        <Card className="rounded-[1.9rem] p-5 text-base [--card-spacing:0]">
          <p className={cn("text-3xl", DISPLAY)}>Today</p>
          <ul className="mt-4">
            {SAMPLE_LIST.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-3 border-b py-3.5 last:border-b-0"
              >
                <span
                  className={cn(
                    "font-semibold",
                    item.done && "line-through opacity-60",
                  )}
                >
                  {item.name}
                </span>
                {item.done ? (
                  <span className="grid size-8 place-items-center rounded-full bg-muted text-foreground">
                    <Check className="size-5" />
                  </span>
                ) : (
                  <span className="-rotate-3 rounded-md bg-primary px-2.5 py-1 text-sm font-extrabold whitespace-nowrap text-primary-foreground">
                    Pull today
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground">
            <ScanBarcode className="size-5" />
            Scan
          </div>
        </Card>
      </div>
      <figcaption className="mt-6 text-center text-sm text-muted-foreground">
        Sample list
      </figcaption>
    </figure>
  );
}

const TILES = [
  {
    title: "Scan instead of type",
    text: "Scan the barcode and move on. Nobody types long product names on a small screen.",
    Icon: ScanBarcode,
    className: "md:col-span-2 lg:col-span-4",
    titleSize: "text-4xl sm:text-5xl",
  },
  {
    title: "One shared list",
    text: "The whole team works from the same list, so everyone sees what's done and what's left.",
    Icon: Users,
    className: "lg:col-span-2",
    titleSize: "text-3xl",
  },
  {
    title: "Quick PIN sign-in",
    text: "Colleagues sign in with a short PIN, not a long password.",
    Icon: KeyRound,
    className: "lg:col-span-2",
    titleSize: "text-3xl",
  },
  {
    title: "Nothing to install",
    text: "ShelfWatch runs in the phone's browser. There's no app to download.",
    Icon: Smartphone,
    className: "md:col-span-2 lg:col-span-4",
    titleSize: "text-4xl sm:text-5xl",
  },
];

export default function Home() {
  return (
    <div
      className={cn(
        display.variable,
        "flex flex-1 flex-col overflow-x-clip bg-background text-foreground",
      )}
    >
      <div>
        <header
          className={cn(CONTAINER, "flex items-center justify-between py-4")}
        >
          <Wordmark />
          <div className="flex items-center gap-2 sm:gap-4">
            <ModeToggle />
            <Link
              href="/signin"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "hidden h-12 px-3 text-base font-bold sm:inline-flex",
              )}
            >
              Sign in
            </Link>
          </div>
        </header>

        <main>
          <section
            className={cn(
              CONTAINER,
              "grid items-center gap-14 pt-10 pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pt-14 lg:pb-20",
            )}
          >
            <div>
              <h1 className={cn("text-[clamp(3.5rem,13vw,7.75rem)]", DISPLAY)}>
                Know what to pull today.
              </h1>
              <p className="mt-7 max-w-xl text-lg text-muted-foreground sm:text-xl">
                Scan a barcode, set a pull date, and your whole team sees what
                comes off the shelf today.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: "lg" }), CTA_SIZE)}
                >
                  Create your store
                </Link>
                <Link
                  href="/signin"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    CTA_SIZE,
                  )}
                >
                  Sign in
                </Link>
              </div>
            </div>
            <PhoneMock />
          </section>

          <Barcode />
        </main>
      </div>

      <section className="bg-background">
        <div className={cn(CONTAINER, "py-16 sm:py-24")}>
          <h2 className={cn("text-5xl sm:text-6xl", DISPLAY)}>How it works</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex items-start gap-5 md:flex-col md:gap-3"
              >
                <span
                  className={cn(
                    "w-14 shrink-0 text-7xl sm:w-16 sm:text-8xl text-primary md:w-auto dark:text-sidebar-primary",
                    DISPLAY,
                  )}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className={cn("text-3xl", DISPLAY)}>{step.title}</h3>
                  <p className="mt-2 max-w-xs text-lg text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className={CONTAINER}>
        <Separator />
      </div>

      <section>
        <div className={cn(CONTAINER, "py-16 sm:py-24")}>
          <h2 className={cn("max-w-3xl text-5xl sm:text-6xl", DISPLAY)}>
            Made for the store floor
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {TILES.map(({ title, text, Icon, className, titleSize }) => (
              <Card
                key={title}
                className={cn(
                  "[--card-spacing:--spacing(7)] sm:[--card-spacing:--spacing(8)]",
                  className,
                )}
              >
                <CardContent>
                  <Icon
                    className="size-9 text-primary dark:text-sidebar-primary"
                    aria-hidden="true"
                  />
                  <CardTitle className={cn("mt-10", titleSize, DISPLAY)}>
                    {title}
                  </CardTitle>
                  <CardDescription className="mt-3 max-w-md text-lg">
                    {text}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div
          className={cn(
            CONTAINER,
            "flex flex-col gap-8 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between",
          )}
        >
          <h2
            className={cn(
              "max-w-2xl text-5xl text-balance sm:text-6xl lg:text-7xl",
              DISPLAY,
            )}
          >
            Set up your store&apos;s list.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                CTA_SIZE,
              )}
            >
              Create your store
            </Link>
            <Link
              href="/signin"
              className={cn(
                buttonVariants({ size: "lg", variant: "ghost" }),
                CTA_SIZE,
                "ring-2 ring-primary-foreground/60 ring-inset hover:bg-primary-foreground/10 hover:text-primary-foreground dark:hover:bg-primary-foreground/10",
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-muted-foreground">
        <p className={cn(CONTAINER, "py-8 text-base")}>
          A personal project by Ranok Raihan
        </p>
      </footer>
    </div>
  );
}
