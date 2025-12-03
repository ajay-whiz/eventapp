import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../layouts/Layout';
import TableComponent from '../../../components/atoms/Table';
import type { TableColumn, TableAction } from '../../../types/table';
import { useToast } from '../../../components/atoms/Toast';
import { useUser } from '../../user/hooks/useUser';
import { useDynamicFormActions } from '../../user/hooks/dynamicFormActions';
import { ROUTING } from '../../../constants/routes';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { Button } from '../../../components/atoms/Button';
import { X } from 'lucide-react';

const DynamicFormList: React.FC = () => {
  const { users = [], pagination, loading } = useUser();
  const { getFormList, removeForm } = useDynamicFormActions();

  const [selectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const toast = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFormDetails, setSelectedFormDetails] = useState<any | null>(null);
  type FormRow = { 
    id: string; 
    key: string; 
    name: string; 
    description?: string;
    fieldsCount?: number;
    createdAt?: string;
    updatedAt?: string;
    type?: string;
    [key: string]: any; // Allow additional properties
  };
  const [selectedUser, setSelectedUser] = useState<FormRow | null>(null);

  // Check pagination data
  useEffect(() => {
    console.log('FormList: Component mounted, fetching forms...');
    const delayDebounce = setTimeout(() => {
      getFormList(currentPage, rowsPerPage, searchQuery, selectedRole);
    }, 300); // debounce API call by 300ms

    return () => clearTimeout(delayDebounce);
  }, [getFormList, currentPage, searchQuery, selectedRole, rowsPerPage]);

  // Debug: Log when data changes
  useEffect(() => {
    console.log('FormList: Data updated', { users, pagination, loading });
  }, [users, pagination, loading]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAction = (action: TableAction, row: FormRow) => {
    if (action === 'edit') navigate(`/form-builder?id=${row.key}`);
    else if (action === 'delete') {
      setSelectedUser(row);
      setShowDeleteModal(true);
    }
  };

  // Handle row click to show details modal
  const handleRowClick = (form: FormRow) => {
    // Find the full form data from the users array
    const fullFormData = users.find((u: any) => (u.id ?? u._id ?? u.key) === form.id || u.key === form.key);
    setSelectedFormDetails(fullFormData || form);
    setShowDetailsModal(true);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const confirmDelete = () => {
    if (!selectedUser) return;
    removeForm(selectedUser.key);
    setShowDeleteModal(false);
    setSelectedUser(null);
    toast.success('Form deleted successfully');
    setTimeout(() => {
      getFormList(currentPage, rowsPerPage, searchQuery,selectedRole);
    }, 500);
  };
  

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // Helper function to format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to truncate description
  const truncateDescription = (text: string | undefined, maxLength: number = 100): string => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const columns: TableColumn<FormRow>[] = [
    { key: 'name', label: 'Name', width: 100, sortable: true, searchable: true },
    { 
      key: 'description', 
      label: 'Description', 
      width: 300,
      render: (value) => {
        const description = value as string | undefined;
        return (
          <span title={description || ''}>
            {truncateDescription(description, 100)}
          </span>
        );
      }
    },
    { 
      key: 'fieldsCount', 
      label: 'Fields', 
      width: 100,
      render: (value) => {
        const count = value as number | undefined;
        return <span>{count ?? 0}</span>;
      }
    },
    { 
      key: 'type', 
      label: 'Type', 
      width: 150,
      render: (value) => {
        const type = value as string | undefined;
        return <span className="capitalize">{type || '-'}</span>;
      }
    },
    { 
      key: 'createdAt', 
      label: 'Created', 
      width: 120,
      render: (value) => {
        const date = value as string | undefined;
        return <span>{formatDate(date)}</span>;
      }
    },
    { 
      key: 'updatedAt', 
      label: 'Updated', 
      width: 120,
      render: (value) => {
        const date = value as string | undefined;
        return <span>{formatDate(date)}</span>;
      }
    },
  ];
 const sanitizedUsers: FormRow[] = Array.isArray(users)
  ? users.filter(Boolean).map((u:any) => ({
      id: (u.id ?? u._id ?? u.key) as string,
      key: u.key as string,
      name: u.name as string,
      description: u.description as string | undefined,
      fieldsCount: Array.isArray(u.fields) ? u.fields.length : 0,
      createdAt: u.createdAt as string | undefined,
      updatedAt: u.updatedAt as string | undefined,
      type: u.type as string | undefined,
      ...u, // Include all form data for modal
    }))
  : [];

  console.log('FormList: Rendering with', { 
    usersCount: users.length, 
    sanitizedCount: sanitizedUsers.length,
    loading,
    pagination 
  });

  return (
    <Layout>
      <TableComponent<FormRow>
        heading={'Form Management'}
        columns={columns}
        className='fromListTable'
        data={sanitizedUsers}
        onRowAction={handleAction}
        onRowClick={handleRowClick}
        total={pagination?.total ?? 0}
        featureName="Form Builder"
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        searchBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setCurrentPage(1);
          setSearchQuery(q);
        }}
        addButtonText={"Add Form"}
        addButtonRoute={ROUTING.FORM_BUILDER}
        loading={loading}
        showAddButton={true}
      />

      {showDeleteModal && selectedUser && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete this form?`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      )}

      {/* Form Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Form Details</h2>
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedFormDetails(null);
                }}
                variant='muted'
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[65vh]">
              {selectedFormDetails ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedFormDetails.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <p className="text-sm text-gray-900 mt-1 capitalize">{selectedFormDetails.type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Form Key</label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">{selectedFormDetails.key || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Number of Fields</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {Array.isArray(selectedFormDetails.fields) ? selectedFormDetails.fields.length : 0}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <p className="text-sm text-gray-900 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedFormDetails.isActive !== false
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedFormDetails.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedFormDetails.description && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedFormDetails.description}
                      </p>
                    </div>
                  )}

                  {/* Form Fields */}
                  {selectedFormDetails.fields && Array.isArray(selectedFormDetails.fields) && selectedFormDetails.fields.length > 0 && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Fields ({selectedFormDetails.fields.length})</h3>
                      <div className="space-y-3 ">
                        {selectedFormDetails.fields.map((field: any, index: number) => (
                          <div key={field.id || index} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {field.name || field.label || field.metadata?.label || `Field ${index + 1}`}
                                  </span>
                                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-xs rounded capitalize">
                                    {field.type || 'text'}
                                  </span>
                                  {field.validation?.required?.value && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                {field.description && (
                                  <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                                )}
                                {field.placeholder && (
                                  <p className="text-xs text-gray-500 mt-1">Placeholder: {field.placeholder}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  {(selectedFormDetails.createdAt || selectedFormDetails.updatedAt) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedFormDetails.createdAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created At</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(selectedFormDetails.createdAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedFormDetails.updatedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Updated At</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(selectedFormDetails.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Metadata */}
                  {selectedFormDetails.categoryId && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Category ID</h3>
                      <p className="text-sm text-gray-700 font-mono">{selectedFormDetails.categoryId}</p>
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
                  if (selectedFormDetails?.key) {
                    navigate(`/form-builder?id=${selectedFormDetails.key}`);
                  }
                }}
              >
                Edit Form
              </Button>
              <Button
                variant="muted"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedFormDetails(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DynamicFormList;
