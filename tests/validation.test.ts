import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVerificationMessageText, getMissingProfileFields, hasMinimumJobDescription, hasMinimumJobRequirements, isEmailLike, isNonNegativePrice, isSomaliPhone, isValidRating, normalizeInternationalPhone, normalizeOptionalEmail, normalizePhone } from '../src/validation';

test('normalizes phone numbers by removing spaces and dashes', () => {
  assert.equal(normalizePhone('+252 90-700 1122'), '+252907001122');
});

test('accepts common Somali phone formats', () => {
  assert.equal(isSomaliPhone('+252907001122'), true);
  assert.equal(isSomaliPhone('907001122'), true);
});

test('rejects invalid phone formats', () => {
  assert.equal(isSomaliPhone('123'), false);
  assert.equal(isSomaliPhone('+15551234567'), false);
});

test('normalizes optional emails', () => {
  assert.equal(normalizeOptionalEmail(' USER@Example.COM '), 'user@example.com');
  assert.equal(normalizeOptionalEmail('   '), null);
});

test('validates email-like values and allows blank optional email', () => {
  assert.equal(isEmailLike('name@example.com'), true);
  assert.equal(isEmailLike(''), true);
  assert.equal(isEmailLike('not-an-email'), false);
});

test('validates review ratings from 1 to 5', () => {
  assert.equal(isValidRating(1), true);
  assert.equal(isValidRating(5), true);
  assert.equal(isValidRating(0), false);
  assert.equal(isValidRating(6), false);
});
test('detects common and worker-specific missing profile fields', () => {
  assert.deepEqual(getMissingProfileFields({
    name: 'Amina',
    phone: '+252907001122',
    role: 'worker',
    location: '',
    bio: '',
    skill: '',
    rate: '',
    availability: undefined,
  }), ['location', 'bio', 'skill', 'availability']);
});

test('validates optional non-negative prices', () => {
  assert.equal(isNonNegativePrice(''), true);
  assert.equal(isNonNegativePrice(0), true);
  assert.equal(isNonNegativePrice(25.5), true);
  assert.equal(isNonNegativePrice(-1), false);
});

test('enforces job description and requirements minimums', () => {
  assert.equal(hasMinimumJobDescription('a'.repeat(99)), false);
  assert.equal(hasMinimumJobDescription('a'.repeat(100)), true);
  assert.equal(hasMinimumJobRequirements('a'.repeat(49)), false);
  assert.equal(hasMinimumJobRequirements('a'.repeat(50)), true);
});

test('normalizes international WhatsApp numbers', () => {
  assert.equal(normalizeInternationalPhone('+252 90 700 1122'), '+252907001122');
  assert.equal(normalizeInternationalPhone('252907001122'), '+252907001122');
  assert.equal(normalizeInternationalPhone('123'), null);
});

test('does not require worker-only fields from employers', () => {
  assert.deepEqual(getMissingProfileFields({
    name: 'Qardho Shop',
    phone: '+252907001122',
    role: 'employer',
    location: 'Kaambo',
    bio: 'Local employer',
  }), []);
});

test('builds a readable verification message from selected fields and a note', () => {
  const message = buildVerificationMessageText('Amina', ['location', 'bio'], 'Add a clear description of your experience.');
  assert.match(message, /Location, Profile bio/);
  assert.match(message, /clear description/);
});
