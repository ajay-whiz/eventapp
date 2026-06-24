import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { Button } from '../../../components/atoms/Button';
import { FormError } from '../../../components/atoms/FormError';
import { Form } from '../../../components/common/Form';
import { useToast } from '../../../components/atoms/Toast';
import { SelectGroup } from '../../../components/molecules/SelectGroup';
import { vendorSchema, createVendorSchema, type VendorSchemaType } from '../schemas/vendor.schema';
import { useVendor } from '../hooks/useVendor';
import { useVendorActions } from '../hooks/useVendorActions';

import type { DynamicForm, DynamicFormField } from '../../../types/Vendor';
import { Textarea } from '../../../components/atoms/Textarea';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import LocationField from '../../../components/common/LocationField';
import ListingLocationManager from '../../../components/common/ListingLocationManager';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';
import MultiImageUpload from '../../../components/atoms/MultiImageUpload';
import { getUserDataFromStorage, isSuperAdmin } from '../../../utils/permissions';
import { useEnterpriseActions } from '../../enterprise/hooks/useEnterpriseActions';
import { useEnterprise } from '../../enterprise/hooks/useEnterprise';
import { Input } from '../../../components/atoms/Input';
import { FieldErrorMessage } from '../../../components/common/FieldErrorMessage';
import { FieldLabel } from '../../../components/common/FieldLabel';
import {
  fieldErrorBorder,
  getDynamicFieldButtonLabel,
  getFieldDisplayLabel,
  getFieldOptions,
  isFieldRequired,
  validateDynamicField,
} from '../../../utils/validateDynamicField';

interface DynamicFieldRendererProps {
  field: DynamicFormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

// Helper function to validate dynamic field values — see utils/validateDynamicField.ts

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field, 
  value, 
  onChange, 
  error 
}) => {
  const displayLabel = getFieldDisplayLabel(field);
  const hasError = fieldErrorBorder(error);
  
  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <div className="col-span-1">
          <InputGroup
            label={displayLabel}
            name={field.id}
            id={field.id}
            type={field.type}
            placeholder={field.placeholder || `Enter ${displayLabel.toLowerCase()}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            required={isFieldRequired(field)}
            connected={false}
          />
        </div>
      );
    
    case 'textarea':
      return (
        <div className="col-span-1">
          <FieldLabel field={field} htmlFor={field.id} className="block text-sm font-semibold text-gray-700 mb-2" />
          <Textarea
            id={field.id}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-0 focus:ring-sky-500 focus:border-sky-500"
            placeholder={field.placeholder || `Enter ${displayLabel.toLowerCase()}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          <FieldErrorMessage error={error} />
        </div>
      );
    
    case 'select':
    case 'dropdown': {
      const selectOptions = getFieldOptions(field);
      const selectedOption = value
        ? selectOptions.find((opt) => opt.value === value || opt.label === value)
        : null;

      return (
        <div className="col-span-1">
          <SelectGroup
            label={displayLabel}
            options={selectOptions}
            value={selectedOption ? [selectedOption] : value ? [{ label: String(value), value: String(value) }] : []}
            onChange={(selected) => {
              const selectedValue = Array.isArray(selected) ? selected[0]?.value : '';
              onChange(selectedValue);
            }}
            isMulti={false}
            error={error}
            required={isFieldRequired(field)}
          />
        </div>
      );
    }

    case 'multi-select': {
      const multiOptions = getFieldOptions(field);
      const multiValue = Array.isArray(value)
        ? value.map((v: string) => {
            const match = multiOptions.find((opt) => opt.value === v || opt.label === v);
            return match || { label: String(v), value: String(v) };
          })
        : [];

      return (
        <div className="col-span-1">
          <SelectGroup
            label={displayLabel}
            options={multiOptions}
            value={multiValue}
            onChange={(selected) => onChange(selected.map((item) => item.value))}
            isMulti={true}
            error={error}
            required={isFieldRequired(field)}
          />
        </div>
      );
    }
    
    case 'checkbox': {
      const checkboxOptions = getFieldOptions(field);
      return (
        <div className="col-span-1">
          <FieldLabel field={field} className="block text-sm font-semibold text-gray-700 mb-2" />
          <div className="space-y-2">
            {checkboxOptions.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${field.id}_${option.value}`}
                  checked={Array.isArray(value) ? value.includes(option.value) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                  className="h-4 w-4 text-sky-600 focus:border-sky-500 border-gray-300 rounded-sm"
                />
                <label htmlFor={`${field.id}_${option.value}`} className="ml-2 block text-sm text-gray-900">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <FieldErrorMessage error={error} />
        </div>
      );
    }
    
    case 'radio': {
      const radioOptions = field.options || field.metadata?.options || [];
      const normalizedOptions = radioOptions.map((opt: any) =>
        typeof opt === "string" ? { label: opt, value: opt } : opt
      );
      return (
        <div className="col-span-1">
          <FieldLabel field={field} className="block text-sm font-semibold text-gray-700 mb-2" />
          <RadioGroup value={value} onValueChange={onChange}>
            {normalizedOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${index}`} />
                <Label
                  htmlFor={`${field.id}-${index}`}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <FieldErrorMessage error={error} />
        </div>
      );
    }
    
    case 'date':
      return (
        <div className="col-span-1">
          <FieldLabel field={field} htmlFor={field.id} className="block text-sm font-semibold text-gray-700 mb-2" />
          <Input
            id={field.id}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            error={hasError}
          />
          <FieldErrorMessage error={error} />
        </div>
      );

    case 'button':
      return (
        <div className="col-span-1">
          <button
            id={field.id}
            type="button"
            onClick={() => onChange(field.id)}
            className="px-4 py-2 bg-sky-600 text-white font-medium text-sm rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-200"
          >
            {getDynamicFieldButtonLabel(field)}
          </button>
          <FieldErrorMessage error={error} />
        </div>
      );

    case 'button-group': {
      const groupValues = Array.isArray(value) ? value : [''];
      return (
        <div className="col-span-1">
          <FieldLabel field={field} className="block text-sm font-semibold text-gray-700 mb-2" />
          <div className="space-y-2">
            {groupValues.map((val: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  id={`${field.id}_${index}`}
                  type="text"
                  placeholder={field.placeholder || `Enter ${displayLabel.toLowerCase()}`}
                  value={val || ''}
                  onChange={(e) => {
                    const newValues = [...groupValues];
                    newValues[index] = e.target.value;
                    onChange(newValues);
                  }}
                  error={hasError}
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newValues = groupValues.filter((_: string, i: number) => i !== index);
                      onChange(newValues.length > 0 ? newValues : ['']);
                    }}
                    className="shrink-0 px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 border border-gray-300 rounded-md bg-white"
                    title="Remove field"
                    aria-label="Remove field"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="muted"
              onClick={() => onChange([...groupValues, ''])}
              className="flex items-center gap-1 px-3 py-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded text-sm font-medium"
            >
              <span className="text-lg">+</span>
              Add More
            </Button>
          </div>
          <FieldErrorMessage error={error} />
        </div>
      );
    }
    
    case 'date-range':
      const dateRange = value || { startDate: '', endDate: '' };
      return (
        <div className="col-span-1">
          <FieldLabel field={field} className="block text-sm font-semibold text-gray-700 mb-2" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <Input
                id={`${field.id}_startDate`}
                type="date"
                value={dateRange.startDate || ''}
                onChange={(e) => onChange({ ...dateRange, startDate: e.target.value })}
                error={hasError}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date</label>
              <Input
                id={`${field.id}_endDate`}
                type="date"
                value={dateRange.endDate || ''}
                onChange={(e) => onChange({ ...dateRange, endDate: e.target.value })}
                error={hasError}
              />
            </div>
          </div>
          <FieldErrorMessage error={error} />
        </div>
      );
    
    case 'location':
      return (
        <div className="col-span-1 md:col-span-2">
          <LocationField
            value={value || {}}
            onChange={onChange}
            label={displayLabel}
            required={isFieldRequired(field)}
            error={error}
            showCoordinates={field.metadata?.showCoordinates !== false}
          />
        </div>
      );
    
    case 'MultiImageUpload':
      return (
        <div className="col-span-1">
          <FieldLabel field={field} className="block text-sm font-semibold text-gray-700 mb-2" />
          <MultiImageUpload
            isSingleMode={false}
            onImagesChange={onChange}
            acceptedFormats={field.validation?.invalidType?.value ? 
              field.validation.invalidType.value.split(',') : 
              ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            }
          />
          <FieldErrorMessage error={error} />
        </div>
      );
    
    default:
      return (
        <div className="col-span-1">
          <InputGroup
            label={displayLabel}
            name={field.id}
            id={field.id}
            placeholder={field.placeholder || `Enter ${displayLabel.toLowerCase()}`}
            value={Array.isArray(value) ? value.join(', ') : value || ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            required={isFieldRequired(field)}
            connected={false}
          />
        </div>
      );
  }
};

const VendorFormWithLocation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { fetchVendorById, updateVendor, addVendor, getServiceCategories, getDynamicFormByCategory } = useVendorActions();
  const { selectedVendor, loading: vendorLoading, error } = useVendor();
  const { getEnterpriseList } = useEnterpriseActions();
  const enterpriseState = useEnterprise();
  
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [dynamicForm, setDynamicForm] = useState<DynamicForm | null>(null);
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  const [dynamicFormErrors, setDynamicFormErrors] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [savedVendorId, setSavedVendorId] = useState<string | null>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);

  // Get user data to determine user type
  const userData = getUserDataFromStorage();
  const isUserSuperAdmin = isSuperAdmin(userData);
  const isEnterpriseUser = userData?.enterpriseId;

  const methods = useForm<VendorSchemaType>({
    resolver: zodResolver(createVendorSchema(isUserSuperAdmin && !isEnterpriseUser)),
          defaultValues: {
        name: '',
        description: '',
        serviceCategoryId: '',
        enterpriseId: isEnterpriseUser ? userData.enterpriseId : '',
        enterpriseName: isEnterpriseUser ? userData.organizationName : '',
      },
  });

  const { formState: { errors }, control, reset, watch } = methods;
  const watchedCategoryId = watch('serviceCategoryId');

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        await fetchVendorById(id);
        setSavedVendorId(id);
      }
      // Load service categories
      const categories = await getServiceCategories();
      setServiceCategories(categories);
      
      // Load enterprises for admin users
      if (isUserSuperAdmin && !isEnterpriseUser) {
        try {
          const enterpriseList = await getEnterpriseList();
          setEnterprises(enterpriseList);
        } catch (error) {

        }
      }
    };
    loadData();
  }, [id, isUserSuperAdmin, isEnterpriseUser]);

  const isEditMode = Boolean(id);
  
  // Load dynamic form in edit mode
  useEffect(() => {
    const loadDynamicFormInEditMode = async () => {
      if (isEditMode && selectedVendor && selectedVendor.serviceCategoryId && !dynamicForm) {

        const form = await getDynamicFormByCategory(selectedVendor.serviceCategoryId);

        setDynamicForm(form);
        
        // Pre-populate form data if editing
        if (selectedVendor.formData && selectedVendor.formData.fields) {
          const extractedData: Record<string, any> = {};
          
          // Handle array format: [{ id, type, actualValue: [...] }]
          if (Array.isArray(selectedVendor.formData.fields)) {
            selectedVendor.formData.fields.forEach((field: any) => {
              if (field.actualValue !== undefined) {
                // Handle MultiImageUpload fields with url.imageUrl structure
                if (field.type === 'MultiImageUpload' && Array.isArray(field.actualValue)) {
                  const transformedImages = field.actualValue.map((img: any) => {
                    let imageUrl = '';
                    
                    // Handle the format: { id, name, url: { imageUrl: "..." } }
                    if (img?.url?.imageUrl && typeof img.url.imageUrl === 'string') {
                      imageUrl = img.url.imageUrl;
                    } else if (typeof img.url === 'string') {
                      imageUrl = img.url;
                    } else if (typeof img === 'string') {
                      imageUrl = img;
                    }
                    
                    // Return in format expected by MultiImageUpload component
                    return {
                      id: img.id || `img_${Date.now()}_${Math.random()}`,
                      name: img.name || imageUrl || 'image',
                      url: imageUrl, // Store as flat string for component
                      uploaded: true
                    };
                  });
                  extractedData[field.id] = transformedImages;
                } else {
                  extractedData[field.id] = field.actualValue;
                }
              }
            });
          } else {
            // Handle object format (fallback)
            Object.entries(selectedVendor.formData.fields).forEach(([fieldName, value]) => {
              extractedData[fieldName] = value;
            });
          }
          
          setDynamicFormData(extractedData);
        }
      }
    };
    loadDynamicFormInEditMode();
  }, [isEditMode, selectedVendor, dynamicForm]);

  useEffect(() => {
    const loadDynamicForm = async () => {
      const categoryId = watchedCategoryId || selectedCategoryId;
      if (categoryId && !isEditMode) {
        try {
          const form = await getDynamicFormByCategory(categoryId);
          setDynamicForm(form);
        } catch (error) {

        }
      }
    };

    loadDynamicForm();
  }, [watchedCategoryId, selectedCategoryId, isEditMode]);

  // Helper function to convert form data to FormData for binary uploads
  const createFormData = (data: VendorSchemaType) => {
    const formData = new FormData();

    // Get user name for createdBy/updatedBy
    const currentUserName = userData?.firstName && userData?.lastName 
      ? `${userData.firstName} ${userData.lastName}`.trim()
      : (userData as any)?.firstName || (userData as any)?.lastName || (userData as any)?.name || '';

    // Add basic vendor data
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('serviceCategoryId', data.serviceCategoryId);
    formData.append('formId', dynamicForm?.formId || '');
    formData.append('enterpriseId', data.enterpriseId || '');
    formData.append('enterpriseName', data.enterpriseName || '');
    
    // Add createdBy when creating, updatedBy when updating
    if (id) {
      // Update mode - add updatedBy
      formData.append('updatedBy', currentUserName);
    } else {
      // Create mode - add createdBy
      formData.append('createdBy', currentUserName);
    }

    // Process dynamic form fields and handle images
    if (dynamicForm && dynamicForm.fields) {
      const processedFields = dynamicForm.fields.map(field => {
        const fieldValue = dynamicFormData[field.id] || field.metadata?.defaultValue || '';
        
        // Handle MultiImageUpload fields - extract File objects
        if (field.type === 'MultiImageUpload' && Array.isArray(fieldValue)) {
          // For MultiImageUpload, we'll append files separately and store metadata
          return {
            ...field,
            actualValue: fieldValue.map((img: any) => ({
              id: img.id,
              name: img.name,
              // Don't include the file object in JSON, it will be sent separately
            }))
          };
        }
        
        return {
          ...field,
          actualValue: fieldValue
        };
      });

      const formDataWithValues = {
        _id: dynamicForm.id,
        name: dynamicForm.name,
        description: dynamicForm.description || '',
        categoryId: data.serviceCategoryId,
        type: 'vendor-service',
        fields: processedFields,
        key: dynamicForm.key || '',
        isActive: true,
        isDeleted: false,
        createdBy: id ? (dynamicForm.createdBy || currentUserName) : currentUserName, // Use existing createdBy in edit mode, or current user in create mode
        updatedBy: id ? currentUserName : (dynamicForm.updatedBy || currentUserName), // Use current user in edit mode
        createdAt: dynamicForm.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      formData.append('formData', JSON.stringify(formDataWithValues));

      // Append image files separately with static parameter name
      dynamicForm.fields.forEach(field => {
        if (field.type === 'MultiImageUpload') {
          const fieldValue = dynamicFormData[field.id];
          if (Array.isArray(fieldValue)) {
            fieldValue.forEach((img: any) => {
              if (img.file) {
                formData.append('images', img.file);
              }
            });
          }
        }
      });
    }

    return formData;
  };

  const onSubmit = async (data: VendorSchemaType) => {
    try {
      // Validate dynamic form fields
      if (!validateDynamicForm()) {
        toast.error('Please fix the errors in the form fields.');
        return;
      }

      // Create FormData for binary upload
      const formData = createFormData(data);

      let vendorId = id;
      if (id) {
        await updateVendor(id, formData);
        toast.success('Vendor updated successfully');
      } else {
        const newVendor = await addVendor(formData);
        vendorId = newVendor.id;
        setSavedVendorId(vendorId);
        toast.success('Vendor created successfully');
      }

      // Don't navigate immediately - show location manager
      if (!isEditMode) {
        // For new vendors, show location manager after creation
        setSavedVendorId(vendorId);
      }
    } catch (err) {
      toast.error('Something went wrong.');
    }
  };

  const handleDynamicFieldChange = (fieldId: string, value: any) => {
    setDynamicFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field
    setDynamicFormErrors(prev => ({
      ...prev,
      [fieldId]: ''
    }));
  };

  const validateDynamicForm = (): boolean => {
    if (!dynamicForm || !dynamicForm.fields) return true;

    const errors: Record<string, string> = {};
    let isValid = true;

    dynamicForm.fields.forEach((field: DynamicFormField) => {
      const fieldValue = dynamicFormData[field.id];
      const error = validateDynamicField(field, fieldValue);
      if (error) {
        errors[field.id] = error;
        isValid = false;
      }
    });

    setDynamicFormErrors(errors);
    return isValid;
  };

  const handleLocationAdded = (location: any) => {

    // You can add additional logic here if needed
  };

  return (
    <Layout>
      <>
        <Breadcrumbs />
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Vendor' : 'Create New Vendor'}
              </h1>
            </div>

            <FormProvider {...methods}>
              <Form onSubmit={methods.handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Basic Vendor Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <InputGroup
                          label="Vendor Name"
                          name="name"
                          id="name"
                          placeholder="Enter vendor name"
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.name?.message}
                        />
                      )}
                    />

                    {/* Enterprise Selection */}
                    {isUserSuperAdmin && !isEnterpriseUser && (
                      <Controller
                        name="enterpriseId"
                        control={control}
                        render={({ field, fieldState }) => {
                          const selectedEnterprise = enterprises?.find((enterprise: any) =>
                            enterprise.id === field.value
                          ) || null;
                          return (
                            <SelectGroup
                              label="Select Enterprise *"
                              options={enterprises?.map((enterprise: any) => ({
                                label: enterprise.enterpriseName,
                                value: enterprise.id,
                              })) || []}
                              value={selectedEnterprise ? [{
                                label: selectedEnterprise.enterpriseName,
                                value: selectedEnterprise.id
                              }] : []}
                              onChange={(selected) => {
                                const value = Array.isArray(selected) ? selected[0]?.value : '';
                                const enterpriseName = Array.isArray(selected) ? selected[0]?.label : '';
                                field.onChange(value);
                                methods.setValue('enterpriseName', enterpriseName);
                              }}
                              isMulti={false}
                              error={fieldState.error?.message}
                              placeholder="Choose an enterprise..."
                            />
                          );
                        }}
                      />
                    )}


                    <Controller
                      name="serviceCategoryId"
                      control={control}
                      render={({ field }) => (
                                                 <SelectGroup
                           label="Service Category"
                           options={serviceCategories.map(cat => ({
                             label: cat.name,
                             value: cat.id
                           }))}
                           value={field.value ? [{ label: serviceCategories.find(c => c.id === field.value)?.name || '', value: field.value }] : []}
                          onChange={(selected) => {
                            const selectedValue = Array.isArray(selected) ? selected[0]?.value : '';
                            field.onChange(selectedValue);
                            setSelectedCategoryId(selectedValue);
                          }}
                          isMulti={false}
                          error={errors.serviceCategoryId?.message}
                        />
                      )}
                    />
                  </div>

                  {/* Enterprise Selection - Only show for Admin users */}
                  {isUserSuperAdmin && !isEnterpriseUser && (
                    <Controller
                      name="enterpriseId"
                      control={control}
                      render={({ field, fieldState }) => {
                        const selectedEnterprise = enterprises?.find((enterprise: any) => 
                          enterprise.id === field.value
                        ) || null;

                        return (
                          <div>
                            <SelectGroup
                              label="Enterprise"
                              options={enterprises?.map((enterprise: any) => ({
                                label: enterprise.enterpriseName,
                                value: enterprise.id,
                              })) || []}
                              value={selectedEnterprise ? [{
                                label: selectedEnterprise.enterpriseName,
                                value: selectedEnterprise.id
                              }] : []}
                              onChange={(selected) => {
                                const value = Array.isArray(selected) ? selected[0]?.value : '';
                                const enterpriseName = Array.isArray(selected) ? selected[0]?.label : '';
                                field.onChange(value);
                                // Also update enterprise name
                                methods.setValue('enterpriseName', enterpriseName);
                              }}
                              isMulti={false}
                              error={fieldState.error?.message}
                            />
                          </div>
                        );
                      }}
                    />
                  )}

                  {/* Show enterprise info for Enterprise users */}
                  {isEnterpriseUser && (
                    <div className="p-4 bg-sky-50 rounded-md">
                      <p className="text-sm text-sky-800">
                        <strong>Enterprise:</strong> {userData.organizationName}
                      </p>
                      <p className="text-xs text-sky-600 mt-1">
                        This vendor will be associated with your enterprise account.
                      </p>
                    </div>
                  )}

                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <Textarea
                          id="description"
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-0 focus:ring-sky-500 focus:border-sky-500"
                          placeholder="Enter vendor description"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        {errors.description?.message && (
                          <span className="text-red-500 text-sm">{errors.description.message}</span>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Dynamic Form Fields */}
                {dynamicForm && dynamicForm.fields && dynamicForm.fields.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {dynamicForm.name} Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dynamicForm.fields.map((field: DynamicFormField) => (
                        <DynamicFieldRenderer
                          key={field.id}
                          field={field}
                          value={dynamicFormData[field.id]}
                          onChange={(value) => handleDynamicFieldChange(field.id, value)}
                          error={dynamicFormErrors[field.id]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <Button type="submit" variant="primary" disabled={vendorLoading}>
                    {vendorLoading ? 'Saving...' : id ? 'Update Vendor' : 'Create Vendor'}
                  </Button>
                  <Button
                    type="button"
                    variant="muted"
                    onClick={() => navigate('/vendor-management')}
                  >
                    Cancel
                  </Button>
                </div>
                {error && <FormError message={error} />}
              </Form>
            </FormProvider>
          </div>

          {/* Location Manager - Show after vendor is created or when editing */}
          {savedVendorId && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <ListingLocationManager
                  serviceId={savedVendorId}
                  serviceName={methods.watch('name') || 'Vendor'}
                  onLocationAdded={handleLocationAdded}
                />
              </div>
            </div>
          )}
        </div>
      </>
    </Layout>
  );
};

export default VendorFormWithLocation;
