import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { Button } from '../../../components/atoms/Button';
import { Form } from '../../../components/common/Form';
import { useToast } from '../../../components/atoms/Toast';
import { z } from 'zod';
import { useServiceCategoryActions } from '../hooks/useServiceCategoryActions';
import { SelectGroup } from '../../../components/molecules/SelectGroup';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';

const formInputSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  active: z.enum(['Active', 'Inactive']).default('Active'),
  maxrange: z.string().optional(),
  minrange: z.string().optional(),
});

type FormInputSchemaType = z.infer<typeof formInputSchema>;

const ServiceCategoryFormInputs: React.FC = () => {
  const { id } = useParams(); // In add route, this is categoryId. In edit route, this is formInputId
  const location = useLocation();
  const toast = useToast();
  const navigate = useNavigate();

  const { addServiceCategoryFormInput, updateServiceCategoryFormInput, getServiceCategoryFormInputById, getFormInputLabels } = useServiceCategoryActions();

  const isEditMode = location.pathname.includes('/edit/');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);

  const methods = useForm<FormInputSchemaType>({
    resolver: zodResolver(formInputSchema),
    mode: 'all',
    defaultValues: {
      label: '',
      active: 'Active',
      minrange: '',
      maxrange: '',
    },
  });

  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [labelsLoading, setLabelsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadLabels = async () => {
      setLabelsLoading(true);
      try {
        const list = await getFormInputLabels();
        if (isMounted && Array.isArray(list)) {
          setLabelOptions(list);
        }
      } finally {
        if (isMounted) setLabelsLoading(false);
      }
    };
    loadLabels();
    return () => {
      isMounted = false;
    };
  }, [getFormInputLabels]);

  // Prefill in edit mode
  useEffect(() => {
    const fetchDetails = async () => {
      if (!isEditMode || !id) return;
      try {
        const data: any = await getServiceCategoryFormInputById(id);
        // Save categoryId for back navigation after update
        if (data?.categoryId) setCurrentCategoryId(data.categoryId);
        methods.reset({
          label: data?.label ?? '',
          active: data?.active === false ? 'Inactive' : 'Active',
          minrange: typeof data?.minrange === 'number' ? String(data.minrange) : '',
          maxrange: typeof data?.maxrange === 'number' ? String(data.maxrange) : '',
        });
      } catch (err) {
        // Optionally show toast
      }
    };
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, id]);

  const { formState: { errors, isDirty } } = methods;

  const onSubmit = async (data: FormInputSchemaType) => {
    try {
      if (isEditMode && id) {
        const normalizedLabel = data.label.trim().replace(/_/g, ' ');
        const payload = {
          label: normalizedLabel,
          active: data.active === 'Active',
          minrange: data.minrange ? Number(data.minrange) : undefined,
          maxrange: data.maxrange ? Number(data.maxrange) : undefined,
        };
        await updateServiceCategoryFormInput(id, payload);
        toast.success('Form input updated successfully');
        const targetCategoryId = currentCategoryId || '';
        if (targetCategoryId) {
          navigate(`/service-category/${targetCategoryId}`);
        }
        return;
      }

      const normalizedLabel = data.label.trim().replace(/_/g, ' ');
      const payload = {
        categoryId: id as string,
        label: normalizedLabel,
        active: data.active === 'Active',
        minrange: data.minrange ? Number(data.minrange) : undefined,
        maxrange: data.maxrange ? Number(data.maxrange) : undefined,
      };

      await addServiceCategoryFormInput(payload);
      toast.success('Form input added successfully');
      navigate(`/service-category/form-inputs/${id}`);
    } catch (err) {
      // Error handled by Redux; optionally show toast
    }
  };

  const labelValue = methods.watch('label');
  const canSubmit = useMemo(
    () => isDirty && !!labelValue?.trim(),
    [isDirty, labelValue]
  );

  return (
    <>
      <Layout>
        <h2 className="text-xl font-semibold mb-2">{isEditMode ? 'Edit Form Input' : 'Add Form Input'}</h2>
        <Breadcrumbs onItemClick={(item) => {
          if (item.label === 'Form Inputs' && currentCategoryId) {
            navigate(`/service-category/form-inputs/${currentCategoryId}`);
            return;
          }
          navigate(item.path);
        }} />
        <div className="text-gray-800 shadow-sm mt-5 max-w-3xl border border-neutral-100 bg-white rounded-xl p-6">
          <div className="grid grid-cols-1">
            <FormProvider {...methods}>
              <Form<FormInputSchemaType>
                mode="all"
                schema={formInputSchema}
                onSubmit={onSubmit}
                className='bg-white text-gray-800'
              >
                <div className="grid grid-cols-1 md:grid-row-1 gap-4">
                  <Controller
                    name="label"
                    control={methods.control}
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
                        disabled={isEditMode}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-row-1 gap-4 mt-2">
                  <Controller
                    name="active"
                    control={methods.control}
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
                  <InputGroup
                    label="MinRange"
                    name="minrange"
                    id="minrange"
                    placeholder="Enter min range (optional)"
                    autoComplete="off"
                    error={errors?.minrange?.message}
                  />
                  <InputGroup
                    label="MaxRange"
                    name="maxrange"
                    id="maxrange"
                    placeholder="Enter max range (optional)"
                    autoComplete="off"
                    error={errors?.maxrange?.message}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button type="submit" variant="primary" disabled={!canSubmit}>
                    {isEditMode ? 'Update Form Input' : 'Create Form Input'}
                  </Button>
                </div>
              </Form>
            </FormProvider>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ServiceCategoryFormInputs;
