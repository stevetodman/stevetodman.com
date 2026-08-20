export function normalizeSearchTokens(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || [];
}

export function rankSearch(items, query) {
  const tokens = [...new Set(normalizeSearchTokens(query))];
  if (!tokens.length) {
    return [...items]
      .map(item => ({ item, score: 0 }))
      .sort((a, b) => a.item.title.localeCompare(b.item.title));
  }

  const ranked = [];
  for (const item of items) {
    const titleTokens = new Set(normalizeSearchTokens(item.title));
    const titleText = normalizeSearchTokens(item.title).join(' ');
    const metaText = normalizeSearchTokens([item.category, item.audience, item.route].join(' ')).join(' ');
    const contentTerms = new Set(Array.isArray(item.terms) ? item.terms : normalizeSearchTokens(item.terms));

    let score = 0;
    let matched = true;
    for (const token of tokens) {
      if (titleTokens.has(token)) score += 10;
      else if (titleText.includes(token)) score += 6;
      else if (metaText.includes(token)) score += 3;
      else if (contentTerms.has(token)) score += 1;
      else {
        matched = false;
        break;
      }
    }
    if (matched) ranked.push({ item, score });
  }

  return ranked.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
}
