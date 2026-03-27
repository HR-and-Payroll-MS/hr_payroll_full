const stripWrappingQuotes = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  return trimmed.replace(/^['\"]|['\"]$/g, '');
};

const normalizeOrigin = (value) => stripWrappingQuotes(value).replace(/\/+$/, '');

const envApiOrigin = import.meta.env.VITE_API_BASE_URL || '';
const fallbackOrigin =
  typeof window !== 'undefined' ? window.location.origin : '';

export const API_ORIGIN = normalizeOrigin(envApiOrigin);

export const API_BASE_URL = API_ORIGIN
  ? API_ORIGIN.endsWith('/api/v1')
    ? API_ORIGIN
    : `${API_ORIGIN}/api/v1`
  : `${fallbackOrigin}/api/v1`;

export const WS_ORIGIN =
  normalizeOrigin(import.meta.env.VITE_WS_BASE_URL || API_ORIGIN) ||
  fallbackOrigin;
