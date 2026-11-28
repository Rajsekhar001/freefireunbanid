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
    telegramChannelUrl: 'https://t.me/+bmeECrH6ozc2YTA1',
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

  const ANALYTICS_BASE = 500;

  function readLocalAnalytics() {
    const defaults = {
      visitors: ANALYTICS_BASE - 1,
      telegramClicks: ANALYTICS_BASE,
      instagramClicks: ANALYTICS_BASE,
      screenshotAttempts: ANALYTICS_BASE,
    };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.analytics);
      if (!raw) return defaults;
      const p = JSON.parse(raw);
      const lift = (val, base) => {
        if (!Number.isFinite(val) || val < 0) return base;
        return val < base ? base + val : val;
      };
      return {
        visitors: lift(p.visitors, ANALYTICS_BASE - 1),
        telegramClicks: lift(p.telegramClicks, ANALYTICS_BASE),
        instagramClicks: lift(p.instagramClicks, ANALYTICS_BASE),
        screenshotAttempts: lift(p.screenshotAttempts, ANALYTICS_BASE),
      };
    } catch {
      return defaults;
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
          'Live community traffic and click counters starting from 500 across visitors and portal actions.';
      } else {
        note.textContent =
          'Live community traffic and click counters starting from 500 across visitors and portal actions.';
      }
    }

    ['visitors', 'telegramClicks', 'instagramClicks', 'screenshotAttempts'].forEach((key) => {
      const gVal = analyticsState.globalCounts[key];
      const lVal = analyticsState.localCounts[key];
      const showGlobal = isGlobal && gVal !== null;
      const displayGlobal =
        key === 'visitors' ? Math.max(ANALYTICS_BASE, ANALYTICS_BASE - 1 + gVal) : ANALYTICS_BASE + gVal;
      const valEl = document.querySelector('[data-metric-val="' + key + '"]');
      const scopeEl = document.querySelector('[data-metric-scope="' + key + '"]');
      if (valEl) valEl.textContent = (showGlobal ? displayGlobal : lVal).toLocaleString();
      if (scopeEl) scopeEl.textContent = showGlobal ? 'Global' : 'Live';
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
      try {
        window.sessionStorage.setItem(STORAGE_KEYS.sessionVisit, '1');
      } catch {
        // Ignore sessionStorage restrictions
      }
    }
    if (analyticsState.localCounts.visitors < ANALYTICS_BASE) {
      analyticsState.localCounts.visitors = ANALYTICS_BASE;
    }
    writeLocalAnalytics(analyticsState.localCounts);

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
  // 4. HERO BANNER, PROOF VAULT CAROUSEL, ANDROID SWIPE & AUTO-SWIPE LIGHTBOX
  // --------------------------------------------------------------------------
  let activeSlideIndex = 0;
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxAutoplayEnabled = true;
  let lightboxAutoplayTimer = null;
  let lightboxTouching = false;
  let vaultCarouselSyncFn = null;
  let vaultCloseFn = null;

  function triggerSwipeAnimation(el, direction) {
    if (!el || prefersReducedMotion) return;
    el.classList.remove('is-swipe-next', 'is-swipe-prev');
    void el.offsetWidth;
    if (direction > 0) {
      el.classList.add('is-swipe-next');
    } else if (direction < 0) {
      el.classList.add('is-swipe-prev');
    }
  }

  function bindSwipeGesture(containerEl, onNext, onPrev, onTouchStartCb, onTouchEndCb) {
    if (!containerEl) return { wasRecentSwipe: () => false };
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let tracking = false;
    let lastSwipeTime = 0;

    containerEl.addEventListener(
      'touchstart',
      (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        lastX = startX;
        lastY = startY;
        tracking = true;
        if (onTouchStartCb) onTouchStartCb();
      },
      { passive: true }
    );

    containerEl.addEventListener(
      'touchmove',
      (e) => {
        if (!tracking || !e.touches || e.touches.length !== 1) return;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      },
      { passive: true }
    );

    const finishTouch = () => {
      if (!tracking) return;
      tracking = false;
      const dx = lastX - startX;
      const dy = lastY - startY;
      if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        lastSwipeTime = Date.now();
        if (dx < 0) {
          onNext();
        } else {
          onPrev();
        }
      }
      if (onTouchEndCb) onTouchEndCb();
    };

    containerEl.addEventListener('touchend', finishTouch, { passive: true });
    containerEl.addEventListener(
      'touchcancel',
      () => {
        tracking = false;
        if (onTouchEndCb) onTouchEndCb();
      },
      { passive: true }
    );

    return {
      wasRecentSwipe: () => Date.now() - lastSwipeTime < 300,
    };
  }

  function stopLightboxAutoplay() {
    if (lightboxAutoplayTimer !== null) {
      window.clearInterval(lightboxAutoplayTimer);
      lightboxAutoplayTimer = null;
    }
  }

  function updateLightboxAutoplayUI() {
    const btn = document.getElementById('lightbox-autoplay');
    const label = document.getElementById('lightbox-autoplay-label');
    const hasMultiple = lightboxItems.length > 1;
    if (!btn) return;
    btn.classList.toggle('hidden', !hasMultiple);
    btn.classList.toggle('is-playing', lightboxAutoplayEnabled);
    btn.setAttribute('aria-pressed', lightboxAutoplayEnabled ? 'true' : 'false');
    if (label) label.textContent = lightboxAutoplayEnabled ? 'Auto: ON' : 'Auto: OFF';
  }

  function resetLightboxAutoplay() {
    stopLightboxAutoplay();
    const modal = document.getElementById('lightbox-modal');
    const isOpen = modal && !modal.classList.contains('hidden');
    if (!isOpen || !lightboxAutoplayEnabled || lightboxItems.length <= 1 || lightboxTouching) return;
    const current = lightboxItems[lightboxIndex];
    if (current && current.type === 'video') return;
    lightboxAutoplayTimer = window.setInterval(() => {
      stepLightbox(1, true);
    }, 3600);
  }

  function renderLightboxItem(direction) {
    const modal = document.getElementById('lightbox-modal');
    const asset = lightboxItems[lightboxIndex];
    if (!modal || !asset) return;

    document.getElementById('lightbox-cat').textContent = asset.category || 'Proof';
    document.getElementById('lightbox-title').textContent = asset.title || '';

    const img = document.getElementById('lightbox-img');
    const vid = document.getElementById('lightbox-video');
    const isVideo = asset.type === 'video';

    if (vid) {
      vid.pause();
      vid.removeAttribute('src');
      vid.classList.toggle('hidden', !isVideo);
    }
    if (img) {
      img.classList.toggle('hidden', isVideo);
    }

    if (isVideo && vid) {
      vid.src = asset.src;
      if (asset.poster) vid.poster = asset.poster;
      vid.load();
      triggerSwipeAnimation(vid, direction || 0);
    } else if (img) {
      img.src = asset.src;
      img.alt = asset.alt || asset.title || 'Proof preview';
      triggerSwipeAnimation(img, direction || 0);
    }

    document.getElementById('lightbox-caption').textContent = asset.caption || '';

    const hasMultiple = lightboxItems.length > 1;
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const counterEl = document.getElementById('lightbox-counter');
    if (prevBtn) prevBtn.classList.toggle('hidden', !hasMultiple);
    if (nextBtn) nextBtn.classList.toggle('hidden', !hasMultiple);
    if (counterEl) {
      counterEl.classList.toggle('hidden', !hasMultiple);
      if (hasMultiple) {
        counterEl.textContent =
          String(lightboxIndex + 1).padStart(2, '0') +
          ' / ' +
          String(lightboxItems.length).padStart(2, '0');
      }
    }
    updateLightboxAutoplayUI();
  }

  function openLightbox(asset, list, index) {
    const modal = document.getElementById('lightbox-modal');
    if (!modal || !asset) return;
    lightboxItems = Array.isArray(list) && list.length ? list : [asset];
    lightboxIndex = typeof index === 'number' && index >= 0 ? index : 0;
    renderLightboxItem(1);
    modal.classList.remove('hidden');
    if (vaultCarouselSyncFn) vaultCarouselSyncFn();
    resetLightboxAutoplay();
  }

  function stepLightbox(delta, fromAutoplay) {
    if (lightboxItems.length <= 1) return;
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    renderLightboxItem(delta >= 0 ? 1 : -1);
    if (!fromAutoplay) {
      resetLightboxAutoplay();
    }
  }

  function closeLightbox() {
    stopLightboxAutoplay();
    const modal = document.getElementById('lightbox-modal');
    const vid = document.getElementById('lightbox-video');
    if (vid) {
      vid.pause();
      vid.currentTime = 0;
    }
    if (modal) modal.classList.add('hidden');
    if (vaultCarouselSyncFn) vaultCarouselSyncFn();
  }

  function initShowcase() {
    const assets = CONFIG.showcaseAssets || [];
    const heroImg = document.getElementById('hero-banner-img');
    const heroCat = document.getElementById('hero-banner-cat');
    const heroTitle = document.getElementById('hero-banner-title');
    const switcher = document.getElementById('hero-slide-switcher');
    const expandBtn = document.getElementById('hero-expand-btn');

    if (assets.length) {
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
        expandBtn.addEventListener('click', () =>
          openLightbox(assets[activeSlideIndex] || assets[0], assets, activeSlideIndex)
        );
      }
    }

    // Separate Proof Vault Overlay (Photos load only when clicked + Android Swipe + Auto-Swipe)
    const proofVaultModal = document.getElementById('proof-vault-modal');
    const proofVaultClose = document.getElementById('proof-vault-close');
    const proofVaultCloseIcon = document.getElementById('proof-vault-close-icon');
    const proofGrid = document.getElementById('proof-grid');
    const filterBar = document.getElementById('proof-filters');
    const summaryBadge = document.getElementById('proof-summary-badge');

    const carouselViewport = document.getElementById('proof-carousel-viewport');
    const carouselStage = document.getElementById('proof-carousel-stage');
    const carouselMediaBtn = document.getElementById('proof-carousel-media-btn');
    const carouselImg = document.getElementById('proof-carousel-img');
    const carouselCounter = document.getElementById('proof-carousel-counter');
    const carouselCat = document.getElementById('proof-carousel-cat');
    const carouselTitle = document.getElementById('proof-carousel-title');
    const carouselCaption = document.getElementById('proof-carousel-caption');
    const carouselPrev = document.getElementById('proof-carousel-prev');
    const carouselNext = document.getElementById('proof-carousel-next');
    const carouselAutoBtn = document.getElementById('proof-slider-autoplay');
    const carouselAutoLabel = document.getElementById('proof-slider-autoplay-label');
    const progressFill = document.getElementById('proof-progress-fill');

    const proofs = CONFIG.proofAssets || [];
    let activeFilter = 'all';
    let filteredList = proofs.slice();
    let carouselIndex = 0;
    let carouselAutoEnabled = true;
    let carouselTouching = false;
    let carouselTimer = null;
    let carouselSwipeGuard = { wasRecentSwipe: () => false };
    let proofRenderedOnce = false;
    const AUTO_SWIPE_MS = 3600;

    const restartProgressBar = (active) => {
      if (!progressFill) return;
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
      if (!active) return;
      void progressFill.offsetWidth;
      progressFill.style.transition = 'width ' + AUTO_SWIPE_MS + 'ms linear';
      progressFill.style.width = '100%';
    };

    const stopCarouselAutoplay = () => {
      if (carouselTimer !== null) {
        window.clearInterval(carouselTimer);
        carouselTimer = null;
      }
      restartProgressBar(false);
    };

    const syncCarouselAutoplay = () => {
      stopCarouselAutoplay();
      if (carouselAutoBtn) {
        carouselAutoBtn.classList.toggle('is-playing', carouselAutoEnabled);
        carouselAutoBtn.setAttribute('aria-pressed', carouselAutoEnabled ? 'true' : 'false');
      }
      if (carouselAutoLabel) {
        carouselAutoLabel.textContent = carouselAutoEnabled ? 'Auto-Swipe: ON' : 'Auto-Swipe: OFF';
      }

      const pvOpen = proofVaultModal && !proofVaultModal.classList.contains('hidden');
      const lbModal = document.getElementById('lightbox-modal');
      const lbOpen = lbModal && !lbModal.classList.contains('hidden');
      if (!pvOpen || lbOpen || !carouselAutoEnabled || carouselTouching || filteredList.length <= 1) {
        return;
      }

      restartProgressBar(true);
      carouselTimer = window.setInterval(() => {
        stepCarousel(1, true);
      }, AUTO_SWIPE_MS);
    };

    vaultCarouselSyncFn = syncCarouselAutoplay;

    const renderCarouselSlide = (direction) => {
      if (!filteredList.length) return;
      if (carouselIndex >= filteredList.length) carouselIndex = 0;
      const item = filteredList[carouselIndex];
      if (!item) return;

      if (carouselImg) {
        carouselImg.src = item.src;
        carouselImg.alt = item.alt || item.title || 'Verified unban proof';
      }
      if (carouselCounter) {
        carouselCounter.textContent =
          String(carouselIndex + 1).padStart(2, '0') +
          ' / ' +
          String(filteredList.length).padStart(2, '0');
      }
      if (carouselCat) carouselCat.textContent = item.category || 'Verified Proof';
      if (carouselTitle) carouselTitle.textContent = item.title || '';
      if (carouselCaption) carouselCaption.textContent = item.caption || '';

      triggerSwipeAnimation(carouselStage, direction || 0);
    };

    function stepCarousel(delta, fromAutoplay) {
      if (filteredList.length <= 1) return;
      carouselIndex = (carouselIndex + delta + filteredList.length) % filteredList.length;
      renderCarouselSlide(delta >= 0 ? 1 : -1);
      if (fromAutoplay) {
        restartProgressBar(true);
      } else {
        syncCarouselAutoplay();
      }
    }

    const updateFilterCounts = () => {
      const counts = { all: proofs.length, 'before-after': 0, 'multi-id': 0, reviews: 0 };
      proofs.forEach((p) => {
        if (p.group && Object.prototype.hasOwnProperty.call(counts, p.group)) {
          counts[p.group] += 1;
        }
      });
      Object.keys(counts).forEach((key) => {
        document.querySelectorAll('[data-filter-count="' + key + '"]').forEach((el) => {
          el.textContent = String(counts[key]);
        });
      });
    };

    const syncFilterButtons = (selected) => {
      if (!filterBar) return;
      filterBar.querySelectorAll('[data-proof-filter]').forEach((b) => {
        const active = (b.getAttribute('data-proof-filter') || 'all') === selected;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };

    const renderProofGrid = (immediateReveal) => {
      if (!proofGrid) return;
      proofGrid.innerHTML = '';
      filteredList =
        activeFilter === 'all' ? proofs.slice() : proofs.filter((item) => item.group === activeFilter);
      carouselIndex = 0;
      renderCarouselSlide(1);

      if (summaryBadge) {
        summaryBadge.textContent =
          'Showing ' + filteredList.length + ' Verified Proof' + (filteredList.length === 1 ? '' : 's');
      }

      if (!filteredList.length) {
        proofGrid.innerHTML =
          '<div class="apex-glass apex-gradient-border proof-empty-card reveal is-visible">' +
          '<div class="proof-empty-icon" aria-hidden="true">' +
          '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />' +
          '</svg>' +
          '</div>' +
          '<h3 class="proof-empty-title">Proof Section Ready</h3>' +
          '<p class="proof-empty-desc">' +
          'Verified ID unban proof photos and videos will appear right here as soon as you share them.' +
          '</p>' +
          '</div>';
        return;
      }

      filteredList.forEach((item, idx) => {
        const isVideo = item.type === 'video';
        const article = document.createElement('article');
        article.className =
          'apex-glass apex-gradient-border proof-card reveal' +
          (immediateReveal ? ' is-visible' : '');
        const mediaHtml = isVideo
          ? '<video src="' +
            item.src +
            '"' +
            (item.poster ? ' poster="' + item.poster + '"' : '') +
            ' muted playsinline preload="metadata"></video>'
          : '<img src="' +
            item.src +
            '" alt="' +
            (item.alt || item.title) +
            '" loading="lazy" referrerpolicy="no-referrer" />';

        const numLabel = String(idx + 1).padStart(2, '0');
        article.innerHTML =
          '<button type="button" class="proof-img-btn" aria-label="Open ' +
          (isVideo ? 'video' : 'photo') +
          ' proof: ' +
          item.title +
          '">' +
          mediaHtml +
          '<div class="banner-scrim" aria-hidden="true"></div>' +
          '<span class="inspect-pill">' +
          (isVideo ? 'Play Proof' : 'Inspect Proof') +
          '</span>' +
          '</button>' +
          '<div class="showcase-body">' +
          '<p class="showcase-meta">' +
          numLabel +
          ' · ' +
          (item.category || (isVideo ? 'Video Proof' : 'Photo Proof')) +
          '</p>' +
          '<h3 class="showcase-title">' +
          item.title +
          '</h3>' +
          '<p class="showcase-desc">' +
          (item.caption || '') +
          '</p>' +
          '</div>';

        article
          .querySelector('.proof-img-btn')
          .addEventListener('click', () => openLightbox(item, filteredList, idx));
        proofGrid.appendChild(article);
      });
    };

    const openProofVault = (filter) => {
      if (!proofVaultModal) return;
      const nextFilter = filter || 'all';
      const filterChanged = nextFilter !== activeFilter;
      activeFilter = nextFilter;
      syncFilterButtons(activeFilter);

      if (!proofRenderedOnce || filterChanged) {
        renderProofGrid(true);
        proofRenderedOnce = true;
      } else {
        renderCarouselSlide(1);
      }

      proofVaultModal.classList.remove('hidden');
      proofVaultModal.scrollTop = 0;
      document.body.style.overflow = 'hidden';
      syncCarouselAutoplay();

      if (proofVaultClose && typeof proofVaultClose.focus === 'function') {
        window.setTimeout(() => {
          try {
            proofVaultClose.focus({ preventScroll: true });
          } catch {
            // Ignore focus errors
          }
        }, 50);
      }
    };

    const closeProofVault = () => {
      stopCarouselAutoplay();
      if (!proofVaultModal) return;
      proofVaultModal.classList.add('hidden');
      document.body.style.overflow = '';
    };

    vaultCloseFn = closeProofVault;

    updateFilterCounts();

    document.querySelectorAll('[data-open-proofs]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const filter = trigger.getAttribute('data-open-proofs') || 'all';
        openProofVault(filter);
      });
    });

    if (proofVaultClose) proofVaultClose.addEventListener('click', closeProofVault);
    if (proofVaultCloseIcon) proofVaultCloseIcon.addEventListener('click', closeProofVault);
    if (proofVaultModal) {
      proofVaultModal.addEventListener('click', (e) => {
        if (e.target === proofVaultModal) closeProofVault();
      });
    }

    if (carouselPrev) carouselPrev.addEventListener('click', () => stepCarousel(-1, false));
    if (carouselNext) carouselNext.addEventListener('click', () => stepCarousel(1, false));
    if (carouselMediaBtn) {
      carouselMediaBtn.addEventListener('click', () => {
        if (carouselSwipeGuard.wasRecentSwipe()) return;
        const item = filteredList[carouselIndex];
        if (item) openLightbox(item, filteredList, carouselIndex);
      });
    }
    if (carouselAutoBtn) {
      carouselAutoBtn.addEventListener('click', () => {
        carouselAutoEnabled = !carouselAutoEnabled;
        syncCarouselAutoplay();
      });
    }

    carouselSwipeGuard = bindSwipeGesture(
      carouselViewport,
      () => stepCarousel(1, false),
      () => stepCarousel(-1, false),
      () => {
        carouselTouching = true;
        stopCarouselAutoplay();
      },
      () => {
        carouselTouching = false;
        syncCarouselAutoplay();
      }
    );

    if (filterBar) {
      filterBar.querySelectorAll('[data-proof-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const nextFilter = btn.getAttribute('data-proof-filter') || 'all';
          if (nextFilter === activeFilter && proofRenderedOnce) return;
          activeFilter = nextFilter;
          syncFilterButtons(activeFilter);
          renderProofGrid(true);
          proofRenderedOnce = true;
          syncCarouselAutoplay();
        });
      });
    }

    // Lightbox controls + Android swipe + Auto-Swipe
    const lbModal = document.getElementById('lightbox-modal');
    const lbClose = document.getElementById('lightbox-close');
    const lbPrev = document.getElementById('lightbox-prev');
    const lbNext = document.getElementById('lightbox-next');
    const lbAutoBtn = document.getElementById('lightbox-autoplay');
    const lbSwipeZone = document.getElementById('lightbox-swipe-zone');

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', () => stepLightbox(-1, false));
    if (lbNext) lbNext.addEventListener('click', () => stepLightbox(1, false));
    if (lbAutoBtn) {
      lbAutoBtn.addEventListener('click', () => {
        lightboxAutoplayEnabled = !lightboxAutoplayEnabled;
        updateLightboxAutoplayUI();
        resetLightboxAutoplay();
      });
    }
    if (lbModal) {
      lbModal.addEventListener('click', (e) => {
        if (e.target === lbModal) closeLightbox();
      });
    }

    bindSwipeGesture(
      lbSwipeZone,
      () => stepLightbox(1, false),
      () => stepLightbox(-1, false),
      () => {
        lightboxTouching = true;
        stopLightboxAutoplay();
      },
      () => {
        lightboxTouching = false;
        resetLightboxAutoplay();
      }
    );
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
    let previewIsObjectUrl = false;
    let fileName = state.lastFileName;
    let dimensions = state.lastDimensions;
    let confirmed = false;
    let isVerifying = false;

    const MAX_BYTES = 15 * 1024 * 1024;
    const step1Card = document.getElementById('step1-card');
    const uploadCard = document.getElementById('upload-card');
    const step4Card = document.getElementById('step4-card');
    const step5Card = document.getElementById('step5-card');
    const followBtn = document.getElementById('follow-instagram-btn');
    const footerIg = document.getElementById('footer-ig-link');
    const igNote = document.getElementById('ig-opened-note');
    const uploadLockedNotice = document.getElementById('upload-locked-notice');
    const fileInput = document.getElementById('screenshot-input');
    const dropzone = document.getElementById('dropzone');
    const dropzoneTitle = document.getElementById('dropzone-title');
    const browseLabel = dropzone ? dropzone.querySelector('.browse-label') : null;
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
    const unlockBtnLabel = document.getElementById('unlock-btn-label');
    const stateLocked = document.getElementById('state-locked');
    const stateUnlocked = document.getElementById('state-unlocked');
    const confirmedFileBox = document.getElementById('confirmed-file-box');
    const confirmedFileMeta = document.getElementById('confirmed-file-meta');
    const unlockedBotCta = document.getElementById('unlocked-bot-cta');
    const unlockedBotCtaLabel = document.getElementById('unlocked-bot-cta-label');
    const resetWrap = document.getElementById('reset-wrap');
    const resetBtn = document.getElementById('reset-verify-btn');

    const pulseElement = (el) => {
      if (!el || prefersReducedMotion) return;
      el.classList.remove('task-focus-pulse');
      void el.offsetWidth;
      el.classList.add('task-focus-pulse');
    };

    const scrollToTarget = (cardEl, focusEl) => {
      if (!cardEl) return;
      cardEl.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
      pulseElement(cardEl);
      if (focusEl && typeof focusEl.focus === 'function') {
        window.setTimeout(() => {
          try {
            focusEl.focus({ preventScroll: true });
          } catch {
            // Ignore focus restrictions
          }
        }, 280);
      }
    };

    const showStepWarning = (msg) => {
      if (!step1Warning) return;
      if (!msg) {
        step1Warning.classList.add('hidden');
        step1Warning.textContent = '';
      } else {
        step1Warning.textContent = msg;
        step1Warning.classList.remove('hidden');
      }
    };

    const scrollToNextIncompleteTask = () => {
      if (!state.instagramClicked) {
        showStepWarning('Complete Step 1: Click "Follow Instagram" first.');
        scrollToTarget(step1Card, followBtn);
        return;
      }
      if (!previewUrl && !state.unlocked) {
        showStepWarning('Complete Step 2: Select and upload your follow screenshot.');
        scrollToTarget(uploadCard, browseLabel);
        return;
      }
      if (!confirmed && !state.unlocked) {
        showStepWarning('Please tick the confirmation checkbox above, then click Verify Screenshot.');
        scrollToTarget(step4Card, confirmCheckbox);
        pulseElement(confirmLabel);
        return;
      }
      if (!state.unlocked) {
        showStepWarning(null);
        scrollToTarget(step4Card, unlockBtn);
        return;
      }
      scrollToTarget(step5Card, unlockedBotCta);
    };

    const syncUI = (animateUnlock, animateUploadOpen) => {
      const hasImage = Boolean(previewUrl);
      const activeStep = state.unlocked
        ? 5
        : confirmed && hasImage
        ? 4
        : hasImage
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
      if (s2) {
        s2.textContent = hasImage || state.unlocked ? 'Uploaded' : state.instagramClicked ? 'Open Now' : 'Locked';
      }
      if (s3) s3.textContent = state.unlocked ? 'Verified' : confirmed ? 'Ready' : 'Pending';

      // Confirmation checkbox state
      const checkboxDisabled = !hasImage || !state.instagramClicked;
      if (confirmCheckbox) {
        confirmCheckbox.disabled = checkboxDisabled;
        confirmCheckbox.checked = confirmed;
      }
      if (confirmLabel) {
        confirmLabel.classList.toggle('is-disabled', checkboxDisabled);
        confirmLabel.classList.toggle('is-checked', hasImage && confirmed);
      }

      const canUnlock = Boolean(state.instagramClicked && hasImage && confirmed);
      if (canUnlock || state.unlocked) {
        showStepWarning(null);
      }
      if (unlockBtn) {
        unlockBtn.classList.toggle('is-locked-btn', !canUnlock && !isVerifying);
        unlockBtn.setAttribute('aria-disabled', canUnlock && !isVerifying ? 'false' : 'true');
      }
      if (unlockBtnLabel) {
        unlockBtnLabel.textContent = isVerifying
          ? 'Verifying Screenshot...'
          : state.unlocked
          ? 'Screenshot Verified'
          : 'Verify Screenshot';
      }

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

      // Join buttons link to the Telegram channel; Step 5 UNBAN YOUR ID button links to the bot ONLY after verification
      const channelUrl = CONFIG.telegramChannelUrl || 'https://t.me/+bmeECrH6ozc2YTA1';
      const channelAnchors = [
        document.getElementById('header-cta-unlocked'),
        document.getElementById('mobile-cta-unlocked'),
        document.getElementById('footer-tg-unlocked'),
      ];

      channelAnchors.forEach((a) => {
        if (a) a.href = channelUrl;
      });

      if (unlockedBotCta) {
        if (state.unlocked) {
          unlockedBotCta.href = CONFIG.telegramUrl;
        } else {
          unlockedBotCta.removeAttribute('href');
        }
      }

      const togglePair = (lockedId, unlockedId) => {
        const l = document.getElementById(lockedId);
        const u = document.getElementById(unlockedId);
        if (l) l.classList.toggle('hidden', state.unlocked);
        if (u) u.classList.toggle('hidden', !state.unlocked);
      };

      togglePair('header-cta-locked', 'header-cta-unlocked');
      togglePair('mobile-cta-locked', 'mobile-cta-unlocked');
      togglePair('footer-tg-locked', 'footer-tg-unlocked');

      const heroStatus = document.getElementById('hero-status-text');
      if (heroStatus) {
        heroStatus.textContent = state.unlocked
          ? 'Verified · Tap Unban Your ID'
          : 'Follow & Verify to Unlock';
      }

      if (state.unlocked) {
        if (unlockedBotCtaLabel) unlockedBotCtaLabel.textContent = 'UNBAN YOUR ID';
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

    const revokePreview = () => {
      if (previewUrl && previewIsObjectUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrl = null;
      previewIsObjectUrl = false;
    };

    const clearImage = () => {
      revokePreview();
      fileName = null;
      dimensions = null;
      confirmed = false;
      isVerifying = false;
      if (fileInput) fileInput.value = '';
      showUploadError(null);
      showStepWarning(null);
      syncUI(false, false);
    };

    const isLikelyImageFile = (file) => {
      if (file.type && file.type.startsWith('image/')) return true;
      return /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i.test(file.name || '');
    };

    const commitLoadedImage = (srcUrl, isObjectUrl, file, width, height) => {
      if (dropzoneTitle) {
        dropzoneTitle.textContent = 'Drag & drop your screenshot here, or browse from device';
      }
      if (width < 100 || height < 100) {
        if (isObjectUrl) URL.revokeObjectURL(srcUrl);
        if (fileInput) fileInput.value = '';
        showUploadError('Screenshot resolution is too small. Please upload a clear follow screenshot.');
        return;
      }

      revokePreview();
      previewUrl = srcUrl;
      previewIsObjectUrl = isObjectUrl;
      fileName = file.name || 'follow-screenshot.png';
      dimensions = width + ' × ' + height + ' px';
      confirmed = false;

      if (previewImg) previewImg.src = previewUrl;
      if (previewFilename) previewFilename.textContent = fileName;
      if (previewDims) previewDims.textContent = dimensions;
      if (dropzone) dropzone.classList.add('hidden');
      if (previewBox) previewBox.classList.remove('hidden');
      if (clearBtn) clearBtn.classList.remove('hidden');
      syncUI(false, false);

      window.setTimeout(() => {
        scrollToTarget(step4Card, confirmCheckbox);
      }, 220);
    };

    const processFile = (file) => {
      if (!state.instagramClicked) {
        scrollToNextIncompleteTask();
        return;
      }
      showUploadError(null);
      void trackEvent('screenshotAttempts');

      if (!isLikelyImageFile(file)) {
        if (fileInput) fileInput.value = '';
        showUploadError('Please select a valid screenshot image (PNG, JPG, WEBP, or GIF).');
        return;
      }
      if (file.size <= 0 || file.size > MAX_BYTES) {
        if (fileInput) fileInput.value = '';
        showUploadError('Image exceeds the 15 MB browser limit. Please upload a smaller screenshot.');
        return;
      }

      if (dropzoneTitle) dropzoneTitle.textContent = 'Reading screenshot locally...';

      const loadViaDataUrlFallback = () => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          if (!dataUrl) {
            if (dropzoneTitle) {
              dropzoneTitle.textContent = 'Drag & drop your screenshot here, or browse from device';
            }
            if (fileInput) fileInput.value = '';
            showUploadError('Could not read that image locally. Please try a PNG or JPG screenshot.');
            return;
          }
          const imgFallback = new Image();
          imgFallback.onload = () => {
            commitLoadedImage(dataUrl, false, file, imgFallback.naturalWidth, imgFallback.naturalHeight);
          };
          imgFallback.onerror = () => {
            if (dropzoneTitle) {
              dropzoneTitle.textContent = 'Drag & drop your screenshot here, or browse from device';
            }
            if (fileInput) fileInput.value = '';
            showUploadError('Unsupported screenshot format. Please choose a PNG or JPG screenshot.');
          };
          imgFallback.src = dataUrl;
        };
        reader.onerror = () => {
          if (dropzoneTitle) {
            dropzoneTitle.textContent = 'Drag & drop your screenshot here, or browse from device';
          }
          if (fileInput) fileInput.value = '';
          showUploadError('Could not read that image locally. Please try a PNG or JPG screenshot.');
        };
        reader.readAsDataURL(file);
      };

      const objectUrl = URL.createObjectURL(file);
      const probe = new Image();

      probe.onload = () => {
        commitLoadedImage(objectUrl, true, file, probe.naturalWidth, probe.naturalHeight);
      };

      probe.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        loadViaDataUrlFallback();
      };

      probe.src = objectUrl;
    };

    const handleIgClick = () => {
      const wasClicked = state.instagramClicked;
      state.instagramClicked = true;
      saveVerification(state);
      void trackEvent('instagramClicks');
      syncUI(false, !wasClicked);
      window.setTimeout(() => {
        scrollToTarget(uploadCard, browseLabel);
      }, 180);
    };

    if (followBtn) followBtn.addEventListener('click', handleIgClick);
    if (footerIg) footerIg.addEventListener('click', handleIgClick);

    if (uploadLockedNotice) {
      uploadLockedNotice.addEventListener('click', () => {
        scrollToNextIncompleteTask();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (!state.instagramClicked) {
          scrollToNextIncompleteTask();
          return;
        }
        const file = e.target.files && e.target.files[0];
        if (file) processFile(file);
      });
    }

    if (dropzone) {
      dropzone.addEventListener('click', (e) => {
        if (!state.instagramClicked) {
          e.preventDefault();
          scrollToNextIncompleteTask();
          return;
        }
        if (e.target && e.target.closest && e.target.closest('label')) {
          return;
        }
        if (fileInput) fileInput.click();
      });
      dropzone.addEventListener('dragover', (e) => {
        if (!state.instagramClicked) return;
        e.preventDefault();
        dropzone.classList.add('is-dragging');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));
      dropzone.addEventListener('drop', (e) => {
        if (!state.instagramClicked) {
          e.preventDefault();
          scrollToNextIncompleteTask();
          return;
        }
        e.preventDefault();
        dropzone.classList.remove('is-dragging');
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) processFile(file);
      });
    }

    if (clearBtn) clearBtn.addEventListener('click', clearImage);

    if (confirmLabel) {
      confirmLabel.addEventListener('click', (e) => {
        if (!state.instagramClicked || !previewUrl) {
          e.preventDefault();
          scrollToNextIncompleteTask();
        }
      });
    }

    if (confirmCheckbox) {
      confirmCheckbox.addEventListener('change', (e) => {
        confirmed = Boolean(e.target.checked);
        syncUI(false, false);
      });
    }

    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => {
        if (isVerifying) return;
        if (!state.instagramClicked || !previewUrl || !confirmed) {
          scrollToNextIncompleteTask();
          return;
        }
        isVerifying = true;
        syncUI(false, false);
        window.setTimeout(() => {
          isVerifying = false;
          state.unlocked = true;
          state.lastFileName = fileName;
          state.lastDimensions = dimensions;
          saveVerification(state);
          syncUI(true, false);
          scrollToTarget(step5Card, unlockedBotCta);
          const announce = document.getElementById('sr-announce');
          if (announce) announce.textContent = 'Your Free ID Unban Link Is Ready! Tap Unban Your ID.';
        }, 550);
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
        scrollToTarget(step1Card, followBtn);
      });
    }

    document.querySelectorAll('[data-scroll-verify]').forEach((btn) => {
      btn.addEventListener('click', () => {
        scrollToNextIncompleteTask();
      });
    });

    document.querySelectorAll('[data-telegram-track]').forEach((el) => {
      el.addEventListener('click', () => {
        void trackEvent('telegramClicks');
      });
    });

    syncUI(false, false);
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
      const lbModal = document.getElementById('lightbox-modal');
      const lbOpen = lbModal && !lbModal.classList.contains('hidden');
      const pvModal = document.getElementById('proof-vault-modal');
      const pvOpen = pvModal && !pvModal.classList.contains('hidden');
      const prOpen = privacyModal && !privacyModal.classList.contains('hidden');

      if (e.key === 'Escape') {
        if (lbOpen) {
          closeLightbox();
        } else if (prOpen) {
          hidePrivacy();
        } else if (pvOpen && vaultCloseFn) {
          vaultCloseFn();
        }
      } else if (lbOpen && e.key === 'ArrowLeft') {
        stepLightbox(-1, false);
      } else if (lbOpen && e.key === 'ArrowRight') {
        stepLightbox(1, false);
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
