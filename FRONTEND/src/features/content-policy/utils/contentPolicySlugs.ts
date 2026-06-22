/** Maps public URL slugs to backend category keys */
export const CONTENT_POLICY_SLUG_ALIASES: Record<string, string> = {
  'terms-and-conditions': 'terms-of-service',
  'terms-of-service': 'terms-of-service',
  'privacy-policy': 'privacy-policy',
  'refund-policy': 'refund-policy',
  'cookie-policy': 'cookie-policy',
  'data-protection': 'data-protection',
  'user-agreement': 'user-agreement',
  'about-us': 'about-us',
};

export function resolveContentPolicyCategory(slug: string): string {
  return CONTENT_POLICY_SLUG_ALIASES[slug] || slug;
}

export function getPublicContentPolicyPath(category: string): string {
  return `/content-policy/${category || 'privacy-policy'}`;
}

export function isMongoObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

export function formatPolicyUpdatedAt(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
