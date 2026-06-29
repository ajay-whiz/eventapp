import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import api from '../../../axios';
import {
  fetchTestimonialsStart,
  fetchTestimonialsSuccess,
  fetchTestimonialsFailure,
  addTestimonialStart,
  addTestimonialSuccess,
  addTestimonialFailure,
  removeTestimonialStart,
  removeTestimonialSuccess,
  removeTestimonialFailure,
  updateTestimonialStart,
  updateTestimonialSuccess,
  updateTestimonialFailure,
  fetchTestimonialByIdStart,
  fetchTestimonialByIdSuccess,
  fetchTestimonialByIdFailure,
} from '../slices/testimonialSlice';
import { API_ROUTES } from '../../../constants/routes';
import { normalizeTestimonial } from '../utils/normalizeTestimonial';
import type { TestimonialSchemaType } from '../schemas/testimonial.schema';

const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export function useTestimonialActions() {
  const dispatch = useDispatch();

  const getTestimonialList = useCallback(
    async (
      page = 1,
      limit = 10,
      searchQuery = '',
      sortBy = 'createdAt',
      sortOrder: 'asc' | 'desc' = 'desc',
    ) => {
      dispatch(fetchTestimonialsStart());
      try {
        const response = await api.get(API_ROUTES.TESTIMONIALS, {
          params: {
            page,
            limit,
            search: searchQuery,
            sortBy,
            sortOrder,
          },
          headers: getApiHeaders(),
        });

        const payload = response.data.data;
        const rawList = Array.isArray(payload?.data) ? payload.data : [];
        const testimonials = rawList
          .map((item: unknown) => normalizeTestimonial(item))
          .filter(Boolean);

        const total = payload?.total ?? 0;
        const currentLimit = payload?.limit ?? limit;

        dispatch(
          fetchTestimonialsSuccess({
            testimonials: testimonials as NonNullable<ReturnType<typeof normalizeTestimonial>>[],
            pagination: {
              total,
              page: payload?.page ?? page,
              limit: currentLimit,
              totalPages: currentLimit > 0 ? Math.ceil(total / currentLimit) : 0,
            },
          }),
        );
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to fetch testimonials';
        dispatch(fetchTestimonialsFailure(errorMessage));
      }
    },
    [dispatch],
  );

  const removeTestimonial = useCallback(
    async (id: string) => {
      dispatch(removeTestimonialStart());
      try {
        await api.delete(`${API_ROUTES.TESTIMONIALS}/${id}`, {
          headers: getApiHeaders(),
        });
        dispatch(removeTestimonialSuccess(id));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Delete failed';
        dispatch(removeTestimonialFailure(errorMessage));
        throw err;
      }
    },
    [dispatch],
  );

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('files/upload?folder=images', formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data.data;
    return data?.imageUrl || data?.url || '';
  }, []);

  const addTestimonial = useCallback(
    async (payload: TestimonialSchemaType) => {
      dispatch(addTestimonialStart());
      try {
        const response = await api.post(API_ROUTES.TESTIMONIALS, payload, {
          headers: getApiHeaders(),
        });

        const normalized = normalizeTestimonial(response.data.data);
        if (normalized) {
          dispatch(addTestimonialSuccess(normalized));
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Add failed';
        dispatch(addTestimonialFailure(errorMessage));
        throw err;
      }
    },
    [dispatch],
  );

  const updateTestimonial = useCallback(
    async (id: string, payload: TestimonialSchemaType) => {
      dispatch(updateTestimonialStart());
      try {
        const response = await api.put(`${API_ROUTES.TESTIMONIALS}/${id}`, payload, {
          headers: getApiHeaders(),
        });

        const normalized = normalizeTestimonial(response.data.data);
        if (normalized) {
          dispatch(updateTestimonialSuccess(normalized));
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Update failed';
        dispatch(updateTestimonialFailure(errorMessage));
        throw err;
      }
    },
    [dispatch],
  );

  const fetchTestimonialById = useCallback(
    async (id: string) => {
      dispatch(fetchTestimonialByIdStart());

      try {
        const response = await api.get(`${API_ROUTES.TESTIMONIALS}/${id}`, {
          headers: getApiHeaders(),
        });

        dispatch(
          fetchTestimonialByIdSuccess(
            normalizeTestimonial(response.data.data) || response.data.data,
          ),
        );
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to fetch testimonial';
        dispatch(fetchTestimonialByIdFailure(errorMessage));
      }
    },
    [dispatch],
  );

  return {
    getTestimonialList,
    removeTestimonial,
    addTestimonial,
    updateTestimonial,
    fetchTestimonialById,
    uploadAvatar,
  };
}
