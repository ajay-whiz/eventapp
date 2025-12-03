import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, X, Eye, DollarSign, Package, Edit2, CheckCircle } from 'lucide-react';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import { useBooking } from '../hooks/useBooking';
import { useBookingActions } from '../hooks/useBookingActions';
import { RowActionMenu } from '../../../components/atoms/RowActionMenu';
import { DropDown } from '../../../components/atoms/DropDown';
import { Button } from '../../../components/atoms/Button';
import { Textarea } from '../../../components/atoms/Textarea';
import { useToast } from '../../../components/atoms/Toast';
import { getUserDataFromStorage, isSuperAdmin } from '../../../utils/permissions';
import { VendorOfferModal } from './VendorOfferModal';
import type { VendorOffer } from './OfferList';

// Define a more flexible booking interface for the component
interface BookingItem {
  bookingId?: string;
  bookingNumber?: string;
  status: string;
  type?: string;
  location?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  specialRequests?: string;
  vendorId?: string;
  venueId?: string;
  vendor?: {
    id?: string;
    name?: string;
  };
  venue?: {
    id?: string;
    title?: string;
  };
  customer?: {
    name?: string;
    email?: string;
  };
  services?: Array<{
    name?: string;
    price?: number;
  }>;
  payment?: {
    amount?: number;
  };
}

interface QuotationData {
  quotationTitle: string;
  description: string;
  price: number;
  breakdownOfCharges: string;
  discounts: number;
  taxes: number;
  totalAmount: number;
}

type TabType = 'all' | 'confirmed' | 'pending' | 'rejected';

interface Tab {
  id: TabType;
  label: string;
  count: number;
}

export const BookingIndex: React.FC = () => {
  const navigate = useNavigate();
  const bookingState = useBooking();
  const { bookings = [] } = bookingState;
  const { getBookingList, submitQuotation, getBookingOffers, submitVendorOffer } = useBookingActions();
  const userData = getUserDataFromStorage();
  const isAdmin = isSuperAdmin(userData) || userData?.roles?.some((r: any) => r.name?.toLowerCase().includes('admin'));
  
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [open, setOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationData, setQuotationData] = useState<QuotationData>({
    quotationTitle: '',
    description: '',
    price: 0,
    breakdownOfCharges: '',
    discounts: 0,
    taxes: 0,
    totalAmount: 0
  });
  const [filteredBookings, setFilteredBookings] = useState<BookingItem[]>([]);
  const [bookingOffers, setBookingOffers] = useState<Record<string, VendorOffer[]>>({});
  const [selectedBookingForOffer, setSelectedBookingForOffer] = useState<BookingItem | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<VendorOffer | null>(null);
  const toast = useToast();
  
  // Load basic stats on component mount
  useEffect(() => {

    // Load all bookings to get proper counts using booking/all API
    getBookingList(1, 100, '', {});
  }, []);

  // Load offers for all bookings when bookings change (only for admin users)
  useEffect(() => {
    if (bookings.length > 0 && isAdmin) {
      loadAllBookingOffers();
    }
  }, [bookings.length, isAdmin]); // Only depend on length to avoid infinite loops

  const loadAllBookingOffers = async () => {
    if (!isAdmin) return;
    
    const offersMap: Record<string, VendorOffer[]> = {};
    const userData = getUserDataFromStorage();
    const currentUserId = userData?.id || userData?._id;
    
    // Helper function to compare vendor/user IDs (handle string and object ID formats)
    const isCurrentUserOffer = (offer: any): boolean => {
      if (!currentUserId) return false;
      // Check offerAddedBy first (new API field), then userId, then vendorId
      const offerUserId = offer.offerAddedBy || offer.userId || offer.vendorId || (offer as any).vendor?._id || (offer as any).vendor?.id;
      // Compare as strings to handle different ID formats
      return String(offerUserId) === String(currentUserId);
    };
    
    // Load offers for each booking in parallel
    const offerPromises = bookings.map(async (booking: any) => {
      const bookingId = booking.bookingId || booking.id || booking.bookingNumber;
      if (!bookingId) return;
      
      try {
        const offersData = await getBookingOffers(bookingId);
        const offersList = Array.isArray(offersData) ? offersData : offersData?.offers || [];
        
        // Transform API response to match VendorOffer interface
        const transformedOffers: VendorOffer[] = offersList.map((offer: any) => ({
          offerId: offer.offerId,
          id: offer.offerId || offer.id,
          bookingId: offer.bookingId,
          userId: offer.userId,
          userName: offer.userName,
          offerAddedBy: offer.offerAddedBy,
          amount: offer.amount,
          offerAmount: offer.amount || offer.offerAmount,
          extraServices: offer.extraServices,
          notes: offer.notes,
          status: offer.status,
          createdAt: offer.createdAt,
          // Legacy fields
          vendorId: offer.userId || offer.vendorId,
          vendorName: offer.userName || offer.vendorName,
        }));
        
        // Filter to only show offers from current admin user
        const adminOffers = transformedOffers.filter(isCurrentUserOffer);
        offersMap[bookingId] = adminOffers;
      } catch (error) {
        // Silently fail if offers endpoint doesn't exist or booking has no offers
        offersMap[bookingId] = [];
      }
    });
    
    await Promise.all(offerPromises);
    setBookingOffers(offersMap);
  };

  const getBookingOffer = (booking: any): VendorOffer | null => {
    const bookingId = booking.bookingId || booking.id || booking.bookingNumber;
    if (!bookingId) return null;
    
    const offers = bookingOffers[bookingId] || [];
    // Since we already filter offers by current admin user in loadAllBookingOffers,
    // we can just return the first one (admin can only have one offer per booking)
    return offers[0] || null;
  };

  const handleSubmitOffer = (booking: BookingItem) => {
    setSelectedBookingForOffer(booking);
    setEditingOffer(null);
    setShowOfferModal(true);
  };

  const handleEditOffer = (booking: BookingItem, offer: VendorOffer) => {
    setSelectedBookingForOffer(booking);
    setEditingOffer(offer);
    setShowOfferModal(true);
  };

  const handleOfferSuccess = async () => {
    if (selectedBookingForOffer) {
      const bookingId = selectedBookingForOffer.bookingId || selectedBookingForOffer.bookingNumber;
      if (bookingId) {
        try {
          const offersData = await getBookingOffers(bookingId);
          const offersList = Array.isArray(offersData) ? offersData : offersData?.offers || [];
          
          // Transform API response to match VendorOffer interface
          const transformedOffers: VendorOffer[] = offersList.map((offer: any) => ({
            offerId: offer.offerId,
            id: offer.offerId || offer.id,
            bookingId: offer.bookingId,
            userId: offer.userId,
            userName: offer.userName,
            offerAddedBy: offer.offerAddedBy,
            amount: offer.amount,
            offerAmount: offer.amount || offer.offerAmount,
            extraServices: offer.extraServices,
            notes: offer.notes,
            status: offer.status,
            createdAt: offer.createdAt,
            // Legacy fields
            vendorId: offer.userId || offer.vendorId,
            vendorName: offer.userName || offer.vendorName,
          }));
          
          // Filter to only show offers from current admin user (same as loadAllBookingOffers)
          const userData = getUserDataFromStorage();
          const currentUserId = userData?.id || userData?._id;
          
          // Helper function to compare vendor/user IDs (handle string and object ID formats)
          const isCurrentUserOffer = (offer: VendorOffer): boolean => {
            if (!currentUserId) return false;
            // Check offerAddedBy first (new API field), then userId, then vendorId
            const offerUserId = offer.offerAddedBy || offer.userId || offer.vendorId || (offer as any).vendor?._id || (offer as any).vendor?.id;
            // Compare as strings to handle different ID formats
            return String(offerUserId) === String(currentUserId);
          };
          
          const adminOffers = transformedOffers.filter(isCurrentUserOffer);
          
          setBookingOffers(prev => ({
            ...prev,
            [bookingId]: adminOffers,
          }));
          
          // Also reload all booking offers to ensure consistency
          if (bookings.length > 0) {
            await loadAllBookingOffers();
          }
        } catch (error) {

        }
      }
    }
    setShowOfferModal(false);
    setSelectedBookingForOffer(null);
    setEditingOffer(null);
  };

  // Update filtered bookings when bookings data, active tab, or service type changes
  useEffect(() => {
    let filtered = [...bookings];
    
    // Helper function to get status (check both status and bookingStatus fields, case-insensitive)
    const getStatus = (booking: any) => {
      const status = booking.status || booking.bookingStatus || '';
      return status.toLowerCase();
    };
    
    // Filter by status tab
    switch (activeTab) {
      case 'confirmed':
        filtered = bookings.filter(b => {
          const status = getStatus(b);
          return status === 'confirmed' || status === 'CONFIRMED';
        });
        break;
      case 'pending':
        filtered = bookings.filter(b => getStatus(b) === 'pending');
        break;
      case 'rejected':
        filtered = bookings.filter(b => {
          const status = getStatus(b);
          return status === 'rejected' || status === 'REJECTED';
        });
        break;
      case 'all':
      default:
        filtered = [...bookings];
        break;
    }
    
    // Filter by service type
    if (selectedServiceType !== 'all') {
      filtered = filtered.filter(booking => {
        // Check if booking has vendor services
        if (selectedServiceType === 'vendor') {
          return booking.bookingType === 'vendor' || 
                 booking.vendorId ||
                 booking.vendor || 
                 booking.services?.some((service: any) => service.type === 'vendor' || service.vendorId);
        }
        // Check if booking has venue services
        if (selectedServiceType === 'venue') {
          return booking.bookingType === 'venue' ||
                 booking.venueId ||
                 booking.services?.some((service: any) => service.type === 'venue' || service.venueId);
        }
        return true;
      });
    }
    
    setFilteredBookings(filtered);
  }, [bookings, activeTab, selectedServiceType]);

  // Helper function to get status (check both status and bookingStatus fields, case-insensitive)
  const getBookingStatus = (booking: any) => {
    const status = booking.status || booking.bookingStatus || '';
    return status.toLowerCase();
  };

  // Calculate counts for each tab
  const allCount = bookings.length;
  const confirmedCount = bookings.filter(b => {
    const status = getBookingStatus(b);
    return status === 'confirmed' || status === 'CONFIRMED';
  }).length;
  const pendingCount = bookings.filter(b => getBookingStatus(b) === 'pending').length;
  const rejectedCount = bookings.filter(b => {
    const status = getBookingStatus(b);
    return status === 'rejected' || status === 'REJECTED';
  }).length;

  // Tab configuration
  const tabs: Tab[] = [
    { id: 'all', label: 'All Bookings', count: allCount },
    { id: 'confirmed', label: 'Confirmed', count: confirmedCount },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'rejected', label: 'Rejected', count: rejectedCount },
  ];

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    
    // Define filters based on selected tab
    let filters: any = {};
    switch (tabId) {
      case 'confirmed':
        filters = { status: 'CONFIRMED' };
        break;
      case 'pending':
        filters = { status: 'pending' };
        break;
      case 'rejected':
        filters = { status: 'REJECTED' };
        break;
      case 'all':
      default:
        filters = {};
        break;
    }
    
    // Add service type filter if selected
    if (selectedServiceType !== 'all') {
      filters.serviceType = selectedServiceType;
    }
    
    // Fetch bookings with the selected filter using booking/all API
    getBookingList(1, 100, '', filters);
  };

  // Handle service type filter change
  const handleServiceTypeChange = async (serviceType: string) => {
    setSelectedServiceType(serviceType);
    
    // Make API call with service type filter
    try {
      const filters: any = {};
      
      // Add service type filter if not 'all'
      if (serviceType !== 'all') {
        filters.serviceType = serviceType;
      }
      
      // Make API call to fetch filtered bookings
      await getBookingList(1, 100, '', filters);
    } catch (error) {

      toast.error('Failed to fetch filtered bookings');
    }
  };

  // Calculate total quotation amount
  const calculateTotal = () => {
    const subtotal = quotationData.price;
    const discountAmount = quotationData.discounts;
    const taxAmount = quotationData.taxes;
    const total = subtotal - discountAmount + taxAmount;
    
    // Update the total amount in state
    setQuotationData(prev => ({ ...prev, totalAmount: total }));
    
    return total;
  };

  // Handle quotation input changes
  const handleQuotationChange = (field: keyof QuotationData, value: string | number) => {
    setQuotationData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate total when price, discounts, or taxes change
      if (field === 'price' || field === 'discounts' || field === 'taxes') {
        const subtotal = field === 'price' ? Number(value) : prev.price;
        const discountAmount = field === 'discounts' ? Number(value) : prev.discounts;
        const taxAmount = field === 'taxes' ? Number(value) : prev.taxes;
        updated.totalAmount = subtotal - discountAmount + taxAmount;
      }
      
      return updated;
    });
  };

  // Handle save quotation
  const handleSaveQuotation = async () => {
    try {
      // Validate required fields
      if (!quotationData.quotationTitle.trim()) {
        toast.error('Quotation title is required');
        return;
      }
      if (!quotationData.description.trim()) {
        toast.error('Description is required');
        return;
      }
      if (quotationData.price <= 0) {
        toast.error('Price must be greater than 0');
        return;
      }

      // Get user data from storage
      const userData = getUserDataFromStorage();
      if (!userData) {
        toast.error('User data not found. Please login again.');
        return;
      }

      // Prepare quotation data for API
      const quotationPayload = {
        quotationTitle: quotationData.quotationTitle,
        description: quotationData.description,
        price: quotationData.price,
        breakdownOfCharges: quotationData.breakdownOfCharges,
        discounts: quotationData.discounts,
        taxes: quotationData.taxes,
        totalAmount: quotationData.totalAmount,
        serviceId: 'service-id-placeholder', // You may need to get this from the selected booking or service
        userId: (userData as any).id || (userData as any)._id, // Assuming user data has an id field
        enterpriseId: userData.enterpriseId,
        enterpriseName: userData.organizationName,
        status: 'pending', // Initial status
        createdAt: new Date().toISOString(),
      };

      // Call API to submit quotation
      await submitQuotation(quotationPayload);
      
      setShowQuotationModal(false);
      // Reset form
      setQuotationData({
        quotationTitle: '',
        description: '',
        price: 0,
        breakdownOfCharges: '',
        discounts: 0,
        taxes: 0,
        totalAmount: 0
      });
      
      // Reload bookings list using booking/all API
      await getBookingList(1, 100, '', {});
    } catch (error) {

      // Error handling is done in the submitQuotation function
    }
  };

  // Handle cancel quotation
  const handleCancelQuotation = () => {
    setShowQuotationModal(false);
    setQuotationData({
      quotationTitle: '',
      description: '',
      price: 0,
      breakdownOfCharges: '',
      discounts: 0,
      taxes: 0,
      totalAmount: 0
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'confirmed':
        return 'bg-sky-100 text-sky-600';
      case 'rejected':
        return 'bg-red-100 text-red-600';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };



  return (
    <Layout>
      <div className="space-y-6">
      
        {/* Recent Bookings */}
        <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-6 grid gap-4">
          <div className="py-0">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold mb-0">Bookings</h3>
              <div className="flex items-center space-x-4">
                {/* Service Type Filter Dropdown */}
                <DropDown 
                  options={[
                    { label: 'All', value: 'all' },
                    { label: 'Venue', value: 'venue' },
                    { label: 'Vendor', value: 'vendor' }
                  ]}
                  value={selectedServiceType}
                  onChange={handleServiceTypeChange}
                />
              </div>
            </div>
          </div>
      
                {/* Tabs */}
         
          <div className=" mt-0 overflow-hidden ">
            {/* Tabs */}
            <div className="border-gray-200 border-b-0 p-0 m-0">
              <div className="px-0 pt-0">
                <div className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      className={`pb-2 px-3  font-medium flex items-center cursor-pointer space-x-1 pt-2  ${
                        activeTab === tab.id
                          ? 'border-b-2 border-sky-500 text-black bg-sky-100 rounded-md  font-semibold rounded-b-none'
                          : 'text-gray-500 hover:text-black  hover:border-sky-500'
                      }`}
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          tab.id === 'confirmed'
                            ? 'bg-sky-600'
                            : tab.id === 'pending'
                            ? 'bg-yellow-600'
                            : tab.id === 'rejected'
                            ? 'bg-red-600'
                            : 'bg-sky-600'
                        }`}
                      ></span>
                      <span className="font-medium">{tab.label}</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-300 scheme-light">
              <div className="max-h-[600px] overflow-y-auto overflow-x-scroll">
                <table className="min-w-full rounded-b-xl table-fixed">
                  <thead className="sticky top-0 z-10 divide-y divide-gray-200 text-left text-md bg-white">
                  <tr className="bg-neutral-100 font-normal cursor-pointer">
                  <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm font-semibold w-[120px]">
                    Booking ID
                  </th>
                  <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm font-semibold w-[150px]">
                    Event Type
                  </th>
                  <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm font-semibold w-[200px]">
                    Location
                  </th>
                  <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm font-semibold w-[150px]">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm sm:text-base font-semibold w-[380px]">
                    Specific Requirements
                  </th>
                  <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm font-semibold w-[120px]">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm font-semibold w-[120px]">
                      Offer Status
                    </th>
                  )}
                  <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm font-semibold w-[200px]">
                    Managed By
                  </th>
                  <th className="px-4 py-3 cursor-pointer whitespace-nowrap border-b border-neutral-300 text-sm font-semibold w-[250px]">
                    Action
                  </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 rounded-b-sm">
                  {/* Bookings Table */}
                  <>
                    {bookingState.loading ? (
                      <tr>
                        <td colSpan={isAdmin ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                          <div className="flex items-center justify-center space-x-2 min-h-[300px]">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
                            <span>Loading bookings...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredBookings.length > 0 ? (
                      filteredBookings.map((booking: any, index) => (
                        <tr key={booking.id || booking.bookingId || index} className="hover:bg-gray-50 cursor-default">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-sky-600">
                            {booking.bookingNumber || booking.bookingId || `BOKID-${Math.floor(Math.random() * 9999)}`}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.bookingType || booking.type || booking.title || 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div className="max-w-[200px] truncate" title={booking.location?.address || booking.location || 'N/A'}>
                              {booking.location?.address || booking.location || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.startDateTime || booking.eventDate || booking.date
                              ? new Date(booking.startDateTime || booking.eventDate || booking.date).toLocaleDateString()
                              : 'N/A'}{' '}
                            {booking.startTime || ''}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div className="max-w-[200px] truncate" title={booking.specialRequirement || booking.specialRequests || 'N/A'}>
                              {booking.specialRequirement || booking.specialRequests || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                getBookingStatus(booking)
                              )}`}
                            >
                              {(() => {
                                const status = booking.status || booking.bookingStatus || 'pending';
                                return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
                              })()}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              {(() => {
                                const existingOffer = getBookingOffer(booking);
                                if (existingOffer) {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                                      <CheckCircle className="w-3 h-3" />
                                      Offer Sent
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-xs text-gray-400">No Offer</span>
                                );
                              })()}
                            </td>
                          )}
                          <td className="px-4 py-4 text-sm">
                            <div className="text-sm">
                              <div className="text-gray-900">
                                <span className="font-medium">Created:</span> {booking.createdByName && booking.createdByName.trim() !== '' ? booking.createdByName : '---'}
                              </div>
                              <div className="text-gray-600 mt-1">
                                <span className="font-medium">Updated:</span> {booking.updatedByName && booking.updatedByName.trim() !== '' ? booking.updatedByName : '---'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                onClick={() => navigate(`/booking-management/${booking.bookingId || booking.id || booking.bookingNumber}`)}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs whitespace-nowrap flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View Details
                              </Button>
                              
                              {isAdmin && (() => {
                                const existingOffer = getBookingOffer(booking);
                                if (existingOffer) {
                                  return (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                                        <CheckCircle className="w-3 h-3" />
                                        Offer Sent
                                      </span>
                                      <Button
                                        onClick={() => handleEditOffer(booking, existingOffer)}
                                        className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs whitespace-nowrap flex items-center gap-1"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        Edit Offer
                                      </Button>
                                    </>
                                  );
                                }
                                return (
                                  <Button
                                    onClick={() => handleSubmitOffer(booking)}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs whitespace-nowrap flex items-center gap-1"
                                  >
                                    <DollarSign className="w-3 h-3" />
                                    Submit Offer
                                  </Button>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      // No bookings found message
                      <tr>
                        <td colSpan={isAdmin ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center space-y-2 min-h-[300px]">
                            <div className="text-gray-400">
                              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <span className="text-lg font-medium">No bookings found</span>
                            <span className="text-sm">Try adjusting your filters or check back later</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Offer Modal */}
        {showOfferModal && selectedBookingForOffer && (
          <VendorOfferModal
            isOpen={showOfferModal}
            onClose={() => {
              setShowOfferModal(false);
              setSelectedBookingForOffer(null);
              setEditingOffer(null);
            }}
            bookingId={selectedBookingForOffer.bookingId || selectedBookingForOffer.bookingNumber || ''}
            bookingNumber={selectedBookingForOffer.bookingNumber}
            existingOffer={editingOffer || undefined}
            onSuccess={handleOfferSuccess}
          />
        )}

        {/* Event Quotation Modal - Right Side Slide */}
        {showQuotationModal && (
          <div className="fixed inset-0 z-50">
            <div 
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Event Quotation</h3>
                <Button
                  onClick={handleCancelQuotation}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Quotation Fields */}
                <div className="space-y-4">
                  {/* Quotation Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Title *</label>
                    <input
                      type="text"
                      value={quotationData.quotationTitle}
                      onChange={(e) => handleQuotationChange('quotationTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="e.g., Wedding Photography Premium Package"
                    />
                  </div>

                  {/* Description / Proposal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Proposal *</label>
                    <Textarea
                      value={quotationData.description}
                      onChange={(e) => handleQuotationChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Explain your offer and services in detail..."
                    />
                  </div>

                  {/* Price / Estimated Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price / Estimated Cost *</label>
                    <input
                      type="number"
                      value={quotationData.price}
                      onChange={(e) => handleQuotationChange('price', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {/* Breakdown of Charges */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Breakdown of Charges (Optional)</label>
                    <Textarea
                      value={quotationData.breakdownOfCharges}
                      onChange={(e) => handleQuotationChange('breakdownOfCharges', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Item 1: ₹1000&#10;Item 2: ₹2000&#10;Item 3: ₹1500"
                    />
                  </div>

                  {/* Discounts / Offers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discounts / Offers (Optional)</label>
                    <input
                      type="number"
                      value={quotationData.discounts}
                      onChange={(e) => handleQuotationChange('discounts', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {/* Taxes & Fees */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taxes & Fees (Optional)</label>
                    <input
                      type="number"
                      value={quotationData.taxes}
                      onChange={(e) => handleQuotationChange('taxes', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {/* Total Amount */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                      <span className="text-lg font-bold text-sky-600">₹{quotationData.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
                <Button
                  variant="muted"
                  onClick={handleCancelQuotation}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveQuotation}
                  className="px-4 py-2"
                >
                  Save Quotation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookingIndex;
