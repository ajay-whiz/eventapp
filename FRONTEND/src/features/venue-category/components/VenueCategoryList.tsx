import React, { useEffect, useState } from 'react';
import Layout from '../../../layouts/Layout';
import TableComponent from '../../../components/atoms/Table';
import type { TableColumn, TableAction } from '../../../types/table';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { useToast } from '../../../components/atoms/Toast';
import { useVenueCategory } from '../hooks/useVenueCategory';
import { useVenueCategoryActions } from '../hooks/useVenueCategoryActions';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/atoms/Button';
import { X } from 'lucide-react';
import type { VenueCategory } from '../../../types/VenueCategory';

type VenueCategoryRow = { id: string; name: string; description?: string; isActive?: boolean };

const VenueCategoryList: React.FC = () => {
  const { categories = [], pagination, loading, selectedCategory } = useVenueCategory();
  const { getCategoryList, removeCategory, updateVenueCategoryStatus, fetchCategoryById } =
    useVenueCategoryActions();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const toast = useToast();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<VenueCategoryRow | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<VenueCategory | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getCategoryList(currentPage, rowsPerPage, searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [getCategoryList, currentPage, searchQuery, rowsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAction = (action: TableAction, row: VenueCategoryRow) => {
    if (action === 'edit') {
      navigate(`/venue-category/${row.id}`);
    } else if (action === 'delete') {
      setSelectedRow(row);
      setShowDeleteModal(true);
    } else if (action === 'activate') {
      updateVenueCategoryStatus(row.id, { isActive: true });
      toast.success('Venue category activated successfully');
      getCategoryList(currentPage, rowsPerPage, searchQuery);
    } else if (action === 'deactivate') {
      updateVenueCategoryStatus(row.id, { isActive: false });
      toast.success('Venue category deactivated successfully');
      getCategoryList(currentPage, rowsPerPage, searchQuery);
    }
  };

  const confirmDelete = async () => {
    if (!selectedRow) return;
    try {
      await removeCategory(selectedRow.id);
      setShowDeleteModal(false);
      setSelectedRow(null);
      toast.success('Venue category deleted successfully');
    } catch {
      // Error handled by Redux
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedRow(null);
  };

  const truncateDescription = (text: string | undefined, maxLength = 50): string => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleRowClick = async (category: VenueCategoryRow) => {
    setSelectedCategoryDetails(null);
    setShowDetailsModal(true);
    setLoadingDetails(true);

    try {
      await fetchCategoryById(category.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load venue category details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedCategory && showDetailsModal) {
      setSelectedCategoryDetails(selectedCategory);
    }
  }, [selectedCategory, showDetailsModal]);

  const columns: TableColumn<VenueCategoryRow>[] = [
    { key: 'name', label: 'Name', width: 250, sortable: true, searchable: true },
    {
      key: 'description',
      label: 'Description',
      width: 300,
      render: (value) => (
        <span className="text-gray-700" title={value as string}>
          {truncateDescription(value as string, 50)}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 100,
      render: (value: unknown) => {
        const isActive = Boolean(value);
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
  ];

  const sanitizedCategories: VenueCategoryRow[] =
    (categories as VenueCategory[])?.filter(Boolean).map((c) => ({
      id: c.id,
      name: c.name ?? '',
      description: c.description,
      isActive: c.isActive,
    })) ?? [];

  return (
    <Layout>
      <div className="max-w-3xl">
        <TableComponent<VenueCategoryRow>
          columns={columns}
          data={sanitizedCategories}
          onRowAction={handleAction}
          onRowClick={handleRowClick}
          total={pagination?.total ?? 0}
          currentPage={currentPage}
          featureName="Venue Category"
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          heading="Venue Category"
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
          addButtonRoute="/venue-category/new"
          addButtonText="Add Venue Category"
          showLocationOption={false}
          showCategoryInputsOption={false}
        />

        {showDeleteModal && selectedRow && (
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={cancelDelete}
            onConfirm={confirmDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete ${selectedRow.name} venue category?`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
        )}

        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">Venue Category Details</h2>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCategoryDetails(null);
                  }}
                  variant="muted"
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[65vh]">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
                    <span className="ml-3 text-gray-600">Loading details...</span>
                  </div>
                ) : selectedCategoryDetails ? (
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-sm text-gray-900 mt-1">
                            {selectedCategoryDetails.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <p className="text-sm text-gray-900 mt-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                selectedCategoryDetails.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {selectedCategoryDetails.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedCategoryDetails.description && (
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedCategoryDetails.description}
                        </p>
                      </div>
                    )}

                    {selectedCategoryDetails.formId && (
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Form ID</h3>
                        <p className="text-sm text-gray-700">{selectedCategoryDetails.formId}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No details available</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 shrink-0">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    if (selectedCategoryDetails?.id) {
                      navigate(`/venue-category/${selectedCategoryDetails.id}`);
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
    </Layout>
  );
};

export default VenueCategoryList;
