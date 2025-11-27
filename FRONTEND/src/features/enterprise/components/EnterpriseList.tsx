import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../layouts/Layout';
import { useEnterpriseActions } from '../hooks/useEnterpriseActions';
import { useEnterprise } from '../hooks/useEnterprise';
import TableComponent from '../../../components/atoms/Table';
import type { TableColumn, TableAction } from '../../../types/table';
import { useToast } from '../../../components/atoms/Toast';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { Button } from '../../../components/atoms/Button';
import { X, User as UserIcon, Mail, Building, Phone, MapPin, CheckCircle, XCircle, FileText } from 'lucide-react';

// Define types inline or import from your types file
interface EnterprisePermission {
  read: boolean;
  write: boolean;
  admin: boolean;
}

interface EnterpriseFeature {
  featureId: string;
  permissions: EnterprisePermission;
}

export interface Enterprise {
  key: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  enterpriseName: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  countryCode: string;
  features?: EnterpriseFeature[];
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const EnterpriseList: React.FC = () => {
  const { enterprises = [], pagination, loading, selectedEnterprise: fullEnterpriseDetails } = useEnterprise();
  const { getEnterpriseList, removeEnterprise, resetEnterprisePassword, updateEnterpriseStatus, fetchEnterpriseById } = useEnterpriseActions();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const toast = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch enterprises when page or search changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getEnterpriseList(currentPage, rowsPerPage, searchQuery);
    }, 300); // debounce API call by 300ms

    return () => clearTimeout(delayDebounce);
  }, [currentPage, searchQuery, rowsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAction = async (action: TableAction, enterprise: Enterprise) => {
    if (action === 'edit') navigate(`/enterprise-management/${enterprise.key}`);
    else if (action === 'delete') {
      setSelectedEnterprise(enterprise);
      setShowDeleteModal(true);
    }
    else if (action === 'reset-password') {
      try {
        await resetEnterprisePassword(enterprise.email);
        toast.success('Password reset link sent successfully!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to send reset link');
      }
    }
    else if (action === 'activate') {
      try {
        await updateEnterpriseStatus(enterprise.id, true);
        toast.success('Enterprise activated successfully!');
        getEnterpriseList(currentPage, rowsPerPage, searchQuery);
      } catch (error: any) {
        toast.error(error.message || 'Failed to activate enterprise');
      }
    }
    else if (action === 'deactivate') {
      try {
        await updateEnterpriseStatus(enterprise.id, false);
        toast.success('Enterprise deactivated successfully!');
        getEnterpriseList(currentPage, rowsPerPage, searchQuery);
      } catch (error: any) {
        toast.error(error.message || 'Failed to deactivate enterprise');
      }
    }
  };

  const confirmDelete = () => {
    if (selectedEnterprise) {
      removeEnterprise(selectedEnterprise.key ?? '');
      setShowDeleteModal(false);
      setSelectedEnterprise(null);
      toast.success('Enterprise deleted successfully');
      getEnterpriseList(currentPage, rowsPerPage, searchQuery);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedEnterprise(null);
  };

  // Handle row click to show details modal
  const handleRowClick = async (enterprise: EnterpriseRow) => {
    setShowDetailsModal(true);
    setLoadingDetails(true);
    
    try {
      // Use key or id to fetch enterprise details
      const enterpriseId = enterprise.key || enterprise.id;
      await fetchEnterpriseById(enterpriseId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load enterprise details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  type EnterpriseRow = Enterprise;

  // Truncate description helper
  const truncateDescription = (text: string | undefined, maxLength: number = 50): string => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const columns: TableColumn<EnterpriseRow>[] = [
    { key: 'firstName', label: 'First Name', width: 160, sortable: true, searchable: true },
    { key: 'lastName', label: 'Last Name', width: 160, sortable: true, searchable: true },
    { key: 'email', label: 'Email', width: 200, sortable: true, searchable: true },
    { key: 'phoneNumber', label: 'Phone Number', width: 140, searchable: true },
    { key: 'enterpriseName', label: 'Enterprise Name', width: 200, sortable: true, searchable: true },
    { 
      key: 'description', 
      label: 'Description', 
      width: 200,
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
      render: (value: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          Boolean(value) 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {Boolean(value) ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];  

  const sanitizedEnterprises: Enterprise[] =
  enterprises?.filter(Boolean).map((e:any) => ({ ...e, key: e.key || e.id })) ?? [];

  return (
    <Layout>
      {/* <div className="flex gap-4 mb-6 items-center">
        <h2 className="text-xl font-semibold mb-0">Enterprise Management</h2>
        <Button
          onClick={() => navigate('/enterprise-management/new')}
          className=" ml-auto"
          variant="primary"
          size="md"
        >
          Invite Enterprise
        </Button>
      </div> */}

      <TableComponent<EnterpriseRow>
        columns={columns}
        data={sanitizedEnterprises}
        heading="Enterprise Management"
        showAddButton
        addButtonRoute="/enterprise-management/new"
        addButtonText="Invite Enterprise"
        onRowAction={handleAction}
        onRowClick={handleRowClick}
        total={pagination?.total ?? 0}
        currentPage={currentPage}
        featureName="Enterprise Management"
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
          getEnterpriseList(1, size, searchQuery);
        }}
        showResetPasswordOption={true}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setCurrentPage(1);
          setSearchQuery(q);
        }}
        searchBar={
          // Only show search bar if there's data or if user is already searching
          (sanitizedEnterprises.length > 0 || searchQuery.length > 0) ? (
            <div />
          ) : null
        }
        loading={loading}
      />

      {showDeleteModal && selectedEnterprise && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete enterprise "${selectedEnterprise.enterpriseName}"?`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      )}

      {/* Enterprise Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Enterprise Details</h2>
                <Button
                  variant='muted'
                  onClick={() => {
                    setShowDetailsModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className='w-6 h-6' />
                </Button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <span className="ml-3 text-gray-600">Loading details...</span>
                </div>
              ) : fullEnterpriseDetails ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          Full Name
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {fullEnterpriseDetails.firstName} {fullEnterpriseDetails.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </label>
                        <p className="text-sm text-gray-900 mt-1">{fullEnterpriseDetails.email || 'N/A'}</p>
                      </div>
                      {fullEnterpriseDetails.phoneNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {fullEnterpriseDetails.countryCode || ''} {fullEnterpriseDetails.phoneNumber}
                          </p>
                        </div>
                      )}
                      {fullEnterpriseDetails.enterpriseName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Enterprise Name
                          </label>
                          <p className="text-sm text-gray-900 mt-1">{fullEnterpriseDetails.enterpriseName}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {fullEnterpriseDetails.description && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Description
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{fullEnterpriseDetails.description}</p>
                    </div>
                  )}

                  {/* Address Information */}
                  {(fullEnterpriseDetails.address || fullEnterpriseDetails.city || fullEnterpriseDetails.state || fullEnterpriseDetails.pincode) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fullEnterpriseDetails.address && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Address
                            </label>
                            <p className="text-sm text-gray-900 mt-1">{fullEnterpriseDetails.address}</p>
                          </div>
                        )}
                        {fullEnterpriseDetails.city && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <p className="text-sm text-gray-900 mt-1">{fullEnterpriseDetails.city}</p>
                          </div>
                        )}
                        {fullEnterpriseDetails.state && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">State</label>
                            <p className="text-sm text-gray-900 mt-1">{fullEnterpriseDetails.state}</p>
                          </div>
                        )}
                        {fullEnterpriseDetails.pincode && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Pincode</label>
                            <p className="text-sm text-gray-900 mt-1">{fullEnterpriseDetails.pincode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Information */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Account Status</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            fullEnterpriseDetails.isActive
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {fullEnterpriseDetails.isActive ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {fullEnterpriseDetails.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email Verification</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            fullEnterpriseDetails.isEmailVerified
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}>
                            {fullEnterpriseDetails.isEmailVerified ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {fullEnterpriseDetails.isEmailVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {fullEnterpriseDetails.features && fullEnterpriseDetails.features.length > 0 && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Features & Permissions</h3>
                      <div className="space-y-3">
                        {fullEnterpriseDetails.features.map((feature: EnterpriseFeature, index: number) => (
                          <div key={feature.featureId || index} className="border border-gray-200 rounded-lg p-3">
                            <div className="font-medium text-sm text-gray-900 mb-2">
                              {feature.featureId}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {feature.permissions.read && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-sky-100 text-sky-700">
                                  Read
                                </span>
                              )}
                              {feature.permissions.write && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                  Write
                                </span>
                              )}
                              {feature.permissions.admin && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  {(fullEnterpriseDetails.createdAt || fullEnterpriseDetails.updatedAt) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fullEnterpriseDetails.createdAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created At</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(fullEnterpriseDetails.createdAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {fullEnterpriseDetails.updatedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Last Updated</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(fullEnterpriseDetails.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowDetailsModal(false);
                        navigate(`/enterprise-management/${fullEnterpriseDetails.key || fullEnterpriseDetails.id}`);
                      }}
                    >
                      Edit Enterprise
                    </Button>
                    <Button
                      variant="muted"
                      onClick={() => {
                        setShowDetailsModal(false);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No details available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EnterpriseList;
