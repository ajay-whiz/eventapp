import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import api from '../../../axios';
import { loginStart, loginSuccess, loginFailure, logout, fetchProfileStart, fetchProfileSuccess, fetchProfileFailure, changePasswordStart, changePasswordSuccess, changePasswordFailure, fileUploadStart, fileUploadSuccess, fileUploadFailure } from '../slices/authSlice';
import type { UpdateProfileSchemaType } from '../schemas/login.schema';
import { API_ROUTES } from '../../../constants/routes';

export function useAuthActions() {
  const dispatch = useDispatch();

  const login = useCallback(async (email: string, password: string) => {
    dispatch(loginStart());
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (email.trim() === '' || password.trim() === '') {
        throw new Error('Email and password cannot be empty');
      }
      
      const requestData = {
        email: email.trim(),
        password: password.trim(),
      };
      
      // Debug: Log the full URL being constructed
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Full URL will be:', `${api.defaults.baseURL}auth/login`);
      
      // Make a POST request to your authentication endpoint using axios
      const response = await api.post('auth/login', requestData, {
        headers: {
          'Content-Type': 'application/json',
          // Add any additional headers if required, e.g., Authorization, etc.
        }
      });


      // Assume the API returns a token or user info in response.data
      const token = response.data.data.accessToken; // Adjust according to your API response
      const userData = response.data.data; // Full user data from login response
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      // Dispatch success action with both token and user data
      dispatch(loginSuccess({ token, user: userData }));
    } catch (err: any) {
      // Handle errors (network issues, invalid credentials, etc.)
      // Axios error messages can be in err.response?.data?.message
      console.error('Login error:', err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials';
      dispatch(loginFailure(errorMessage));
    }
  }, [dispatch]);

  const signOut = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const sendResetLink = useCallback(async (email: string) => {
    dispatch(loginStart());
    try {
      const response = await api.post('auth/forgot-password', {
        email,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Forgot password doesn't log the user in, just sends a reset link
      // Reset loading state (using loginFailure with empty string to reset loading without showing error)
      dispatch(loginFailure(''));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials';
      dispatch(loginFailure(errorMessage));
    }
  }, [dispatch]);

  const resetPassword = useCallback(async (newPassword: string, token: string) => {
    dispatch(loginStart());
    try {
      const response = await api.post('auth/reset-password', {
        newPassword,
        token,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Check if the response indicates success
      const isSuccess = response.data?.status === 'OK' || 
                       response.data?.data?.message?.toLowerCase().includes('success') ||
                       response.status === 200;
      
      if (isSuccess) {
        // Password reset successful - check if token/user data is returned
        const userData = response.data.data?.user || null;
        const accessToken = response.data.data?.accessToken || response.data.data?.token || null;
        
        // If token is provided, log the user in automatically
        if (accessToken && userData) {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('user', JSON.stringify(userData));
          dispatch(loginSuccess({ token: accessToken, user: userData }));
          return { success: true, message: response.data?.data?.message || 'Password reset successful', autoLogin: true };
        } else {
          // Password reset successful but no auto-login - clear loading state without error
          // Reset loading state by dispatching loginFailure with empty string (which clears error)
          dispatch(loginFailure('')); 
          // Return success indicator
          return { success: true, message: response.data?.data?.message || 'Password reset successful', autoLogin: false };
        }
      } else {
        dispatch(loginFailure('Password reset failed. Please try again.'));
        throw new Error('Password reset failed. Please try again.');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.data?.message ||
        err.message ||
        'Failed to reset password';
      dispatch(loginFailure(errorMessage));
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  const updateProfile = useCallback(async (data: UpdateProfileSchemaType, _id: string) => {
    dispatch(loginStart());
    try {
      const response = await api.put(`${API_ROUTES.UPDATE_PROFILE}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      // Update localStorage with new profile data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        countryCode: data.countryCode,
        phoneNumber: data.phoneNumber,
        organizationName: data.organizationName,
        profileImage: data.profileImage,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Trigger custom event to notify useUser hook
      window.dispatchEvent(new Event('userUpdated'));
      
      // Dispatch success with updated user data
      const token = localStorage.getItem('token') || '';
      dispatch(loginSuccess({ token, user: updatedUser }));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials';
      dispatch(loginFailure(errorMessage));
    }
  }, [dispatch]);

  const fetchProfile = useCallback(async (_id: string) => {
    dispatch(fetchProfileStart());
  
    try {
      const response = await api.get(`${API_ROUTES.GET_PROFILE}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
  
     dispatch(fetchProfileSuccess(response.data.data));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch user';
      dispatch(fetchProfileFailure(errorMessage));
    }
  }, [dispatch]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    dispatch(changePasswordStart());
    try {
      const response = await api.put(`${API_ROUTES.CHANGE_PASSWORD}`, {
        currentPassword,
        newPassword,
        confirmPassword,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      dispatch(changePasswordSuccess(response.data.data.accessToken));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials';
      dispatch(changePasswordFailure(errorMessage));
    }
  }, [dispatch]);

  const updateProfileImage = useCallback(async (file: File): Promise<string> => {
    dispatch(fileUploadStart());
  
    try {
      // Validate file before upload
      if (!file) {
        throw new Error('No file provided');
      }
      
      // Check file size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.');
      }
      
      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await api.post(`${API_ROUTES.UPDATE_PROFILE_IMAGE}`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const fileUrl = response.data.data;
      
      if (!fileUrl) throw new Error('File URL not returned');

      // Ensure fileUrl is a string
      const imageUrlString = typeof fileUrl === 'string' ? fileUrl : String(fileUrl);

      // Update localStorage with new profile image
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        profileImage: imageUrlString,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Don't trigger userUpdated event to prevent profile refetch that causes form reset
      // window.dispatchEvent(new Event('userUpdated'));

      dispatch(fileUploadSuccess(imageUrlString));
      return imageUrlString;
  
    } catch (err: any) {
      console.error('Profile image upload error:', err);
      
      let errorMessage = 'Image upload failed';
      
      if (err.response?.status === 500) {
        errorMessage = 'Server error during image upload. Please try again or contact support.';
      } else if (err.response?.status === 413) {
        errorMessage = 'File too large. Please choose a smaller image.';
      } else if (err.response?.status === 415) {
        errorMessage = 'Unsupported file type. Please use JPEG, PNG, or GIF images.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch(fileUploadFailure(errorMessage));
      throw new Error(errorMessage);
    }
  }, [dispatch]);
  
  

  return { login, signOut, resetPassword, sendResetLink, updateProfile, fetchProfile, changePassword, updateProfileImage };
}
