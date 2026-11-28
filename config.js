// ============================================================================
// APEX ID UNBAN BOT — CENTRAL CONFIGURATION
// Edit values here without touching HTML or JavaScript logic.
// ============================================================================

window.APEX_CONFIG = {
  brandName: 'APEX ID UNBAN BOT',
  communityName: 'APEX CARNAGE LIVE',
  tagline: 'YOUR GAMING COMMUNITY. YOUR ACCESS. YOUR EXPERIENCE.',
  description:
    'Welcome to APEX ID UNBAN BOT, the official community access portal of APEX CARNAGE LIVE. Explore our gaming community, access available bot services and stay connected with the latest updates.',
  footerSubtitle: 'Gaming Technology | Community | Educational Purposes',
  copyrightYear: 2026,

  instagramHandle: '@apex.carnage.live',
  instagramUrl: 'https://www.instagram.com/apex.carnage.live/',

  // Official Telegram bot target — never printed as text on the page, unlocked only after Step 1 follow + screenshot verification
  telegramUrl: 'https://t.me/Apex_unban_bot',

  logoSrc: './assets/icons/apex-logo.svg',

  // Official community artwork stored in assets/images/ (100% Free Service)
  showcaseAssets: [
    {
      id: 'unban-bot-hero',
      title: 'Free Fire Unban Bot — 100% Free Service',
      caption:
        'Official APEX ID UNBAN BOT community portal banner showcasing our 100% free service and verified community reward access.',
      category: '100% Free Official Thumbnail',
      src: './assets/images/free-fire-unban-bot.png',
      alt: 'APEX ID UNBAN BOT Free Fire 100% Free Service and Unban Success thumbnail',
    },
  ],

  // Optional: Free CounterAPI v2 workspace for global cross-visitor counters (https://counterapi.dev)
  // Leave workspace empty ('') to show real browser-local counts with zero fake statistics.
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
