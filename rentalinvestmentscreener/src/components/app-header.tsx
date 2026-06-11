import Link from "next/link";

const navigationItems = [
  "Match",
  "Profile",
  "Recommendations",
  "Compliance",
  "Data",
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col justify-center gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-base font-semibold tracking-normal text-zinc-950"
          >
            PropVest AI
          </Link>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
            SF
          </span>
        </div>
        <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
          {navigationItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
