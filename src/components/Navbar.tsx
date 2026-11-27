import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SITE_CONFIG } from '../config';

interface NavbarProps {
  isUnlocked: boolean;
  onPrimaryAction: () => void;
  onTelegramClick: () => void;
}

const NAV_LINKS = [
  { label: 'Overview', href: '#hero' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Verify Access', href: '#verification' },
  { label: 'Analytics', href: '#analytics' },
];

export function Navbar({ isUnlocked, onPrimaryAction, onTelegramClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080910]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#hero"
          className="flex shrink-0 items-center gap-3 whitespace-nowrap text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066FF]"
        >
          <img
            src={SITE_CONFIG.logoSrc}
            alt={SITE_CONFIG.brandName}
            className="h-8 w-8 rounded-lg border border-white/15 object-cover"
            referrerPolicy="no-referrer"
          />
          <span className="font-display text-xl font-extrabold tracking-wide whitespace-nowrap shrink-0">
            {SITE_CONFIG.brandName}
          </span>
        </a>

        {/* Zone 2: Concise Single-Line Nav Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative whitespace-nowrap shrink-0 text-sm font-medium text-slate-300 transition-colors duration-150 hover:text-white after:absolute after:right-0 after:-bottom-1 after:left-0 after:h-[2px] after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-[#FF1744] after:to-[#0066FF] after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066FF]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Drawer Toggle */}
        <div className="flex shrink-0 items-center gap-3">
          {isUnlocked ? (
            <a
              href={SITE_CONFIG.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onTelegramClick}
              className="hidden whitespace-nowrap shrink-0 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8B35FF] px-4 py-2 text-xs font-semibold tracking-wide text-white transition-transform duration-150 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF] sm:inline-flex"
            >
              Open Telegram
            </a>
          ) : (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="hidden whitespace-nowrap shrink-0 cursor-pointer rounded-lg bg-gradient-to-r from-[#D90024] to-[#FF1744] px-4 py-2 text-xs font-semibold tracking-wide text-white transition-transform duration-150 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF1744] sm:inline-flex"
            >
              Get Started
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-200 transition-colors hover:border-white/25 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#080910]/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            {isUnlocked ? (
              <a
                href={SITE_CONFIG.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onTelegramClick();
                }}
                className="mt-1 block w-full rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8B35FF] px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Open Telegram
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPrimaryAction();
                }}
                className="mt-1 w-full cursor-pointer rounded-lg bg-gradient-to-r from-[#D90024] to-[#FF1744] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Get Started
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
