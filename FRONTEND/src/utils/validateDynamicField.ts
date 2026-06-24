import type { DynamicFormField } from '../types/Vendor';

function coerceNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveMaxLength(
  validation: DynamicFormField['validation'],
): number | undefined {
  const configuredMax = coerceNumber(validation?.max?.value);
  const message = validation?.max?.message || '';
  const messageMatch = message.match(/(\d{2,4})/);
  const messageMax = messageMatch ? Number(messageMatch[1]) : undefined;

  if (
    configuredMax !== undefined &&
    messageMax !== undefined &&
    configuredMax !== messageMax
  ) {
    return messageMax;
  }

  return configuredMax ?? messageMax;
}

function isFieldRequired(field: DynamicFormField): boolean {
  return Boolean(field.required || field.validation?.required?.value);
}

export function getFieldOptions(
  field: DynamicFormField,
): { label: string; value: string }[] {
  const raw = field.options || field.metadata?.options || [];
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );
}

export { isFieldRequired };

function isEmptyFieldValue(field: DynamicFormField, value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  switch (field.type) {
    case 'checkbox':
    case 'multi-select':
      return !Array.isArray(value) || value.length === 0;

    case 'date-range': {
      const range = value as { startDate?: string; endDate?: string };
      return !range?.startDate?.trim() || !range?.endDate?.trim();
    }

    case 'button-group':
      return (
        !Array.isArray(value) ||
        value.every((entry) => !String(entry ?? '').trim())
      );

    case 'MultiImageUpload':
      return !Array.isArray(value) || value.length === 0;

    case 'button':
      return false;

    case 'location': {
      const location = value as { address?: string };
      return !location?.address?.trim();
    }

    default:
      if (typeof value === 'string') {
        return value.trim() === '';
      }

      if (typeof value === 'object') {
        return Object.keys(value as object).length === 0;
      }

      return !value;
  }
}

export function getFieldDisplayLabel(field: DynamicFormField): string {
  const candidates = [
    field.name,
    field.label,
    field.metadata?.label,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
}

export function getDynamicFieldButtonLabel(field: DynamicFormField): string {
  const candidates = [
    field.metadata?.label,
    field.label,
    field.name,
    field.placeholder,
    field.key,
    field.metadata?.defaultValue,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return 'Submit';
}

function isAlphanumericRegexMessage(message?: string): boolean {
  return Boolean(message && /letters?\s+and\s+numbers?/i.test(message));
}

function isStrictAlphanumericPattern(pattern: string): boolean {
  return /^(\^)?\[a-zA-Z0-9\]\+(\$)?$/.test(pattern.replace(/\\/g, ''));
}

function passesRegexValidation(
  value: string,
  pattern: string,
  message?: string,
): boolean {
  try {
    const regex = new RegExp(pattern);
    if (regex.test(value)) {
      return true;
    }

    if (isAlphanumericRegexMessage(message) || isStrictAlphanumericPattern(pattern)) {
      return /^[a-zA-Z0-9\s]+$/.test(value);
    }

    return false;
  } catch {
    return true;
  }
}

function validateStringRules(
  value: string,
  validation: DynamicFormField['validation'],
): string | undefined {
  const minValue = coerceNumber(validation?.min?.value);
  const maxValue = resolveMaxLength(validation);

  if (minValue !== undefined && value.length < minValue) {
    return (
      validation?.min?.message ||
      `This field must be at least ${minValue} characters`
    );
  }

  if (maxValue !== undefined && value.length > maxValue) {
    return (
      validation?.max?.message ||
      `This field must be at most ${maxValue} characters`
    );
  }

  if (validation?.regex?.value) {
    if (!passesRegexValidation(value, validation.regex.value, validation.regex.message)) {
      return validation.regex.message || 'Invalid format';
    }
  }

  return undefined;
}

export function validateDynamicField(
  field: DynamicFormField,
  value: unknown,
): string | undefined {
  if (field.type === 'button') {
    return undefined;
  }

  const validation = field.validation;

  if (isFieldRequired(field)) {
    const requiredMessage =
      validation?.required?.message || `${field.name || field.label} is required`;

    if (isEmptyFieldValue(field, value)) {
      return requiredMessage;
    }
  }

  if (typeof value === 'string' && value.length > 0) {
    const stringError = validateStringRules(value, validation);
    if (stringError) {
      return stringError;
    }
  }

  if (field.type === 'button-group' && Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === 'string' && entry.trim()) {
        const entryError = validateStringRules(entry, validation);
        if (entryError) {
          return entryError;
        }
      }
    }
  }

  return undefined;
}

export function fieldErrorBorder(error?: string): boolean {
  return Boolean(error);
}
