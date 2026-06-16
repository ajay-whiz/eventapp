import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Resolver,
  ResolverError,
  ResolverSuccess,
} from 'react-hook-form';
import type { ZodType } from 'zod';

type ZodIssue = {
  path: PropertyKey[];
  message: string;
  code: string;
};

function toFieldErrors<TFieldValues extends FieldValues>(
  issues: ZodIssue[],
): FieldErrors<TFieldValues> {
  const errors = {} as FieldErrors<TFieldValues>;

  for (const issue of issues) {
    const path = issue.path.map(String).join('.') || 'root';
    const record = errors as Record<string, FieldError | undefined>;

    if (!record[path]) {
      record[path] = {
        type: issue.code,
        message: issue.message,
      };
    }
  }

  return errors;
}

export function zodSafeResolver<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues>,
): Resolver<TFieldValues> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      const success: ResolverSuccess<TFieldValues> = {
        values: result.data,
        errors: {},
      };
      return success;
    }

    const failure: ResolverError<TFieldValues> = {
      values: {},
      errors: toFieldErrors<TFieldValues>(result.error.issues as ZodIssue[]),
    };
    return failure;
  };
}
