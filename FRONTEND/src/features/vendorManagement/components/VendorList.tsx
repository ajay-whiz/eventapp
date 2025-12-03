import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../layouts/Layout';
import TableComponent from '../../../components/atoms/Table';
import type { TableColumn, TableAction } from '../../../types/table';

import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { useToast } from '../../../components/atoms/Toast';
import { useVendor } from '../hooks/useVendor';
import { useVendorActions } from '../hooks/useVendorActions';
import VendorForm from './VendorForm';
import ListingLocationManager from '../../../components/common/ListingLocationManager';
import api from '../../../axios';
import { Button } from '../../../components/atoms/Button';
import { X } from 'lucide-react';
import type { Vendor } from '../../../types/Vendor';
import type { DynamicForm, DynamicFormField } from '../../../types/Vendor';
import { IMAGE_BASE_URL } from '../../../config/api';

// Read-only field renderer to display form data like edit view
const ReadOnlyFieldRenderer: React.FC<{ field: DynamicFormField; value: any }> = ({ field, value }) => {
  const displayLabel = field.name || field.label || field.id;
  
  const renderValue = () => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">Not provided</span>;
    }

    switch (field.type) {
      case 'textarea':
        return (
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
            {String(value)}
          </div>
        );
      
      case 'select':
      case 'dropdown':
        if (Array.isArray(value)) {
          return <span className="text-sm text-gray-700">{value.join(', ')}</span>;
        }
        return <span className="text-sm text-gray-700">{String(value)}</span>;
      
      case 'checkbox':
        return (
          <span className="text-sm text-gray-700">
            {value ? 'Yes' : 'No'}
          </span>
        );
      
      case 'radio':
        return <span className="text-sm text-gray-700">{String(value)}</span>;
      
      case 'date':
        return (
          <span className="text-sm text-gray-700">
            {new Date(value).toLocaleDateString()}
          </span>
        );
      
      case 'date-range':
        if (typeof value === 'object' && value.startDate && value.endDate) {
          return (
            <span className="text-sm text-gray-700">
              {new Date(value.startDate).toLocaleDateString()} - {new Date(value.endDate).toLocaleDateString()}
            </span>
          );
        }
        return <span className="text-sm text-gray-700">{String(value)}</span>;
      
      case 'MultiImageUpload':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {value.map((img: any, idx: number) => {
                let imageUrl = '';
                if (typeof img === 'string') {
                  imageUrl = img;
                } else if (img?.url) {
                  imageUrl = typeof img.url === 'string' ? img.url : img.url.data || '';
                }
                
                if (imageUrl && imageUrl.startsWith('/uploads/')) {
                  imageUrl = `${IMAGE_BASE_URL}${imageUrl}`;
                }
                
                return (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-gray-200">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={img.name || `Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }
        return <span className="text-sm text-gray-400">No images</span>;
      
      case 'multi-select':
        if (Array.isArray(value)) {
          return <span className="text-sm text-gray-700">{value.join(', ')}</span>;
        }
        return <span className="text-sm text-gray-700">{String(value)}</span>;
      
      default:
        return <span className="text-sm text-gray-700">{String(value)}</span>;
    }
  };

  return (
    <div className="col-span-1">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {displayLabel}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderValue()}
    </div>
  );
};

// Helper component to display form data details in edit view format
const FormDataPreview: React.FC<{ 
  formData: any; 
  dynamicForm: DynamicForm | null;
  formFieldsData?: Record<string, any>;
}> = ({ formData, dynamicForm, formFieldsData }) => {
  if (!formData) return <span className="text-gray-400">No data</span>;
  
  // If we have dynamic form structure, display fields in edit view format
  if (dynamicForm && dynamicForm.fields && dynamicForm.fields.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dynamicForm.fields.map((field: DynamicFormField) => {
          // Get value from formFieldsData (object format) or formData.fields (array format)
          let fieldValue: any = null;
          
          if (formFieldsData && formFieldsData[field.id]) {
            fieldValue = formFieldsData[field.id];
          } else if (formFieldsData && formFieldsData[field.name || field.label || '']) {
            fieldValue = formFieldsData[field.name || field.label || ''];
          } else if (formData.fields) {
            if (Array.isArray(formData.fields)) {
              const fieldData = formData.fields.find((f: any) => f.id === field.id);
              fieldValue = fieldData?.actualValue;
            } else if (typeof formData.fields === 'object') {
              fieldValue = formData.fields[field.name || field.label || field.id];
            }
          }
          
          return (
            <ReadOnlyFieldRenderer
              key={field.id}
              field={field}
              value={fieldValue}
            />
          );
        })}
      </div>
    );
  }
  
  // Fallback: Dynamic form with fields array (old format)
  if (formData.fields && Array.isArray(formData.fields)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formData.fields.map((field: any, index: number) => (
          <div key={field.id || index} className="col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {field.label || field.name || 'Field'}
            </label>
            <div className="text-sm text-gray-700">
              {field.actualValue ? 
                (Array.isArray(field.actualValue) ? field.actualValue.join(', ') : String(field.actualValue))
                : <span className="text-gray-400">Not provided</span>
              }
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Fallback: Custom JSON structure
  const keys = Object.keys(formData).filter(key => !['_id', 'name', 'description', 'categoryId', 'type', 'key', 'isActive', 'isDeleted', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'].includes(key));
  if (keys.length === 0) {
    return <span className="text-gray-400">No additional data</span>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {keys.map(key => (
        <div key={key} className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {key}
          </label>
          <div className="text-sm text-gray-700">
            {typeof formData[key] === 'object' ? JSON.stringify(formData[key]) : String(formData[key])}
          </div>
        </div>
      ))}
    </div>
  );
};

const VendorList: React.FC = () => {
  const { vendors, pagination, loading } = useVendor();
  const { getVendorList, removeVendor } = useVendorActions();
  
  // Ensure vendors is always an array
  const vendorList = Array.isArray(vendors) ? vendors : [];
  
  // Debug log removed

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();
  const toast = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationDeleteModal, setShowLocationDeleteModal] = useState(false);
  const [selectedVendorForLocation, setSelectedVendorForLocation] = useState<VendorRow | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<any>(null);
  type VendorRow = { id: string; name: string; description?: string; [key: string]: any };
  const [selectedVendor, setSelectedVendor] = useState<VendorRow | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVendorDetails, setSelectedVendorDetails] = useState<Vendor | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dynamicForm, setDynamicForm] = useState<DynamicForm | null>(null);
  const [formFieldsData, setFormFieldsData] = useState<Record<string, any>>({});
  const { fetchVendorById, getDynamicFormByCategory } = useVendorActions();
  const { selectedVendor: fullVendorDetails } = useVendor();

  // Fetch vendors when page or search changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getVendorList(currentPage, rowsPerPage, searchQuery);
    }, 300); // debounce API call by 300ms

    return () => clearTimeout(delayDebounce);
  }, [getVendorList, currentPage, searchQuery, rowsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAction = (action: TableAction, vendor: VendorRow) => {
    if (action === 'edit') navigate(`/vendor-management/${vendor.id}`);
    else if (action === 'delete') {
      setSelectedVendor(vendor);
      setShowDeleteModal(true);
    }
    else if (action === 'add location') {
      setSelectedVendorForLocation(vendor);
      setShowLocationModal(true);
    }
    // ignore other actions for vendors
  };

  const confirmDelete = () => {
    if (!selectedVendor) return;
    removeVendor(selectedVendor.id);
    setShowDeleteModal(false);
    setSelectedVendor(null);
    toast.success('Vendor deleted successfully');
    getVendorList(currentPage, rowsPerPage, searchQuery);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedVendor(null);
  };

  // Truncate description helper
  const truncateDescription = (text: string | undefined, maxLength: number = 50): string => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const columns: TableColumn<VendorRow>[] = [
    { key: 'name', label: 'Title', width: 250, sortable: true, searchable: true },
    { 
      key: 'description', 
      label: 'Description', 
      width: 300,
      render: (value) => (
        <span className="text-gray-700" title={value as string}>
          {truncateDescription(value as string, 50)}
        </span>
      )
    },
  ];

  const sanitizedVendors: VendorRow[] = vendorList
    ?.filter(Boolean)
    .map((v: any) => ({
      id: (v.id ?? v.key ?? `${v.name || 'vendor'}-${Math.random().toString(36).slice(2,8)}`) as string,
      name: (v.name ?? '') as string,
      description: (v.description ?? v.details ?? undefined) as string | undefined,
      ...v, // Include all vendor data for modal
    })) ?? [];

  // Handle row click to show details modal
  const handleRowClick = async (vendor: VendorRow) => {
    setSelectedVendorDetails(null);
    setDynamicForm(null);
    setFormFieldsData({});
    setShowDetailsModal(true);
    setLoadingDetails(true);
    
    try {
      await fetchVendorById(vendor.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load vendor details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Update selected vendor details when fetched and load dynamic form
  useEffect(() => {
    if (fullVendorDetails && showDetailsModal) {
      setSelectedVendorDetails(fullVendorDetails);
      
      // Load dynamic form structure
      const loadFormStructure = async () => {
        const categoryId = fullVendorDetails.vendorCategoryId || 
                          fullVendorDetails.serviceCategoryId || 
                          fullVendorDetails.categoryId;
        
        if (categoryId) {
          try {
            const form = await getDynamicFormByCategory(categoryId);
            setDynamicForm(form);
            
            // Extract form fields data
            if (fullVendorDetails.formData && fullVendorDetails.formData.fields) {
              const extractedData: Record<string, any> = {};
              
              if (Array.isArray(fullVendorDetails.formData.fields)) {
                // Old format: array of fields with actualValue
                fullVendorDetails.formData.fields.forEach((field: any) => {
                  if (field.actualValue !== undefined) {
                    extractedData[field.id] = field.actualValue;
                  }
                });
              } else if (typeof fullVendorDetails.formData.fields === 'object') {
                // New format: object with field names as keys
                Object.entries(fullVendorDetails.formData.fields).forEach(([fieldName, value]) => {
                  if (form && form.fields) {
                    // Find field by name to get the ID
                    const matchingField = form.fields.find((f: DynamicFormField) => 
                      f.name === fieldName || f.label === fieldName
                    );
                    if (matchingField) {
                      extractedData[matchingField.id] = value;
                    } else {
                      extractedData[fieldName] = value;
                    }
                  } else {
                    extractedData[fieldName] = value;
                  }
                });
              }
              
              setFormFieldsData(extractedData);
            } else if (fullVendorDetails.dynamicFormData) {
              setFormFieldsData(fullVendorDetails.dynamicFormData);
            }
          } catch (error) {

          }
        }
      };
      
      loadFormStructure();
    }
  }, [fullVendorDetails, showDetailsModal, getDynamicFormByCategory]);

  return (
    <Layout>
      <>
      <div className='max-w-3xl'>
        <TableComponent<VendorRow>
          columns={columns}
          data={sanitizedVendors}
          onRowAction={handleAction}
          onRowClick={handleRowClick}
          total={pagination?.total ?? 0}
          currentPage={currentPage}
          featureName="Vendor Management"
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setCurrentPage(1);
            getVendorList(1, size, searchQuery);
          }}
          heading="Vendor Management"
          searchBar
          searchQuery={searchQuery}
          showResetPasswordOption={false}
          onSearchChange={(q) => {
            setCurrentPage(1);
            setSearchQuery(q);
          }}
          loading={loading}
          showAddButton
          addButtonRoute="/vendor-management/new"
          addButtonText='Add Vendor'
          showLocationOption={true}
        />
          {showDeleteModal && selectedVendor && (
         <ConfirmModal
            isOpen={showDeleteModal}
            onClose={cancelDelete}
            onConfirm={confirmDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete ${selectedVendor.name} vendor?`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
          )}
          
          {/* Location Management Modal */}
          {showLocationModal && selectedVendorForLocation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] ">
                {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h2 className="text-xl font-semibold text-gray-900"> Manage Locations for {selectedVendorForLocation.name}</h2>
                <Button
                  onClick={() => {
                    setShowLocationModal(false);
                    setSelectedVendorForLocation(null);
                  }}
                   variant='muted'
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
                 {/* Modal Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <ListingLocationManager
                    serviceId={selectedVendorForLocation.id}
                    serviceName={selectedVendorForLocation.name}
                    onLocationAdded={(location) => {
                      toast.success(`Location added to ${selectedVendorForLocation.name} successfully`);
                    }}
                                         onDeleteLocation={(location) => {
                       setLocationToDelete(location);
                       setShowLocationDeleteModal(true);
                       setShowLocationModal(false); // Hide the location listing modal
                     }}
                  />
                </div>
                {/* Modal Footer */}
                
              </div>
            </div>
          )}

          {/* Location Delete Confirmation Modal */}
          {showLocationDeleteModal && locationToDelete && (
            <ConfirmModal
              isOpen={showLocationDeleteModal}
                             onClose={() => {
                 setShowLocationDeleteModal(false);
                 setLocationToDelete(null);
                 setShowLocationModal(true); // Show the location listing modal again
               }}
              onConfirm={async () => {
                try {
                  await api.delete(`/location/${locationToDelete.id}`);
                  toast.success('Location deleted successfully!');
                  setShowLocationDeleteModal(false);
                  setLocationToDelete(null);
                  // Refresh the location list by re-rendering the modal
                  setShowLocationModal(false);
                  setTimeout(() => setShowLocationModal(true), 100);
                } catch (error: any) {

                  toast.error(error.response?.data?.message || 'Failed to delete location');
                }
              }}
              title="Confirm Location Deletion"
              message={`Are you sure you want to delete the location "${locationToDelete.name || locationToDelete.address || 'Unnamed Location'}"? This action cannot be undone.`}
              confirmLabel="Delete Location"
              cancelLabel="Cancel"
            />
          )}

          {/* Vendor Details Modal */}
          {showDetailsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h2 className="text-xl font-semibold text-gray-900"> Vendor Details</h2>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedVendorDetails(null);
                  }}
                   variant='muted'
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1  max-h-[65vh] ">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                      <span className="ml-3 text-gray-600">Loading details...</span>
                    </div>
                  ) : selectedVendorDetails ? (
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Name</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedVendorDetails.name || 'N/A'}</p>
                          </div>
                          {selectedVendorDetails.vendorCategory && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Category</label>
                              <p className="text-sm text-gray-900 mt-1">{selectedVendorDetails.vendorCategory.name || 'N/A'}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {selectedVendorDetails.description && (
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedVendorDetails.description}</p>
                        </div>
                      )}

                      {/* Form Data */}
                      {selectedVendorDetails.formData && (
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {dynamicForm?.name || selectedVendorDetails.formData.name || 'Additional Information'}
                          </h3>
                          <FormDataPreview 
                            formData={selectedVendorDetails.formData} 
                            dynamicForm={dynamicForm}
                            formFieldsData={formFieldsData}
                          />
                        </div>
                      )}

                      {/* Dynamic Form Data */}
                      {selectedVendorDetails.dynamicFormData && Object.keys(selectedVendorDetails.dynamicFormData).length > 0 && (
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dynamic Form Data</h3>
                          <div className="space-y-2">
                            {Object.entries(selectedVendorDetails.dynamicFormData).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">{key}:</span>
                                <span className="text-sm text-gray-900 ml-4">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enterprise Information */}
                      {selectedVendorDetails.enterpriseName && (
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise</h3>
                          <p className="text-sm text-gray-700">{selectedVendorDetails.enterpriseName}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                       
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No details available</p>
                    </div>
                  )}
                </div>
                 {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 shrink-0">
              <Button
                          variant="primary"
                          onClick={() => {
                            setShowDetailsModal(false);
                            if (selectedVendorDetails?.id) {
                              navigate(`/vendor-management/${selectedVendorDetails.id}`);
                            }
                          }}
                        >
                          Edit Vendor
                        </Button>
                        <Button
                          variant="muted"
                          onClick={() => {
                            setShowDetailsModal(false);
                            setSelectedVendorDetails(null);
                          }}
                        >
                          Close
                        </Button>
              </div>
              </div>
            </div>
          )}
          
          {/* <VendorForm/> */}
         </div>
      </>
    </Layout>
  );
};

export default VendorList;
