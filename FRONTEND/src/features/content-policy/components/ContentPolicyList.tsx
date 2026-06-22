import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../../../layouts/Layout';
import TableComponent from '../../../components/atoms/Table';
import type { TableColumn, TableAction } from '../../../types/table';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { useToast } from '../../../components/atoms/Toast';
import { useContentPolicy } from '../hooks/useContentPolicy';
import { useContentPolicyActions } from '../hooks/useContentPolicyActions';
import { getContentPreview } from '../../../utils/htmlUtils';
import { useNavigate } from 'react-router-dom';
import { getPublicContentPolicyPath } from '../utils/contentPolicySlugs';

type ContentPolicyRow = {
  id: string;
  title: string;
  category: string;
  contentPreview: string;
  content: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
  'cookie-policy': 'Cookie Policy',
  'data-protection': 'Data Protection',
  'user-agreement': 'User Agreement',
  'about-us': 'About Us',
  'support': 'Support',

};

const ContentPolicyList: React.FC = () => {
  const { contentPolicies = [], pagination, loading } = useContentPolicy();
  const { getContentPolicyList, removeContentPolicy } = useContentPolicyActions();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const toast = useToast();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContentPolicy, setSelectedContentPolicy] = useState<ContentPolicyRow | null>(null);

  // Fetch content policies when page or search changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getContentPolicyList(currentPage, rowsPerPage, searchQuery);
    }, 300); // debounce API call by 300ms

    return () => clearTimeout(delayDebounce);
  }, [getContentPolicyList, currentPage, searchQuery, rowsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handleAction = useCallback((action: TableAction, row: ContentPolicyRow) => {
    switch (action) {
      case 'edit':
        navigate(`/content-policy/${row.id}`);
        // setIsFormVisible(true);
        break;
      case 'delete':
        setSelectedContentPolicy(row);
        setShowDeleteModal(true);
        break;
      case 'view':
        if (row.category) {
          window.open(getPublicContentPolicyPath(row.category), '_blank', 'noopener,noreferrer');
        } else {
          toast.error('This policy has no category and cannot be viewed publicly.');
        }
        break;
    }
  }, [navigate, toast]);

  const confirmDelete = useCallback(async () => {
    if (!selectedContentPolicy) return;
    try {
      await removeContentPolicy(selectedContentPolicy.id);
      setShowDeleteModal(false);
      setSelectedContentPolicy(null);
      toast.success('Content Policy deleted successfully');
    } catch (error) {
      // Delete content policy error
    }
  }, [selectedContentPolicy, removeContentPolicy, toast]);

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedContentPolicy(null);
  }, []);

  const columns: TableColumn<ContentPolicyRow>[] = useMemo(() => [
    { key: 'title', label: 'Title', width: 90, sortable: true, searchable: true },
    {
      key: 'category',
      label: 'Category',
      width: 120,
      render: (value) => CATEGORY_LABELS[String(value)] ?? String(value ?? '-'),
    },
    { key: 'contentPreview', label: 'Content Preview', width: 180 },
  ], []);

  const sanitizedContentPolicies: ContentPolicyRow[] = useMemo(() => 
    (contentPolicies as any[])?.filter(Boolean).map((cp: any) => ({
      id: (cp.id ?? cp.key ?? `${cp.title || 'policy'}-${Math.random().toString(36).slice(2,8)}`) as string,
      title: (cp.title ?? '') as string,
      category: (cp.category ?? '') as string,
      contentPreview: getContentPreview(cp.content ?? '', 120),
      content: (cp.content ?? '') as string,
    })) ?? []
  , [contentPolicies]);

  return (
    <Layout>
      <>
      <div className='max-w-full'>
        <TableComponent<ContentPolicyRow>
          columns={columns}
          data={sanitizedContentPolicies}
          onRowAction={handleAction}
          total={pagination?.total ?? 0}
          currentPage={currentPage}
          featureName="Content Policy Management"
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          heading="Content Policies"
          searchBar
          searchQuery={searchQuery}
          showResetPasswordOption={false}
          onSearchChange={useCallback((q: string) => {
            setCurrentPage(1);
            setSearchQuery(q);
          }, [])}
          onRowsPerPageChange={useCallback((size: number) => {
            setRowsPerPage(size);
            setCurrentPage(1);
            getContentPolicyList(1, size, searchQuery);
          }, [getContentPolicyList, searchQuery])}
          loading={loading}
          showAddButton   
          showViewOption
          addButtonRoute="/content-policy/new"
          addButtonText='Add Content Policy'
        />
          {showDeleteModal && selectedContentPolicy && (
         <ConfirmModal
            isOpen={showDeleteModal}
            onClose={cancelDelete}
            onConfirm={confirmDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete "${selectedContentPolicy.title}" content policy?`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
          )}
        </div>
      </>
    </Layout>
  );
};

export default ContentPolicyList;
