import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../layouts/Layout';
import { useUserActions } from '../hooks/useUserActions';
import { useUser } from '../hooks/useUser';
import TableComponent from '../../../components/atoms/Table';
import { useToast } from '../../../components/atoms/Toast';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { Button } from '../../../components/atoms/Button';
import { X, User as UserIcon, Mail, Building, Phone, MapPin, CheckCircle, XCircle } from 'lucide-react';

import type { TableColumn } from '../../../types/table';

const UserList: React.FC = () => {
  const { users = [], pagination, loading, selectedUser: fullUserDetails } = useUser();
  const { getUserList, removeUser, resetUserPassword, updateUserStatus, blockUser, fetchUserById } = useUserActions();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const toast = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getUserList(currentPage, rowsPerPage, searchQuery);
    }, 300); // debounce API call by 300ms

    return () => clearTimeout(delayDebounce);
  }, [currentPage, searchQuery, rowsPerPage]);



  const confirmDelete = () => {
    if (selectedUser) {
      removeUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success('User deleted successfully');
      getUserList(currentPage, rowsPerPage, searchQuery); 
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // Handle row click to show details modal
  const handleRowClick = async (user: UserRow) => {
    setShowDetailsModal(true);
    setLoadingDetails(true);
    
    try {
      await fetchUserById(user.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load user details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  type UserRow = { id: string; firstName: string; lastName: string; email: string; organizationName: string; isActive?: boolean; isBlocked?: boolean };

  const columns: TableColumn<UserRow>[] = [
    { key: 'firstName', label: 'First Name', sortable: true, searchable: true, width: 150 },
    { key: 'lastName',  label: 'Last Name',  sortable: true, searchable: true, width: 150 },
    { key: 'email',     label: 'Email',      sortable: true, searchable: true, width: 250 },
    { key: 'organizationName', label: 'Organization', sortable: true, width: 200 },
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
    { 
      key: 'isBlocked', 
      label: 'Block Status', 
      width: 100,
      render: (value: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          Boolean(value) 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {Boolean(value) ? 'Blocked' : 'Unblocked'}
        </span>
      )
    },
  ];
  const sanitizedUsers = users?.filter(Boolean).map((user: any) => ({
    ...user,
    isActive: user.isActive,
    isBlocked: user.isBlocked
  })) ?? [];
  return (
    <Layout>
      <TableComponent<UserRow>
        columns={columns}
        data={sanitizedUsers}
        heading="User Management"
        showAddButton
        addButtonRoute="/user-management/new"
        featureName="Role Management"   // match the exact key your app uses
        showResetPasswordOption
        searchBar
        searchQuery={searchQuery}
        onRowClick={handleRowClick}
        onSearchChange={(q) => {
          setCurrentPage(1);
          setSearchQuery(q);
          getUserList(1, rowsPerPage, q);
        }}
        total={pagination?.total ?? 0}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          getUserList(page, rowsPerPage, searchQuery);
        }}
        loading={loading}
        onRowAction={async (action, row) => {
          if (action === 'edit') navigate(`/user-management/${row.id}`);
          if (action === 'delete') { setSelectedUser(row); setShowDeleteModal(true); }
          if (action === 'reset-password') {
            try {
              await resetUserPassword(row.email);
              toast.success('Password reset link sent successfully!');
            } catch (error: any) {
              toast.error(error.message || 'Failed to send reset link');
            }
          }
          if (action === 'activate') {
            try {
              await updateUserStatus(row.id, true);
              toast.success('User activated successfully!');
              getUserList(currentPage, rowsPerPage, searchQuery);
            } catch (error: any) {
              toast.error(error.message || 'Failed to activate user');
            }
          }
          if (action === 'deactivate') {
            try {
              await updateUserStatus(row.id, false);
              toast.success('User deactivated successfully!');
              getUserList(currentPage, rowsPerPage, searchQuery);
            } catch (error: any) {
              toast.error(error.message || 'Failed to deactivate user');
            }
          }
          if (action === 'block') {
            try {
              await blockUser(row.id, { isBlocked: true });
              toast.success('User blocked successfully!');
              getUserList(currentPage, rowsPerPage, searchQuery);
            } catch (error: any) {
              toast.error(error.message || 'Failed to block user');
            }
          }
          if (action === 'unblock') {
            try {
              await blockUser(row.id, { isBlocked: false });
              toast.success('User unblocked successfully!');
              getUserList(currentPage, rowsPerPage, searchQuery);
            } catch (error: any) {
              toast.error(error.message || 'Failed to unblock user');
            }
          }
        }}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
          getUserList(1, size, searchQuery);
        }}
      />


      {showDeleteModal && selectedUser && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete user ${selectedUser.firstName} ${selectedUser.lastName}?`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      )}

      {/* User Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">User Details</h2>
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
              ) : fullUserDetails ? (
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
                          {fullUserDetails.firstName} {fullUserDetails.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </label>
                        <p className="text-sm text-gray-900 mt-1">{fullUserDetails.email || 'N/A'}</p>
                      </div>
                      {fullUserDetails.phoneNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {fullUserDetails.countryCode || ''} {fullUserDetails.phoneNumber}
                          </p>
                        </div>
                      )}
                      {fullUserDetails.organizationName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Organization
                          </label>
                          <p className="text-sm text-gray-900 mt-1">{fullUserDetails.organizationName}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Information */}
                  {(fullUserDetails.address || fullUserDetails.city || fullUserDetails.state || fullUserDetails.pincode) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fullUserDetails.address && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Address
                            </label>
                            <p className="text-sm text-gray-900 mt-1">{fullUserDetails.address}</p>
                          </div>
                        )}
                        {fullUserDetails.city && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <p className="text-sm text-gray-900 mt-1">{fullUserDetails.city}</p>
                          </div>
                        )}
                        {fullUserDetails.state && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">State</label>
                            <p className="text-sm text-gray-900 mt-1">{fullUserDetails.state}</p>
                          </div>
                        )}
                        {fullUserDetails.pincode && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Pincode</label>
                            <p className="text-sm text-gray-900 mt-1">{fullUserDetails.pincode}</p>
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
                            fullUserDetails.isActive
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {fullUserDetails.isActive ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {fullUserDetails.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email Verification</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            fullUserDetails.isEmailVerified
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}>
                            {fullUserDetails.isEmailVerified ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {fullUserDetails.isEmailVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      </div>
                      {(fullUserDetails as any).isBlocked !== undefined && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Block Status</label>
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              (fullUserDetails as any).isBlocked
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                              {(fullUserDetails as any).isBlocked ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {(fullUserDetails as any).isBlocked ? 'Blocked' : 'Unblocked'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Roles and Features */}
                  {((fullUserDetails.roles && fullUserDetails.roles.length > 0) || 
                    (fullUserDetails.features && fullUserDetails.features.length > 0) ||
                    (fullUserDetails.roleIds && fullUserDetails.roleIds.length > 0)) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles & Permissions</h3>
                      {fullUserDetails.roles && Array.isArray(fullUserDetails.roles) && fullUserDetails.roles.length > 0 && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-500">Assigned Roles</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {fullUserDetails.roles.map((role: any, index: number) => (
                              <span
                                key={role.id || role._id || index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200"
                              >
                                {role.name || role.roleName || role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {fullUserDetails.roleIds && Array.isArray(fullUserDetails.roleIds) && fullUserDetails.roleIds.length > 0 && !fullUserDetails.roles && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-500">Role IDs</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {fullUserDetails.roleIds.map((roleId: string, index: number) => (
                              <span
                                key={roleId || index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200"
                              >
                                {roleId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {fullUserDetails.features && Array.isArray(fullUserDetails.features) && fullUserDetails.features.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Features</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {fullUserDetails.features.map((feature: any, index: number) => (
                              <span
                                key={feature.id || feature._id || feature.uniqueId || feature.featureId || index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
                              >
                                {feature.name || feature.uniqueId || feature.featureId || 'Feature'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  {(fullUserDetails.createdAt || fullUserDetails.updatedAt) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fullUserDetails.createdAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created At</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(fullUserDetails.createdAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {fullUserDetails.updatedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Last Updated</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(fullUserDetails.updatedAt).toLocaleString()}
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
                        navigate(`/user-management/${fullUserDetails.id}`);
                      }}
                    >
                      Edit User
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

export default UserList;
