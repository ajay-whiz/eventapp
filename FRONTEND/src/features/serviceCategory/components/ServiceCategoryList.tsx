import React, { useEffect, useState } from 'react';
import Layout from '../../../layouts/Layout';
import TableComponent from '../../../components/atoms/Table';
import type { TableColumn, TableAction } from '../../../types/table';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { useToast } from '../../../components/atoms/Toast';
import { useServiceCategory } from '../hooks/useServiceCategory';
import { useServiceCategoryActions } from '../hooks/useServiceCategoryActions';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/atoms/Button';
import { X } from 'lucide-react';
import type { ServiceCategory } from '../../../types/ServiceCategory';

const ServiceCategoryList: React.FC = () => {
  const { categories = [], pagination, loading, selectedCategory } = useServiceCategory();
  const { getCategoryList, removeCategory, updateServiceCategoryStatus, fetchCategoryById } = useServiceCategoryActions();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const toast = useToast();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  type ServiceCategoryRow = { id: string; name: string; description?: string;isActive?: boolean; };
  const [selectedUser, setSelectedUser] = useState<ServiceCategoryRow | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<ServiceCategory | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch users when page or search changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getCategoryList(currentPage, rowsPerPage, searchQuery);
    }, 300); // debounce API call by 300ms

    return () => clearTimeout(delayDebounce);
  }, [getCategoryList, currentPage, searchQuery, rowsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAction = (action: TableAction, row: ServiceCategoryRow) => {
    if (action === 'edit') {
      navigate(`/service-category/${row.id}`);
    } else if (action === 'delete') {
      setSelectedUser(row);
      setShowDeleteModal(true);
    }

    else if (action === 'activate') {
      updateServiceCategoryStatus(row.id, {isActive: true});
      toast.success('Category activated successfully');
      getCategoryList(currentPage, rowsPerPage, searchQuery);
    }
    else if (action === 'deactivate') {
      updateServiceCategoryStatus(row.id, {isActive: false});
      toast.success('Category deactivated successfully');
      getCategoryList(currentPage, rowsPerPage, searchQuery);
    }
    else if (action === 'reset-password') {
      // Reset password functionality
    }
    else if (action === 'view') {
      // View service category
    }else if (action === 'add form inputs') {
       navigate(`/service-category/form-inputs/${row.id}`);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await removeCategory(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success('Category deleted successfully');
      // No need to refresh the list as Redux actions already update the state
    } catch (error) {
      // Error is already handled by Redux actions and displayed in UI
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // Truncate description helper
  const truncateDescription = (text: string | undefined, maxLength: number = 50): string => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Handle row click to show details modal
  const handleRowClick = async (category: ServiceCategoryRow) => {
    setSelectedCategoryDetails(null);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    
    try {
      await fetchCategoryById(category.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load category details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Update selected category details when fetched
  useEffect(() => {
    if (selectedCategory && showDetailsModal) {
      setSelectedCategoryDetails(selectedCategory);
    }
  }, [selectedCategory, showDetailsModal]);

  const columns: TableColumn<ServiceCategoryRow>[] = [
    { key: 'name', label: 'Name', width: 250, sortable: true, searchable: true },
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
    { 
      key: 'isActive', 
      label: 'Status', 
      width: 100,
      render: (value: any) => {
        const isActive = Boolean(value);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
  ];

  const sanitizedCategories: ServiceCategoryRow[] = (categories as any[])?.filter(Boolean).map((c: any) => ({
    id: (c.id ?? c.key ?? `${c.name || 'category'}-${Math.random().toString(36).slice(2,8)}`) as string,
    name: (c.name ?? '') as string,
    description: (c.description ?? undefined) as string | undefined,
    isActive: c.isActive, // Include isActive field from API data
  })) ?? [];

  return (
    <Layout>
      <>
      <div className='max-w-3xl'>
        <TableComponent<ServiceCategoryRow>
          columns={columns}
          data={sanitizedCategories}
          onRowAction={handleAction}
          onRowClick={handleRowClick}
          total={pagination?.total ?? 0}
          currentPage={currentPage}
          featureName="Service Category"
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          heading="Service Category"
          searchBar
          searchQuery={searchQuery}
          showResetPasswordOption={false}
          onSearchChange={(q) => {
            setCurrentPage(1);
            setSearchQuery(q);
          }}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setCurrentPage(1);
            getCategoryList(1, size, searchQuery);
          }}
          loading={loading}
          showAddButton
          addButtonRoute="/service-category/new"
          addButtonText='Add Category'
          showLocationOption={false}
          showCategoryInputsOption={false}
        />
          {showDeleteModal && selectedUser && (
         <ConfirmModal
            isOpen={showDeleteModal}
            onClose={cancelDelete}
            onConfirm={confirmDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete ${selectedUser.name} service category?`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
          )}

          {/* Service Category Details Modal */}
          {showDetailsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">Service Category Details</h2>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCategoryDetails(null);
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
                  ) : selectedCategoryDetails ? (
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Name</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedCategoryDetails.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <p className="text-sm text-gray-900 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                selectedCategoryDetails.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {selectedCategoryDetails.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {selectedCategoryDetails.description && (
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap" title={selectedCategoryDetails.description}>
                            {truncateDescription(selectedCategoryDetails.description, 100)}
                          </p>
                        </div>
                      )}

                      {/* Form ID */}
                      {selectedCategoryDetails.formId && (
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Form ID</h3>
                          <p className="text-sm text-gray-700">{selectedCategoryDetails.formId}</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      {(selectedCategoryDetails.createdAt || selectedCategoryDetails.updatedAt) && (
                        <div className="border-b border-gray-200 pb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedCategoryDetails.createdAt && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Created At</label>
                                <p className="text-sm text-gray-900 mt-1">
                                  {new Date(selectedCategoryDetails.createdAt).toLocaleString()}
                                </p>
                              </div>
                            )}
                            {selectedCategoryDetails.updatedAt && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Updated At</label>
                                <p className="text-sm text-gray-900 mt-1">
                                  {new Date(selectedCategoryDetails.updatedAt).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                            if (selectedCategoryDetails?.id) {
                              navigate(`/service-category/${selectedCategoryDetails.id}`);
                            }
                          }}
                        >
                          Edit Category
                        </Button>
                        <Button
                          variant="muted"
                          onClick={() => {
                            setShowDetailsModal(false);
                            setSelectedCategoryDetails(null);
                          }}
                        >
                          Close
                        </Button>
              </div>
              </div>
            </div>
          )}
      
        </div>
      </>
    </Layout>
  );
};

export default ServiceCategoryList;
