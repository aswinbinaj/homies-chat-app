import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessage, validateUsername, getInitials, getAvatarColor } from '../src/utils/helpers.js';
import { formatTimeRemaining, formatDayDivider } from '../src/utils/formatters.js';

test('validateMessage rejects empty or whitespace-only messages', () => {
  assert.equal(validateMessage('').isValid, false);
  assert.equal(validateMessage('   ').isValid, false);
  assert.equal(validateMessage(null).isValid, false);
  assert.equal(validateMessage(undefined).isValid, false);
});

test('validateMessage rejects messages exceeding 1000 characters', () => {
  const longMsg = 'a'.repeat(1001);
  const result = validateMessage(longMsg);
  assert.equal(result.isValid, false);
  assert.match(result.error, /1,000 characters/);
});

test('validateMessage trims valid messages', () => {
  const input = '   Hello friends! 👋   ';
  const result = validateMessage(input);
  assert.equal(result.isValid, true);
  assert.equal(result.sanitized, 'Hello friends! 👋');
});

test('validateMessage preserves XSS payloads as plain string without executing', () => {
  const xss = '<script>alert("test")</script>';
  const result = validateMessage(xss);
  assert.equal(result.isValid, true);
  assert.equal(result.sanitized, '<script>alert("test")</script>');
});

test('validateUsername enforces 3 to 30 valid characters', () => {
  assert.equal(validateUsername('ab').isValid, false);
  assert.equal(validateUsername('a'.repeat(31)).isValid, false);
  assert.equal(validateUsername('rahul!@#').isValid, false);
  assert.equal(validateUsername('rahul_dev').isValid, true);
  assert.equal(validateUsername('alice-123').isValid, true);
});

test('getInitials extracts clean uppercase initials', () => {
  assert.equal(getInitials('Rahul Sharma'), 'RS');
  assert.equal(getInitials('Alice'), 'AL');
  assert.equal(getInitials('john_doe'), 'JD');
  assert.equal(getInitials(''), '?');
});

test('formatTimeRemaining correctly identifies remaining expiration time', () => {
  const now = 1780000000000;
  // 42 minutes in the future
  const expiresAtFuture = new Date(now + 42 * 60 * 1000).toISOString();
  assert.equal(formatTimeRemaining(expiresAtFuture, now), 'Expires in 42m');

  // 30 seconds in the future
  const expiresAtSoon = new Date(now + 30 * 1000).toISOString();
  assert.equal(formatTimeRemaining(expiresAtSoon, now), 'Expires in 30s');

  // Expired in past
  const expiresAtPast = new Date(now - 1000).toISOString();
  assert.equal(formatTimeRemaining(expiresAtPast, now), 'Expired');
});

test('Avatar color generator is deterministic for the same name', () => {
  const c1 = getAvatarColor('Rahul');
  const c2 = getAvatarColor('Rahul');
  assert.equal(c1, c2);
});
