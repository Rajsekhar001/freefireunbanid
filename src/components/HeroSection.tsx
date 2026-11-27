import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownRight, Send, Expand } from 'lucide-react';
import { SHOWCASE_ASSETS, SITE_CONFIG, type ShowcaseAsset } from '../config';

interface HeroSectionProps {
  isUnlocked: boolean;
  onGetStarted: () => void;
  onJoinTelegram: () => void;
  onOpenLightbox: (asset: ShowcaseAsset) => void;
}

export function HeroSection({
  isUnlocked,
  onGetStarted,
  onJoinTelegram,
  onOpenLightbox,
}: HeroSectionProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const currentAsset = SHOWCASE_ASSETS[activeSlide] ?? SHOWCASE_ASSETS[0];

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28"
    >
      {/* Ambient cinematic lighting glows */}
      <div className="pointer-events-none absolute -top-28 -left-24 h-96 w-96 rounded-full bg-[#D90024]/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-16 right-0 h-[28rem] w-[28rem] rounded-full bg-[#0066FF]/18 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#8B35FF]/14 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Narrative Column */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-6"
          >
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
              {SITE_CONFIG.communityName}
              <span aria-hidden="true" className="mx-2 text-[#FF1744]">
                ·
              </span>
              Community Access Portal
            </p>

            <h1 className="mt-4 font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
              <span className="animate-gradient-text">{SITE_CONFIG.brandName}</span>
            </h1>

            <p className="mt-4 font-display text-xl font-bold tracking-wide text-white/95 sm:text-2xl">
              “{SITE_CONFIG.tagline}”
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-[1.05rem]">
              {SITE_CONFIG.description}
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onGetStarted}
                className="neon-red-glow inline-flex min-h-[46px] cursor-pointer items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#D90024] via-[#FF1744] to-[#D90024] px-6 py-3 text-sm font-bold tracking-wider text-white uppercase whitespace-nowrap shrink-0 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF1744]"
              >
                <span>GET STARTED</span>
                <ArrowDownRight className="h-4 w-4" />
              </button>

              {isUnlocked ? (
                <a
                  href={SITE_CONFIG.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onJoinTelegram}
                  className="neon-blue-glow inline-flex min-h-[46px] items-center gap-2.5 rounded-xl border border-[#0066FF]/55 bg-[#0066FF]/20 px-6 py-3 text-sm font-bold tracking-wider text-white uppercase whitespace-nowrap shrink-0 transition-all duration-150 hover:border-[#0066FF] hover:bg-[#0066FF]/35 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF]"
                >
                  <Send className="h-4 w-4 text-[#60A5FA]" />
                  <span>OPEN TELEGRAM BOT</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="neon-blue-glow inline-flex min-h-[46px] cursor-pointer items-center gap-2.5 rounded-xl border border-[#0066FF]/55 bg-[#0066FF]/15 px-6 py-3 text-sm font-bold tracking-wider text-white uppercase whitespace-nowrap shrink-0 transition-all duration-150 hover:border-[#0066FF] hover:bg-[#0066FF]/28 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF]"
                >
                  <Send className="h-4 w-4 text-[#60A5FA]" />
                  <span>JOIN TELEGRAM</span>
                </button>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-400">
              <span>Instagram {SITE_CONFIG.instagramHandle}</span>
              <span aria-hidden="true">·</span>
              <span>Local Browser Verification</span>
              <span aria-hidden="true">·</span>
              <span>{isUnlocked ? 'Telegram Access Unlocked' : 'Verify Screenshot to Unlock'}</span>
            </div>
          </motion.div>

          {/* Right Cinematic Visual Banner Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-6"
          >
            <div className="apex-glass apex-gradient-border group relative overflow-hidden rounded-2xl p-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0C0E18]">
                <img
                  src={currentAsset.src}
                  alt={currentAsset.alt}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />

                {/* Cinematic dark gradient scrim for crisp caption legibility */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080910]/90 via-[#080910]/20 to-transparent" />

                <button
                  type="button"
                  onClick={() => onOpenLightbox(currentAsset)}
                  aria-label={`Inspect ${currentAsset.title} full screen`}
                  className="absolute top-3 right-3 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-[#080910]/75 text-white backdrop-blur-md transition-colors hover:border-[#0066FF] hover:bg-[#0066FF]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Expand className="h-4 w-4" />
                </button>

                <div className="absolute right-4 bottom-3.5 left-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-300">
                      {currentAsset.category}
                    </p>
                    <p className="font-display text-lg font-bold tracking-wide text-white">
                      {currentAsset.title}
                    </p>
                  </div>

                  {/* Interactive slide switcher between the user's two provided photos */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#080910]/80 p-1 backdrop-blur-md">
                    {SHOWCASE_ASSETS.map((asset, index) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                          activeSlide === index
                            ? 'bg-gradient-to-r from-[#FF1744] to-[#0066FF] text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        0{index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
