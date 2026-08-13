import { describe, expect, it } from 'vitest';
import { MatchType } from '@instaauto/shared';
import { matchKeyword, renderTemplate } from './automationMatcher';

describe('matchKeyword', () => {
  it('matches CONTAINS as a substring', () => {
    expect(matchKeyword('please send me the guide!', ['send me'], MatchType.CONTAINS)).toBe('send me');
  });

  it('does not match CONTAINS when absent', () => {
    expect(matchKeyword('love this reel', ['send me'], MatchType.CONTAINS)).toBeNull();
  });

  it('matches EXACT only on full equality', () => {
    expect(matchKeyword('guide', ['guide'], MatchType.EXACT)).toBe('guide');
    expect(matchKeyword('send me the guide', ['guide'], MatchType.EXACT)).toBeNull();
  });

  it('matches ANY_KEYWORD on whole words ignoring punctuation/emoji', () => {
    expect(matchKeyword('guide!! 🔥 please', ['guide'], MatchType.ANY_KEYWORD)).toBe('guide');
    expect(matchKeyword('guidebook', ['guide'], MatchType.ANY_KEYWORD)).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(matchKeyword('SEND ME PLEASE', ['send me'], MatchType.CONTAINS)).toBe('send me');
  });
});

describe('renderTemplate', () => {
  it('substitutes known variables', () => {
    const result = renderTemplate('Hi {{username}}, re: {{reel_title}}', {
      username: 'jane',
      reelTitle: 'My Reel',
    });
    expect(result).toBe('Hi jane, re: My Reel');
  });

  it('falls back first_name to username when absent', () => {
    expect(renderTemplate('Hey {{first_name}}', { username: 'jane' })).toBe('Hey jane');
  });
});
