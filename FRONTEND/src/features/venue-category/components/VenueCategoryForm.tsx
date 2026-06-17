import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodSafeResolver } from '../../../lib/zodSafeResolver';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { Button } from '../../../components/atoms/Button';
import { FormError } from '../../../components/atoms/FormError';
import { Form } from '../../../components/common/Form';
import { useToast } from '../../../components/atoms/Toast';
import {
  venueCategorySchema,
  type VenueCategorySchemaType,
} from '../schemas/venueCategory.schema';
import { useVenueCategory } from '../hooks/useVenueCategory';
import { useVenueCategoryActions } from '../hooks/useVenueCategoryActions';
import { SelectGroup } from '../../../components/molecules/SelectGroup';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import { ROUTING } from '../../../constants/routes';

const getFormDocumentId = (form: { id?: string; _id?: string }) => {
  const raw = form.id ?? form._id;
  if (!raw) return '';
  return typeof raw === 'string' ? raw : String(raw);
};

const VenueCategoryForm: React.FC = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const { fetchCategoryById, updateCategory, addCategory, getFormsList } =
    useVenueCategoryActions();
  const { selectedCategory, formLoading: categoryLoading, error } = useVenueCategory();

  const [forms, setForms] = useState<any[]>([]);

  const methods = useForm<VenueCategorySchemaType>({
    resolver: zodSafeResolver(venueCategorySchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      description: '',
      formId: '',
    },
  });

  const {
    formState: { errors, isDirty },
    reset,
    watch,
    control,
  } = methods;

  const name = watch('name');
  const formId = watch('formId');

  const formOptions = useMemo(
    () =>
      forms
        .filter((form) => form.type === 'venue-category')
        .map((form) => ({
          label: form.name || form.description || 'Untitled form',
          value: getFormDocumentId(form),
        }))
        .filter((option) => option.value),
    [forms],
  );

  useEffect(() => {
    const load = async () => {
      if (id) {
        await fetchCategoryById(id);
      }
      const formsList = await getFormsList();
      setForms(formsList);
    };
    load();
  }, [id, fetchCategoryById, getFormsList]);

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (!id || !selectedCategory) return;

    reset({
      name: selectedCategory.name ?? '',
      description: selectedCategory.description ?? '',
      formId: selectedCategory.formId ?? '',
    });
  }, [id, selectedCategory, reset]);

  const onSubmit = async (data: VenueCategorySchemaType) => {
    try {
      if (isEditMode && id) {
        await updateCategory(id, data.name, data.description || '', data.formId || '');
        toast.success('Venue category updated successfully');
        navigate('/venue-category');
      } else {
        await addCategory(data.name, data.description || '', data.formId || '');
        toast.success('Venue category created successfully');
        navigate('/venue-category');
      }
    } catch {
      // Error displayed via FormError
    }
  };

  const canSubmit = useMemo(() => {
    if (categoryLoading) return false;
    if (isEditMode) return isDirty;
    return !!name?.trim() && !!formId?.trim();
  }, [categoryLoading, isEditMode, isDirty, name, formId]);

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {id ? 'Edit Venue Category' : 'Create Venue Category'}
        </h2>
        <Breadcrumbs />
      </div>

      <div className="text-gray-800 shadow-sm mt-5 max-w-3xl border border-neutral-100 bg-white rounded-xl p-6">
        <div className="grid grid-cols-1">
          <FormProvider {...methods}>
            <Form<VenueCategorySchemaType>
              mode="all"
              schema={venueCategorySchema}
              onSubmit={onSubmit}
              className="bg-white text-gray-800"
            >
              <div className="grid grid-cols-1 md:grid-row-1 gap-4">
                <InputGroup
                  label="Category Name"
                  name="name"
                  id="name"
                  placeholder="Enter category name"
                  autoComplete="category-name"
                  error={errors?.name?.message}
                />
                <InputGroup
                  label="Description"
                  name="description"
                  id="description"
                  placeholder="Enter description"
                  autoComplete="description"
                  error={errors?.description?.message}
                />
                <Controller
                  name="formId"
                  control={control}
                  render={({ field }) => {
                    const selectedOption = formOptions.find(
                      (option) => option.value === field.value,
                    );
                    return (
                      <div>
                        <SelectGroup
                          label="Select Form"
                          options={[
                            { label: 'Select a form...', value: '' },
                            ...formOptions,
                          ]}
                          value={
                            selectedOption
                              ? [selectedOption]
                              : field.value
                                ? [{ label: field.value, value: field.value }]
                                : []
                          }
                          onChange={(selection) =>
                            field.onChange(
                              Array.isArray(selection) ? selection[0]?.value ?? '' : '',
                            )
                          }
                          isMulti={false}
                          error={errors.formId?.message}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Forms must be created in{' '}
                          <button
                            type="button"
                            className="font-medium text-sky-600 underline"
                            onClick={() => navigate(ROUTING.FORM_BUILDER)}
                          >
                            Form Builder
                          </button>{' '}
                          with category type <strong>venue-category</strong>.
                        </p>
                        {formOptions.length === 0 && (
                          <p className="mt-1 text-sm text-amber-600">
                            No venue-category forms found. Create one in Form Builder first.
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" variant="primary" disabled={categoryLoading || !canSubmit}>
                  {categoryLoading
                    ? 'Saving...'
                    : isEditMode
                      ? 'Update Venue Category'
                      : 'Create Venue Category'}
                </Button>
                <Button type="button" variant="muted" onClick={() => navigate('/venue-category')}>
                  Cancel
                </Button>
              </div>
              {error && <FormError message={error} />}
            </Form>
          </FormProvider>
        </div>
      </div>
    </Layout>
  );
};

export default VenueCategoryForm;
