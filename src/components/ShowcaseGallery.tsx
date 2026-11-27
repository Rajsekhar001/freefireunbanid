import { motion } from 'motion/react';
import { Expand } from 'lucide-react';
import { SHOWCASE_ASSETS, type ShowcaseAsset } from '../config';

interface ShowcaseGalleryProps {
  onOpenLightbox: (asset: ShowcaseAsset) => void;
}

export function ShowcaseGallery({ onOpenLightbox }: ShowcaseGalleryProps) {
  return (
    <section id="showcase" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#60A5FA] uppercase">
              01 · Visual Showcase
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white text-balance sm:text-4xl">
              Community Highlights & Bot Previews
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Official artwork and community service previews from APEX CARNAGE LIVE. Click any banner to inspect full detail.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2">
          {SHOWCASE_ASSETS.map((asset, index) => (
            <motion.article
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="apex-glass apex-gradient-border group flex flex-col overflow-hidden rounded-2xl p-3 transition-transform duration-200 hover:-translate-y-1"
            >
              <button
                type="button"
                onClick={() => onOpenLightbox(asset)}
                className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-[#0C0E18] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF]"
                aria-label={`Open full view of ${asset.title}`}
              >
                <img
                  src={asset.src}
                  alt={asset.alt}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080910]/85 via-transparent to-transparent" />
                <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#080910]/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors group-hover:border-[#FF1744]/60">
                  <Expand className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                </span>
              </button>

              <div className="px-2 pt-4 pb-2">
                <p className="text-xs font-medium text-slate-400">
                  0{index + 1} · {asset.category}
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold tracking-wide text-white">
                  {asset.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  {asset.caption}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
