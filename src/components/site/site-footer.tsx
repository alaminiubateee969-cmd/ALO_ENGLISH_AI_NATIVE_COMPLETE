import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg text-white mb-3">
            <span className="rounded bg-blue-600 px-2 py-1 text-sm">ALO</span> Education
          </div>
          <p className="text-sm">Study abroad consultancy. UK, Canada, Australia, USA, Ireland, NZ, Dubai.</p>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-3 text-sm">Study Destinations</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/destinations" className="hover:text-white">All Destinations</Link></li>
            <li><Link href="/destinations" className="hover:text-white">UK</Link></li>
            <li><Link href="/destinations" className="hover:text-white">Canada</Link></li>
            <li><Link href="/destinations" className="hover:text-white">Australia</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-3 text-sm">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/universities" className="hover:text-white">Universities</Link></li>
            <li><Link href="/scholarships" className="hover:text-white">Scholarships</Link></li>
            <li><Link href="/course-finder" className="hover:text-white">Course Finder</Link></li>
            <li><Link href="/language-prep" className="hover:text-white">Language Prep</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-3 text-sm">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/events" className="hover:text-white">Events</Link></li>
            <li><Link href="/portals" className="hover:text-white">Portals</Link></li>
            <li><Link href="/book-consultation" className="hover:text-white">Book Consultation</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} ALO Education. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/cookie-policy" className="hover:text-white">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
