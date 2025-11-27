import { useAppSelector } from '../redux/store';

export function useAuth() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated;
}
