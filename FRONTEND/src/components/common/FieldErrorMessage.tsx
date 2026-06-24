import React from 'react';

export function FieldErrorMessage({ error }: { error?: string }) {
  if (!error) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{error}</p>;
}
