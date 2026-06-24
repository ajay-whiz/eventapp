export function buildFieldPlaceholder(label?: string): string {
  const trimmed = label?.trim() ?? '';
  return trimmed ? `Enter ${trimmed}` : '';
}

export function fieldTypeSupportsPlaceholder(type: string): boolean {
  return (
    type === 'text' ||
    type === 'email' ||
    type === 'number' ||
    type === 'textarea' ||
    type === 'MultiImageUpload' ||
    type === 'date-range' ||
    type === 'button' ||
    type === 'date' ||
    type === 'Address' ||
    type === 'button-group'
  );
}
