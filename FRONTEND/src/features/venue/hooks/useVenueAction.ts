import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import api from '../../../axios';
import { addVenueStart, addVenueSuccess, addVenueFailure, fetchVenueStart, fetchVenueSuccess, fetchVenueFailure, removeVenueStart, updateVenueSuccess, fetchVenueByIdStart, updateVenueFailure, updateVenueStart, removeVenueSuccess, removeVenueFailure, fetchVenueByIdSuccess, fetchVenueByIdFailure } from '../slices/venueSlice';
import { useToast } from '../../../components/atoms/Toast';
import { CONSTANT } from '../../../constants/constant';
import { useNavigate } from 'react-router-dom';
import { ROUTING } from '../../../constants/routes';

export function useVenueActions() {
  const toast = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const getVenueList = useCallback(
    async (page = 1, limit = 10, searchQuery = '') => {
      dispatch(fetchVenueStart());
      try {
        const response = await api.get('venues', {
          params: {
            name: searchQuery,
            page,
            limit,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        // Destructure response if backend format is { data: { data, pagination } }
        const { data, pagination } = response.data.data;

        dispatch(fetchVenueSuccess({ venues: data, pagination }));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to fetch venues';
        dispatch(fetchVenueFailure(errorMessage));
      }
    }, [dispatch]
  );

  const removeVenue = useCallback(async (id: string) => {
    dispatch(removeVenueStart());
    try {
      await api.delete(`venues/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      dispatch(removeVenueSuccess(id));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete venue';
      dispatch(removeVenueFailure(errorMessage));
    }
  }, [dispatch]);

  const updateVenue = useCallback(async (id: string, data: any) => {
    dispatch(updateVenueStart());
    try {
      // Determine if we're sending FormData (for binary uploads) or JSON
      const isFormData = data instanceof FormData;
      
      await api.patch(`venues/${id}`, data, {
        headers: {
          'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      dispatch(updateVenueSuccess({ id, data }));
      toast.success(CONSTANT.Update_venue)
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update venue';
      dispatch(updateVenueFailure(errorMessage));
      toast.error(errorMessage);
    }
  }, [dispatch]);

  const fetchVenueById = useCallback(async (id: string) => {
    dispatch(fetchVenueByIdStart());
    try {
      const response = await api.get(`venues/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      dispatch(fetchVenueByIdSuccess(response.data.data));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch venue';
      dispatch(fetchVenueByIdFailure(errorMessage));
    }
  }, [dispatch]);

  const addVenue = useCallback(async (formData: any) => {
    dispatch(addVenueStart());
    try {
      // Determine if we're sending FormData (for binary uploads) or JSON
      const isFormData = formData instanceof FormData;
      
      await api.post('venues', formData, {
        headers: {
          'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      dispatch(addVenueSuccess());
      toast.success(CONSTANT.Add_venue);
       navigate(ROUTING.VENUE_MANAGEMENT);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials';
      toast.error(errorMessage);
      dispatch(addVenueFailure(errorMessage));
    }
  }, [dispatch]);

  const getServiceCategories = useCallback(async () => {
    try {
      const response = await api.get('venue-category?page=1&limit=100', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response?.data?.data?.data || [];
    } catch (error) {
      console.error('Error fetching venue categories:', error);
      return [];
    }
  }, []);

  const getDynamicFormByCategory = useCallback(async (categoryId: string) => {
    try {
      console.log('Fetching dynamic form for service category (venue):', categoryId);
      // Add type=venue query parameter to differentiate from vendor
      const response = await api.get(`service-category/user/${categoryId}?type=venue`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Service category API response:', response.data);
      
      // Handle different response structures: form, formData, or vendorCategory.form
      const form = response?.data?.data?.form || 
                   response?.data?.data?.formData || 
                   response?.data?.data?.vendorCategory?.form ||
                   response?.data?.data?.form;
      
      if (form && form.fields) {
        console.log('Form data from API:', form);
        
        // Map the form fields to include label and options properties
        const mappedFields = form.fields?.map((field: any) => ({
          ...field,
          label: field.metadata?.label || field.name,
          // Map metadata.options to field.options for select/dropdown fields
          options: field.metadata?.options 
            ? field.metadata.options.map((option: string) => ({
                label: option,
                value: option
              }))
            : field.options || []
        })) || [];
        
        const mappedForm = {
          ...form,
          fields: mappedFields
        };
        
        console.log('Mapped form data:', mappedForm);
        return mappedForm;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching dynamic form:', error);
      return null;
    }
  }, []);

  return { addVenue, getVenueList, removeVenue, updateVenue, fetchVenueById, getServiceCategories, getDynamicFormByCategory };
}