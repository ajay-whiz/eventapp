import React from 'react';
import type { DynamicFormField } from '../../types/Vendor';
import { getFieldDisplayLabel, isFieldRequired } from '../../utils/validateDynamicField';

type FieldLabelProps = {
  field: DynamicFormField;
  label?: string;
  className?: string;
  htmlFor?: string;
};

export function FieldLabel({
  field,
  label,
  className = 'block mb-2 font-semibold text-gray-800 text-sm',
  htmlFor,
}: FieldLabelProps) {
  const text = label ?? getFieldDisplayLabel(field);

  if (!text) {
    return null;
  }

  return (
    <label htmlFor={htmlFor} className={className}>
      {text}
      {isFieldRequired(field) && <span className="text-red-500">*</span>}
    </label>
  );
}
