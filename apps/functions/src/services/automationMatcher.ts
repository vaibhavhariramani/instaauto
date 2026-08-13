import { MatchType } from '@instaauto/shared';

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns the first keyword that matches `text` under `matchType`, or null if none match.
 * Pure function — kept dependency-free so it's cheap to unit test.
 */
export function matchKeyword(text: string, keywords: string[], matchType: MatchType): string | null {
  const normalizedText = normalize(text);
  const normalizedKeywords = keywords.map(normalize).filter(Boolean);

  if (matchType === MatchType.EXACT) {
    return normalizedKeywords.find((k) => normalizedText === k) ?? null;
  }

  if (matchType === MatchType.CONTAINS) {
    return normalizedKeywords.find((k) => normalizedText.includes(k)) ?? null;
  }

  // ANY_KEYWORD: whole-word/phrase match, tolerant of punctuation and emoji.
  const words = tokenize(text);
  for (const keyword of normalizedKeywords) {
    const keywordWords = tokenize(keyword);
    if (keywordWords.length === 1) {
      if (words.includes(keywordWords[0]!)) return keyword;
    } else {
      const joined = words.join(' ');
      if (joined.includes(keywordWords.join(' '))) return keyword;
    }
  }
  return null;
}

const VARIABLE_PATTERN = /\{\{\s*(username|first_name|reel_title)\s*\}\}/g;

export function renderTemplate(
  content: string,
  vars: { username: string; firstName?: string; reelTitle?: string },
): string {
  return content.replace(VARIABLE_PATTERN, (_match, key: string) => {
    switch (key) {
      case 'username':
        return vars.username;
      case 'first_name':
        return vars.firstName ?? vars.username;
      case 'reel_title':
        return vars.reelTitle ?? '';
      default:
        return '';
    }
  });
}
