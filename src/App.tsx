import { useCallback, useEffect, useState } from 'react';
import { SITE_CONFIG, type ShowcaseAsset } from './config';
import {
  initializeVisitorAnalytics,
  recordAnalyticsEvent,
  type AnalyticsSnapshot,
} from './services/analytics';
import { ParticleCanvas } from './components/ParticleCanvas';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ShowcaseGallery } from './components/ShowcaseGallery';
import {
  InstagramVerification,
  type VerificationState,
} from './components/InstagramVerification';
import { AnalyticsSection } from './components/AnalyticsSection';
import { PhonkPlayer } from './components/PhonkPlayer';
import { Footer } from './components/Footer';
import { LightboxModal, PrivacyModal } from './components/Modals';

const VERIFICATION_STORAGE_KEY = 'apex_verification_v1';

const DEFAULT_VERIFICATION: VerificationState = {
  instagramClicked: false,
  unlocked: false,
  unlockedAt: null,
  lastFileName: null,
  lastDimensions: null,
};

function loadVerificationState(): VerificationState {
  try {
    const raw = window.localStorage.getItem(VERIFICATION_STORAGE_KEY);
    if (!raw) return DEFAULT_VERIFICATION;
    const parsed = JSON.parse(raw) as Partial<VerificationState>;
    return {
      instagramClicked: Boolean(parsed.instagramClicked),
      unlocked: Boolean(parsed.unlocked),
      unlockedAt: typeof parsed.unlockedAt === 'string' ? parsed.unlockedAt : null,
      lastFileName: typeof parsed.lastFileName === 'string' ? parsed.lastFileName : null,
      lastDimensions: typeof parsed.lastDimensions === 'string' ? parsed.lastDimensions : null,
    };
  } catch {
    return DEFAULT_VERIFICATION;
  }
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const [verification, setVerification] = useState<VerificationState>(loadVerificationState);
  const [lightboxAsset, setLightboxAsset] = useState<ShowcaseAsset | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot>({
    source: 'local-only',
    globalCounts: {
      visitors: null,
      telegramClicks: null,
      instagramClicks: null,
      screenshotAttempts: null,
    },
    localCounts: {
      visitors: 0,
      telegramClicks: 0,
      instagramClicks: 0,
      screenshotAttempts: 0,
    },
    lastUpdated: '',
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verification));
    } catch {
      // Ignore private browsing quota errors
    }
  }, [verification]);

  useEffect(() => {
    let active = true;
    void initializeVisitorAnalytics().then((snapshot) => {
      if (active) {
        setAnalytics(snapshot);
        setAnalyticsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const scrollToVerification = useCallback(() => {
    const el = document.getElementById('verification');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleInstagramClick = useCallback(() => {
    setVerification((prev) => ({ ...prev, instagramClicked: true }));
    void recordAnalyticsEvent('instagramClicks', analytics).then(setAnalytics);
  }, [analytics]);

  const handleTelegramClick = useCallback(() => {
    void recordAnalyticsEvent('telegramClicks', analytics).then(setAnalytics);
  }, [analytics]);

  const handleScreenshotAttempt = useCallback(() => {
    void recordAnalyticsEvent('screenshotAttempts', analytics).then(setAnalytics);
  }, [analytics]);

  const handleUnlockSuccess = useCallback(
    (meta: { fileName: string; dimensions: string }) => {
      setVerification((prev) => ({
        ...prev,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        lastFileName: meta.fileName,
        lastDimensions: meta.dimensions,
      }));
    },
    []
  );

  const handleResetVerification = useCallback(() => {
    setVerification((prev) => ({
      ...DEFAULT_VERIFICATION,
      instagramClicked: prev.instagramClicked,
    }));
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#080910] text-white">
      {!introDone && <LoadingScreen onComplete={handleIntroComplete} />}

      <ParticleCanvas />

      <Navbar
        isUnlocked={verification.unlocked}
        onPrimaryAction={scrollToVerification}
        onTelegramClick={handleTelegramClick}
      />

      <main className="relative z-10">
        <HeroSection
          isUnlocked={verification.unlocked}
          onGetStarted={scrollToVerification}
          onJoinTelegram={handleTelegramClick}
          onOpenLightbox={setLightboxAsset}
        />

        <ShowcaseGallery onOpenLightbox={setLightboxAsset} />

        <InstagramVerification
          verification={verification}
          onInstagramClick={handleInstagramClick}
          onTelegramClick={handleTelegramClick}
          onScreenshotAttempt={handleScreenshotAttempt}
          onUnlockSuccess={handleUnlockSuccess}
          onResetVerification={handleResetVerification}
        />

        <AnalyticsSection analytics={analytics} isLoading={analyticsLoading} />
      </main>

      <Footer
        isUnlocked={verification.unlocked}
        onInstagramClick={handleInstagramClick}
        onTelegramClick={handleTelegramClick}
        onLockedTelegramRequest={scrollToVerification}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />

      <PhonkPlayer />

      <LightboxModal asset={lightboxAsset} onClose={() => setLightboxAsset(null)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />

      {/* Accessible screen-reader announcement for unlock completion */}
      <div className="sr-only" aria-live="polite">
        {verification.unlocked
          ? `${SITE_CONFIG.brandName} Telegram access unlocked.`
          : ''}
      </div>
    </div>
  );
}
