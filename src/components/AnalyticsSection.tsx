import { Eye, Instagram, Send, UploadCloud } from 'lucide-react';
import { type AnalyticsMetricKey, type AnalyticsSnapshot } from '../services/analytics';

interface AnalyticsSectionProps {
  analytics: AnalyticsSnapshot;
  isLoading: boolean;
}

const METRIC_CARDS: Array<{
  key: AnalyticsMetricKey;
  label: string;
  subtext: string;
  accentClass: string;
  icon: typeof Eye;
}> = [
  {
    key: 'visitors',
    label: 'Total Visitors',
    subtext: 'Unique browser sessions recorded',
    accentClass: 'text-[#60A5FA]',
    icon: Eye,
  },
  {
    key: 'telegramClicks',
    label: 'Telegram Button Clicks',
    subtext: 'Unlocked bot link opens',
    accentClass: 'text-[#8B35FF]',
    icon: Send,
  },
  {
    key: 'instagramClicks',
    label: 'Instagram Button Clicks',
    subtext: 'Profile visits to @apex.carnage.live',
    accentClass: 'text-[#FF1744]',
    icon: Instagram,
  },
  {
    key: 'screenshotAttempts',
    label: 'Screenshot Submissions',
    subtext: 'Local verification attempts checked',
    accentClass: 'text-white',
    icon: UploadCloud,
  },
];

export function AnalyticsSection({ analytics, isLoading }: AnalyticsSectionProps) {
  const isGlobal = analytics.source === 'counterapi-v2';

  return (
    <section id="analytics" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#8B35FF] uppercase">
              03 · Live Portal Metrics
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white text-balance sm:text-4xl">
              Community Traffic & Click Analytics
            </h2>
          </div>

          <p className="max-w-md text-xs leading-relaxed text-slate-400">
            {isGlobal
              ? 'Connected to CounterAPI v2 public workspace counters for live global visitor and click counts.'
              : analytics.source === 'offline'
              ? 'CounterAPI v2 is currently unreachable; displaying real counts recorded on this browser.'
              : 'Displaying real counts recorded on this browser. Add your free CounterAPI v2 workspace slug in src/config.ts to aggregate global counts across all visitors.'}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {METRIC_CARDS.map((card) => {
            const Icon = card.icon;
            const globalVal = analytics.globalCounts[card.key];
            const localVal = analytics.localCounts[card.key];
            const displayVal = isGlobal && globalVal !== null ? globalVal : localVal;

            return (
              <div
                key={card.key}
                className="apex-glass rounded-2xl p-6 transition-colors hover:border-white/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    {isGlobal && globalVal !== null ? 'Global' : 'This Browser'}
                  </span>
                  <Icon className={`h-4 w-4 ${card.accentClass}`} aria-hidden="true" />
                </div>

                <p className="mt-4 font-mono text-4xl font-semibold tracking-tight text-white tabular-nums">
                  {isLoading ? '—' : displayVal.toLocaleString()}
                </p>

                <h3 className="mt-2 font-display text-xl font-bold tracking-wide text-white">
                  {card.label}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{card.subtext}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
