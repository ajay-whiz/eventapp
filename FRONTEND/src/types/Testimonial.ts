export interface Testimonial {
  id: string;
  name: string;
  designation: string;
  message: string;
  avatarUrl?: string;
  rating: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
