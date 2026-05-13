export function normalizeDocument(doc: string | number): string {
  return String(doc)
    .replace(/[\s.\-_,]/g, '')
    .replace(/^0+/, '')
    .trim();
}
