import { Link, useLocation } from "@tanstack/react-router";
import { Home, LayoutGrid, PlusCircle, Bookmark, User, Search } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/upload", label: "Upload", icon: PlusCircle },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function Header({ title, back }: { title?: string; back?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-brand text-primary-foreground shadow-card">
      <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
        {back}
        {title ? (
          <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
        ) : (
          <Link to="/" className="flex flex-1 items-baseline gap-1">
            <span className="font-display text-2xl font-black italic text-sky">Dooars</span>
            <span className="font-display text-2xl font-black">Khabar</span>
          </Link>
        )}
        <Link to="/search" aria-label="Search" className="rounded-full p-2 hover:bg-primary-foreground/10">
          <Search className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const isUpload = to === "/upload";
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isUpload ? (
                  <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-sky text-secondary-foreground shadow-card ring-4 ring-card">
                    <PlusCircle className="h-6 w-6" />
                  </span>
                ) : (
                  <span className={`rounded-full px-4 py-1 ${active ? "bg-sky-soft" : ""}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-xl pb-24 animate-rise">{children}</main>;
}
