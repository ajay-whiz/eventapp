export function extractCityFromAddress(address?: string): string {
  if (!address) return '';

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts[0];
  }

  return '';
}
