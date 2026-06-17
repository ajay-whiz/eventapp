import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { VenueCategory } from '../../../types/VenueCategory';

interface VenueCategoryState {
  categories: VenueCategory[];
  selectedCategory: VenueCategory | null;
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

const initialState: VenueCategoryState = {
  selectedCategory: null,
  categories: [],
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

export const venueCategorySlice = createSlice({
  name: 'venueCategory',
  initialState,
  reducers: {
    fetchVenueCategoriesStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchVenueCategoriesSuccess(
      state,
      action: PayloadAction<{
        categories: VenueCategory[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>,
    ) {
      state.loading = false;
      state.categories = action.payload.categories;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
    fetchVenueCategoriesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addVenueCategoryStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    addVenueCategorySuccess(state, action: PayloadAction<VenueCategory>) {
      state.formLoading = false;
      state.categories.push(action.payload);
    },
    addVenueCategoryFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    removeVenueCategoryStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    removeVenueCategorySuccess(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.categories = state.categories.filter((c) => c.id !== action.payload);
    },
    removeVenueCategoryFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    updateVenueCategoryStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    updateVenueCategorySuccess(state, action: PayloadAction<VenueCategory>) {
      state.formLoading = false;
      state.categories = state.categories.map((c) =>
        c.id === action.payload.id ? action.payload : c,
      );
    },
    updateVenueCategoryFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    fetchVenueCategoryByIdStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchVenueCategoryByIdSuccess(state, action: PayloadAction<VenueCategory>) {
      state.loading = false;
      state.selectedCategory = action.payload;
    },
    fetchVenueCategoryByIdFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateVenueCategoryStatusFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    updateVenueCategoryStatusSuccess(state) {
      state.formLoading = false;
      state.error = null;
    },
  },
});

export const {
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
} = venueCategorySlice.actions;
