import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Testimonial } from '../../../types/Testimonial';

interface TestimonialState {
  testimonials: Testimonial[];
  selectedTestimonial: Testimonial | null;
  loading: boolean;
  formLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: TestimonialState = {
  testimonials: [],
  selectedTestimonial: null,
  loading: false,
  formLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

export const testimonialSlice = createSlice({
  name: 'testimonial',
  initialState,
  reducers: {
    fetchTestimonialsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchTestimonialsSuccess(
      state,
      action: PayloadAction<{
        testimonials: Testimonial[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>,
    ) {
      state.loading = false;
      state.testimonials = action.payload.testimonials;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchTestimonialsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addTestimonialStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    addTestimonialSuccess(state, action: PayloadAction<Testimonial>) {
      state.formLoading = false;
      state.testimonials.push(action.payload);
    },
    addTestimonialFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    removeTestimonialStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    removeTestimonialSuccess(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.testimonials = state.testimonials.filter(
        (testimonial) => testimonial.id !== action.payload,
      );
    },
    removeTestimonialFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    updateTestimonialStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    updateTestimonialSuccess(state, action: PayloadAction<Testimonial>) {
      state.formLoading = false;
      state.testimonials = state.testimonials.map((testimonial) =>
        testimonial.id === action.payload.id ? action.payload : testimonial,
      );
    },
    updateTestimonialFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    fetchTestimonialByIdStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchTestimonialByIdSuccess(state, action: PayloadAction<Testimonial>) {
      state.loading = false;
      state.selectedTestimonial = action.payload;
    },
    fetchTestimonialByIdFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
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
} = testimonialSlice.actions;
