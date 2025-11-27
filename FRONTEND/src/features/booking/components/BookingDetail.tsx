import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Package, MessageSquare } from 'lucide-react';
import Layout from '../../../layouts/Layout';
import Breadcrumbs from '../../../components/common/BreadCrumb';
import { Button } from '../../../components/atoms/Button';
import { useBookingActions } from '../hooks/useBookingActions';
import { useBooking } from '../hooks/useBooking';
import { OfferList, type VendorOffer } from './OfferList';
import { ChatInterface } from './ChatInterface';
import { useToast } from '../../../components/atoms/Toast';

export const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { fetchBookingById, getBookingOffers, acceptVendorOffer } = useBookingActions();
  const { selectedBooking, loading } = useBooking();
  const [offers, setOffers] = useState<VendorOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [acceptedOfferId, setAcceptedOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadBookingDetails();
      loadOffers();
    }
  }, [id]);

  const loadBookingDetails = async () => {
    if (!id) return;
    try {
      await fetchBookingById(id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load booking details');
    }
  };

  const loadOffers = async () => {
    if (!id) return;
    setOffersLoading(true);
    try {
      const offersData = await getBookingOffers(id);
      const offersList = Array.isArray(offersData) ? offersData : offersData?.offers || [];
      
      // Transform API response to match VendorOffer interface
      const transformedOffers: VendorOffer[] = offersList.map((offer: any) => ({
        offerId: offer.offerId,
        id: offer.offerId || offer.id, // Use offerId as primary id
        bookingId: offer.bookingId,
        userId: offer.userId,
        userName: offer.userName,
        offerAddedBy: offer.offerAddedBy,
        amount: offer.amount,
        offerAmount: offer.amount || offer.offerAmount, // Map amount to offerAmount for backward compatibility
        extraServices: offer.extraServices,
        notes: offer.notes,
        status: offer.status,
        createdAt: offer.createdAt,
        // Legacy fields
        vendorId: offer.userId || offer.vendorId,
        vendorName: offer.userName || offer.vendorName,
      }));
      
      setOffers(transformedOffers);
      
      // Check if any offer is accepted
      const acceptedOffer = transformedOffers.find((o: VendorOffer) => o.status === 'accepted');
      if (acceptedOffer) {
        setAcceptedOfferId(acceptedOffer.offerId || acceptedOffer.id || '');
        setShowChat(true);
      }
    } catch (error: any) {
      console.error('Failed to load offers:', error);
      // Don't show error toast if offers endpoint doesn't exist yet
    } finally {
      setOffersLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!id) return;
    try {
      await acceptVendorOffer(id, offerId);
      setAcceptedOfferId(offerId);
      setShowChat(true);
      // Reload offers to update status
      await loadOffers();
    } catch (error: any) {
      throw error;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <span className="ml-3 text-gray-600">Loading booking details...</span>
        </div>
      </Layout>
    );
  }

  if (!selectedBooking) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Booking not found</p>
          <Button
            variant="muted"
            onClick={() => navigate('/booking-management')}
            className="mt-4"
          >
            Back to Bookings
          </Button>
        </div>
      </Layout>
    );
  }

  const booking = selectedBooking;
  const acceptedOffer = offers.find(o => o.id === acceptedOfferId);

  // Helper function to get status text color
  const getStatusTextColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-600 rounded-lg';
      case 'confirmed':
        return 'bg-sky-100 text-sky-600 rounded-lg';
      case 'rejected':
        return 'bg-red-100 text-red-600 rounded-lg';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 rounded-lg';
      default:
        return 'bg-gray-100 text-gray-600 rounded-lg';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4 flex-row justify-between w-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Booking Details
              </h2>
              <Breadcrumbs />
            </div>
            <Button
              variant="muted"
              onClick={() => navigate('/booking-management')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking ID</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {booking.bookingNumber || booking.bookingId || id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block">Status</label>
                    <p className={`text-sm font-semibold mt-1  inline-block capitalize ${getStatusTextColor(booking.status || booking.bookingStatus || 'Pending')}`}>
                      {booking.status || booking.bookingStatus || 'Pending'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Event Date & Time
                  </label>
                  <p className="text-sm text-gray-900 mt-1 font-semibold">
                    {booking.startDateTime || booking.eventDate || booking.date
                      ? new Date(booking.startDateTime || booking.eventDate || booking.date).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {booking.location?.address || booking.location || 'N/A'}
                  </p>
                </div>

                {booking.specialRequirement || booking.specialRequests ? (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Special Requirements</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {booking.specialRequirement || booking.specialRequests}
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {booking.createdByName || '---'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Updated By</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {booking.updatedByName || '---'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Offers */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Vendor Offers
                </h3>
                <Button
                  variant="muted"
                  size="sm"
                  onClick={loadOffers}
                  disabled={offersLoading}
                >
                  Refresh
                </Button>
              </div>
              <OfferList
                offers={offers}
                bookingId={id || ''}
                onAcceptOffer={handleAcceptOffer}
                loading={offersLoading}
              />
            </div>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-1">
            {showChat && acceptedOffer ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chat with Vendor
                  </h3>
                  <Button
                    variant="muted"
                    size="sm"
                    onClick={() => setShowChat(false)}
                  >
                    Close
                  </Button>
                </div>
                <ChatInterface
                  bookingId={id || ''}
                  vendorId={acceptedOffer.userId || acceptedOffer.vendorId || ''}
                  vendorName={acceptedOffer.userName || acceptedOffer.vendorName || 'Unknown Vendor'}
                />
              </div>
            ) : acceptedOfferId ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-4">Chat interface will appear here</p>
                  <Button
                    variant="primary"
                    onClick={() => setShowChat(true)}
                  >
                    Open Chat
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">Accept an offer to start chatting with the vendor</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingDetail;

