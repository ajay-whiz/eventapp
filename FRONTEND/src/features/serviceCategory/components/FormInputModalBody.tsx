import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { SelectGroup } from '../../../components/molecules/SelectGroup';
import { Button } from '../../../components/atoms/Button';
import { useToast } from '../../../components/atoms/Toast';
import { useServiceCategoryActions } from '../hooks/useServiceCategoryActions';

const formInputSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  active: z.enum(['Active', 'Inactive']).default('Active'),
  maxrange: z.string().optional(),
  minrange: z.string().optional(),
});

type FormInputSchemaType = z.infer<typeof formInputSchema>;

interface FormInputModalBodyProps {
  categoryId: string;
  categoryName?: string;
  category?: string;
  editingInput?: { id: string; label: string; active?: boolean; minrange?: number; maxrange?: number } | null;
  onCancel: () => void;
  onCreated: () => void;
}

const FormInputModalBody: React.FC<FormInputModalBodyProps> = ({
  categoryId,
  category,
  editingInput,
  onCancel,
  onCreated,
}) => {
  const toast = useToast();
  const { addServiceCategoryFormInput, updateServiceCategoryFormInput, getFormInputLabels } = useServiceCategoryActions();
  
  const [labelOptions, setLabelOptions] = useState<string[]>([]);

  const methods = useForm<FormInputSchemaType>({
    resolver: zodResolver(formInputSchema),
    mode: 'all',
    defaultValues: {
      label: editingInput?.label || '',
      active: editingInput?.active === false ? 'Inactive' : 'Active',
      minrange: editingInput?.minrange ? String(editingInput.minrange) : '',
      maxrange: editingInput?.maxrange ? String(editingInput.maxrange) : '',
    },
  });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = methods;

  useEffect(() => {
    let isMounted = true;
    const loadLabels = async () => {
      try {
        const list = await getFormInputLabels(category);
        if (isMounted && Array.isArray(list)) {
          setLabelOptions(list);
        }
      } catch {
        // Silently handle error
      }
    };
    loadLabels();
    return () => {
      isMounted = false;
    };
  }, [getFormInputLabels, category]);

  const onSubmit = async (data: FormInputSchemaType) => {
    try {
      const normalizedLabel = data.label.trim().replace(/_/g, ' ');
      
      if (editingInput) {
        // Update existing input
        const payload = {
          label: normalizedLabel,
          active: data.active === 'Active',
          minrange: data.minrange ? Number(data.minrange) : undefined,
          maxrange: data.maxrange ? Number(data.maxrange) : undefined,
        };
        await updateServiceCategoryFormInput(editingInput.id, payload);
        toast.success('Form input updated successfully');
      } else {
        // Create new input
        const payload = {
          categoryId: categoryId,
          label: normalizedLabel,
          active: data.active === 'Active',
          minrange: data.minrange ? Number(data.minrange) : undefined,
          maxrange: data.maxrange ? Number(data.maxrange) : undefined,
        };
        await addServiceCategoryFormInput(payload);
        toast.success('Form input added successfully');
      }
      
      onCreated();
    } catch {
      toast.error(editingInput ? 'Failed to update form input' : 'Failed to add form input');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="label"
        control={control}
        render={({ field, fieldState }) => (
          <SelectGroup
            label="Label"
            options={[
              { label: 'Select a label', value: '' },
              ...labelOptions.map(l => ({ label: String(l), value: String(l) }))
            ]}
            value={field.value ? [{ label: field.value, value: field.value }] : []}
            onChange={(selected) => {
              const value = Array.isArray(selected) ? selected[0]?.value : '';
              field.onChange(value || '');
            }}
            isMulti={false}
            error={fieldState.error?.message}
            disabled={!!editingInput}
          />
        )}
      />

      <Controller
        name="active"
        control={control}
        render={({ field, fieldState }) => (
          <SelectGroup
            label="Status"
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
            ]}
            value={field.value ? [{ label: field.value, value: field.value }] : []}
            onChange={(selected) => {
              const value = Array.isArray(selected) ? selected[0]?.value : '';
              field.onChange(value || 'Active');
            }}
            isMulti={false}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="minrange"
        control={control}
        render={({ field }) => (
          <InputGroup
            label="MinRange"
            id="minrange"
            placeholder="Enter min range (optional)"
            autoComplete="off"
            error={errors?.minrange?.message}
            {...field}
          />
        )}
      />

      <Controller
        name="maxrange"
        control={control}
        render={({ field }) => (
          <InputGroup
            label="MaxRange"
            id="maxrange"
            placeholder="Enter max range (optional)"
            autoComplete="off"
            error={errors?.maxrange?.message}
            {...field}
          />
        )}
      />

      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="muted"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (editingInput ? 'Updating...' : 'Creating...') : (editingInput ? 'Update Form Input' : 'Create Form Input')}
        </Button>
      </div>
    </form>
  );
};

export default FormInputModalBody;
