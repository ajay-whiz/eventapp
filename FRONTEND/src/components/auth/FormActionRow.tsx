import React from 'react';
import { Button } from '../atoms/Button';

type FormActionRowProps = {
  submitLabel: string;
  loadingLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  submitDisabled?: boolean;
  cancelDisabled?: boolean;
};

const FormActionRow: React.FC<FormActionRowProps> = ({
  submitLabel,
  loadingLabel = 'Please wait...',
  cancelLabel = 'Cancel',
  onCancel,
  loading = false,
  submitDisabled = false,
  cancelDisabled = false,
}) => {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-6">
      {onCancel && (
        <Button
          type="button"
          variant="muted"
          disabled={loading || cancelDisabled}
          className="w-full sm:w-auto sm:min-w-[120px]"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        disabled={loading || submitDisabled}
        className="w-full sm:w-auto sm:min-w-[160px]"
      >
        {loading ? loadingLabel : submitLabel}
      </Button>
    </div>
  );
};

export default FormActionRow;
