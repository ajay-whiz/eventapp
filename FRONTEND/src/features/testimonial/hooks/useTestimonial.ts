import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';

export const useTestimonial = () => {
  return useSelector((state: RootState) => state.testimonial);
};
