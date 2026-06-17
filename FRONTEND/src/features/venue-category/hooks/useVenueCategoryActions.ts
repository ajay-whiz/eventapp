import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import api from '../../../axios';
import { API_ROUTES } from '../../../constants/routes';
import {
  fetchVenueCategoriesStart,
  fetchVenueCategoriesSuccess,
  fetchVenueCategoriesFailure,
  addVenueCategoryStart,
  addVenueCategorySuccess,
  addVenueCategoryFailure,
  removeVenueCategoryStart,
  removeVenueCategorySuccess,
  removeVenueCategoryFailure,
  updateVenueCategoryStart,
  updateVenueCategorySuccess,
  updateVenueCategoryFailure,
  fetchVenueCategoryByIdStart,
  fetchVenueCategoryByIdSuccess,
  fetchVenueCategoryByIdFailure,
  updateVenueCategoryStatusFailure,
  updateVenueCategoryStatusSuccess,
} from '../slices/venueCategorySlice';

export function useVenueCategoryActions() {
  const dispatch = useDispatch();

  const getCategoryList = useCallback(
    async (page = 1, limit = 10, searchQuery = '') => {
      dispatch(fetchVenueCategoriesStart());
      try {
        const response = await api.get(API_ROUTES.VENUE_CATEGORIES, {
          params: { search: searchQuery, page, limit },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const { data, pagination } = response.data.data;
        dispatch(fetchVenueCategoriesSuccess({ categories: data, pagination }));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to fetch venue categories';
        dispatch(fetchVenueCategoriesFailure(errorMessage));
      }
    },
    [dispatch],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      dispatch(removeVenueCategoryStart());
      try {
        await api.delete(`${API_ROUTES.VENUE_CATEGORIES}/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        dispatch(removeVenueCategorySuccess(id));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to remove venue category';
        dispatch(removeVenueCategoryFailure(errorMessage));
        throw err;
      }
    },
    [dispatch],
  );

  const addCategory = useCallback(
    async (name: string, description: string, formId: string) => {
      dispatch(addVenueCategoryStart());
      const requestData = { name, description, formId };
      try {
        const response = await api.post(API_ROUTES.VENUE_CATEGORIES, requestData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        dispatch(addVenueCategorySuccess(response.data.data || response.data));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to add venue category';
        dispatch(addVenueCategoryFailure(errorMessage));
        throw err;
      }
    },
    [dispatch],
  );

  const updateCategory = useCallback(
    async (id: string, name: string, description: string, formId: string) => {
      dispatch(updateVenueCategoryStart());
      const requestData = { name, description, formId };
      try {
        const response = await api.put(`${API_ROUTES.VENUE_CATEGORIES}/${id}`, requestData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        dispatch(updateVenueCategorySuccess(response.data.data || response.data));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to update venue category';
        dispatch(updateVenueCategoryFailure(errorMessage));
        throw err;
      }
    },
    [dispatch],
  );

  const fetchCategoryById = useCallback(
    async (id: string) => {
      dispatch(fetchVenueCategoryByIdStart());
      try {
        const response = await api.get(`${API_ROUTES.VENUE_CATEGORIES}/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        dispatch(fetchVenueCategoryByIdSuccess(response.data.data));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to fetch venue category';
        dispatch(fetchVenueCategoryByIdFailure(errorMessage));
        throw err;
      }
    },
    [dispatch],
  );

  const updateVenueCategoryStatus = useCallback(
    async (id: string, status: { isActive: boolean }) => {
      dispatch(updateVenueCategoryStart());
      try {
        await api.patch(`${API_ROUTES.VENUE_CATEGORIES}/${id}/status`, status, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        dispatch(updateVenueCategoryStatusSuccess());
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to update venue category status';
        dispatch(updateVenueCategoryStatusFailure(errorMessage));
        throw err;
      }
    },
    [dispatch],
  );

  const getFormsList = useCallback(async (type = 'venue-category') => {
    try {
      const response = await api.get(API_ROUTES.GET_ALL_FORMS, {
        params: { page: 1, limit: 100, type },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data?.data?.data || [];
    } catch {
      return [];
    }
  }, []);

  return {
    getCategoryList,
    addCategory,
    removeCategory,
    updateCategory,
    fetchCategoryById,
    updateVenueCategoryStatus,
    getFormsList,
  };
}
