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

const getRoleLabel = (role: unknown): string => {
  if (!role) return 'Unknown role';
  if (typeof role === 'string') return role;
  if (typeof role === 'object') {
    const value = role as Record<string, unknown>;
    if (typeof value.name === 'string' && value.name) return value.name;
    if (typeof value.roleName === 'string' && value.roleName) return value.roleName;
    if (value.id != null) return String(value.id);
  }
  return 'Unnamed role';
};

const getFeatureLabel = (feature: unknown): string => {
  if (!feature) return 'Feature';
  if (typeof feature === 'string') return feature;
  if (typeof feature === 'object') {
    const value = feature as Record<string, unknown>;
    if (typeof value.name === 'string' && value.name) return value.name;
    if (typeof value.uniqueId === 'string' && value.uniqueId) return value.uniqueId;
    if (value.featureId != null) return String(value.featureId);
    if (value.id != null) return String(value.id);
  }
  return 'Feature';
};

const UserList: React.FC = () => {
  const { users = [], pagination, loading, selectedUser: fetchedUserDetails } = useUser();
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
  const [viewingUser, setViewingUser] = useState<any>(null);

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
    setViewingUser(user);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    
    try {
      const details = await fetchUserById(user.id);
      if (details) {
        setViewingUser(details);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load user details');
      setShowDetailsModal(false);
      setViewingUser(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (fetchedUserDetails && showDetailsModal) {
      setViewingUser(fetchedUserDetails);
    }
  }, [fetchedUserDetails, showDetailsModal]);

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
                    setViewingUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className='w-6 h-6' />
                </Button>
              </div>

              {loadingDetails && !viewingUser ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <span className="ml-3 text-gray-600">Loading details...</span>
                </div>
              ) : viewingUser ? (
                <div className="space-y-6">
                  {loadingDetails && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
                      Loading full details...
                    </div>
                  )}
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
                          {viewingUser.firstName} {viewingUser.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </label>
                        <p className="text-sm text-gray-900 mt-1">{viewingUser.email || 'N/A'}</p>
                      </div>
                      {viewingUser.phoneNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {viewingUser.countryCode || ''} {viewingUser.phoneNumber}
                          </p>
                        </div>
                      )}
                      {viewingUser.organizationName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Organization
                          </label>
                          <p className="text-sm text-gray-900 mt-1">{viewingUser.organizationName}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Information */}
                  {(viewingUser.address || viewingUser.city || viewingUser.state || viewingUser.pincode) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewingUser.address && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Address
                            </label>
                            <p className="text-sm text-gray-900 mt-1">{viewingUser.address}</p>
                          </div>
                        )}
                        {viewingUser.city && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <p className="text-sm text-gray-900 mt-1">{viewingUser.city}</p>
                          </div>
                        )}
                        {viewingUser.state && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">State</label>
                            <p className="text-sm text-gray-900 mt-1">{viewingUser.state}</p>
                          </div>
                        )}
                        {viewingUser.pincode && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Pincode</label>
                            <p className="text-sm text-gray-900 mt-1">{viewingUser.pincode}</p>
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
                            viewingUser.isActive
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {viewingUser.isActive ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {viewingUser.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email Verification</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            viewingUser.isEmailVerified
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}>
                            {viewingUser.isEmailVerified ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {viewingUser.isEmailVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      </div>
                      {(viewingUser as any).isBlocked !== undefined && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Block Status</label>
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              (viewingUser as any).isBlocked
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                              {(viewingUser as any).isBlocked ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {(viewingUser as any).isBlocked ? 'Blocked' : 'Unblocked'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Roles and Features */}
                  {/* {((viewingUser.roles && viewingUser.roles.length > 0) || 
                    (viewingUser.features && viewingUser.features.length > 0) ||
                    (viewingUser.roleIds && viewingUser.roleIds.length > 0)) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles & Permissions</h3>
                      {viewingUser.roles && Array.isArray(viewingUser.roles) && viewingUser.roles.length > 0 && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-500">Assigned Roles</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {viewingUser.roles.map((role: any, index: number) => (
                              <span
                                key={role.id || role._id || index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200"
                              >
                                {getRoleLabel(role)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {viewingUser.roleIds && Array.isArray(viewingUser.roleIds) && viewingUser.roleIds.length > 0 && !viewingUser.roles && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-500">Role IDs</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {viewingUser.roleIds.map((roleId: string, index: number) => (
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
                      {viewingUser.features && Array.isArray(viewingUser.features) && viewingUser.features.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Features</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {viewingUser.features.map((feature: any, index: number) => (
                              <span
                                key={feature.id || feature._id || feature.uniqueId || feature.featureId || index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
                              >
                                {getFeatureLabel(feature)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )} */}

                  {/* Timestamps */}
                  {(viewingUser.createdAt || viewingUser.updatedAt) && (
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewingUser.createdAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created At</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(viewingUser.createdAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {viewingUser.updatedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Last Updated</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(viewingUser.updatedAt).toLocaleString()}
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
                        setViewingUser(null);
                        navigate(`/user-management/${viewingUser.id}`);
                      }}
                    >
                      Edit User
                    </Button>
                    <Button
                      variant="muted"
                      onClick={() => {
                        setShowDetailsModal(false);
                        setViewingUser(null);
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
