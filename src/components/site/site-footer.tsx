import Link from "next/link";

const FOOTER_GROUPS = [
  {
    title: "Practice",
    links: [
      { label: "Practice tests", href: "/practice-test" },
      { label: "Active exam catalog", href: "/exam-prep" },
      { label: "Language preparation", href: "/language-prep" },
      { label: "Ask the handbook", href: "/ask-handbook" },
    ],
  },
  {
    title: "Study abroad",
    links: [
      { label: "Destinations", href: "/destinations" },
      { label: "Course finder", href: "/course-finder" },
      { label: "Universities", href: "/universities" },
      { label: "Scholarships", href: "/scholarships" },
    ],
  },
  {
    title: "ALO Education",
    links: [
      { label: "Our services", href: "/services" },
      { label: "Book a consultation", href: "/book-consultation" },
      { label: "Contact", href: "/contact" },
      { label: "Partner portal", href: "/portals" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#0B1F3A] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8 lg:py-12">
        <div className="max-w-sm">
          <Link href="/" aria-label="ALO English home" className="inline-flex items-center gap-2.5 rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#CC3F10] text-xs font-extrabold tracking-wide">ALO</span>
            <span className="text-lg font-extrabold tracking-tight">ALO English</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            English-test practice and study-abroad guidance from ALO Education.
          </p>
          <p className="mt-3 max-w-xs text-xs leading-5 text-slate-400">
            Practice content and feedback are for preparation only. They are not official test questions, provider-endorsed materials or certified scores.
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 text-sm font-bold text-white">{group.title}</h2>
            <ul className="space-y-2.5 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="rounded-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} ALO Education. All rights reserved.</p>
          <nav aria-label="Legal links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy-policy" className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Privacy</Link>
            <Link href="/terms" className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Terms</Link>
            <Link href="/cookie-policy" className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Cookies</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
