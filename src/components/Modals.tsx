import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SITE_CONFIG, type ShowcaseAsset } from '../config';

interface LightboxModalProps {
  asset: ShowcaseAsset | null;
  onClose: () => void;
}

export function LightboxModal({ asset, onClose }: LightboxModalProps) {
  useEffect(() => {
    if (!asset) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [asset, onClose]);

  if (!asset) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={asset.title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04050A]/90 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="apex-glass apex-gradient-border relative w-full max-w-5xl overflow-hidden rounded-2xl p-3"
      >
        <div className="flex items-center justify-between gap-4 px-2 pb-3">
          <div>
            <p className="text-xs font-medium text-slate-400">{asset.category}</p>
            <h3 className="font-display text-2xl font-bold text-white">{asset.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-[#FF1744] hover:bg-[#FF1744]/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl bg-[#080910]">
          <img
            src={asset.src}
            alt={asset.alt}
            referrerPolicy="no-referrer"
            className="max-h-[75vh] w-full object-contain"
          />
        </div>
        <p className="px-2 pt-3 pb-1 text-sm text-slate-300">{asset.caption}</p>
      </div>
    </div>
  );
}

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04050A]/85 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="apex-glass apex-gradient-border relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#60A5FA] uppercase">
              {SITE_CONFIG.communityName}
            </p>
            <h2
              id="privacy-policy-title"
              className="mt-1 font-display text-3xl font-extrabold text-white"
            >
              Privacy Policy & Local Verification Notice
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy policy"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/15 text-slate-300 transition-colors hover:border-white/30 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300">
          <section>
            <h3 className="font-semibold text-white">1. Zero Screenshot Uploads</h3>
            <p className="mt-1">
              Screenshots selected during Step 2 are read exclusively inside your web browser using local object URLs for preview and dimension validation. Images are never uploaded, transmitted, or stored on any external server or database.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-white">2. Local Verification Disclaimer</h3>
            <p className="mt-1">
              The confirmation step is a local browser check and user attestation only. This site does not connect to Instagram’s private APIs or claim automated server-side follow verification.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-white">3. Browser Storage (localStorage & sessionStorage)</h3>
            <p className="mt-1">
              We use browser storage solely to remember whether you completed the local verification gate, save your APEX PHONK MODE audio volume/mute preference, and prevent duplicate visitor counts within the same tab session.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-white">4. Anonymous Public Counters</h3>
            <p className="mt-1">
              When CounterAPI v2 is configured, anonymous numeric increment requests are sent for total visitors, Instagram link clicks, Telegram link clicks, and screenshot submission attempts. No personal identifiers, IP logs, or image files are collected by this portal.
            </p>
          </section>
        </div>

        <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
