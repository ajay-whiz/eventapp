import { useSelector, shallowEqual } from 'react-redux';
import type { RootState } from '../../../redux/store';

export function useVenueCategory() {
  return useSelector(
    (state: RootState) => ({
      categories: state.venueCategories.categories,
      selectedCategory: state.venueCategories.selectedCategory,
      loading: state.venueCategories.loading,
      formLoading: state.venueCategories.formLoading,
      error: state.venueCategories.error,
      pagination: state.venueCategories.pagination,
    }),
    shallowEqual,
  );
}
