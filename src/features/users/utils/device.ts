// Compact, human-readable device labels for sessions and login records.
// Order matters: Edge/Opera identify as Chrome, Chrome identifies as Safari.

const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari']
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux']
];

export function summarizeUserAgent(userAgent: string): string {
  if (!userAgent) return '';

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];

  if (browser && system) return `${browser} on ${system}`;
  // Non-browser clients (SDKs, native apps): keep the leading product token.
  return browser ?? system ?? userAgent.split(' ')[0];
}

export function deviceLabel(deviceName: string, userAgent: string): string {
  return deviceName || summarizeUserAgent(userAgent) || 'Unknown device';
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
}
