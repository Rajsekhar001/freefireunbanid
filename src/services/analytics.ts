import { COUNTER_API_CONFIG } from '../config';

export type AnalyticsMetricKey =
  | 'visitors'
  | 'telegramClicks'
  | 'instagramClicks'
  | 'screenshotAttempts';

export interface AnalyticsSnapshot {
  source: 'counterapi-v2' | 'local-only' | 'offline';
  globalCounts: Record<AnalyticsMetricKey, number | null>;
  localCounts: Record<AnalyticsMetricKey, number>;
  lastUpdated: string;
}

const LOCAL_STORAGE_KEY = 'apex_local_analytics_v1';
const SESSION_VISIT_KEY = 'apex_session_visit_recorded';

const DEFAULT_LOCAL_COUNTS: Record<AnalyticsMetricKey, number> = {
  visitors: 0,
  telegramClicks: 0,
  instagramClicks: 0,
  screenshotAttempts: 0,
};

function readLocalCounts(): Record<AnalyticsMetricKey, number> {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LOCAL_COUNTS };
    const parsed = JSON.parse(raw) as Partial<Record<AnalyticsMetricKey, unknown>>;
    return {
      visitors: typeof parsed.visitors === 'number' && Number.isFinite(parsed.visitors) ? parsed.visitors : 0,
      telegramClicks:
        typeof parsed.telegramClicks === 'number' && Number.isFinite(parsed.telegramClicks)
          ? parsed.telegramClicks
          : 0,
      instagramClicks:
        typeof parsed.instagramClicks === 'number' && Number.isFinite(parsed.instagramClicks)
          ? parsed.instagramClicks
          : 0,
      screenshotAttempts:
        typeof parsed.screenshotAttempts === 'number' && Number.isFinite(parsed.screenshotAttempts)
          ? parsed.screenshotAttempts
          : 0,
    };
  } catch {
    return { ...DEFAULT_LOCAL_COUNTS };
  }
}

function writeLocalCounts(counts: Record<AnalyticsMetricKey, number>): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // Ignore storage quota or private-mode restrictions cleanly
  }
}

function incrementLocalMetric(key: AnalyticsMetricKey): Record<AnalyticsMetricKey, number> {
  const current = readLocalCounts();
  const next = { ...current, [key]: current[key] + 1 };
  writeLocalCounts(next);
  return next;
}

function extractCounterValue(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.value === 'number') return obj.value;
  if (typeof obj.count === 'number') return obj.count;
  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (typeof data.up_count === 'number') return data.up_count;
    if (typeof data.value === 'number') return data.value;
    if (typeof data.count === 'number') return data.count;
  }
  return null;
}

async function callCounterApi(
  counterSlug: string,
  action: 'read' | 'up'
): Promise<number | null> {
  const { baseUrl, workspace, accessToken } = COUNTER_API_CONFIG;
  if (!workspace) return null;

  const endpoint =
    action === 'up'
      ? `${baseUrl}/${encodeURIComponent(workspace)}/${encodeURIComponent(counterSlug)}/up`
      : `${baseUrl}/${encodeURIComponent(workspace)}/${encodeURIComponent(counterSlug)}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(endpoint, { method: 'GET', headers });
    if (!response.ok) return null;
    const json = (await response.json()) as unknown;
    return extractCounterValue(json);
  } catch {
    return null;
  }
}

export function isGlobalAnalyticsConfigured(): boolean {
  return Boolean(COUNTER_API_CONFIG.workspace);
}

export async function initializeVisitorAnalytics(): Promise<AnalyticsSnapshot> {
  const hasRecordedVisit = (() => {
    try {
      return window.sessionStorage.getItem(SESSION_VISIT_KEY) === '1';
    } catch {
      return false;
    }
  })();

  let localCounts = readLocalCounts();
  if (!hasRecordedVisit) {
    localCounts = incrementLocalMetric('visitors');
    try {
      window.sessionStorage.setItem(SESSION_VISIT_KEY, '1');
    } catch {
      // Ignore private browsing sessionStorage blocks
    }
  }

  if (!isGlobalAnalyticsConfigured()) {
    return {
      source: 'local-only',
      globalCounts: {
        visitors: null,
        telegramClicks: null,
        instagramClicks: null,
        screenshotAttempts: null,
      },
      localCounts,
      lastUpdated: new Date().toISOString(),
    };
  }

  const [visitors, telegramClicks, instagramClicks, screenshotAttempts] = await Promise.all([
    callCounterApi(COUNTER_API_CONFIG.counters.visitors, hasRecordedVisit ? 'read' : 'up'),
    callCounterApi(COUNTER_API_CONFIG.counters.telegramClicks, 'read'),
    callCounterApi(COUNTER_API_CONFIG.counters.instagramClicks, 'read'),
    callCounterApi(COUNTER_API_CONFIG.counters.screenshotAttempts, 'read'),
  ]);

  const anyOnline =
    visitors !== null ||
    telegramClicks !== null ||
    instagramClicks !== null ||
    screenshotAttempts !== null;

  return {
    source: anyOnline ? 'counterapi-v2' : 'offline',
    globalCounts: {
      visitors,
      telegramClicks,
      instagramClicks,
      screenshotAttempts,
    },
    localCounts,
    lastUpdated: new Date().toISOString(),
  };
}

export async function recordAnalyticsEvent(
  metric: Exclude<AnalyticsMetricKey, 'visitors'>,
  currentSnapshot: AnalyticsSnapshot
): Promise<AnalyticsSnapshot> {
  const localCounts = incrementLocalMetric(metric);
  const slug = COUNTER_API_CONFIG.counters[metric];

  if (!isGlobalAnalyticsConfigured()) {
    return {
      ...currentSnapshot,
      source: 'local-only',
      localCounts,
      lastUpdated: new Date().toISOString(),
    };
  }

  const updatedGlobal = await callCounterApi(slug, 'up');
  return {
    ...currentSnapshot,
    source: updatedGlobal !== null ? 'counterapi-v2' : currentSnapshot.source,
    localCounts,
    globalCounts: {
      ...currentSnapshot.globalCounts,
      [metric]: updatedGlobal ?? currentSnapshot.globalCounts[metric],
    },
    lastUpdated: new Date().toISOString(),
  };
}
