import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Filter, 
  Search, 
  Download, 
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
  Star
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
import { VendorOfferModal } from './VendorOfferModal';

interface VendorBookingRow {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  amount: number;
  commission: number;
  rating?: number;
  createdAt: string;
  specialRequests?: string;
}

export const VendorBookingList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  const bookingState = useBooking();
  const { bookings = [], pagination, loading } = bookingState || {};
  
  // Helper function to map BookingType to VendorBookingRow
  const mapBookingToRow = (booking: any): VendorBookingRow => ({
    id: booking.bookingId || booking.id || '',
    bookingNumber: booking.bookingNumber || '',
    customerName: booking.customer?.name || '',
    customerEmail: booking.customer?.email || '',
    customerPhone: booking.customer?.phone || '',
    serviceName: booking.services?.[0]?.name || '',
    startDateTime: booking.startTime || booking.date || '',
    endDateTime: booking.endTime || '',
    status: booking.status || '',
    amount: booking.totalAmount || booking.amount || 0,
    commission: booking.commission || 0,
    rating: booking.rating || undefined,
    createdAt: booking.createdAt || '',
  });
  
  // Map bookings to table rows
  const tableData = bookings.map(mapBookingToRow);
  const { 
    getBookingList, 
    updateBookingStatus 
  } = useBookingActions();

  // Load vendor bookings (filtered for current vendor)
  const loadVendorBookings = async () => {
    const filters = {
      status: statusFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      vendorId: localStorage.getItem('vendorId') || undefined, // Current vendor's bookings
    };

    await getBookingList(currentPage, rowsPerPage, searchQuery, filters);
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadVendorBookings();
  }, [currentPage, rowsPerPage, searchQuery, statusFilter, dateFromFilter, dateToFilter]);

  // Table columns for vendor view
  const columns = [
    {
      key: 'bookingNumber' as keyof VendorBookingRow,
      label: 'Booking ID',
      sortable: true,
      render: (value: string | number | undefined, row: VendorBookingRow, index: number) => (
        <button
          onClick={() => navigate(`/vendor/bookings/${row.id}`)}
          className="text-sky-600 hover:text-sky-800 font-medium"
        >
          {value}
        </button>
      ),
    },
    {
      key: 'customerName' as keyof VendorBookingRow,
      label: 'Customer',
      sortable: true,
      render: (value: string | number | undefined, row: VendorBookingRow, index: number) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.customerEmail}</div>
          <div className="text-xs text-gray-400">{row.customerPhone}</div>
        </div>
      ),
    },
    {
      key: 'serviceName' as keyof VendorBookingRow,
      label: 'Service',
      sortable: true,
    },
    {
      key: 'startDateTime' as keyof VendorBookingRow,
      label: 'Date & Time',
      sortable: true,
      render: (value: string | number | undefined, row: VendorBookingRow, index: number) => (
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
      key: 'status' as keyof VendorBookingRow,
      label: 'Status',
      sortable: true,
      render: (value: string | number | undefined, row: VendorBookingRow, index: number) => {
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
      key: 'amount' as keyof VendorBookingRow,
      label: 'Amount',
      sortable: true,
      render: (value: string | number | undefined, row: VendorBookingRow, index: number) => (
        <div>
          <div className="font-medium text-gray-900">₹{typeof value === 'number' ? value.toLocaleString() : '0'}</div>
          <div className="text-xs text-gray-500">
            Commission: ₹{row.commission.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: 'rating' as keyof VendorBookingRow,
      label: 'Rating',
      render: (value: string | number | undefined, row: VendorBookingRow, index: number) => value ? (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{value}/5</span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">No rating</span>
      ),
    },
    {
      key: 'actions' as keyof VendorBookingRow,
      label: 'Actions',
      render: (value: string | number | undefined, row: VendorBookingRow, index: number) => {
        const isPending = row.status?.toLowerCase() === 'pending';
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
            {isPending && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleRowAction('submitOffer', row)}
                className="flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white"
              >
                <DollarSign className="w-4 h-4" />
                Submit Offer
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const [selectedBookingForOffer, setSelectedBookingForOffer] = useState<VendorBookingRow | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Handle row actions for vendor
  const handleRowAction = async (action: string, row: VendorBookingRow) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/booking-management/${row.id}`);
          break;
        case 'chat':
          navigate(`/vendor/chat/${row.id}`);
          break;
        case 'submitOffer':
          setSelectedBookingForOffer(row);
          setShowOfferModal(true);
          break;
        case 'complete':
          await updateBookingStatus(row.id, 'completed', () => {
            // Reload bookings from database after status update
            loadVendorBookings();
          });
          break;
      }
    } catch (error) {

      toast.error('Action failed. Please try again.');
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

      setSelectedBookings([]);
      loadVendorBookings();
    } catch (error) {

    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {

      // TODO: Implement export functionality
    } catch (error) {

    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">My Bookings</h2>
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
              onClick={() => navigate('/vendor/requirements')}
              className="flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              View Requirements
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
              onClick={loadVendorBookings}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {showFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        />

        {/* Vendor Offer Modal */}
        {selectedBookingForOffer && (
          <VendorOfferModal
            isOpen={showOfferModal}
            onClose={() => {
              setShowOfferModal(false);
              setSelectedBookingForOffer(null);
            }}
            bookingId={selectedBookingForOffer.id}
            bookingNumber={selectedBookingForOffer.bookingNumber}
            onSuccess={() => {
              loadVendorBookings();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default VendorBookingList;
