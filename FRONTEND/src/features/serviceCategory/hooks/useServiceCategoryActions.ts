import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import api from '../../../axios';
import {
  fetchCategoriesStart,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
  addCategoryStart,
  addCategorySuccess,
  addCategoryFailure,
  removeCategoryStart,
  removeCategorySuccess,
  removeCategoryFailure,
  updateCategoryStart,
  updateCategorySuccess,
  updateCategoryFailure,
  fetchCategoryByIdStart,
  fetchCategoryByIdSuccess,
  fetchCategoryByIdFailure,
  // Form inputs actions
  fetchFormInputsStart,
  fetchFormInputsSuccess,
  fetchFormInputsFailure,
  addFormInputStart,
  addFormInputSuccess,
  addFormInputFailure,
  updateFormInputStart,
  updateFormInputSuccess,
  updateFormInputFailure,
  removeFormInputStart,
  removeFormInputSuccess,
  removeFormInputFailure,
} from '../slices/ServiceCategorySlice';
import { API_ROUTES } from '../../../constants/routes';
import { updateServiceCategoryStatusFailure, updateServiceCategoryStatusSuccess } from '../slices/ServiceCategorySlice';

export function useServiceCategoryActions() {
  const dispatch = useDispatch();

  const getCategoryList = useCallback(
    async (page = 1, limit = 10, searchQuery = '') => {
      dispatch(fetchCategoriesStart());
      try {
        const response = await api.get(API_ROUTES.GET_ALL_CATEGORIES, {
          params: {
            search: searchQuery, 
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
  
        dispatch(fetchCategoriesSuccess({ categories: data, pagination }));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to fetch categories';
        dispatch(fetchCategoriesFailure(errorMessage));
      }
    },
    [dispatch]
  );
  

  const removeCategory = useCallback(async (id: string) => {
    dispatch(removeCategoryStart());
    try {
      await api.delete(`${API_ROUTES.GET_ALL_CATEGORIES}/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      dispatch(removeCategorySuccess(id));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        'Failed to remove category';
      dispatch(removeCategoryFailure(errorMessage));
      throw err;
    }
  }, [dispatch]);

  const addCategory = useCallback(async (
    name: string,
    description: string,
    formId?: string,
  ) => {
    dispatch(addCategoryStart());
    const requestData = { name, description, formId };





    console.log('JSON.stringify(requestData):', JSON.stringify(requestData));

    try {
      const response = await api.post(
        API_ROUTES.GET_ALL_CATEGORIES,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      dispatch(addCategorySuccess(response.data.data || response.data));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        'Failed to add category';
      dispatch(addCategoryFailure(errorMessage));
      throw err;
    }
  }, [dispatch]);
  
    const updateCategory = useCallback(async (
    id: string,
    name: string,
    description: string,
    formId?: string,
  ) => {
    dispatch(updateCategoryStart());
    const requestData = { name, description, formId };
     // Debug log
    try {
      const response = await api.put(
        `${API_ROUTES.GET_ALL_CATEGORIES}/${id}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        }
      );
       // Debug log
      dispatch(updateCategorySuccess(response.data.data || response.data));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        'Failed to update category';
      dispatch(updateCategoryFailure(errorMessage));
      throw err;
    }
  }, [dispatch]);
  

  const fetchCategoryById = useCallback(async (_id: string) => {
    dispatch(fetchCategoryByIdStart());
    try {
      const response = await api.get(`${API_ROUTES.GET_ALL_CATEGORIES}/${_id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      dispatch(fetchCategoryByIdSuccess(response.data.data));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch feature';
      dispatch(fetchCategoryByIdFailure(errorMessage));
    }
  }, [dispatch]);

  const updateServiceCategoryStatus = useCallback(async (id: string, status: any) => {
    dispatch(updateCategoryStart());
    try {
      const response = await api.patch(`${API_ROUTES.GET_ALL_CATEGORIES}/${id}/status`, status, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      dispatch(updateServiceCategoryStatusSuccess(response.data.data));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        'Failed to update vendor category status';
      dispatch(updateServiceCategoryStatusFailure(errorMessage));
      throw err;
    }
  }, [dispatch]);

  const getFormsList = useCallback(async () => {
    try {
      const response = await api.get(API_ROUTES.GET_ALL_FORMS, {
        params: {
          page: 1,
          limit: 100,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
       // Debug log
      return response.data?.data?.data || [];
    } catch (err: any) {

      return [];
    }
  }, []);

  const getFormInputLabels = useCallback(
    async (category?: string): Promise<string[]> => {
      try {
        const response = await api.get(
          `${API_ROUTES.SERVICE_CATEGORY_FORM_INPUTS}/label`,
          {
            params: category ? { category } : undefined,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const payload = response?.data;
        const list = Array.isArray(payload?.data) ? payload.data : payload;
        return Array.isArray(list) ? (list as string[]) : [];
      } catch (err) {
        return [];
      }
    },
    []
  );

  // Service Category Form Inputs: GET list by categoryId
  const getServiceCategoryFormInputs = useCallback(
    async (categoryId: string, page = 1, limit = 10, searchQuery = '') => {
      dispatch(fetchFormInputsStart());
      try {
        const response = await api.get(API_ROUTES.SERVICE_CATEGORY_FORM_INPUTS, {
          params: { categoryId, page, limit, search: searchQuery },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const payload = response?.data;
        const inner = payload?.data;

        let items: any[] = [];
        let pagination = { total: 0, page, limit, totalPages: 0 } as { total: number; page: number; limit: number; totalPages: number };

        if (Array.isArray(inner)) {
          // Shape: { status: 'OK', data: [ ... ] }
          items = inner;
          pagination = { total: inner.length, page, limit, totalPages: Math.ceil(inner.length / limit) };
        } else if (inner && Array.isArray(inner.data)) {
          // Shape: { data: { data: [ ... ], pagination } }
          items = inner.data;
          pagination = inner.pagination ?? pagination;
        } else if (Array.isArray(payload)) {
          // Shape: [ ... ]
          items = payload;
          pagination = { total: payload.length, page, limit, totalPages: Math.ceil(payload.length / limit) };
        } else {
          const maybe = (inner as any)?.items;
          if (Array.isArray(maybe)) {
            items = maybe;
            pagination = (inner as any)?.pagination ?? pagination;
          }
        }

        dispatch(fetchFormInputsSuccess({ items, pagination }));
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch form inputs';
        dispatch(fetchFormInputsFailure(errorMessage));
      }
    },
    [dispatch]
  );

  // Service Category Form Inputs: CREATE
  const addServiceCategoryFormInput = useCallback(
    async (payload: { categoryId: string; label: string; active : boolean; required?: boolean; minrange?: number; maxrange?: number; }) => {
      dispatch(addFormInputStart());
      try {
        const response = await api.post(API_ROUTES.SERVICE_CATEGORY_FORM_INPUTS, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const created = response.data.data || response.data;
        dispatch(addFormInputSuccess(created));
        return created;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to add form input';
        dispatch(addFormInputFailure(errorMessage));
        throw err;
      }
    },
    [dispatch]
  );

  // Service Category Form Inputs: UPDATE
  const updateServiceCategoryFormInput = useCallback(
    async (id: string, payload: { label?: string; active ?: boolean; required?: boolean; minrange?: number; maxrange?: number; }) => {
      dispatch(updateFormInputStart());
      try {
        const response = await api.patch(`${API_ROUTES.SERVICE_CATEGORY_FORM_INPUTS}/${id}`, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const updated = response.data.data || response.data;
        dispatch(updateFormInputSuccess(updated));
        return updated;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to update form input';
        dispatch(updateFormInputFailure(errorMessage));
        throw err;
      }
    },
    [dispatch]
  );

  // Service Category Form Inputs: DELETE
  const removeServiceCategoryFormInput = useCallback(
    async (id: string) => {
      dispatch(removeFormInputStart());
      try {
        await api.delete(`${API_ROUTES.SERVICE_CATEGORY_FORM_INPUTS}/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        dispatch(removeFormInputSuccess(id));
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete form input';
        dispatch(removeFormInputFailure(errorMessage));
        throw err;
      }
    },
    [dispatch]
  );

  const getServiceCategoryFormInputById = useCallback(async (id: string) => {
    const response = await api.get(`${API_ROUTES.SERVICE_CATEGORY_FORM_INPUTS}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data?.data || response.data;
  }, []);

  return {
    getCategoryList,
    addCategory,
    removeCategory,
    updateCategory,
    fetchCategoryById,
    updateServiceCategoryStatus,
    getFormsList,
    getFormInputLabels,

    getServiceCategoryFormInputs,
    addServiceCategoryFormInput,
    updateServiceCategoryFormInput,
    removeServiceCategoryFormInput,
    getServiceCategoryFormInputById,
  };
}
