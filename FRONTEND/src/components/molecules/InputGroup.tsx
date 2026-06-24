import React from 'react';
import { Label } from '../atoms/Label';
import { Input, type InputProps } from '../atoms/Input';
import { FormHelperText } from '../atoms/FormHelperText';
import { useFormContext } from 'react-hook-form';

export type InputGroupProps = InputProps & {
  label?: string;
  helperText?: string;
  name: string;
  /** Set false when used outside react-hook-form FormProvider */
  connected?: boolean;
  errors?: unknown;
  register?: unknown;
  validation?: unknown;
  required?: boolean;
};

const StandaloneInputGroup: React.FC<InputGroupProps> = ({
  label,
  helperText,
  error,
  id,
  name,
  required,
  connected: _connected,
  ...props
}) => (
  <div className="relative">
    {label && <Label htmlFor={id ?? name} required={required}>{label}</Label>}
    <Input id={id ?? name} error={error} name={name} {...props} />
    <FormHelperText>{helperText}</FormHelperText>
  </div>
);

const ConnectedInputGroup: React.FC<InputGroupProps> = ({
  label,
  helperText,
  error,
  id,
  name,
  required,
  connected: _connected,
  ...props
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const fieldError = errors[name]?.message;
  const displayError =
    error ??
    (typeof fieldError === 'string' ? fieldError : undefined);

  return (
    <div className="relative">
      {label && <Label htmlFor={id ?? name} required={required}>{label}</Label>}
      <Input
        id={id ?? name}
        error={displayError}
        {...register(name)}
        {...props}
      />
      <FormHelperText>{helperText}</FormHelperText>
    </div>
  );
};

export const InputGroup: React.FC<InputGroupProps> = ({
  connected = true,
  ...props
}) =>
  connected ? (
    <ConnectedInputGroup connected={connected} {...props} />
  ) : (
    <StandaloneInputGroup connected={connected} {...props} />
  );
