import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: ROUTES.privacyPolicy },
      { label: 'Terms of Service', href: ROUTES.termsOfService },
      { label: 'Data Deletion', href: ROUTES.dataDeletion },
      { label: 'Meta Platform Policy', href: 'https://developers.facebook.com/policy' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link to={ROUTES.home} className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg tracking-tight">InstaAuto</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Turn Reel comments into DMs, automatically — built on Meta&apos;s official Instagram Messaging API.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} InstaAuto. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Not affiliated with Meta or Instagram.</p>
        </div>
      </div>
    </footer>
  );
}
