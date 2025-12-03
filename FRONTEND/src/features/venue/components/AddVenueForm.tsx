import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Form } from '../../../components/common/Form';
import Layout from '../../../layouts/Layout';
import { useToast } from '../../../components/atoms/Toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useVenue } from '../hooks/useVenue';
import { venueSchema, type VenueSchemaType } from '../schemas/venue.schema';
import { useVenueActions } from '../hooks/useVenueAction';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { Button } from '../../../components/atoms/Button';
import { FormError } from '../../../components/atoms/FormError';
import api from '../../../axios';
import { SelectGroup } from '../../../components/molecules/SelectGroup';
import { API_ROUTES, ROUTING } from '../../../constants/routes';
import type { DynamicFormField } from '../../../types/Vendor';
import DynamicFieldForm from '../../../components/common/DynamicFieldForm';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import { Textarea } from '../../../components/atoms/Textarea';
import { getUserDataFromStorage, isSuperAdmin } from '../../../utils/permissions';
import { useEnterpriseActions } from '../../enterprise/hooks/useEnterpriseActions';
import { useEnterprise } from '../../enterprise/hooks/useEnterprise';
import { createVenueSchema } from '../schemas/venue.schema';
import FormInputManager from '../../serviceCategory/components/FormInputManager';
type VenueFormValues = VenueSchemaType;

// Helper function to validate dynamic field values
const validateDynamicField = (field: DynamicFormField, value: any): string | undefined => {
  if (!field.validation) return undefined;

  const validation = field.validation;

  // Required validation
  if (validation.required?.value) {
    if (field.type === 'checkbox') {
      if (!Array.isArray(value) || value.length === 0) {
        return validation.required.message;
      }
    } else {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return validation.required.message;
      }
    }
  }

  // String length validations
  if (typeof value === 'string' && value.length > 0) {
    if (validation.min?.value && value.length < validation.min.value) {
      return validation.min.message;
    }
    if (validation.max?.value && value.length > validation.max.value) {
      return validation.max.message;
    }
    if (validation.regex?.value) {
      const regex = new RegExp(validation.regex.value);
      if (!regex.test(value)) {
        return validation.regex.message;
      }
    }
  }

  return undefined;
};

const AddVenueForm: React.FC = () => {
  const { id } = useParams();
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [getSelectedForm, setSelectedForm] = useState<any>();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoadingVenue, setIsLoadingVenue] = useState(false);
  const { loading: venueLoading, error } = useVenue();
  const { addVenue, updateVenue, getServiceCategories, getDynamicFormByCategory } = useVenueActions();
  const { getEnterpriseList } = useEnterpriseActions();
  const enterpriseState = useEnterprise();
  const [dynamicFormErrors, setDynamicFormErrors] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

  const toast = useToast();
  const navigate = useNavigate();

  // Get user data to determine user type
  const userData = getUserDataFromStorage();
  const isUserSuperAdmin = isSuperAdmin(userData);
  const isEnterpriseUser = userData?.enterpriseId;

  useEffect(() => {
    getCategoryList();
    
    // Load enterprises for admin users
    if (isUserSuperAdmin && !isEnterpriseUser) {
      getEnterpriseList(1, 100, '');
    }
  }, [isUserSuperAdmin, isEnterpriseUser]);

  const getCategoryList = async () => {
    try {
      const categories = await getServiceCategories();
      setServiceCategories(categories);
    } catch (error) {
      setServiceCategories([]);
    }
  };

  // Set default values
  const methods = useForm<VenueFormValues>({
    resolver: zodResolver(createVenueSchema(isUserSuperAdmin && !isEnterpriseUser)),
    defaultValues: {
      name: '',
      description: '',
      serviceCategoryId: '',
      enterpriseId: isEnterpriseUser ? userData.enterpriseId : '',
      enterpriseName: isEnterpriseUser ? userData.organizationName : '',
    },
  });

  const { control, setValue, watch } = methods;
  const watchedCategoryId = watch('serviceCategoryId');

  const selectedCategoryName = useMemo(() => {
    if (!watchedCategoryId) return '';
    const match = (serviceCategories || []).find((cat: any) => cat?.id === watchedCategoryId);
    return match?.name || '';
  }, [serviceCategories, watchedCategoryId]);

  // Load venue data when editing
  useEffect(() => {
    if (!id) return;

    const timeout = setTimeout(async () => {
      try {
        setIsLoadingVenue(true);
        
        // Ensure enterprises are loaded for admin users before loading venue data
        if (isUserSuperAdmin && !isEnterpriseUser) {
          await getEnterpriseList(1, 100, '');
        }
        
        const response = await api.get(`${API_ROUTES.VENUE}/${id}`);
        if (response?.data?.data) {
          const venueData = response?.data?.data;

          // Set form values using react-hook-form's setValue
          setValue('name', venueData?.name || '');
          setValue('description', venueData?.description || '');
          setValue('serviceCategoryId', venueData?.serviceCategoryId || venueData?.categoryId || '');
          
          // Set enterprise values if available
          if (venueData?.enterpriseId) {
            setValue('enterpriseId', venueData.enterpriseId);
          }
          if (venueData?.enterpriseName) {
            setValue('enterpriseName', venueData.enterpriseName);
          }

          // Store venue data for later processing
          if (venueData?.formData?.fields) {
            setSelectedForm(venueData?.formData);
            
            // Extract actualValue from fields array and map to field IDs
            const extractedData: Record<string, any> = {};
            if (Array.isArray(venueData.formData.fields)) {
              venueData.formData.fields.forEach((field: any) => {
                if (field.actualValue !== undefined) {
                  // Handle MultiImageUpload fields specially
                  if (field.type === 'MultiImageUpload' && Array.isArray(field.actualValue)) {
                    const transformedImages = field.actualValue.map((img: any) => {
                      let imageUrl = '';
                      
                      // Safely extract URL from various possible structures
                      if (typeof img === 'string') {
                        imageUrl = img;
                      } else if (img?.url?.imageUrl && typeof img.url.imageUrl === 'string') {
                        // Handle nested structure: url.imageUrl
                        imageUrl = img.url.imageUrl;
                      } else if (img?.url?.data && typeof img.url.data === 'string') {
                        imageUrl = img.url.data;
                      } else if (img?.url && typeof img.url === 'string') {
                        imageUrl = img.url;
                      } else if (img?.preview && typeof img.preview === 'string') {
                        imageUrl = img.preview;
                      }
                      
                      // If the URL is relative, construct the full URL
                      if (imageUrl && imageUrl.startsWith('/uploads/')) {
                        const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 
                          (import.meta.env.VITE_API_BASE_URL 
                            ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1/', '').replace('marketplace.whiz-cloud.com', 'apimarketplace.whiz-cloud.com')
                            : import.meta.env.PROD ? 'https://apimarketplace.whiz-cloud.com' : 'http://localhost:10030');
                        imageUrl = `${imageBaseUrl}${imageUrl}`;
                      }
                      
                      return {
                        id: img.id || `img_${Date.now()}_${Math.random()}`,
                        name: img.name || 'image',
                        url: imageUrl,
                        uploaded: true // Mark as already uploaded
                      };
                    });
                    extractedData[field.id] = transformedImages;
                  } else {
                    // Handle text, select, dropdown, and other field types
                    // Store the actualValue directly
                    extractedData[field.id] = field.actualValue;
                  }
                }
              });
            }
            setFormData(extractedData);
          }
        }
      } catch (error) {
        toast.error('Failed to load venue data');
      } finally {
        setIsLoadingVenue(false);
      }
    }, 500); // debounce delay
    return () => clearTimeout(timeout); // cleanup
  }, [id, setValue]);

  // Load dynamic form in edit mode and process venue data (especially for MultiImageUpload fields)
  useEffect(() => {
    const loadDynamicFormInEditMode = async () => {
      if (id && getSelectedForm && getSelectedForm.fields && getSelectedForm.fields.length > 0) {
        // Process venue data after form is loaded - handle MultiImageUpload fields specially
        if (typeof formData === 'object' && !Array.isArray(formData) && Object.keys(formData).length > 0) {
          const processedData: Record<string, any> = { ...formData };
          let hasChanges = false;
          
          // Process each field value, especially for MultiImageUpload
          Object.entries(formData).forEach(([fieldId, value]) => {
            if (value !== undefined && value !== null) {
              // Find the field in the loaded form structure by ID
              const matchingField = getSelectedForm.fields.find((f: any) => f.id === fieldId);
              
              if (matchingField?.type === 'MultiImageUpload' && Array.isArray(value)) {
                // Handle MultiImageUpload fields specially
                const transformedImages = value.map((img: any) => {
                  let imageUrl = '';
                  
                  // Safely extract URL from various possible structures
                  if (typeof img === 'string') {
                    imageUrl = img;
                  } else if (img?.url?.imageUrl && typeof img.url.imageUrl === 'string') {
                    // Handle nested structure: url.imageUrl
                    imageUrl = img.url.imageUrl;
                  } else if (img?.url?.data && typeof img.url.data === 'string') {
                    imageUrl = img.url.data;
                  } else if (img?.url && typeof img.url === 'string') {
                    imageUrl = img.url;
                  } else if (img?.preview && typeof img.preview === 'string') {
                    imageUrl = img.preview;
                  }
                  
                  // If the URL is relative, construct the full URL
                  if (imageUrl && imageUrl.startsWith('/uploads/')) {
                    // Use IMAGE_BASE_URL from config, or construct from API base URL
                    const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 
                      (import.meta.env.VITE_API_BASE_URL 
                        ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1/', '').replace('marketplace.whiz-cloud.com', 'apimarketplace.whiz-cloud.com')
                        : import.meta.env.PROD ? 'https://apimarketplace.whiz-cloud.com' : 'http://localhost:10030');
                    imageUrl = `${imageBaseUrl}${imageUrl}`;
                  }
                  
                  return {
                    id: img.id || `img_${Date.now()}_${Math.random()}`,
                    name: img.name || 'image',
                    url: imageUrl,
                    uploaded: true // Mark as already uploaded
                  };
                });
                processedData[fieldId] = transformedImages;
                hasChanges = true;
              }
            }
          });
          
          // Only update if there were changes to prevent infinite loops
          if (hasChanges) {
            setFormData(processedData);
          }
        }
      }
    };
    loadDynamicFormInEditMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getSelectedForm]);

  // Watch for service category changes and load dynamic form
  useEffect(() => {
    const loadDynamicForm = async () => {
      if (watchedCategoryId) {
        const form = await getDynamicFormByCategory(watchedCategoryId);
        setSelectedForm(form);
        
        // Only reset dynamic form data when category changes in create mode (not edit mode)
        // In edit mode, formData is already populated from the venue data
        if (!id) {
          setFormData({});
          setDynamicFormErrors({});
        }
      }
    };
    loadDynamicForm();
  }, [watchedCategoryId, id]);

  // Helper function to convert form data to JSON format (no binary files)
  const createFormData = (data: VenueSchemaType) => {
    // Get formId from form's _id (from formData structure) or id or formId
    const formId = getSelectedForm?._id || getSelectedForm?.id || getSelectedForm?.formId || '';
    
    // Get user name for createdBy/updatedBy
    const currentUserName = userData?.firstName && userData?.lastName 
      ? `${userData.firstName} ${userData.lastName}`.trim()
      : (userData as any)?.firstName || (userData as any)?.lastName || (userData as any)?.name || null;
    
    const jsonData: any = {
      name: data.name,
      title: data.name,
      description: data.description || '',
      serviceCategoryId: data.serviceCategoryId,
      formId: formId,
      enterpriseId: data.enterpriseId || '',
      enterpriseName: data.enterpriseName || '',
    };

    // Add createdBy when creating, updatedBy when updating
    if (id) {
      // Update mode - add updatedBy
      jsonData.updatedBy = currentUserName;
    } else {
      // Create mode - add createdBy
      jsonData.createdBy = currentUserName;
    }

    // Process dynamic form fields and handle images
    if (getSelectedForm && getSelectedForm.fields) {
      const processedFields = getSelectedForm.fields.map((field: any) => {
        const fieldValue = formData[field.id] || field.metadata?.defaultValue || '';
        
        // Handle MultiImageUpload fields - extract URLs only (not file names)
        if (field.type === 'MultiImageUpload' && Array.isArray(fieldValue)) {
          // Extract only URLs from uploaded images (filter out images without URLs)
          const uploadedImages = fieldValue
            .filter((img: any) => {
              // Only include images that have been uploaded (have a URL)
              // Exclude images that only have file objects (not yet uploaded)
              if (img.file && !img.url && !img.uploaded) {
                return false; // Skip images that haven't been uploaded yet
              }
              
              // Check if image has URL in any format
              let hasUrl = false;
              if (typeof img.url === 'string' && img.url.trim() !== '') {
                hasUrl = true;
              } else if (img.url?.imageUrl && typeof img.url.imageUrl === 'string' && img.url.imageUrl.trim() !== '') {
                hasUrl = true;
              } else if (img.uploaded && img.preview && typeof img.preview === 'string' && img.preview.startsWith('http')) {
                // Only use preview if it's a full URL (not a data URL)
                hasUrl = true;
              }
              
              return hasUrl;
            })
            .map((img: any) => {
              // Extract URL - handle both flat string and nested object formats
              let imageUrl = '';
              
              // Priority: url (string) > url.imageUrl > preview (if it's a full URL)
              if (typeof img.url === 'string' && img.url.trim() !== '') {
                imageUrl = img.url.trim();
              } else if (img.url?.imageUrl && typeof img.url.imageUrl === 'string' && img.url.imageUrl.trim() !== '') {
                imageUrl = img.url.imageUrl.trim();
              } else if (img.uploaded && img.preview && typeof img.preview === 'string' && img.preview.startsWith('http')) {
                // Only use preview if it's a full URL (not a data URL from FileReader)
                imageUrl = img.preview;
              }
              
              // Ensure we have a valid Supabase URL (not a file name or local data URL)
              // Only accept URLs that start with http/https (Supabase URLs) or absolute paths
              if (!imageUrl || 
                  imageUrl.startsWith('data:') || // Reject local data URLs
                  (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/'))) {
                return null;
              }
              
              // Return in the format expected by backend: nested url.imageUrl structure
              // Set name to the URL instead of file name
              return {
                id: img.id,
                name: imageUrl, // Use URL as name instead of file name
                url: {
                  imageUrl: imageUrl
                }
              };
            })
            .filter((img: any) => img !== null); // Remove any null entries
          
          return {
            ...field,
            actualValue: uploadedImages
          };
        }
        
        return {
          ...field,
          actualValue: fieldValue
        };
      });

      const formDataWithValues = {
        _id: getSelectedForm.id,
        name: getSelectedForm.name,
        description: getSelectedForm.description || '',
        categoryId: data.serviceCategoryId,
        type: 'venue-service',
        fields: processedFields,
        key: getSelectedForm.key || '',
        isActive: true,
        isDeleted: false,
        createdBy: id ? (getSelectedForm.createdBy || currentUserName) : currentUserName, // Use existing createdBy in edit mode, or current user in create mode
        updatedBy: id ? currentUserName : (getSelectedForm.updatedBy || currentUserName), // Use current user in edit mode
        createdAt: getSelectedForm.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      jsonData.formData = formDataWithValues;
    }

    return jsonData;
  };

  const onSubmit = async (data: VenueSchemaType) => {

    // Additional manual validation check
    if (!data.name || data.name.trim() === '') {
      toast.error('Venue Title is required');
      return;
    }

    if (!data.serviceCategoryId || data.serviceCategoryId.trim() === '') {
      toast.error('Service Category is required');
      return;
    }

    if (!validateDynamicForm()) {
      toast.error('Need to filled mandatory fields.');
      return;
    }

    // Check if any images are still uploading
    const isUploading = Object.values(uploadingImages).some(uploading => uploading);
    if (isUploading) {
      toast.error('Please wait for images to finish uploading.');
      return;
    }

    // Validate that all MultiImageUpload fields have URLs (not file names)
    if (getSelectedForm && getSelectedForm.fields) {
      for (const field of getSelectedForm.fields) {
        if (field.type === 'MultiImageUpload') {
          const fieldValue = formData[field.id];
          if (Array.isArray(fieldValue) && fieldValue.length > 0) {
            const imagesWithoutUrl = fieldValue.filter((img: any) => {
              // Check if image has a file but no URL (not uploaded yet)
              if (img.file && !img.url) {
                return true;
              }
              // Check if URL is invalid (not a proper URL)
              const url = typeof img.url === 'string' ? img.url : img.url?.imageUrl;
              if (!url || url.startsWith('data:') || (!url.startsWith('http') && !url.startsWith('/'))) {
                return true;
              }
              return false;
            });
            
            if (imagesWithoutUrl.length > 0) {
              toast.error(`Please wait for all images in "${field.name || field.label}" to finish uploading.`);
              return;
            }
          }
        }
      }
    }

    try {
      // Create JSON data (no binary files, only URLs)
      const jsonData = createFormData(data);

      if (id) {
        await updateVenue(id, jsonData);
        toast.success('Venue updated successfully');
      } else {
        await addVenue(jsonData);
        toast.success('Venue created successfully');
      }
      navigate(ROUTING.VENUE_MANAGEMENT);

    } catch (err) {
      toast.error('Something went wrong.');
    }
  };

  const validateDynamicForm = (): boolean => {
    if (!getSelectedForm || !getSelectedForm.fields) return true;

    const errors: Record<string, string> = {};
    let isValid = true;

    getSelectedForm.fields.forEach((field: any) => {
      const fieldValue = formData[field.id];
      const error = validateDynamicField(field, fieldValue);
      if (error) {
        errors[field.id] = error;
        isValid = false;
      }
    });

    setDynamicFormErrors(errors);
    return isValid;
  };
  // Helper function to upload a single image immediately to Supabase
  // This uploads to Supabase storage via the backend API endpoint
  const uploadSingleImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        fileType: file.type,
        endpoint: '/venues/upload-image'
      });
      
      // Upload to Supabase via backend API endpoint
      const response = await api.post('/venues/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // Handle different response structures
      // API returns: { status: "OK", data: { imageUrl: "..." } }
      const imageUrl = response.data?.data?.imageUrl || 
                      response.data?.data || 
                      response.data?.url || 
                      response.data?.imageUrl ||
                      response.data;
      
      // Ensure we got a valid Supabase URL
      if (!imageUrl) {
        throw new Error('Invalid response: No image URL returned from server');
      }
      
      if (typeof imageUrl !== 'string') {
        throw new Error('Invalid response: Image URL is not a string');
      }
      
      // Verify it's a Supabase URL (not a data URL)
      if (imageUrl.startsWith('data:')) {
        throw new Error('Invalid response: Received data URL instead of Supabase URL');
      }
      
      return imageUrl; // Return the Supabase URL
    } catch (error: any) {
      // Extract detailed error message
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to upload image to Supabase';
      
      throw new Error(errorMessage);
    }
  };

  // Helper function to handle immediate image upload to Supabase when images are selected
  // This ensures images are uploaded to Supabase storage immediately, not stored locally
  const handleImageUpload = async (fieldId: string, images: any[]) => {
    setUploadingImages(prev => ({ ...prev, [fieldId]: true }));
    
    try {
      const uploadedImages = await Promise.all(
        images.map(async (img: any) => {
          if (img.file && !img.url) {
            // Upload new file to Supabase immediately (not stored locally)
            const supabaseUrl = await uploadSingleImage(img.file);
            return {
              ...img,
              url: supabaseUrl, // Store Supabase URL, not local data URL
              uploaded: true
            };
          }
          // Return existing image (already uploaded to Supabase)
          return {
            ...img,
            uploaded: true
          };
        })
      );
      
      // Update the form data with Supabase URLs
      setFormData(prev => ({
        ...prev,
        [fieldId]: uploadedImages
      }));
      
    } catch (error: any) {
      // Extract detailed error message
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          'Failed to upload images to Supabase';
      
      toast.error(errorMessage || 'Failed to upload images to Supabase. Please try again.');
    } finally {
      setUploadingImages(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleFieldChange = (data: any, fieldId: any, value: any) => {
    // Check if this is a MultiImageUpload field and handle upload immediately
    if (data.type === 'MultiImageUpload' && Array.isArray(value)) {
      // Check if there are any new files to upload
      const hasNewFiles = value.some((img: any) => img.file && !img.url);
      if (hasNewFiles) {
        handleImageUpload(fieldId, value);
        return; // handleImageUpload will update formData
      }
    }

    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field when user starts typing
    if (dynamicFormErrors[data.id]) {
      setDynamicFormErrors(prev => {
        const { [data.id]: removed, ...rest } = prev;
        return rest;
      });
    }
  };
  return (
    <Layout>
      <h2 className="text-xl font-semibold mb-2">{id ? 'Edit Venue' : 'Create Venues'}</h2>
      <Breadcrumbs/>
      <div className="text-gray-800 shadow-sm mt-5 max-w-3xl border border-neutral-100 bg-white rounded-xl p-6">
        <p className="text-sm text-gray-500 mb-6">
          {id ? 'Edit a new venue' : 'Venue management'}.
        </p>

        {isLoadingVenue && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading venue data...</p>
            </div>
          </div>
        )}
        {/* Form */}
        <FormProvider {...methods}>
          <Form<VenueSchemaType>
            mode="all"
            schema={venueSchema}
            onSubmit={onSubmit}
          >
            {!isLoadingVenue && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup
                    label="Title"
                    name="name"
                    id="name"
                    placeholder="Enter venue title"
                    autoComplete="name"
                  />
                  {/* Enterprise Selection */}
                  {isUserSuperAdmin && !isEnterpriseUser && (
                    <Controller
                      name="enterpriseId"
                      control={control}
                      render={({ field, fieldState }) => {
                        // Get enterprise from list or use form values if enterprise is not in list yet
                        const selectedEnterprise = enterpriseState.enterprises?.find((enterprise: any) =>
                          enterprise.id === field.value
                        );
                        
                        // If enterprise not found in list but we have enterpriseId and enterpriseName from form, create a temporary option
                        const enterpriseName = methods.getValues('enterpriseName');
                        const enterpriseId = field.value;
                        
                        // Build options list - include selected enterprise if not in list
                        const enterpriseOptions = enterpriseState.enterprises?.map((enterprise: any) => ({
                          label: enterprise.enterpriseName,
                          value: enterprise.id,
                        })) || [];
                        
                        // If we have an enterpriseId that's not in the list, add it
                        if (enterpriseId && enterpriseName && !selectedEnterprise) {
                          const existsInOptions = enterpriseOptions.some(opt => opt.value === enterpriseId);
                          if (!existsInOptions) {
                            enterpriseOptions.push({
                              label: enterpriseName,
                              value: enterpriseId,
                            });
                          }
                        }
                        
                        // Determine selected value
                        const selectedValue = selectedEnterprise 
                          ? [{
                              label: selectedEnterprise.enterpriseName,
                              value: selectedEnterprise.id
                            }]
                          : (enterpriseId && enterpriseName 
                            ? [{
                                label: enterpriseName,
                                value: enterpriseId
                              }]
                            : []);
                        
                        return (
                          <SelectGroup
                            label="Select Enterprise"
                            options={enterpriseOptions}
                            value={selectedValue}
                            onChange={(selected) => {
                              const value = Array.isArray(selected) ? selected[0]?.value : '';
                              const name = Array.isArray(selected) ? selected[0]?.label : '';
                              field.onChange(value);
                              methods.setValue('enterpriseName', name);
                            }}
                            isMulti={false}
                            error={fieldState.error?.message}
                          />
                        );
                      }}
                    />
                  )}

                  <Controller
                    name="serviceCategoryId"
                    control={control}
                    render={({ field, fieldState }) => {
                      const selectedOption = (serviceCategories || []).find((opt: any) => opt?.id === field?.value) || null;
                      return (
                        <>
                          <SelectGroup
                            label="Service Category"
                            className="min-h-[363px] text-gray-800"
                            options={(serviceCategories || []).map((cat: any) => ({
                              label: cat?.name,
                              value: cat?.id,
                            }))}
                            value={
                              selectedOption
                                ? [
                                    {
                                      label: selectedOption.name,
                                      value: selectedOption.id,
                                    },
                                  ]
                                : []
                            }
                            onChange={(selected) => {
                              const value = Array.isArray(selected) ? selected[0]?.value : '';
                              field.onChange(value);
                            }}
                            isMulti={false}
                            error={fieldState.error?.message}
                          />
                        </>
                      );
                    }}
                  />
                </div>

                <div className="mt-4">
                  <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => {
                      const maxLength = 500;
                      const currentLength = field.value?.length || 0;
                      const remainingChars = maxLength - currentLength;
                      
                      return (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Description
                            </label>
                            <span className={`text-xs ${remainingChars < 50 ? 'text-red-500' : 'text-gray-500'}`}>
                              {currentLength}/{maxLength} characters
                            </span>
                          </div>
                          <Textarea
                            id="description"
                            rows={4}
                            maxLength={maxLength}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-0 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="Enter venue description"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                          {fieldState.error?.message && (
                            <span className="text-red-500 text-sm mt-1 block">{fieldState.error.message}</span>
                          )}
                        </div>
                      );
                    }}
                  />
                </div>
                {/* Dynamic Form Fields */}
                {getSelectedForm && getSelectedForm.fields && getSelectedForm.fields.length > 0 ? (
                    <>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-6 capitalize">
                      {getSelectedForm?.name} Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(getSelectedForm?.fields || []).map((field: DynamicFormField, index: number) => {
                        const fieldValue = formData[field.id] || '';
                        return (
                        <div key={index}>
                          <DynamicFieldForm
                            field={field}
                            value={fieldValue}
                            onChange={(value) => handleFieldChange(field, field.id, value)}
                            error={dynamicFormErrors[field.id]}
                          />
                          {field.type === 'MultiImageUpload' && uploadingImages[field.id] && (
                            <div className="mt-2 text-sm text-sky-600">
                              📤 Uploading images...
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </>    
                ) : (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-600">
                      {getSelectedForm ? 'No fields found in the dynamic form.' : 'Select a service category to load dynamic form fields.'}
                    </p>
                    {getSelectedForm && (
                      <pre className="mt-2 text-xs text-gray-500">
                        {JSON.stringify(getSelectedForm, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {id && watchedCategoryId && (
                  <div className="mt-8">
                    <FormInputManager
                      categoryId={id}
                      categoryName={selectedCategoryName}
                      category="event"
                      heading="Booking Request Form inputs"
                      addButtonLabel="+ Add booking request form input"
                      emptyStateMessage="No inputs added yet."
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button type="submit" variant="primary" disabled={venueLoading}>
                    {venueLoading ? 'Saving...' : id ? 'Update Venue' : 'Create Venues'}
                  </Button>
                  <Button
                    type="button"
                    variant="muted"
                    onClick={() => navigate(ROUTING.VENUE_MANAGEMENT)}
                  >
                    Cancel
                  </Button>
                </div>
                {error && <FormError message={error} />}
              </>
            )}
          </Form>
        </FormProvider>
      </div>
    </Layout>
  );
};

export default AddVenueForm;
