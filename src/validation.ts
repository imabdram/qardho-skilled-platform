export const VALID_ROLES = ['worker', 'employer', 'pending'] as const;
export const VALID_JOB_STATUSES = ['open', 'in_progress', 'completed', 'closed'] as const;
export const VALID_REQUEST_STATUSES = ['accepted', 'declined'] as const;
export const VALID_AVAILABILITY = ['available', 'busy', 'unavailable'] as const;

export type ValidRole = typeof VALID_ROLES[number];
export type ValidJobStatus = typeof VALID_JOB_STATUSES[number];
export type ValidRequestStatus = typeof VALID_REQUEST_STATUSES[number];
export type ValidAvailability = typeof VALID_AVAILABILITY[number];

export const isBlank = (value: unknown) => typeof value !== 'string' || value.trim().length === 0;

export const normalizeOptionalEmail = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeRequiredText = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export const isEmailLike = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

export const normalizePhone = (value: unknown) => typeof value === 'string' ? value.replace(/[\s-]/g, '').trim() : '';

export const isSomaliPhone = (value: unknown) => {
  const normalized = normalizePhone(value);
  return /^\+252\d{8,9}$/.test(normalized) || /^\d{8,9}$/.test(normalized);
};

export const isOneOf = <T extends readonly string[]>(value: unknown, allowed: T): value is T[number] => (
  typeof value === 'string' && allowed.includes(value as T[number])
);

export const isValidRating = (value: unknown) => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
