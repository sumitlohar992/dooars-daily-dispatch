import { Link, useLocation } from "@tanstack/react-router";
import { Home, LayoutGrid, PlusCircle, Bookmark, User, Search, Languages } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LANGS, useT } from "@/lib/i18n";

const NAV = [
  { to: "/", label: "home", icon: Home },
  { to: "/categories", label: "categories", icon: LayoutGrid },
  { to: "/upload", label: "upload", icon: PlusCircle },
  { to: "/saved", label: "saved", icon: Bookmark },
  { to: "/profile", label: "profile", icon: User },
] as const;

export function Header({ title, back }: { title?: string; back?: ReactNode }) {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-30 bg-brand text-primary-foreground shadow-card">
      <div className="mx-auto flex h-14 max-w-xl md:max-w-3xl lg:max-w-5xl items-center gap-3 px-4">
        {back}
        {title ? (
          <h1 className="flex-1 truncate text-lg font-bold">{t(title)}</h1>
        ) : (
          <Link to="/" className="flex flex-1 items-center gap-1.5">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-2xl font-black italic text-sky">Dooars</span>
            <span className="font-display text-2xl font-black">Khabar</span>
          </Link>
        )}
        <LanguagePicker />
        <Link
          to="/search"
          aria-label="Search"
          className="rounded-full p-2 hover:bg-primary-foreground/10"
        >
          <Search className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}

function LanguagePicker() {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={t("language")}
        className="flex items-center gap-1 rounded-full p-2 text-sm font-semibold hover:bg-primary-foreground/10"
      >
        <Languages className="h-5 w-5" />
        <span className="uppercase">{lang}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-card">
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-3 text-left font-semibold ${lang === l.code ? "bg-sky-soft text-primary" : "hover:bg-muted"}`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl md:max-w-3xl lg:max-w-5xl grid-cols-5">
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
                {t(label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-xl md:max-w-3xl lg:max-w-5xl pb-24 animate-rise">
      {children}
    </main>
  );
}
