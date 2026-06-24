import type { FormField } from '../types/form';

export function normalizeBuilderFieldType(type: string): FormField['type'] {
  if (type === 'dropdown') {
    return 'select';
  }

  return type as FormField['type'];
}

export function getBuilderFieldTypeValue(type: string): string {
  return normalizeBuilderFieldType(type);
}

export function isOptionsFieldType(type: string): boolean {
  return (
    type === 'select' ||
    type === 'dropdown' ||
    type === 'radio' ||
    type === 'checkbox' ||
    type === 'multi-select'
  );
}

export function getFieldTypeDisplayLabel(type: string): string {
  switch (type) {
    case 'select':
    case 'dropdown':
      return 'Dropdown';
    case 'multi-select':
      return 'Multi Select';
    case 'button-group':
      return 'Button Group';
    case 'date-range':
      return 'Date Range';
    case 'MultiImageUpload':
      return 'Multi Image Upload';
    default:
      return type.replace(/-/g, ' ');
  }
}
