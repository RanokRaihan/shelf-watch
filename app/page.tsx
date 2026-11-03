export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center font-sans">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        ShelfWatch
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        You&apos;re in the right place.
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Scan it, date it, pull it on time.
      </p>
    </main>
  );
}
