import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ServiceCategory } from '../../../types/ServiceCategory';

interface CategoryState {
  categories: ServiceCategory[];
  selectedCategory: ServiceCategory | null;
  loading: boolean; // For list fetching (skeleton)
  formLoading: boolean; // For form operations (add/update/delete)
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  formInputs: {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    key?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    categoryId: string;
    label: string;
    type: string;
    required?: boolean;
    minrange?: number;
    maxrange?: number;
  }[];
  formInputsLoading: boolean;
  formInputsError: string | null;
  formInputsPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: CategoryState = {
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
  formInputs: [],
  formInputsLoading: false,
  formInputsError: null,
  formInputsPagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

export const serviceCategorySlice = createSlice({
  name: 'serviceCategory',
  initialState,
  reducers: {
    fetchCategoriesStart(state) {
      state.loading = true;
      state.error = null;
    },
    
    fetchCategoriesSuccess(
          state,
          action: PayloadAction<{
            categories: ServiceCategory[];
            pagination: {
              total: number;
              page: number;
              limit: number;
              totalPages: number;
            };
          }>
        ) {
          state.loading = false;
          state.categories = action.payload.categories;
          state.pagination = action.payload.pagination;
          state.error = null;
        },
    fetchCategoriesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addCategoryStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    addCategorySuccess(state, action: PayloadAction<ServiceCategory>) {
      state.formLoading = false;
      state.categories.push(action.payload);
    },
    addCategoryFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    removeCategoryStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    removeCategorySuccess(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.categories = state.categories.filter((category: ServiceCategory) => category.id !== action.payload);
    },
    removeCategoryFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    updateCategoryStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    updateCategorySuccess(state, action: PayloadAction<ServiceCategory>) {
      state.formLoading = false;
      state.categories = state.categories.map((category: ServiceCategory) =>
        category.id === action.payload.id ? action.payload : category
      );
    },
    updateCategoryFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },
    fetchCategoryByIdStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCategoryByIdSuccess(state, action: PayloadAction<ServiceCategory>) {
      state.loading = false;
      state.selectedCategory = action.payload;
    },
    fetchCategoryByIdFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateServiceCategoryStatusStart(state) {
      state.formLoading = true;
      state.error = null;
    },
    updateServiceCategoryStatusSuccess(state, action: PayloadAction<ServiceCategory>) {
      state.formLoading = false;
      state.categories = state.categories.map((category: ServiceCategory) =>
        category.id === action.payload.id ? action.payload : category
      );
    },
    updateServiceCategoryStatusFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.error = action.payload;
    },

    // Form Inputs reducers
    fetchFormInputsStart(state) {
      state.formInputsLoading = true;
      state.formInputsError = null;
    },
    fetchFormInputsSuccess(
      state,
      action: PayloadAction<{
        items: {
          id: string;
          createdAt?: string;
          updatedAt?: string;
          createdBy?: string;
          updatedBy?: string;
          key?: string;
          isActive?: boolean;
          isDeleted?: boolean;
          categoryId: string;
          label: string;
          type: string;
          required?: boolean;
          minrange?: number;
          maxrange?: number;
        }[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>
    ) {
      state.formInputsLoading = false;
      state.formInputs = action.payload.items;
      state.formInputsPagination = action.payload.pagination;
    },
    fetchFormInputsFailure(state, action: PayloadAction<string>) {
      state.formInputsLoading = false;
      state.formInputsError = action.payload;
    },

    addFormInputStart(state) {
      state.formLoading = true;
      state.formInputsError = null;
    },
    addFormInputSuccess(
      state,
      action: PayloadAction<{
        id: string;
        createdAt?: string;
        updatedAt?: string;
        createdBy?: string;
        updatedBy?: string;
        key?: string;
        isActive?: boolean;
        isDeleted?: boolean;
        categoryId: string;
        label: string;
        type: string;
        required?: boolean;
        minrange?: number;
        maxrange?: number;
      }>
    ) {
      state.formLoading = false;
      state.formInputs.unshift(action.payload);
    },
    addFormInputFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.formInputsError = action.payload;
    },

    updateFormInputStart(state) {
      state.formLoading = true;
      state.formInputsError = null;
    },
    updateFormInputSuccess(
      state,
      action: PayloadAction<{
        id: string;
        createdAt?: string;
        updatedAt?: string;
        createdBy?: string;
        updatedBy?: string;
        key?: string;
        isActive?: boolean;
        isDeleted?: boolean;
        categoryId: string;
        label: string;
        type: string;
        required?: boolean;
        minrange?: number;
        maxrange?: number;
      }>
    ) {
      state.formLoading = false;
      state.formInputs = state.formInputs.map((it) => (it.id === action.payload.id ? action.payload : it));
    },
    updateFormInputFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.formInputsError = action.payload;
    },

    removeFormInputStart(state) {
      state.formLoading = true;
      state.formInputsError = null;
    },
    removeFormInputSuccess(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.formInputs = state.formInputs.filter((it) => it.id !== action.payload);
    },
    removeFormInputFailure(state, action: PayloadAction<string>) {
      state.formLoading = false;
      state.formInputsError = action.payload;
    },
  },
});

export const { 
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
  updateServiceCategoryStatusStart, 
  updateServiceCategoryStatusSuccess, 
  updateServiceCategoryStatusFailure, 
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
  removeFormInputFailure 
} = serviceCategorySlice.actions;
