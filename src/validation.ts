import type { ProfileFieldKey, User } from './types';

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
export const isNonNegativePrice = (value: unknown) => value === undefined || value === null || value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0);
export const hasMinimumJobDescription = (value: unknown) => typeof value === 'string' && value.trim().length >= 100;
export const hasMinimumJobRequirements = (value: unknown) => typeof value === 'string' && value.trim().length >= 50;
export const normalizeInternationalPhone = (value: unknown) => {
  const normalized = typeof value === 'string' ? value.replace(/[^\d+]/g, '') : '';
  if (!normalized) return null;
  const cleanDigits = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  const digits = cleanDigits.startsWith('252') ? cleanDigits.slice(3) : cleanDigits;
  const withPrefix = `+252${digits}`;
  return /^\+252\d{8,9}$/.test(withPrefix) ? withPrefix : null;
};
export const PROFILE_FIELD_LABELS: Record<ProfileFieldKey, string> = {
  name: 'Full name',
  phone: 'Phone number',
  email: 'Email address',
  role: 'Account role',
  location: 'Location',
  bio: 'Profile bio',
  skill: 'Skill or trade',
  rate: 'Expected rate',
  availability: 'Availability',
};

export const isProfileFieldKey = (value: unknown): value is ProfileFieldKey => (
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(PROFILE_FIELD_LABELS, value)
);

export const getMissingProfileFields = (user: Pick<User, 'name' | 'phone' | 'role' | 'location' | 'bio' | 'skill' | 'rate' | 'availability'>): ProfileFieldKey[] => {
  const missing: ProfileFieldKey[] = [];
  if (!user.name?.trim()) missing.push('name');
  if (!user.phone?.trim()) missing.push('phone');
  if (!user.role || user.role === 'pending') missing.push('role');
  if (!user.location?.trim()) missing.push('location');
  if (!user.bio?.trim()) missing.push('bio');

  if (user.role === 'worker') {
    if (!user.skill?.trim()) missing.push('skill');
    if (!user.availability) missing.push('availability');
  }

  return missing;
};

export const buildVerificationMessageText = (
  userName: string,
  missingFields: ProfileFieldKey[],
  note?: string,
) => {
  const fieldText = missingFields.map((field) => PROFILE_FIELD_LABELS[field]).join(', ');
  const lines = [
    `Hello ${userName}, your Qardho Skilled Platform account is waiting for verification.`,
    fieldText ? `Please update: ${fieldText}.` : '',
    note?.trim() || '',
    'Log in to your account and update your profile, then wait for the admin to review it again.',
  ];
  return lines.filter(Boolean).join('\n\n');
};


