import { ExternalLink, Shield } from 'lucide-react';
import { SITE_CONFIG } from '../config';

interface FooterProps {
  isUnlocked: boolean;
  onInstagramClick: () => void;
  onTelegramClick: () => void;
  onLockedTelegramRequest: () => void;
  onOpenPrivacy: () => void;
}

export function Footer({
  isUnlocked,
  onInstagramClick,
  onTelegramClick,
  onLockedTelegramRequest,
  onOpenPrivacy,
}: FooterProps) {
  return (
    <footer className="relative border-t border-white/10 bg-[#06070D]/90 pt-12 pb-24 sm:pb-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="flex items-center gap-3">
              <img
                src={SITE_CONFIG.logoSrc}
                alt={SITE_CONFIG.communityName}
                className="h-9 w-9 rounded-lg border border-white/15"
                referrerPolicy="no-referrer"
              />
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-wide text-white">
                  {SITE_CONFIG.communityName}
                </h2>
                <p className="text-xs text-slate-400">{SITE_CONFIG.footerSubtitle}</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              {SITE_CONFIG.brandName} is the community portal for {SITE_CONFIG.communityName}, featuring local browser verification, original Web Audio soundscapes, and real public counter telemetry.
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
              Community Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={SITE_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onInstagramClick}
                  className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-[#FF1744]"
                >
                  <span>Instagram: {SITE_CONFIG.instagramHandle}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                {isUnlocked ? (
                  <a
                    href={SITE_CONFIG.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onTelegramClick}
                    className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-[#60A5FA]"
                  >
                    <span>Telegram: {SITE_CONFIG.telegramHandle}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={onLockedTelegramRequest}
                    className="cursor-pointer text-left text-slate-300 transition-colors hover:text-[#60A5FA]"
                  >
                    Telegram: Complete Verification to Unlock
                  </button>
                )}
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
              Legal & Privacy
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
                >
                  <Shield className="h-3.5 w-3.5 text-[#60A5FA]" />
                  <span>Privacy Policy</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            © {SITE_CONFIG.copyrightYear} {SITE_CONFIG.communityName}. All rights reserved.
          </p>
          <p>Static Community Portal · Local Browser Verification</p>
        </div>
      </div>
    </footer>
  );
}
