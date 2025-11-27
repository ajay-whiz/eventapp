import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { Button } from '../../../components/atoms/Button';
import { FormError } from '../../../components/atoms/FormError';
import { Form } from '../../../components/common/Form';
import { useToast } from '../../../components/atoms/Toast';
import { serviceCategorySchema, type ServiceCategorySchemaType } from '../schemas/serviceCategory.schema';
import { useServiceCategory } from '../hooks/useServiceCategory';
import { useServiceCategoryActions } from '../hooks/useServiceCategoryActions';
import { SelectGroup } from '../../../components/molecules/SelectGroup';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import Modal from '../../../components/common/Modal';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';

interface ServiceCategoryFormProps {
  editingServiceCategory?: any;
  onFormSubmit?: () => void;
  onCancel?: () => void;
}

const CategoryForm: React.FC<ServiceCategoryFormProps> = ({ editingServiceCategory, onFormSubmit, onCancel }) => {
  const { id } = useParams();

  const toast = useToast();

  // Use editingServiceCategory if provided, otherwise fall back to URL param
  const currentServiceCategory = editingServiceCategory || null;
  const isEmbedded = Boolean(onFormSubmit); // Check if component is embedded
  const navigate = useNavigate();

  const { fetchCategoryById, updateCategory, addCategory, getFormsList, getFormInputLabels, getServiceCategoryFormInputs, removeServiceCategoryFormInput } = useServiceCategoryActions();
  const { selectedCategory, formLoading: categoryLoading, error, formInputs, formInputsLoading } = useServiceCategory();
  
  const [forms, setForms] = useState<any[]>([]);
  const [isBookingFormModalOpen, setBookingFormModalOpen] = useState(false);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [showDeleteInputModal, setShowDeleteInputModal] = useState(false);
  const [selectedInputForDelete, setSelectedInputForDelete] = useState<{ id: string; label: string } | null>(null);

  const methods = useForm<ServiceCategorySchemaType>({
    resolver: zodResolver(serviceCategorySchema),
    mode: 'all',
    defaultValues: {
      name: '',
      description: '',
      formId: '',
    },
  });
   const { formState: { errors, isDirty } } = methods;

  const { reset, watch } = methods;
  
  // Watch form values in real-time for debugging
  const watchedValues = watch();
  console.log('=== WATCHED FORM VALUES ===');
  console.log('All watched values:', watchedValues);
  console.log('formId watched value:', watchedValues.formId);
  console.log('================================');

  useEffect(() => {
    const load = async () => {
      if (id && !isEmbedded) {
        await fetchCategoryById(id);
      }
      const formsList = await getFormsList();
      console.log('Fetched forms:', formsList);
      setForms(formsList);
    };
    load();
  }, [id, isEmbedded, fetchCategoryById, getFormsList]);

  useEffect(() => {
    const loadInputs = async () => {
      if (!id) return;
      try {
        await getServiceCategoryFormInputs(id as string, 1, 50, '');
      } catch (e) {}
    };
    loadInputs();
  }, [id]);

  const isEditMode = Boolean(id) || Boolean(currentServiceCategory);
  const serviceCategoryToEdit = isEmbedded ? currentServiceCategory : selectedCategory;
  
  useEffect(() => {
    if (isEditMode && serviceCategoryToEdit) {
      console.log('=== EDITING CATEGORY DEBUG ===');
      console.log('Editing category data:', serviceCategoryToEdit);
      console.log('formId from API:', serviceCategoryToEdit.formId);
      console.log('formId type:', typeof serviceCategoryToEdit.formId);
      console.log('formId length:', serviceCategoryToEdit.formId?.length);
      console.log('================================');
      
      reset({
        name: serviceCategoryToEdit.name,
        description: serviceCategoryToEdit.description,
        formId: serviceCategoryToEdit.formId || '',
      });
    } else {
      // Reset for create mode
      reset({
        name: '',
        description: '',
        formId: '',
      });
    }
  }, [serviceCategoryToEdit, isEditMode, reset, currentServiceCategory]);
  

  const onSubmit = async (data: ServiceCategorySchemaType) => {
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form submission data:', data);
    console.log('Form ID value:', data.formId);
    console.log('Form ID type:', typeof data.formId);
    console.log('Form ID length:', data.formId?.length);
    console.log('Is formId empty string?', data.formId === '');
    console.log('Is formId null?', data.formId === null);
    console.log('Is formId undefined?', data.formId === undefined);
    console.log('================================');
    
    try {
      if (isEditMode && (id || currentServiceCategory)) {
        const categoryId = id || currentServiceCategory?.id;
        console.log('Updating category with formId:', data.formId);
        await updateCategory(categoryId, data.name, data.description || '', data.formId || '');
        if (!isEmbedded) {
          toast.success('Category updated successfully');
          navigate('/service-category');
        }
        // Don't navigate - stay on form for further edits
      } else {
        console.log('Creating category with formId:', data.formId);
        await addCategory(data.name, data.description || '', data.formId || '');
        if (!isEmbedded) {
          toast.success('Category created successfully');
          navigate('/service-category');
        }
        // Reset form for next entry instead of navigating
        reset({
          name: '',
          description: '',
          formId: '',
        });
      }
      
      if (isEmbedded && onFormSubmit) {
        onFormSubmit();
      }
      // Remove navigation - let Redux state handle list updates
    } catch (err) {
      console.error('Form submission error:', err);
      // The error is already handled by Redux actions and will be displayed via the FormError component
      // No need to show a toast here as the FormError component will display the specific error
    }
  };

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    if (isEditMode) {
      // For edit mode, require form to be dirty (has changes)
      return isDirty;
    } else {
      // For add mode, require at least name field to have content
      return isDirty && !!methods.watch('name')?.trim();
    }
  }, [isDirty, isEditMode, methods]);
  

  return ( 
      <>
      <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
        {id ? 'Edit Service Category' : 'Create Service Category'}
        </h2>
        <Breadcrumbs />
      </div>
     
        <div className="text-gray-800 shadow-sm mt-5 max-w-3xl border  border-neutral-100 bg-white rounded-xl p-6">
            {/* <div className='flex justify-between items-center'>  
              <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Service Category' : 'Create Service Category'}</h2>
              {isEditMode && isEmbedded && (
                <Button
                  type="button"
                  variant="muted"
                  size="sm"
                  onClick={() => {
                    if (onCancel) {
                      onCancel();
                    }
                  }}
                >
                  + Add New Instead
                </Button>
              )}
            </div> */}
          <div className="grid grid-cols-1">
            <FormProvider {...methods}>
              <Form<ServiceCategorySchemaType>
                mode="all"
                schema={serviceCategorySchema}
                onSubmit={onSubmit} className=' bg-white text-gray-800 '
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
                    e error={errors?.description?.message}
                  />
                  <div className="border-b border-gray-200 my-3" />
                </div>
                {isEditMode && id && (
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Booking Request Form inputs</h3>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setBookingFormModalOpen(true)}
                      >
                        + Add booking request form input
                      </Button>
                    </div>
                    {formInputsLoading ? (
                      <p className="text-sm text-gray-500">Loading inputs...</p>
                    ) : (Array.isArray(formInputs) && formInputs.length > 0 ? (
                      <div className="border-b border-gray-200 rounded-md">
                        {(formInputs as any[]).filter(Boolean).map((f: any) => {
                          const idVal = (f.id ?? f._id ?? f.key ?? `${f.label || 'input'}-${Math.random().toString(36).slice(2,8)}`) as string;
                          const active = (typeof f.active === 'boolean' ? f.active : (typeof f.isActive === 'boolean' ? f.isActive : undefined)) as boolean | undefined;
                          return (
                            <div key={idVal} className="flex items-center justify-between p-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{f.label || '-'}</span>
                                <span className="text-xs text-gray-500">Min: {f.minrange ?? '-'} • Max: {f.maxrange ?? '-'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {active === true && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">Active</span>
                                )}
                                {active === false && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">Inactive</span>
                                )}
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => navigate(`/service-category/form-inputs/edit/${idVal}`)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInputForDelete({ id: idVal, label: f.label });
                                    setShowDeleteInputModal(true);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No inputs added yet.</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={categoryLoading || !canSubmit}
                  >
                    {categoryLoading ? 'Saving...' : isEditMode ? 'Update Service Category' : 'Create Service Category'}
                  </Button>
                </div>
                {error && <FormError message={error} />}
              </Form>
            </FormProvider>
          </div>
        </div>
      </Layout>

      {isEditMode && id && (
        <Modal
          isOpen={isBookingFormModalOpen}
          onClose={() => setBookingFormModalOpen(false)}
          size="md"
          title="Add Booking Request Form Input"
        >
          <BookingRequestFormModalBody
            categoryId={id || ''}
            categoryName={(selectedCategory?.name || editingServiceCategory?.name || '').toString()}
            labelOptions={labelOptions}
            onCancel={() => setBookingFormModalOpen(false)}
            onCreated={async () => {
              setBookingFormModalOpen(false);
              try {
                if (id) {
                  const { getServiceCategoryFormInputs } = useServiceCategoryActions();
                  await getServiceCategoryFormInputs(id as string, 1, 50, '');
                }
              } catch (e) {}
            }}
          />
        </Modal>
      )}
      {showDeleteInputModal && selectedInputForDelete && (
        <ConfirmModal
          isOpen={showDeleteInputModal}
          onClose={() => { setShowDeleteInputModal(false); setSelectedInputForDelete(null); }}
          onConfirm={async () => {
            try {
              await removeServiceCategoryFormInput(selectedInputForDelete.id);
              if (id) await getServiceCategoryFormInputs(id as string, 1, 50, '');
              setShowDeleteInputModal(false);
              setSelectedInputForDelete(null);
              toast.success('Form input deleted successfully');
            } catch (e) {}
          }}
          title="Confirm Deletion"
          message={`Are you sure you want to delete the form input: ${selectedInputForDelete.label}?`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      )}
      </>

   
  );
};

const BookingRequestFormModalBody: React.FC<{ categoryId: string; categoryName: string; labelOptions: string[]; onCancel: () => void; onCreated: () => void; }> = ({ categoryId, categoryName, labelOptions, onCancel, onCreated }) => {
  const { addServiceCategoryFormInput, getFormInputLabels } = useServiceCategoryActions();
  const toast = useToast();
  const [localLabelOptions, setLocalLabelOptions] = React.useState<string[]>(labelOptions || []);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Fetch labels when popup opens, using the selected category NAME
  React.useEffect(() => {
    let isMounted = true;
    const loadLabels = async () => {
      if (!categoryName) return;
      try {
        const labels = await getFormInputLabels(categoryName?.toLocaleLowerCase());
        if (isMounted && Array.isArray(labels)) {
          setLocalLabelOptions(labels);
        }
      } catch (e) {}
    };
    loadLabels();
    return () => {
      isMounted = false;
    };
  }, [categoryName]);

  const modalForm = useForm<{ label: string; status: 'Active' | 'Inactive'; minrange?: number; maxrange?: number; }>({ defaultValues: { label: '', status: 'Active', minrange: undefined, maxrange: undefined } });
  const submitModal = async (values: { label: string; status: 'Active' | 'Inactive'; minrange?: number; maxrange?: number; }) => {
    try {
      setSubmitError(null);
      if (!categoryId) return;
      const payload: any = { categoryId, label: values.label, active: values.status === 'Active' };
      if (values.minrange !== undefined && values.minrange !== null && values.minrange !== ('' as any)) payload.minrange = Number(values.minrange);
      if (values.maxrange !== undefined && values.maxrange !== null && values.maxrange !== ('' as any)) payload.maxrange = Number(values.maxrange);
      await addServiceCategoryFormInput(payload);
      toast.success('Form input created');
      onCreated();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create form input';
      setSubmitError(message);
      // Keep popup open on error by NOT calling onCreated here
    }
  };
  return (
    <FormProvider {...modalForm}>
      <form onSubmit={modalForm.handleSubmit(submitModal)} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Add form input details</h3>
        <div className="grid grid-cols-1 gap-4">
          <Controller
            name="label"
            control={modalForm.control}
            render={({ field }) => (
              <SelectGroup
                label="Label"
                options={[{ label: 'Select...', value: '' }, ...(localLabelOptions || []).map((l) => ({ label: l, value: l }))]}
                value={field.value ? [{ label: field.value, value: field.value }] : []}
                onChange={(sel) => field.onChange(Array.isArray(sel) ? sel[0]?.value : '')}
                isMulti={false}
              />
            )}
          />
          <Controller
            name="status"
            control={modalForm.control}
            render={({ field }) => (
              <SelectGroup
                label="Status"
                options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]}
                value={field.value ? [{ label: field.value, value: field.value }] : []}
                onChange={(sel) => field.onChange(Array.isArray(sel) ? sel[0]?.value : 'Active')}
                isMulti={false}
              />
            )}
          />
          <InputGroup label="MinRange" name="minrange" id="minrange" type="number" placeholder="Enter min range (optional)" />
          <InputGroup label="MaxRange" name="maxrange" id="maxrange" type="number" placeholder="Enter max range (optional)" />
        </div>
        {submitError && <FormError message={submitError} />}
        <div className="pt-2">
          <Button type="submit" variant="primary">Create Form Input</Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default CategoryForm;
