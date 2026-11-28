// ============================================================================
// APEX ID UNBAN BOT — CLIENT-SIDE APPLICATION ENGINE
// Pure JavaScript: Local Verification, Background Video Audio, CounterAPI v2,
// Particle Background, Lightbox & Accessibility Support.
// ============================================================================

(function () {
  'use strict';

  const CONFIG = window.APEX_CONFIG || {
    instagramHandle: '@apex.carnage.live',
    instagramUrl: 'https://www.instagram.com/apex.carnage.live/',
    telegramUrl: 'https://t.me/Apex_unban_bot',
    showcaseAssets: [],
    analytics: {
      baseUrl: 'https://api.counterapi.dev/v2',
      workspace: '',
      accessToken: '',
      counters: {
        visitors: 'visitors',
        telegramClicks: 'telegram-clicks',
        instagramClicks: 'instagram-clicks',
        screenshotAttempts: 'screenshot-attempts',
      },
    },
  };

  const STORAGE_KEYS = {
    verification: 'apex_verification_v1',
    analytics: 'apex_local_analytics_v1',
    sessionVisit: 'apex_session_visit_recorded',
  };

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------------------------------------------------------------------------
  // 1. LOADING SCREEN
  // --------------------------------------------------------------------------
  function initLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    const skipBtn = document.getElementById('skip-intro-btn');
    if (!screen) return;

    const dismiss = () => {
      screen.classList.add('is-hidden');
      window.setTimeout(() => {
        screen.style.display = 'none';
      }, 400);
    };

    if (prefersReducedMotion) {
      dismiss();
      return;
    }

    const timer = window.setTimeout(dismiss, 1000);
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        window.clearTimeout(timer);
        dismiss();
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. GPU-FRIENDLY BACKGROUND PARTICLES
  // --------------------------------------------------------------------------
  function initParticles() {
    if (prefersReducedMotion) return;
    const canvas = document.getElementById('particle-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const palette = ['#FF1744', '#0066FF', '#8B35FF', '#D90024'];
    let width = 0;
    let height = 0;
    let particles = [];

    const createParticles = (w, h) => {
      const count = w < 768 ? 16 : 32;
      return Array.from({ length: count }, (_, idx) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -0.15 - Math.random() * 0.28,
        radius: 1.2 + Math.random() * 1.8,
        color: palette[idx % palette.length],
        alpha: 0.22 + Math.random() * 0.35,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(width, height);
    };

    const tick = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      window.requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.requestAnimationFrame(tick);
  }

  // --------------------------------------------------------------------------
  // 3. REAL COUNTERAPI V2 + BROWSER ANALYTICS (NO FAKE STATS)
  // --------------------------------------------------------------------------
  const analyticsState = {
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
  };

  function readLocalAnalytics() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.analytics);
      if (!raw) return { visitors: 0, telegramClicks: 0, instagramClicks: 0, screenshotAttempts: 0 };
      const p = JSON.parse(raw);
      return {
        visitors: Number.isFinite(p.visitors) ? p.visitors : 0,
        telegramClicks: Number.isFinite(p.telegramClicks) ? p.telegramClicks : 0,
        instagramClicks: Number.isFinite(p.instagramClicks) ? p.instagramClicks : 0,
        screenshotAttempts: Number.isFinite(p.screenshotAttempts) ? p.screenshotAttempts : 0,
      };
    } catch {
      return { visitors: 0, telegramClicks: 0, instagramClicks: 0, screenshotAttempts: 0 };
    }
  }

  function writeLocalAnalytics(counts) {
    try {
      window.localStorage.setItem(STORAGE_KEYS.analytics, JSON.stringify(counts));
    } catch {
      // Ignore storage quota blocks
    }
  }

  function extractCounterValue(payload) {
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.value === 'number') return payload.value;
    if (typeof payload.count === 'number') return payload.count;
    if (payload.data && typeof payload.data === 'object') {
      if (typeof payload.data.up_count === 'number') return payload.data.up_count;
      if (typeof payload.data.value === 'number') return payload.data.value;
      if (typeof payload.data.count === 'number') return payload.data.count;
    }
    return null;
  }

  async function callCounterApi(slug, action) {
    const cfg = CONFIG.analytics;
    if (!cfg || !cfg.workspace) return null;
    const base = cfg.baseUrl + '/' + encodeURIComponent(cfg.workspace) + '/' + encodeURIComponent(slug);
    const url = action === 'up' ? base + '/up' : base;
    const headers = { Accept: 'application/json' };
    if (cfg.accessToken) headers.Authorization = 'Bearer ' + cfg.accessToken;
    try {
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) return null;
      const json = await res.json();
      return extractCounterValue(json);
    } catch {
      return null;
    }
  }

  function renderAnalytics() {
    const isGlobal = analyticsState.source === 'counterapi-v2';
    const note = document.getElementById('analytics-source-note');
    if (note) {
      if (isGlobal) {
        note.textContent =
          'Connected to CounterAPI v2 public workspace counters for live global visitor and click counts.';
      } else if (analyticsState.source === 'offline') {
        note.textContent =
          'CounterAPI v2 is currently unreachable; displaying real counts recorded on this browser.';
      } else {
        note.textContent =
          'Displaying real counts recorded on this browser. Add your free CounterAPI v2 workspace slug in config.js for global counts across all visitors.';
      }
    }

    ['visitors', 'telegramClicks', 'instagramClicks', 'screenshotAttempts'].forEach((key) => {
      const gVal = analyticsState.globalCounts[key];
      const lVal = analyticsState.localCounts[key];
      const showGlobal = isGlobal && gVal !== null;
      const valEl = document.querySelector('[data-metric-val="' + key + '"]');
      const scopeEl = document.querySelector('[data-metric-scope="' + key + '"]');
      if (valEl) valEl.textContent = (showGlobal ? gVal : lVal).toLocaleString();
      if (scopeEl) scopeEl.textContent = showGlobal ? 'Global' : 'This Browser';
    });
  }

  async function initAnalytics() {
    let visitRecorded = false;
    try {
      visitRecorded = window.sessionStorage.getItem(STORAGE_KEYS.sessionVisit) === '1';
    } catch {
      visitRecorded = false;
    }

    analyticsState.localCounts = readLocalAnalytics();
    if (!visitRecorded) {
      analyticsState.localCounts.visitors += 1;
      writeLocalAnalytics(analyticsState.localCounts);
      try {
        window.sessionStorage.setItem(STORAGE_KEYS.sessionVisit, '1');
      } catch {
        // Ignore sessionStorage restrictions
      }
    }

    renderAnalytics();

    if (!CONFIG.analytics || !CONFIG.analytics.workspace) return;
    const slugs = CONFIG.analytics.counters;
    const [visitors, telegramClicks, instagramClicks, screenshotAttempts] = await Promise.all([
      callCounterApi(slugs.visitors, visitRecorded ? 'read' : 'up'),
      callCounterApi(slugs.telegramClicks, 'read'),
      callCounterApi(slugs.instagramClicks, 'read'),
      callCounterApi(slugs.screenshotAttempts, 'read'),
    ]);

    const anyOnline =
      visitors !== null ||
      telegramClicks !== null ||
      instagramClicks !== null ||
      screenshotAttempts !== null;

    analyticsState.source = anyOnline ? 'counterapi-v2' : 'offline';
    analyticsState.globalCounts = {
      visitors,
      telegramClicks,
      instagramClicks,
      screenshotAttempts,
    };
    renderAnalytics();
  }

  async function trackEvent(metric) {
    analyticsState.localCounts[metric] = (analyticsState.localCounts[metric] || 0) + 1;
    writeLocalAnalytics(analyticsState.localCounts);
    renderAnalytics();

    if (!CONFIG.analytics || !CONFIG.analytics.workspace) return;
    const slug = CONFIG.analytics.counters[metric];
    const updated = await callCounterApi(slug, 'up');
    if (updated !== null) {
      analyticsState.source = 'counterapi-v2';
      analyticsState.globalCounts[metric] = updated;
      renderAnalytics();
    }
  }

  // --------------------------------------------------------------------------
  // 4. SHOWCASE, HERO SLIDER & LIGHTBOX
  // --------------------------------------------------------------------------
  let activeSlideIndex = 0;

  function openLightbox(asset) {
    const modal = document.getElementById('lightbox-modal');
    if (!modal || !asset) return;
    document.getElementById('lightbox-cat').textContent = asset.category;
    document.getElementById('lightbox-title').textContent = asset.title;
    const img = document.getElementById('lightbox-img');
    img.src = asset.src;
    img.alt = asset.alt;
    document.getElementById('lightbox-caption').textContent = asset.caption;
    modal.classList.remove('hidden');
  }

  function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.add('hidden');
  }

  function initShowcase() {
    const assets = CONFIG.showcaseAssets || [];
    if (!assets.length) return;

    const heroImg = document.getElementById('hero-banner-img');
    const heroCat = document.getElementById('hero-banner-cat');
    const heroTitle = document.getElementById('hero-banner-title');
    const switcher = document.getElementById('hero-slide-switcher');
    const expandBtn = document.getElementById('hero-expand-btn');

    const applySlide = (index) => {
      activeSlideIndex = index;
      const asset = assets[index] || assets[0];
      if (heroImg) {
        heroImg.src = asset.src;
        heroImg.alt = asset.alt;
      }
      if (heroCat) heroCat.textContent = asset.category;
      if (heroTitle) heroTitle.textContent = asset.title;
      if (switcher) {
        switcher.querySelectorAll('.slide-btn').forEach((btn, idx) => {
          btn.classList.toggle('is-active', idx === index);
          btn.setAttribute('aria-selected', idx === index ? 'true' : 'false');
        });
      }
    };

    if (switcher) {
      switcher.innerHTML = '';
      if (assets.length > 1) {
        switcher.classList.remove('hidden');
        assets.forEach((asset, index) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'slide-btn' + (index === 0 ? ' is-active' : '');
          btn.textContent = '0' + (index + 1);
          btn.setAttribute('role', 'tab');
          btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
          btn.addEventListener('click', () => applySlide(index));
          switcher.appendChild(btn);
        });
      } else {
        switcher.classList.add('hidden');
      }
    }

    applySlide(0);

    if (expandBtn) {
      expandBtn.addEventListener('click', () => openLightbox(assets[activeSlideIndex] || assets[0]));
    }

    const grid = document.getElementById('showcase-grid');
    if (grid) {
      grid.innerHTML = '';
      grid.classList.toggle('showcase-grid--single', assets.length === 1);
      assets.forEach((asset, idx) => {
        const article = document.createElement('article');
        article.className = 'apex-glass apex-gradient-border showcase-card reveal';
        article.innerHTML =
          '<button type="button" class="showcase-img-btn" aria-label="Open full view of ' +
          asset.title +
          '">' +
          '<img src="' +
          asset.src +
          '" alt="' +
          asset.alt +
          '" loading="lazy" referrerpolicy="no-referrer" />' +
          '<div class="banner-scrim" aria-hidden="true"></div>' +
          '<span class="inspect-pill">Inspect</span>' +
          '</button>' +
          '<div class="showcase-body">' +
          '<p class="showcase-meta">0' +
          (idx + 1) +
          ' · ' +
          asset.category +
          '</p>' +
          '<h3 class="showcase-title">' +
          asset.title +
          '</h3>' +
          '<p class="showcase-desc">' +
          asset.caption +
          '</p>' +
          '</div>';
        article.querySelector('.showcase-img-btn').addEventListener('click', () => openLightbox(asset));
        grid.appendChild(article);
      });
    }

    // Lightbox close handlers
    const lbModal = document.getElementById('lightbox-modal');
    const lbClose = document.getElementById('lightbox-close');
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbModal) {
      lbModal.addEventListener('click', (e) => {
        if (e.target === lbModal) closeLightbox();
      });
    }
  }

  // --------------------------------------------------------------------------
  // 5. 5-STEP LOCAL INSTAGRAM VERIFICATION -> UNLOCKS TELEGRAM BOT LINK
  // --------------------------------------------------------------------------
  function loadVerification() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.verification);
      if (!raw) {
        return { instagramClicked: false, unlocked: false, lastFileName: null, lastDimensions: null };
      }
      const p = JSON.parse(raw);
      return {
        instagramClicked: Boolean(p.instagramClicked),
        unlocked: Boolean(p.unlocked),
        lastFileName: typeof p.lastFileName === 'string' ? p.lastFileName : null,
        lastDimensions: typeof p.lastDimensions === 'string' ? p.lastDimensions : null,
      };
    } catch {
      return { instagramClicked: false, unlocked: false, lastFileName: null, lastDimensions: null };
    }
  }

  function saveVerification(state) {
    try {
      window.localStorage.setItem(STORAGE_KEYS.verification, JSON.stringify(state));
    } catch {
      // Ignore storage blocks
    }
  }

  function initVerification() {
    const state = loadVerification();
    let previewUrl = null;
    let fileName = state.lastFileName;
    let dimensions = state.lastDimensions;
    let confirmed = false;

    const MAX_BYTES = 15 * 1024 * 1024;
    const followBtn = document.getElementById('follow-instagram-btn');
    const footerIg = document.getElementById('footer-ig-link');
    const igNote = document.getElementById('ig-opened-note');
    const uploadLockedNotice = document.getElementById('upload-locked-notice');
    const fileInput = document.getElementById('screenshot-input');
    const dropzone = document.getElementById('dropzone');
    const dropzoneTitle = document.getElementById('dropzone-title');
    const previewBox = document.getElementById('preview-box');
    const previewImg = document.getElementById('preview-img');
    const previewFilename = document.getElementById('preview-filename');
    const previewDims = document.getElementById('preview-dims');
    const clearBtn = document.getElementById('clear-screenshot-btn');
    const uploadError = document.getElementById('upload-error');
    const confirmLabel = document.getElementById('confirm-label');
    const confirmCheckbox = document.getElementById('confirm-checkbox');
    const step1Warning = document.getElementById('step1-warning');
    const unlockBtn = document.getElementById('unlock-btn');
    const stateLocked = document.getElementById('state-locked');
    const stateUnlocked = document.getElementById('state-unlocked');
    const confirmedFileBox = document.getElementById('confirmed-file-box');
    const confirmedFileMeta = document.getElementById('confirmed-file-meta');
    const unlockedBotCta = document.getElementById('unlocked-bot-cta');
    const unlockedBotCtaLabel = document.getElementById('unlocked-bot-cta-label');
    const resetWrap = document.getElementById('reset-wrap');
    const resetBtn = document.getElementById('reset-verify-btn');

    const syncUI = (animateUnlock, animateUploadOpen) => {
      // Steps progress bar
      const activeStep = state.unlocked
        ? 5
        : confirmed && previewUrl
        ? 4
        : previewUrl
        ? 3
        : state.instagramClicked
        ? 2
        : 1;

      document.querySelectorAll('#steps-strip .step-pill').forEach((el) => {
        const num = Number(el.getAttribute('data-step'));
        el.classList.toggle('is-done', state.unlocked || activeStep > num);
        el.classList.toggle('is-active', !state.unlocked && activeStep === num);
      });

      if (igNote) igNote.classList.toggle('hidden', !state.instagramClicked);

      // Step 2 Gate: Screenshot upload opens ONLY after clicking Follow Instagram in Step 1
      const hasImage = Boolean(previewUrl);
      if (fileInput) {
        fileInput.disabled = !state.instagramClicked;
      }
      if (uploadLockedNotice) {
        uploadLockedNotice.classList.toggle('hidden', state.instagramClicked);
      }
      if (dropzone) {
        const showDropzone = state.instagramClicked && !hasImage;
        dropzone.classList.toggle('hidden', !showDropzone);
        if (showDropzone && animateUploadOpen) {
          dropzone.classList.remove('unlock-animate');
          void dropzone.offsetWidth;
          dropzone.classList.add('unlock-animate');
        }
      }
      if (previewBox) {
        previewBox.classList.toggle('hidden', !hasImage);
      }
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', !hasImage);
      }

      // Checklist right card
      const s1 = document.getElementById('status-step1');
      const s2 = document.getElementById('status-step2');
      const s3 = document.getElementById('status-step3');
      if (s1) s1.textContent = state.instagramClicked ? 'Followed' : 'Pending';
      if (s2) s2.textContent = hasImage ? 'Uploaded' : state.instagramClicked ? 'Open Now' : 'Locked';
      if (s3) s3.textContent = state.unlocked ? 'Verified' : confirmed ? 'Confirmed' : 'Pending';

      // Confirmation checkbox state
      if (confirmCheckbox) {
        confirmCheckbox.disabled = !hasImage || !state.instagramClicked;
        confirmCheckbox.checked = confirmed;
      }
      if (confirmLabel) {
        confirmLabel.classList.toggle('is-disabled', !hasImage || !state.instagramClicked);
        confirmLabel.classList.toggle('is-checked', hasImage && confirmed);
      }
      if (step1Warning) {
        step1Warning.classList.add('hidden');
      }

      const canUnlock = Boolean(state.instagramClicked && hasImage && confirmed);
      if (unlockBtn) unlockBtn.disabled = !canUnlock;

      // Locked vs Unlocked view (Bot URL & handle are NEVER displayed as text anywhere)
      if (stateLocked) stateLocked.classList.toggle('hidden', state.unlocked);
      if (stateUnlocked) {
        stateUnlocked.classList.toggle('hidden', !state.unlocked);
        if (state.unlocked && animateUnlock) {
          stateUnlocked.classList.remove('unlock-animate');
          void stateUnlocked.offsetWidth;
          stateUnlocked.classList.add('unlock-animate');
        }
      }
      if (resetWrap) resetWrap.classList.toggle('hidden', !state.unlocked);

      // Populate href ONLY after verification is complete
      const tgAnchors = [
        document.getElementById('header-cta-unlocked'),
        document.getElementById('mobile-cta-unlocked'),
        document.getElementById('hero-tg-unlocked'),
        document.getElementById('footer-tg-unlocked'),
        unlockedBotCta,
      ];

      tgAnchors.forEach((a) => {
        if (!a) return;
        if (state.unlocked) {
          a.href = CONFIG.telegramUrl;
        } else {
          a.removeAttribute('href');
        }
      });

      const togglePair = (lockedId, unlockedId) => {
        const l = document.getElementById(lockedId);
        const u = document.getElementById(unlockedId);
        if (l) l.classList.toggle('hidden', state.unlocked);
        if (u) u.classList.toggle('hidden', !state.unlocked);
      };

      togglePair('header-cta-locked', 'header-cta-unlocked');
      togglePair('mobile-cta-locked', 'mobile-cta-unlocked');
      togglePair('hero-tg-locked', 'hero-tg-unlocked');
      togglePair('footer-tg-locked', 'footer-tg-unlocked');

      const heroStatus = document.getElementById('hero-status-text');
      if (heroStatus) {
        heroStatus.textContent = state.unlocked
          ? 'Your Free ID Unban Link Is Ready!'
          : 'Follow & Verify to Unlock Link';
      }

      if (state.unlocked) {
        if (unlockedBotCtaLabel) unlockedBotCtaLabel.textContent = 'JOIN NOW';
        if (confirmedFileBox && confirmedFileMeta && state.lastFileName) {
          confirmedFileBox.classList.remove('hidden');
          confirmedFileMeta.textContent =
            state.lastFileName + (state.lastDimensions ? ' · ' + state.lastDimensions : '');
        }
      } else if (confirmedFileBox) {
        confirmedFileBox.classList.add('hidden');
      }
    };

    const showUploadError = (msg) => {
      if (!uploadError) return;
      if (!msg) {
        uploadError.classList.add('hidden');
        uploadError.textContent = '';
      } else {
        uploadError.textContent = msg;
        uploadError.classList.remove('hidden');
      }
    };

    const clearImage = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      fileName = null;
      dimensions = null;
      confirmed = false;
      if (fileInput) fileInput.value = '';
      showUploadError(null);
      syncUI(false, false);
    };

    const processFile = (file) => {
      if (!state.instagramClicked) return;
      showUploadError(null);
      void trackEvent('screenshotAttempts');

      if (!file.type || !file.type.startsWith('image/')) {
        showUploadError('Please select a valid image file (PNG, JPG, WEBP, or GIF).');
        return;
      }
      if (file.size > MAX_BYTES) {
        showUploadError('Image exceeds the 15 MB browser limit. Please upload a smaller screenshot.');
        return;
      }

      if (dropzoneTitle) dropzoneTitle.textContent = 'Validating image locally...';
      const objectUrl = URL.createObjectURL(file);
      const probe = new Image();

      probe.onload = () => {
        if (dropzoneTitle) {
          dropzoneTitle.textContent = 'Drag & drop your screenshot here, or browse from device';
        }
        if (probe.naturalWidth < 80 || probe.naturalHeight < 80) {
          URL.revokeObjectURL(objectUrl);
          showUploadError('Screenshot resolution is too small. Please upload a clear follow screenshot.');
          return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = objectUrl;
        fileName = file.name;
        dimensions = probe.naturalWidth + ' × ' + probe.naturalHeight + ' px';
        confirmed = false;

        if (previewImg) previewImg.src = previewUrl;
        if (previewFilename) previewFilename.textContent = fileName;
        if (previewDims) previewDims.textContent = dimensions;
        if (dropzone) dropzone.classList.add('hidden');
        if (previewBox) previewBox.classList.remove('hidden');
        if (clearBtn) clearBtn.classList.remove('hidden');
        syncUI(false);
      };

      probe.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        if (dropzoneTitle) {
          dropzoneTitle.textContent = 'Drag & drop your screenshot here, or browse from device';
        }
        showUploadError('Could not read that image locally. Please try a PNG or JPG screenshot.');
      };

      probe.src = objectUrl;
    };

    const handleIgClick = () => {
      const wasClicked = state.instagramClicked;
      state.instagramClicked = true;
      saveVerification(state);
      void trackEvent('instagramClicks');
      syncUI(false, !wasClicked);
    };

    if (followBtn) followBtn.addEventListener('click', handleIgClick);
    if (footerIg) footerIg.addEventListener('click', handleIgClick);

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (!state.instagramClicked) return;
        const file = e.target.files && e.target.files[0];
        if (file) processFile(file);
      });
    }

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        if (!state.instagramClicked) return;
        e.preventDefault();
        dropzone.classList.add('is-dragging');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));
      dropzone.addEventListener('drop', (e) => {
        if (!state.instagramClicked) return;
        e.preventDefault();
        dropzone.classList.remove('is-dragging');
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) processFile(file);
      });
    }

    if (clearBtn) clearBtn.addEventListener('click', clearImage);

    if (confirmCheckbox) {
      confirmCheckbox.addEventListener('change', (e) => {
        confirmed = Boolean(e.target.checked);
        syncUI(false, false);
      });
    }

    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => {
        if (!state.instagramClicked || !previewUrl || !confirmed) return;
        state.unlocked = true;
        state.lastFileName = fileName;
        state.lastDimensions = dimensions;
        saveVerification(state);
        syncUI(true, false);
        const announce = document.getElementById('sr-announce');
        if (announce) announce.textContent = 'Your Free ID Unban Link Is Ready! Tap Join Now.';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.instagramClicked = false;
        state.unlocked = false;
        state.lastFileName = null;
        state.lastDimensions = null;
        saveVerification(state);
        clearImage();
      });
    }

    document.querySelectorAll('[data-telegram-track]').forEach((el) => {
      el.addEventListener('click', () => {
        void trackEvent('telegramClicks');
      });
    });

    syncUI(false);
  }

  // --------------------------------------------------------------------------
  // 6. NAVIGATION, PRIVACY MODAL & SCROLL REVEAL
  // --------------------------------------------------------------------------
  function initNavigationAndModals() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', () => {
        const open = mobileMenu.classList.toggle('hidden') === false;
        mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      mobileMenu.querySelectorAll('a, button').forEach((item) => {
        item.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
          mobileToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    document.querySelectorAll('[data-scroll-verify]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById('verification');
        if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });

    const privacyModal = document.getElementById('privacy-modal');
    const openPrivacy = document.getElementById('open-privacy-btn');
    const closePrivacy = document.getElementById('privacy-close');
    const donePrivacy = document.getElementById('privacy-done');

    const hidePrivacy = () => privacyModal && privacyModal.classList.add('hidden');
    if (openPrivacy && privacyModal) {
      openPrivacy.addEventListener('click', () => privacyModal.classList.remove('hidden'));
    }
    if (closePrivacy) closePrivacy.addEventListener('click', hidePrivacy);
    if (donePrivacy) donePrivacy.addEventListener('click', hidePrivacy);
    if (privacyModal) {
      privacyModal.addEventListener('click', (e) => {
        if (e.target === privacyModal) hidePrivacy();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        hidePrivacy();
      }
    });

    // Smooth card entrance animations
    const revealEls = document.querySelectorAll('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach((el) => observer.observe(el));
    }
  }

  // --------------------------------------------------------------------------
  // 7. BACKGROUND VIDEO & CLICK-TO-START SONG
  // --------------------------------------------------------------------------
  function initBackgroundVideo() {
    const video = document.getElementById('bg-video');
    if (!video) return;

    let songStarted = false;
    let fadeRaf = null;
    const targetVolume = 0.75;

    video.muted = true;
    video.volume = 0;

    const rampVolume = (target, durationMs) => {
      if (fadeRaf !== null) {
        window.cancelAnimationFrame(fadeRaf);
        fadeRaf = null;
      }
      const startVol = video.volume || 0;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        video.volume = Math.min(1, Math.max(0, startVol + (target - startVol) * eased));
        if (t < 1) {
          fadeRaf = window.requestAnimationFrame(step);
        } else {
          fadeRaf = null;
        }
      };

      fadeRaf = window.requestAnimationFrame(step);
    };

    const attemptMutedPlay = () => {
      if (prefersReducedMotion) return;
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Starts on first user click or button tap
        });
      }
    };

    attemptMutedPlay();

    const detachInteractionListeners = () => {
      document.removeEventListener('click', startSongOnInteraction, true);
      document.removeEventListener('pointerdown', startSongOnInteraction, true);
      document.removeEventListener('keydown', startSongOnInteraction, true);
    };

    function startSongOnInteraction(event) {
      if (songStarted) return;
      if (event && event.type === 'keydown') {
        const k = event.key;
        if (k !== 'Enter' && k !== ' ' && k !== 'Spacebar') return;
      }

      video.muted = false;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            songStarted = true;
            rampVolume(targetVolume, 350);
            detachInteractionListeners();
          })
          .catch(() => {
            // Keep listeners active until a qualifying activation click succeeds
            video.muted = true;
          });
      } else {
        songStarted = true;
        rampVolume(targetVolume, 350);
        detachInteractionListeners();
      }
    }

    document.addEventListener('click', startSongOnInteraction, { capture: true, passive: true });
    document.addEventListener('pointerdown', startSongOnInteraction, { capture: true, passive: true });
    document.addEventListener('keydown', startSongOnInteraction, { capture: true, passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        video.pause();
      } else if (songStarted) {
        video.muted = false;
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        attemptMutedPlay();
      }
    });
  }

  // Boot all modules once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initLoadingScreen();
    initBackgroundVideo();
    initParticles();
    initShowcase();
    initVerification();
    initNavigationAndModals();
    void initAnalytics();
  });
})();
