import Link from "next/link";

const navigationItems = [
  { href: "#search", label: "Search" },
  { href: "#results", label: "Results" },
  { href: "#details", label: "Details" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="whitespace-nowrap text-base font-semibold tracking-normal text-zinc-950"
          >
            PropVest AI
          </Link>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
            SF
          </span>
        </div>
        <nav
          aria-label="Primary navigation"
          className="flex shrink-0 items-center gap-1"
        >
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:px-3"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
