import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import Layout from '../../../layouts/Layout';
import TableComponent from '../../../components/atoms/Table';
import type { TableColumn, TableAction } from '../../../types/table';
import { ConfirmModal } from '../../../components/molecules/ConfirmModal';
import { useToast } from '../../../components/atoms/Toast';
import { ROUTING } from '../../../constants/routes';
import { useTestimonial } from '../hooks/useTestimonial';
import { useTestimonialActions } from '../hooks/useTestimonialActions';
import StarRating from './StarRating';
import {
  formatTestimonialDate,
  resolveAvatarUrl,
  truncateText,
} from '../utils/testimonialDisplay';

type TestimonialRow = {
  id: string;
  name: string;
  designation: string;
  message: string;
  messagePreview: string;
  avatarUrl?: string;
  rating: number;
  createdAt?: string;
};

const TestimonialList: React.FC = () => {
  const { testimonials = [], pagination, loading, formLoading } = useTestimonial();
  const { getTestimonialList, removeTestimonial } = useTestimonialActions();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<TestimonialRow | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getTestimonialList(currentPage, rowsPerPage, searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [getTestimonialList, currentPage, searchQuery, rowsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handleAction = useCallback(
    (action: TableAction, row: TestimonialRow) => {
      switch (action) {
        case 'edit':
          navigate(`/${ROUTING.UPDATE_TESTIMONIAL.replace(':id', row.id)}`);
          break;
        case 'delete':
          setSelectedTestimonial(row);
          setShowDeleteModal(true);
          break;
      }
    },
    [navigate],
  );

  const confirmDelete = useCallback(async () => {
    if (!selectedTestimonial) return;

    try {
      await removeTestimonial(selectedTestimonial.id);
      setShowDeleteModal(false);
      setSelectedTestimonial(null);
      toast.success('Testimonial deleted successfully');
      getTestimonialList(currentPage, rowsPerPage, searchQuery);
    } catch {
      toast.error('Failed to delete testimonial');
    }
  }, [
    selectedTestimonial,
    removeTestimonial,
    toast,
    getTestimonialList,
    currentPage,
    rowsPerPage,
    searchQuery,
  ]);

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedTestimonial(null);
  }, []);

  const columns: TableColumn<TestimonialRow>[] = useMemo(
    () => [
      {
        key: 'avatarUrl',
        label: 'Avatar',
        width: 70,
        render: (_, row) => {
          const imageUrl = resolveAvatarUrl(row.avatarUrl);

          return (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={row.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </div>
          );
        },
      },
      { key: 'name', label: 'Name', width: 120, sortable: true, searchable: true },
      { key: 'designation', label: 'Designation', width: 140, sortable: true, searchable: true },
      {
        key: 'rating',
        label: 'Rating',
        width: 120,
        sortable: true,
        render: (value) => <StarRating value={Number(value) || 0} readOnly size={16} />,
      },
      {
        key: 'messagePreview',
        label: 'Message',
        width: 220,
        searchable: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700" title={row.message}>
            {row.messagePreview}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        width: 120,
        sortable: true,
        render: (value) => formatTestimonialDate(String(value ?? '')),
      },
    ],
    [],
  );

  const tableData: TestimonialRow[] = useMemo(
    () =>
      testimonials.map((item) => ({
        id: item.id,
        name: item.name,
        designation: item.designation,
        message: item.message,
        messagePreview: truncateText(item.message, 80),
        avatarUrl: item.avatarUrl,
        rating: item.rating,
        createdAt: item.createdAt,
      })),
    [testimonials],
  );

  return (
    <Layout>
      <div className="max-w-full">
        <TableComponent<TestimonialRow>
          columns={columns}
          data={tableData}
          onRowAction={handleAction}
          total={pagination?.total ?? 0}
          currentPage={currentPage}
          featureName="Testimonials"
          uniqueId="testimonial_management"
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          heading="Testimonials"
          searchBar
          searchQuery={searchQuery}
          showResetPasswordOption={false}
          onSearchChange={useCallback((q: string) => {
            setCurrentPage(1);
            setSearchQuery(q);
          }, [])}
          onRowsPerPageChange={useCallback(
            (size: number) => {
              setRowsPerPage(size);
              setCurrentPage(1);
              getTestimonialList(1, size, searchQuery);
            },
            [getTestimonialList, searchQuery],
          )}
          loading={loading || formLoading}
          showAddButton
          addButtonRoute={`/${ROUTING.ADD_TESTIMONIAL}`}
          addButtonText="Add Testimonial"
        />

        {showDeleteModal && selectedTestimonial && (
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={cancelDelete}
            onConfirm={confirmDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete the testimonial from "${selectedTestimonial.name}"?`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
        )}
      </div>
    </Layout>
  );
};

export default TestimonialList;
