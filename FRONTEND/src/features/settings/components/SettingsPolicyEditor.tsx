import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { Button } from '../../../components/atoms/Button';
import { Form } from '../../../components/common/Form';
import { useToast } from '../../../components/atoms/Toast';
import RichTextEditor from '../../../components/common/RichTextEditor';
import {
  contentPolicySchema,
  type ContentPolicySchemaType,
} from '../../content-policy/schemas/contentPolicy.schema';
import { useContentPolicyActions } from '../../content-policy/hooks/useContentPolicyActions';
import type { ContentPolicy } from '../../../types/ContentPolicy';

interface SettingsPolicyEditorProps {
  category: 'privacy-policy' | 'terms-of-service';
  label: string;
  policy: ContentPolicy | null;
  onCancel: () => void;
  onSaved: () => void;
}

const SettingsPolicyEditor: React.FC<SettingsPolicyEditorProps> = ({
  category,
  label,
  policy,
  onCancel,
  onSaved,
}) => {
  const toast = useToast();
  const { addContentPolicy, updateContentPolicy } = useContentPolicyActions();
  const isEditMode = Boolean(policy?.id);

  const methods = useForm<ContentPolicySchemaType>({
    resolver: zodResolver(contentPolicySchema),
    mode: 'onChange',
    defaultValues: {
      title: policy?.title || label,
      content: policy?.content || '',
      effectiveDate: policy?.effectiveDate
        ? new Date(policy.effectiveDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      category,
    },
  });

  const { control, setValue, formState: { errors, isSubmitting } } = methods;
  const [title, content, effectiveDate] = useWatch({
    control,
    name: ['title', 'content', 'effectiveDate'],
  });

  useEffect(() => {
    methods.reset({
      title: policy?.title || label,
      content: policy?.content || '',
      effectiveDate: policy?.effectiveDate
        ? new Date(policy.effectiveDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      category,
    });
  }, [policy, label, category, methods]);

  const canSubmit = useMemo(() => {
    const hasTitle = (title || '').trim().length > 0;
    const contentText = (content || '').replace(/<[^>]*>/g, '').trim();
    const hasContent = contentText.length >= 3;
    const hasEffectiveDate = (effectiveDate || '').trim().length > 0;
    return hasTitle && hasContent && hasEffectiveDate;
  }, [title, content, effectiveDate]);

  const onSubmit = async (data: ContentPolicySchemaType) => {
    try {
      if (isEditMode && policy?.id) {
        await updateContentPolicy(
          policy.id,
          data.title,
          data.content,
          data.effectiveDate,
          category,
        );
        toast.success(`${label} updated successfully`);
      } else {
        await addContentPolicy(
          data.title,
          data.content,
          data.effectiveDate,
          category,
        );
        toast.success(`${label} created successfully`);
      }
      onSaved();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Failed to save policy';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-800 mb-4">
        {isEditMode ? `Edit ${label}` : `Create ${label}`}
      </h4>
      <FormProvider {...methods}>
        <Form<ContentPolicySchemaType>
          mode="onSubmit"
          schema={contentPolicySchema}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup
              label="Title"
              name="title"
              id={`${category}-title`}
              placeholder={`Enter ${label} title`}
              error={errors?.title?.message}
            />
            <InputGroup
              label="Effective Date"
              name="effectiveDate"
              id={`${category}-effectiveDate`}
              type="date"
              error={errors?.effectiveDate?.message}
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold text-gray-800 text-sm mb-2">Content</label>
            <Controller
              name="content"
              control={control}
              render={() => (
                <RichTextEditor
                  value={content || ''}
                  onChange={(value) => {
                    setValue('content', value.trim(), {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                  placeholder={`Enter ${label} content...`}
                  error={errors?.content?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="muted" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </Form>
      </FormProvider>
    </div>
  );
};

export default SettingsPolicyEditor;
