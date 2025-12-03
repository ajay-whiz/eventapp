import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import api from '../../../axios';
import { useToast } from '../../../components/atoms/Toast';
import { API_ROUTES } from '../../../constants/routes';
import { getUserDataFromStorage } from '../../../utils/permissions';
import { 
  fetchBookingsStart,
  fetchBookingsSuccess,
  fetchBookingsFailure,
  fetchBookingByIdStart,
  fetchBookingByIdSuccess,
  fetchBookingByIdFailure,
  addBookingStart,
  addBookingSuccess,
  addBookingFailure,
  updateBookingStart,
  updateBookingSuccess,
  updateBookingFailure,
  removeBookingStart,
  removeBookingSuccess,
  removeBookingFailure,
  updateBookingStatusStart,
  updateBookingStatusSuccess,
  updateBookingStatusFailure,
  checkAvailabilityStart,
  checkAvailabilitySuccess,
  checkAvailabilityFailure,
} from '../slices/bookingSlice';
import { 
  type BookingType,
  type AvailabilitySearchType,
  type CancelType,
  type RescheduleType,
  type UpdateBookingType, 
} from '../schemas/booking.schema';

export function useBookingActions() {
  const dispatch = useDispatch();
  const toast = useToast();

  // Get booking list with pagination and search
  const getBookingList = useCallback(
    async (pageParam = 1, limitParam = 10, searchQuery = '', filters = {}) => {
      dispatch(fetchBookingsStart());
      try {
        const params: any = {
          page: pageParam,
          limit: limitParam,
        };
        
        // Add search query if provided
        if (searchQuery && searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        
        // Add filters (status, dateFrom, dateTo, etc.)
        if (filters) {
          if (filters.status) {
            params.status = filters.status;
          }
          if (filters.dateFrom) {
            params.dateFrom = filters.dateFrom;
          }
          if (filters.dateTo) {
            params.dateTo = filters.dateTo;
          }
          // Add any other filters
          Object.keys(filters).forEach(key => {
            if (!['status', 'dateFrom', 'dateTo'].includes(key) && filters[key as keyof typeof filters]) {
              params[key] = filters[key as keyof typeof filters];
            }
          });
        }
        
        const apiUrl = `${API_ROUTES.BOOKINGS}/all`;



        const response = await api.get(apiUrl, {
          params,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        // Handle new API response structure: { status: "OK", data: { bookings, total, page, limit } }
        const responseData = response.data?.data || response.data;
        const { bookings, total, page, limit } = responseData;
        
        // Transform backend data to frontend format
        const transformedBookings = (bookings || []).map((booking: any) => ({
          id: booking.id || booking._id || booking.bookingId,
          bookingId: booking.bookingId || booking.id || booking._id,
          bookingNumber: booking.bookingId || booking.id || booking._id,
          customerName: booking.customerName || booking.userName || 'Unknown Customer',
          customerEmail: booking.customerEmail || booking.userEmail || 'unknown@example.com',
          serviceName: booking.title || booking.serviceName || 'Unknown Service',
          startDateTime: booking.eventDate || booking.startDateTime || new Date().toISOString(),
          endDateTime: booking.endDate || booking.endDateTime || new Date().toISOString(),
          status: booking.status || booking.bookingStatus || 'pending',
          bookingStatus: booking.bookingStatus || booking.status || 'pending',
          amount: booking.amount || booking.price || 0,
          createdAt: booking.createdAt || new Date().toISOString(),
          assignedStaff: booking.assignedStaff || null,
          // Additional fields from backend
          title: booking.title,
          description: booking.description,
          location: booking.location,
          rating: booking.rating,
          imageUrl: booking.imageUrl,
          reviews: booking.reviews,
          bookingType: booking.bookingType,
          venueId: booking.venueId,
          vendorId: booking.vendorId,
          userId: booking.userId,
          // Date and time fields
          eventDate: booking.eventDate,
          endDate: booking.endDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          date: booking.eventDate || booking.startDateTime,
          // Special requirements
          specialRequirement: booking.specialRequirement,
          specialRequests: booking.specialRequirement,
          // Type field
          type: booking.bookingType || booking.type,
          // Created and updated by names
          createdByName: booking.createdByName || null,
          updatedByName: booking.updatedByName || null,
        }));
        
        
        dispatch(fetchBookingsSuccess({ 
          bookings: transformedBookings, 
          pagination: { total: total || 0, page: page || 1, limit: limit || 10 } 
        }));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to fetch bookings';
        dispatch(fetchBookingsFailure(errorMessage));
      }
    },
    [dispatch]
  );

  // Get booking by ID
  const fetchBookingById = useCallback(async (bookingId: string) => {
    dispatch(fetchBookingByIdStart());
    try {
      const response = await api.get(`${API_ROUTES.BOOKINGS}/${bookingId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const bookingData = response.data?.data || response.data;
      dispatch(fetchBookingByIdSuccess(bookingData));
      return bookingData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch booking details';
      dispatch(fetchBookingByIdFailure(errorMessage));
      throw err;
    }
  }, [dispatch]);

  // Create booking
  const addBooking = useCallback(async (bookingData: BookingType) => {
    dispatch(addBookingStart());
    try {
      const response = await api.post(`${API_ROUTES.BOOKINGS}`, bookingData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const bookingResponse = response.data?.data || response.data;
      dispatch(addBookingSuccess(bookingResponse));
      toast.success('Booking created successfully!');
      return bookingResponse;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to create booking';
      dispatch(addBookingFailure(errorMessage));
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch]);

  // Update booking
  const updateBooking = useCallback(async (bookingId: string, updateData: UpdateBookingType) => {
    dispatch(updateBookingStart());
    try {
      const response = await api.put(`${API_ROUTES.BOOKINGS}/${bookingId}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const bookingResponse = response.data?.data || response.data;
      dispatch(updateBookingSuccess(bookingResponse));
      toast.success('Booking updated successfully!');
      return bookingResponse;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to update booking';
      dispatch(updateBookingFailure(errorMessage));
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch]);

  // Remove booking
  const removeBooking = useCallback(async (bookingId: string) => {
    dispatch(removeBookingStart());
    try {
      await api.delete(`${API_ROUTES.BOOKINGS}/${bookingId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      dispatch(removeBookingSuccess(bookingId));
      toast.success('Booking deleted successfully!');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete booking';
      dispatch(removeBookingFailure(errorMessage));
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch]);

  // Update booking status
  const updateBookingStatus = useCallback(async (
    bookingId: string, 
    status: string, 
    reloadCallback?: () => void
  ) => {
    dispatch(updateBookingStatusStart());
    try {
      const response = await api.patch(`${API_ROUTES.BOOKINGS}/${bookingId}/status`, 
        { status }, 
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      // Handle response structure: { status: "OK", data: { booking, ... } } or { booking, ... }
      const responseData = response.data?.data || response.data;
      const updatedBooking = responseData?.booking || responseData;
      
      // Update status in Redux state using the booking ID from response or the one passed
      const finalBookingId = updatedBooking?.id || updatedBooking?.bookingId || bookingId;
      const finalStatus = updatedBooking?.status || updatedBooking?.bookingStatus || status;
      
      dispatch(updateBookingStatusSuccess({ bookingId: finalBookingId, status: finalStatus }));
      
      // Reload bookings from database via callback to ensure we have the latest data
      if (reloadCallback) {
        reloadCallback();
      }
      
      toast.success(`Booking ${status} successfully!`);
      return updatedBooking || responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update booking status';
      dispatch(updateBookingStatusFailure(errorMessage));
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch]);

  // Accept booking
  const acceptBooking = useCallback(async (
    bookingId: string,
    notes?: string,
    reloadCallback?: () => void
  ) => {
    dispatch(updateBookingStatusStart());
    try {
      const requestBody = notes ? { bookingId, notes } : { bookingId };
      const response = await api.post(`${API_ROUTES.BOOKINGS}/accept`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      // Handle response structure
      const responseData = response.data?.data || response.data;
      const acceptedBooking = responseData?.booking || responseData;
      
      // Update status in Redux store
      const finalBookingId = acceptedBooking?.id || acceptedBooking?.bookingId || bookingId;
      dispatch(updateBookingStatusSuccess({ bookingId: finalBookingId, status: 'confirmed' }));
      
      // Reload bookings from database via callback to ensure we have the latest data
      if (reloadCallback) {
        reloadCallback();
      }
      
      toast.success('Booking accepted successfully!');
      return acceptedBooking || responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to accept booking';
      dispatch(updateBookingStatusFailure(errorMessage));
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch, toast]);

  // Reject booking
  const rejectBooking = useCallback(async (
    bookingId: string,
    reason?: string,
    reloadCallback?: () => void
  ) => {
    dispatch(updateBookingStatusStart());
    try {
      const requestBody = reason ? { bookingId, reason } : { bookingId };
      const response = await api.post(`${API_ROUTES.BOOKINGS}/reject`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      // Handle response structure
      const responseData = response.data?.data || response.data;
      const rejectedBooking = responseData?.booking || responseData;
      
      // Update status in Redux store
      const finalBookingId = rejectedBooking?.id || rejectedBooking?.bookingId || bookingId;
      dispatch(updateBookingStatusSuccess({ bookingId: finalBookingId, status: 'rejected' }));
      
      // Reload bookings from database via callback to ensure we have the latest data
      if (reloadCallback) {
        reloadCallback();
      }
      
      toast.success('Booking rejected successfully!');
      return rejectedBooking || responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to reject booking';
      dispatch(updateBookingStatusFailure(errorMessage));
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch, toast]);

  // Cancel booking
  const cancelBooking = useCallback(async (
    cancelData: CancelType,
    reloadCallback?: () => void
  ) => {
    try {
      const response = await api.post(`${API_ROUTES.BOOKINGS}/${cancelData.bookingId}/cancel`, cancelData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      // Handle response structure
      const responseData = response.data?.data || response.data;
      const cancelledBooking = responseData?.booking || responseData;
      
      // Update status in Redux store
      const finalBookingId = cancelledBooking?.id || cancelledBooking?.bookingId || cancelData.bookingId;
      dispatch(updateBookingStatusSuccess({ bookingId: finalBookingId, status: 'cancelled' }));
      
      // Reload bookings from database via callback to ensure we have the latest data
      if (reloadCallback) {
        reloadCallback();
      }
      
      toast.success('Booking cancelled successfully!');
      return cancelledBooking || responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to cancel booking';
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch]);

  // Reschedule booking
  const rescheduleBooking = useCallback(async (rescheduleData: RescheduleType) => {
    try {
      const response = await api.post(`${API_ROUTES.BOOKINGS}/${rescheduleData.bookingId}/reschedule`, rescheduleData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      // Fetch updated booking data
      await fetchBookingById(rescheduleData.bookingId);
      toast.success('Booking rescheduled successfully!');
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to reschedule booking';
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch, fetchBookingById]);

  // Check availability
  const checkAvailability = useCallback(async (searchData: AvailabilitySearchType) => {
    dispatch(checkAvailabilityStart());
    try {
      const response = await api.post('/availability/check', searchData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const availabilityData = response.data?.data || response.data;
      dispatch(checkAvailabilitySuccess(availabilityData));
      return availabilityData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to check availability';
      dispatch(checkAvailabilityFailure(errorMessage));
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch]);

  // Process payment
  const processPayment = useCallback(async (bookingId: string, paymentData: any) => {
    try {
      const response = await api.post(`${API_ROUTES.BOOKINGS}/${bookingId}/payment`, paymentData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      // Update booking status to confirmed after payment
      dispatch(updateBookingStatusSuccess({ bookingId, status: 'confirmed' }));
      toast.success('Payment processed successfully!');
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to process payment';
      toast.error(errorMessage);
      throw err;
    }
  }, [dispatch]);

  // Submit vendor quote for requirement
  const submitVendorQuote = useCallback(async (requirementId: string, quoteData: any) => {
    try {
      const response = await api.post(`${API_ROUTES.BOOKINGS}/requirements/${requirementId}/quotes`, quoteData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.data?.data || response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to submit quote';
      throw new Error(errorMessage);
    }
  }, []);

  // Submit vendor offer for booking
  const submitVendorOffer = useCallback(async (bookingId: string, offerData: any) => {
    try {
      // Get current user ID to add to offer
      const userData = getUserDataFromStorage();
      // Try multiple possible field names for user ID
      const offerAddedBy = userData?.id || userData?._id || userData?.userId || userData?.user_id || (userData as any)?.user?.id || (userData as any)?.user?._id || null;

      // Debug logging


      // Prepare payload with offerAddedBy
      const payload = {
        ...offerData,
        offerAddedBy: offerAddedBy,
      };

      // Debug logging

      // Use the correct endpoint: /booking/{bookingId}/vendor-offer
      const response = await api.post(`${API_ROUTES.BOOKINGS}/${bookingId}/vendor-offer`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const offerResponse = response.data?.data || response.data;
      toast.success('Offer submitted successfully!');
      return offerResponse;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to submit offer';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [toast]);

  // Get booking offers - accessible to all users
  const getBookingOffers = useCallback(async (bookingId: string) => {
    try {
      const response = await api.get(`${API_ROUTES.BOOKINGS}/${bookingId}/offers`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Handle both single offer and array of offers
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // If single offer, return as array
        return [data];
      }
      return [];
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch offers';

      // Return empty array on error (endpoint should be accessible to all users)
      return [];
    }
  }, []);

  // Accept vendor offer
  const acceptVendorOffer = useCallback(async (bookingId: string, offerId: string) => {
    try {
      const response = await api.post(`${API_ROUTES.BOOKINGS}/${bookingId}/offers/${offerId}/accept`, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const responseData = response.data?.data || response.data;
      toast.success('Offer accepted successfully!');
      return responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to accept offer';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [toast]);

  // Update vendor offer
  const updateVendorOffer = useCallback(async (bookingId: string, offerId: string, offerData: any) => {
    try {
      // Get current user ID to add to offer
      const userData = getUserDataFromStorage();
      // Try multiple possible field names for user ID
      const offerAddedBy = userData?.id || userData?._id || userData?.userId || userData?.user_id || (userData as any)?.user?.id || (userData as any)?.user?._id || null;

      // Prepare payload with offerAddedBy
      const payload = {
        ...offerData,
        offerAddedBy: offerAddedBy,
      };

      // Try vendor-offer endpoint first, fallback to offers
      let response;
      try {
        // Try PUT on vendor-offer endpoint (might be PUT /vendor-offer or PUT /vendor-offer/:id)
        response = await api.put(`${API_ROUTES.BOOKINGS}/${bookingId}/vendor-offer`, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      } catch (err: any) {
        // Fallback to old endpoint
        response = await api.put(`${API_ROUTES.BOOKINGS}/${bookingId}/offers/${offerId}`, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }

      const offerResponse = response.data?.data || response.data;
      toast.success('Offer updated successfully!');
      return offerResponse;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update offer';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [toast]);

  // Get vendor requirements
  const getVendorRequirements = useCallback(async (page = 1, limit = 10, filters = {}) => {
    try {
      const params: any = {
        page,
        limit,
        ...filters,
      };
      
      const response = await api.get(`${API_ROUTES.BOOKINGS}/requirements`, {
        params,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.data?.data || response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch requirements';
      throw new Error(errorMessage);
    }
  }, []);

  // Submit quotation
  const submitQuotation = useCallback(async (quotationData: any) => {
    try {
      const response = await api.post(`${API_ROUTES.QUOTATIONS}`, quotationData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const quotationResponse = response.data?.data || response.data;
      toast.success('Quotation submitted successfully!');
      return quotationResponse;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to submit quotation';
      toast.error(errorMessage);
      throw err;
    }
  }, [toast]);

  // Get quotations list
  const getQuotationsList = useCallback(async (page = 1, limit = 100, searchQuery = '', filters = {}) => {
    try {
      const params: any = {
        page,
        limit,
        search: searchQuery,
        ...filters,
      };
      
      const response = await api.get(`${API_ROUTES.QUOTATIONS}`, {
        params,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.data?.data || response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch quotations';
      toast.error(errorMessage);
      throw err;
    }
  }, [toast]);

  // Approve quotation (similar to accept booking)
  const approveQuotation = useCallback(async (
    quotationId: string,
    notes?: string,
    reloadCallback?: () => void
  ) => {
    try {
      const requestBody: any = { quotationId };
      if (notes) requestBody.notes = notes;
      
      const response = await api.put(`${API_ROUTES.QUOTATIONS}/${quotationId}`, {
        status: 'approved',
        ...requestBody
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const responseData = response.data?.data || response.data;
      
      if (reloadCallback) {
        reloadCallback();
      }
      
      toast.success('Quotation approved successfully!');
      return responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to approve quotation';
      toast.error(errorMessage);
      throw err;
    }
  }, [toast]);

  // Reject quotation (similar to reject booking)
  const rejectQuotation = useCallback(async (
    quotationId: string,
    reason?: string,
    reloadCallback?: () => void
  ) => {
    try {
      const requestBody: any = { quotationId };
      if (reason) requestBody.reason = reason;
      
      const response = await api.put(`${API_ROUTES.QUOTATIONS}/${quotationId}`, {
        status: 'rejected',
        ...requestBody
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const responseData = response.data?.data || response.data;
      
      if (reloadCallback) {
        reloadCallback();
      }
      
      toast.success('Quotation rejected successfully!');
      return responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to reject quotation';
      toast.error(errorMessage);
      throw err;
    }
  }, [toast]);

  // Update quotation status
  const updateQuotationStatus = useCallback(async (
    quotationId: string,
    status: string,
    notes?: string,
    reloadCallback?: () => void
  ) => {
    try {
      const requestBody: any = { status };
      if (notes) requestBody.notes = notes;
      
      const response = await api.put(`${API_ROUTES.QUOTATIONS}/${quotationId}`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const responseData = response.data?.data || response.data;
      
      if (reloadCallback) {
        reloadCallback();
      }
      
      toast.success(`Quotation ${status} successfully!`);
      return responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || `Failed to ${status} quotation`;
      toast.error(errorMessage);
      throw err;
    }
  }, [toast]);

  return {
    getBookingList,
    fetchBookingById,
    addBooking,
    updateBooking,
    removeBooking,
    updateBookingStatus,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    rescheduleBooking,
    checkAvailability,
    processPayment,
    submitVendorQuote,
    getVendorRequirements,
    submitQuotation,
    getQuotationsList,
    approveQuotation,
    rejectQuotation,
    updateQuotationStatus,
    submitVendorOffer,
    getBookingOffers,
    acceptVendorOffer,
    updateVendorOffer,
  };
}