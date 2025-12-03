import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  Filter, 
  Search, 
  Plus, 
  Download, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import { Button } from '../../../components/atoms/Button';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { SelectGroup } from '../../../components/molecules/SelectGroup';
import TableComponent from '../../../components/atoms/Table';
import { useBookingActions } from '../hooks/useBookingActions';
import { useBooking } from '../hooks/useBooking';
import { useToast } from '../../../components/atoms/Toast';


interface BookingRow {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  amount: number;
  createdAt: string;
  assignedStaff?: string;
  createdByName?: string | null;
  updatedByName?: string | null;
  managedBy?: string | null; // Placeholder for column key
}

export const BookingList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // State (bookings and loading now come from Redux)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  const bookingState = useBooking();
  const { bookings = [], pagination, loading } = bookingState || {};
  
  // Helper function to map BookingType to BookingRow
  const mapBookingToRow = (booking: any): BookingRow => {
    // Handle empty strings - convert to null for display
    const createdByName = booking.createdByName && booking.createdByName.trim() !== '' 
      ? booking.createdByName 
      : null;
    const updatedByName = booking.updatedByName && booking.updatedByName.trim() !== '' 
      ? booking.updatedByName 
      : null;
    
    return {
      id: booking.id || booking.bookingId || '',
      bookingNumber: booking.bookingNumber || booking.bookingId || '',
      customerName: booking.customerName || booking.userName || booking.customer?.name || '',
      customerEmail: booking.customerEmail || booking.userEmail || booking.customer?.email || '',
      serviceName: booking.serviceName || booking.title || booking.services?.[0]?.name || '',
      startDateTime: booking.eventDate || booking.startDateTime || booking.startTime || '',
      endDateTime: booking.endDate || booking.endDateTime || booking.endTime || '',
      status: booking.status || booking.bookingStatus || '',
      amount: booking.amount || booking.price || 0,
      createdAt: booking.createdAt || '',
      assignedStaff: booking.assignedStaff || undefined,
      createdByName: createdByName,
      updatedByName: updatedByName,
      managedBy: 'managedBy', // Placeholder value for column key
    };
  };
  
  // Map bookings to table rows
  const tableData = bookings.map(mapBookingToRow);
  
  const { 
    getBookingList, 
    removeBooking, 
    updateBookingStatus 
  } = useBookingActions();

  // Load bookings
  const loadBookings = useCallback(async () => {
    const filters = {
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    };

    await getBookingList(currentPage, rowsPerPage, searchQuery, filters);
  }, [getBookingList, currentPage, rowsPerPage, searchQuery, statusFilter, typeFilter, dateFromFilter, dateToFilter]);

  // Update URL parameters when filters change
  useEffect(() => {
    if (!isInitialized) return; // Don't update URL on initial load

    const params = new URLSearchParams();
    
    // Always include page and limit
    params.set('page', currentPage.toString());
    params.set('limit', rowsPerPage.toString());
    
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (dateFromFilter) params.set('dateFrom', dateFromFilter);
    if (dateToFilter) params.set('dateTo', dateToFilter);

    setSearchParams(params, { replace: true });
  }, [currentPage, rowsPerPage, searchQuery, statusFilter, typeFilter, dateFromFilter, dateToFilter, isInitialized, setSearchParams]);

  // Initialize filters from URL params on mount
  useEffect(() => {
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Set state from URL params
    if (page) setCurrentPage(parseInt(page, 10));
    if (limit) setRowsPerPage(parseInt(limit, 10));
    if (status) setStatusFilter(status);
    if (type) setTypeFilter(type);
    if (search) setSearchQuery(search);
    if (dateFrom) setDateFromFilter(dateFrom);
    if (dateTo) setDateToFilter(dateTo);

    // If no URL params exist, set defaults
    if (!page && !limit && !status && !type && !search && !dateFrom && !dateTo) {
      const defaultParams = new URLSearchParams();
      defaultParams.set('page', '1');
      defaultParams.set('limit', '10');
      setSearchParams(defaultParams, { replace: true });
    }

    setIsInitialized(true);
  }, []); // Only run on mount

  // Load data when filters change (after initialization)
  useEffect(() => {
    if (isInitialized) {
      loadBookings();
    }
  }, [isInitialized, loadBookings]);

  // Table columns
  const columns = [
    {
      key: 'bookingNumber' as keyof BookingRow,
      label: 'Booking ID',
      sortable: true,
      render: (value: string | number | undefined, row: BookingRow, index: number) => (
        <button
          onClick={() => navigate(`/booking-management/${row.id}`)}
          className="text-sky-600 hover:text-sky-800 font-medium"
        >
          {value}
        </button>
      ),
    },
    {
      key: 'customerName' as keyof BookingRow,
      label: 'Customer',
      sortable: true,
      render: (value: string | number | undefined, row: BookingRow, index: number) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.customerEmail}</div>
        </div>
      ),
    },
    {
      key: 'serviceName' as keyof BookingRow,
      label: 'Service',
      sortable: true,
    },
    {
      key: 'startDateTime' as keyof BookingRow,
      label: 'Date & Time',
      sortable: true,
      render: (value: string | number | undefined, row: BookingRow, index: number) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {value ? new Date(value).toLocaleDateString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            {value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - 
            {row.endDateTime ? new Date(row.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'status' as keyof BookingRow,
      label: 'Status',
      sortable: true,
      render: (value: string | number | undefined, row: BookingRow, index: number) => {
        const getStatusConfig = (status: string) => {
          switch (status.toLowerCase()) {
            case 'confirmed':
              return { color: 'text-green-700 bg-green-100', icon: CheckCircle };
            case 'pending':
              return { color: 'text-yellow-700 bg-yellow-100', icon: Clock };
            case 'cancelled':
              return { color: 'text-red-700 bg-red-100', icon: XCircle };
            case 'completed':
              return { color: 'text-sky-700 bg-sky-100', icon: CheckCircle };
            default:
              return { color: 'text-gray-700 bg-gray-100', icon: Clock };
          }
        };

        const config = getStatusConfig(value as string);
        const Icon = config.icon;

        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <Icon className="w-3 h-3" />
            {value}
          </span>
        );
      },
    },
    {
      key: 'amount' as keyof BookingRow,
      label: 'Amount',
      sortable: true,
      render: (value: string | number | undefined, row: BookingRow, index: number) => (
        <span className="font-medium text-gray-900">₹{typeof value === 'number' ? value.toLocaleString() : '0'}</span>
      ),
    },
    {
      key: 'assignedStaff' as keyof BookingRow,
      label: 'Staff',
      render: (value: string | number | undefined, row: BookingRow, index: number) => value || '-',
    },
    {
      key: 'managedBy' as keyof BookingRow,
      label: 'Managed By',
      sortable: false,
      width: 200,
      render: (value: string | number | undefined, row: BookingRow, index: number) => {
        const createdByName = row.createdByName && row.createdByName.trim() !== '' ? row.createdByName : '---';
        const updatedByName = row.updatedByName && row.updatedByName.trim() !== '' ? row.updatedByName : '---';
        
        return (
          <div className="text-sm">
            <div className="text-gray-900">
              <span className="font-medium">Created:</span> {createdByName}
            </div>
            <div className="text-gray-600 mt-1">
              <span className="font-medium">Updated:</span> {updatedByName}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions' as keyof BookingRow,
      label: 'Actions',
      render: (value: string | number | undefined, row: BookingRow, index: number) => {
        const status = row.status?.toLowerCase() || '';
        const isPending = status === 'pending';
        
        if (isPending) {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleRowAction('accept', row)}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4" />
                Accept
              </Button>
              <Button
                variant="muted"
                size="sm"
                onClick={() => handleRowAction('decline', row)}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </Button>
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="muted"
              size="sm"
              onClick={() => handleRowAction('view', row)}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View
            </Button>
          </div>
        );
      },
    },
  ];

  // Handle row actions
  const handleRowAction = async (action: string, row: BookingRow) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/booking-management/${row.id}`);
          break;
        case 'edit':
          navigate(`/booking-management/${row.id}/edit`);
          break;
        case 'quotation':
          navigate(`/booking-management/${row.id}/quotation`);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this booking?')) {
            await removeBooking(row.id);
            toast.success('Booking deleted successfully!');
          }
          break;
        case 'accept':
          if (window.confirm('Are you sure you want to accept this booking request?')) {
            await updateBookingStatus(row.id, 'confirmed', () => {
              // Reload bookings from database after status update
              loadBookings();
            });
          }
          break;
        case 'decline':
          const reason = window.prompt('Please provide a reason for declining this booking:');
          if (reason) {
            await updateBookingStatus(row.id, 'rejected', () => {
              // Reload bookings from database after status update
              loadBookings();
            });
          }
          break;
        case 'confirm':
          await updateBookingStatus(row.id, 'confirmed', () => {
            // Reload bookings from database after status update
            loadBookings();
          });
          break;
        case 'reject':
          const rejectReason = window.prompt('Please provide a reason for rejection:');
          if (rejectReason) {
            await updateBookingStatus(row.id, 'rejected', () => {
              // Reload bookings from database after status update
              loadBookings();
            });
          }
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('Failed to perform action. Please try again.');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedBookings.length === 0) {
      toast.error('Please select bookings first');
      return;
    }

    try {
      // Implement bulk actions here
      // Bulk action implementation
      setSelectedBookings([]);
      loadBookings();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      // Export current filtered bookings
      // Export functionality
      // TODO: Implement export functionality with current bookings
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
    // Reset URL to default params
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', rowsPerPage.toString());
    setSearchParams(params, { replace: true });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Booking Management</h2>
            <Breadcrumbs />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="muted"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            
            <Button
              variant="muted"
              size="sm"
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/booking-management/create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex gap-4 items-center mb-4">
            <div className="flex-1">
              <InputGroup
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                name="search"
              />
            </div>
            
            <Button
              variant="muted"
              size="sm"
              onClick={loadBookings}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {showFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SelectGroup
                  label="Status"
                  value={statusFilter ? [{ label: statusFilter, value: statusFilter }] : []}
                  onChange={(selected) => setStatusFilter(selected[0]?.value || '')}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                />
                
                <SelectGroup
                  label="Type"
                  value={typeFilter ? [{ label: typeFilter, value: typeFilter }] : []}
                  onChange={(selected) => setTypeFilter(selected[0]?.value || '')}
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'hotel', label: 'Hotel' },
                    { value: 'event', label: 'Event' },
                    { value: 'appointment', label: 'Appointment' },
                    { value: 'service', label: 'Service' },
                    { value: 'venue', label: 'Venue' },
                  ]}
                />
                
                <InputGroup
                  label="From Date"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  name="dateFrom"
                />
                
                <InputGroup
                  label="To Date"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  name="dateTo"
                />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button
                  variant="muted"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedBookings.length > 0 && (
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-sky-700">
                {selectedBookings.length} booking(s) selected
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="muted"
                  size="sm"
                  onClick={() => handleBulkAction('confirm')}
                >
                  Bulk Confirm
                </Button>
                
                <Button
                  variant="muted"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                >
                  Bulk Reject
                </Button>
                
                <Button
                  variant="muted"
                  size="sm"
                  onClick={() => setSelectedBookings([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <TableComponent
          data={tableData}
          columns={columns}
          loading={loading}
          total={pagination?.total || 0}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowAction={handleRowAction}
          hideDeleteAction={true}
        />
      </div>
    </Layout>
  );
};

export default BookingList;
