export function normalizeHospitalBodyText(bodyText) {
  return String(bodyText ?? '').replace(/\s+/g, ' ').trim();
}

export function classifyHospitalBody(bodyText) {
  const visibleText = normalizeHospitalBodyText(bodyText);
  return {
    visibleText,
    fatal: /The clinical world could not load\./.test(visibleText),
    entry:
      /Pediatric Hospital/.test(visibleText) &&
      /Enter the hospital|Resume patient|Loading saved shift/.test(visibleText),
  };
}
