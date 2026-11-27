import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  ImagePlus,
  Lock,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  Unlock,
} from 'lucide-react';
import { SITE_CONFIG } from '../config';

export interface VerificationState {
  instagramClicked: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  lastFileName: string | null;
  lastDimensions: string | null;
}

interface InstagramVerificationProps {
  verification: VerificationState;
  onInstagramClick: () => void;
  onTelegramClick: () => void;
  onScreenshotAttempt: () => void;
  onUnlockSuccess: (meta: { fileName: string; dimensions: string }) => void;
  onResetVerification: () => void;
}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

export function InstagramVerification({
  verification,
  onInstagramClick,
  onTelegramClick,
  onScreenshotAttempt,
  onUnlockSuccess,
  onResetVerification,
}: InstagramVerificationProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(verification.lastFileName);
  const [dimensions, setDimensions] = useState<string | null>(verification.lastDimensions);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedFollow, setConfirmedFollow] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    setDimensions(null);
    setConfirmedFollow(false);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    onScreenshotAttempt();

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, or GIF).');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg('Image exceeds the 15 MB browser limit. Please upload a smaller screenshot.');
      return;
    }

    setIsProcessing(true);
    const objectUrl = URL.createObjectURL(file);
    const probe = new Image();

    probe.onload = () => {
      if (probe.naturalWidth < 80 || probe.naturalHeight < 80) {
        URL.revokeObjectURL(objectUrl);
        setIsProcessing(false);
        setErrorMsg('Screenshot resolution is too small. Please upload a clear follow screenshot.');
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(objectUrl);
      setFileName(file.name);
      setDimensions(`${probe.naturalWidth} × ${probe.naturalHeight} px`);
      setConfirmedFollow(false);
      setIsProcessing(false);
    };

    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setIsProcessing(false);
      setErrorMsg('Could not read that image locally. Please try a PNG or JPG screenshot.');
    };

    probe.src = objectUrl;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const canUnlock = Boolean(
    verification.instagramClicked && previewUrl && fileName && dimensions && confirmedFollow
  );

  const handleUnlock = () => {
    if (!canUnlock || !fileName || !dimensions) return;
    setJustUnlocked(true);
    onUnlockSuccess({ fileName, dimensions });
  };

  const handleCopyBotLink = async () => {
    try {
      await navigator.clipboard.writeText(SITE_CONFIG.telegramUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard API unavailable in restricted context
    }
  };

  const handleFollowClick = () => {
    onInstagramClick();
  };

  const currentStep = verification.unlocked
    ? 5
    : confirmedFollow && previewUrl
    ? 4
    : previewUrl
    ? 3
    : verification.instagramClicked
    ? 2
    : 1;

  return (
    <section id="verification" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#FF1744] uppercase">
              02 · Community Access Gate
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white text-balance sm:text-4xl">
              Instagram Verification & Telegram Unlock
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Follow {SITE_CONFIG.instagramHandle} and verify your screenshot locally in your browser to unlock the Telegram bot link.
          </p>
        </div>

        {/* Step Progress Strip */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { num: '01', label: 'Follow Instagram' },
            { num: '02', label: 'Upload Screenshot' },
            { num: '03', label: 'Preview Image' },
            { num: '04', label: 'Confirm Follow' },
            { num: '05', label: 'Unlock Telegram' },
          ].map((step, idx) => {
            const stepNum = idx + 1;
            const completed = verification.unlocked || currentStep > stepNum;
            const active = !verification.unlocked && currentStep === stepNum;
            return (
              <div
                key={step.num}
                className={`rounded-xl border px-3.5 py-3 transition-colors ${
                  completed
                    ? 'border-[#0066FF]/50 bg-[#0066FF]/12 text-white'
                    : active
                    ? 'border-[#FF1744]/60 bg-[#FF1744]/12 text-white'
                    : 'border-white/8 bg-white/[0.02] text-slate-400'
                }`}
              >
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-400">
                  {step.num}
                </span>
                <p className="mt-0.5 text-xs font-semibold sm:text-sm">{step.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Steps 1 - 4 */}
          <div className="space-y-6 lg:col-span-7">
            {/* Step 1: Follow Instagram */}
            <div className="apex-glass rounded-2xl p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                    STEP 01 · INSTAGRAM
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-white">
                    Follow {SITE_CONFIG.instagramHandle}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Open our official Instagram profile, tap Follow, and take a quick screenshot.
                  </p>
                </div>

                <a
                  href={SITE_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleFollowClick}
                  className="neon-red-glow inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D90024] via-[#FF1744] to-[#8B35FF] px-5 py-2.5 text-sm font-bold text-white whitespace-nowrap transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Follow Instagram</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {verification.instagramClicked && (
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#60A5FA]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Instagram link opened. Proceed below when your screenshot is ready.</span>
                </p>
              )}
            </div>

            {/* Step 2 & 3: Upload & Preview */}
            <div className="apex-glass rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                    STEP 02 & 03 · LOCAL UPLOAD & PREVIEW
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-white">
                    Upload Follow Screenshot
                  </h3>
                </div>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-[#FF1744]/60 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
                id="screenshot-upload-input"
              />

              {!previewUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                    isDragging
                      ? 'border-[#0066FF] bg-[#0066FF]/10'
                      : 'border-white/15 bg-[#080910]/60 hover:border-[#FF1744]/50'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#FF1744]">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-white">
                    {isProcessing
                      ? 'Validating image locally...'
                      : 'Drag & drop your screenshot here, or browse from device'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    PNG, JPG, or WEBP up to 15 MB · Processed strictly inside your browser
                  </p>
                  <label
                    htmlFor="screenshot-upload-input"
                    className="mt-5 inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:border-[#0066FF] hover:bg-[#0066FF]/20"
                  >
                    Select Screenshot
                  </label>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-[#080910]"
                >
                  <div className="relative flex max-h-80 w-full items-center justify-center bg-[#06070D] p-2">
                    <img
                      src={previewUrl}
                      alt="Uploaded Instagram follow screenshot preview"
                      className="max-h-76 w-auto rounded-lg object-contain"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-300">
                    <span className="max-w-[220px] truncate font-medium text-white">
                      {fileName}
                    </span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {dimensions}
                    </span>
                  </div>
                </motion.div>
              )}

              {errorMsg && (
                <p role="alert" className="mt-3 text-xs font-medium text-[#FF1744]">
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Step 4: User Confirmation */}
            <div className="apex-glass rounded-2xl p-6">
              <p className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                STEP 04 · LOCAL CONFIRMATION
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold text-white">
                Confirm Follow Screenshot
              </h3>

              <label
                className={`mt-4 flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors ${
                  previewUrl
                    ? confirmedFollow
                      ? 'border-[#0066FF]/60 bg-[#0066FF]/12'
                      : 'border-white/15 bg-[#080910]/60 hover:border-white/30'
                    : 'cursor-not-allowed border-white/8 bg-white/[0.02] opacity-55'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!previewUrl}
                  checked={confirmedFollow}
                  onChange={(e) => setConfirmedFollow(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#0066FF] disabled:cursor-not-allowed"
                />
                <span className="text-sm leading-relaxed text-slate-200">
                  I confirm that the uploaded screenshot clearly shows my Instagram account following{' '}
                  <strong className="font-semibold text-white">{SITE_CONFIG.instagramHandle}</strong>.
                </span>
              </label>

              <div className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-slate-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#60A5FA]" />
                <span>
                  Local validation & user confirmation only: your screenshot stays on your device, is never uploaded to any server, and is not verified through Instagram’s API.
                </span>
              </div>

              {!verification.instagramClicked && previewUrl && (
                <p className="mt-4 text-xs font-medium text-[#FF1744]">
                  Please complete Step 1 (Follow {SITE_CONFIG.instagramHandle}) before unlocking the Telegram bot link.
                </p>
              )}

              <div className="mt-5">
                <button
                  type="button"
                  disabled={!canUnlock}
                  onClick={handleUnlock}
                  className="neon-blue-glow inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#8B35FF] px-6 py-3 text-sm font-bold tracking-wider text-white uppercase transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <Unlock className="h-4 w-4" />
                  <span>Verify & Unlock Telegram Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Step 5 Telegram Unlock Card */}
          <div className="lg:col-span-5">
            <div className="apex-glass apex-gradient-border sticky top-24 flex h-full flex-col justify-between rounded-2xl p-6 sm:p-8">
              <div>
                <p className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                  STEP 05 · ACCESS STATUS
                </p>

                <AnimatePresence mode="wait">
                  {verification.unlocked ? (
                    <motion.div
                      key="unlocked"
                      initial={justUnlocked ? { opacity: 0, scale: 0.94, y: 12 } : false}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-4"
                    >
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0066FF]/50 bg-gradient-to-br from-[#0066FF]/25 to-[#8B35FF]/25 text-[#60A5FA] shadow-lg">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>

                      <h3 className="mt-5 font-display text-3xl font-extrabold tracking-wide text-white">
                        Telegram Access Unlocked
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        Your local confirmation is saved on this browser. You can now open the official {SITE_CONFIG.communityName} Telegram link below.
                      </p>

                      {verification.lastFileName && (
                        <div className="mt-5 rounded-xl border border-white/10 bg-[#080910]/70 px-4 py-3 text-xs text-slate-300">
                          <p className="font-medium text-white">Confirmed Local Screenshot</p>
                          <p className="mt-1 truncate text-slate-400">
                            {verification.lastFileName}
                            {verification.lastDimensions ? ` · ${verification.lastDimensions}` : ''}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between gap-2 rounded-xl border border-[#0066FF]/35 bg-[#080910]/85 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                            Official Bot Link
                          </p>
                          <p className="mt-0.5 truncate font-mono text-xs font-semibold text-[#60A5FA]">
                            {SITE_CONFIG.telegramUrl}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyBotLink}
                          aria-label="Copy Telegram bot link"
                          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white transition-colors hover:border-[#0066FF] hover:bg-[#0066FF]/20"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <a
                        href={SITE_CONFIG.telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onTelegramClick}
                        className="neon-blue-glow mt-4 inline-flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] via-[#4F46E5] to-[#8B35FF] px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Send className="h-4 w-4" />
                        <span>OPEN {SITE_CONFIG.telegramHandle}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="locked"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4"
                    >
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF1744]/40 bg-[#FF1744]/10 text-[#FF1744]">
                        <Lock className="h-7 w-7" />
                      </div>

                      <h3 className="mt-5 font-display text-3xl font-extrabold tracking-wide text-white">
                        Telegram Link Locked
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">
                        Complete Steps 1 through 4 on the left to unlock instant access to the {SITE_CONFIG.brandName} Telegram link.
                      </p>

                      <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-xs text-slate-400">
                        <div className="flex items-center justify-between">
                          <span>1. Follow {SITE_CONFIG.instagramHandle}</span>
                          <span className="font-mono text-slate-300">
                            {verification.instagramClicked ? 'Opened' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>2. Screenshot Validated</span>
                          <span className="font-mono text-slate-300">
                            {previewUrl ? 'Ready' : 'Waiting'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>3. User Confirmed</span>
                          <span className="font-mono text-slate-300">
                            {confirmedFollow ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {verification.unlocked && (
                <div className="mt-8 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      clearSelectedImage();
                      setJustUnlocked(false);
                      onResetVerification();
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Local Verification State</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
