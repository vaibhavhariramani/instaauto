import { describe, expect, it } from 'vitest';
import { formatNumber, formatPercent, initials, timeAgo } from './format';

describe('formatNumber', () => {
  it('formats thousands and millions', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(2_300_000)).toBe('2.3M');
  });
});

describe('formatPercent', () => {
  it('formats one decimal place', () => {
    expect(formatPercent(97.256)).toBe('97.3%');
  });
});

describe('initials', () => {
  it('takes first letters of first two words', () => {
    expect(initials('Jane Doe')).toBe('JD');
    expect(initials('Cher')).toBe('C');
  });
});

describe('timeAgo', () => {
  it('returns "just now" for very recent timestamps', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });
});
