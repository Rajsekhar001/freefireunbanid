export interface ShowcaseAsset {
  id: string;
  title: string;
  caption: string;
  category: string;
  src: string;
  alt: string;
}

export const SITE_CONFIG = {
  brandName: 'APEX ID UNBAN BOT',
  communityName: 'APEX CARNAGE LIVE',
  tagline: 'YOUR GAMING COMMUNITY. YOUR ACCESS. YOUR EXPERIENCE.',
  description:
    'Welcome to APEX ID UNBAN BOT, the official community access portal of APEX CARNAGE LIVE. Explore our gaming community, access available bot services and stay connected with the latest updates.',
  instagramHandle: '@apex.carnage.live',
  instagramUrl: 'https://www.instagram.com/apex.carnage.live/',
  telegramHandle: '@Apex_unban_bot',
  telegramUrl: 'https://t.me/Apex_unban_bot',
  telegramLabel: 'Join Telegram',
  logoSrc: './assets/icons/apex-logo.svg',
  copyrightYear: 2026,
  footerSubtitle: 'Gaming Technology | Community | Educational Purposes',
} as const;

export const COUNTER_API_CONFIG = {
  baseUrl: 'https://api.counterapi.dev/v2',
  // Set your free CounterAPI v2 workspace slug here (from https://counterapi.dev)
  // or via VITE_COUNTERAPI_WORKSPACE at build time for global cross-visitor counts.
  workspace: (import.meta.env.VITE_COUNTERAPI_WORKSPACE as string | undefined)?.trim() || '',
  accessToken: (import.meta.env.VITE_COUNTERAPI_TOKEN as string | undefined)?.trim() || '',
  counters: {
    visitors: 'visitors',
    telegramClicks: 'telegram-clicks',
    instagramClicks: 'instagram-clicks',
    screenshotAttempts: 'screenshot-attempts',
  },
} as const;

export const SHOWCASE_ASSETS: ShowcaseAsset[] = [
  {
    id: 'unban-bot-hero',
    title: 'Free Fire Unban Bot Thumbnail',
    caption: 'Official APEX ID UNBAN BOT community portal banner featuring before-and-after account status showcase.',
    category: 'Official Thumbnail',
    src: './assets/aistudio/Free_Fire_Unban_Bot_Success_31bdbe12.png',
    alt: 'APEX ID UNBAN BOT Free Fire Free Service and Unban Success thumbnail',
  },
  {
    id: 'unban-proof-showcase',
    title: 'Banned ID Proof & Bot Showcase',
    caption: 'Community proof overview highlighting Free & Paid service tiers and instant Telegram bot access flow.',
    category: 'Community Proof',
    src: './assets/aistudio/6075779673615964132_0763bd47.jpg',
    alt: 'APEX ID UNBAN BOT Banned ID Proof and Free & Paid Unban Bot overview',
  },
];
