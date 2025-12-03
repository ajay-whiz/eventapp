import React, { useEffect, useState } from 'react';
import { resetPasswordSchema, type ResetPasswordSchemaType  } from '../../schemas/login.schema';
import { Form } from '../../../../components/common/Form';
import { InputGroup } from '../../../../components/molecules/InputGroup';
import { Button } from '../../../../components/atoms/Button';
import { FormError } from '../../../../components/atoms/FormError';
import { useAuth } from '../../hooks/useAuth';
import { useAuthActions } from '../../hooks/useAuthActions';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type ResetFormValues = ResetPasswordSchemaType;

const ResetPassword: React.FC = () => {
    const { loading, error, isAuthenticated } = useAuth();
    const { resetPassword } = useAuthActions();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const [resetSuccess, setResetSuccess] = useState(false);

    // Check if token exists
    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing reset token. Please request a new password reset link.');
            navigate('/forgot-password');
        }
    }, [token, navigate]);

    // Navigate to login after successful password reset (with auto-login)
    useEffect(() => {
        if (isAuthenticated && !loading && !error) {
            toast.success('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
    }, [isAuthenticated, loading, error, navigate]);

    // Navigate to login after successful password reset (without auto-login)
    useEffect(() => {
        if (resetSuccess && !loading && !isAuthenticated) {
            const timer = setTimeout(() => {
                navigate('/login');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [resetSuccess, loading, isAuthenticated, navigate]);

    const onSubmit = async (data: ResetFormValues) => {
        if (!token) {
            toast.error('Invalid or missing reset token');
            return;
        }

        setResetSuccess(false);
        try {
            const result = await resetPassword(data.newPassword, token);
            
            // Check if password reset was successful
            if (result?.success) {
                setResetSuccess(true);
                toast.success(result.message || 'Password reset successfully! Please log in with your new password.');
            }
            // If result is undefined but no error was thrown, the API call succeeded
            // The error state will be checked in the useEffect
        } catch (err: any) {
            // Error is already handled by the Redux action and will be shown via error state

            setResetSuccess(false);
            // Error toast will be shown via FormError component
        }
    };
  
  return (
    <div className="min-h-screen flex justify-center bg-no-repeat from-sky-500 to-purple-600 font-sans pt-10 pb-10 items-center" style={{ backgroundImage: "url('/assets/images/bg.png')" }}>
          <div className='w-xl flex flex-col justify-center  px-4 py-2  bg-white shadow-lg w-ful'>
          <div className="flex items-center space-x-2 mb-6 justify-center">
               
                <h1 className="text-2xl font-bold text-gray-900 mb-2"> <img
                  src="/assets/images/logo.png"
                  alt=""
                  className="rounded w-60 h-60  block"
                />
                </h1>
            </div>
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6 px-12">Reset Password</h2>
            {email && (
              <p className="text-sm text-center text-gray-600 mb-4 px-12">
                Resetting password for: <span className="font-medium">{email}</span>
              </p>
            )}
            {!token && (
              <div className="px-12 mb-4">
                <p className="text-red-600 text-sm text-center">
                  Invalid or missing reset token. Please request a new password reset link.
                </p>
              </div>
            )}
            <Form<ResetFormValues> mode="all" schema={resetPasswordSchema} onSubmit={onSubmit} className="pace-y-4 grid grid-row-2 gap-4 mb-6 w-full px-12">
               
              <InputGroup
                label="New Password"
                name="newPassword"
                id="newPassword"
                placeholder="Enter your new password"
                autoComplete="newPassword"
                className='w-full'
              />
              <InputGroup
                label="Confirm New Password"
                name="confirmNewPassword"
                id="confirmNewPassword"
                placeholder="Enter your confirm new password"
                autoComplete="confirmNewPassword"
                className='w-full'
              />
              <FormError message={error ?? undefined} />
              <Button type="submit" disabled={loading || !token} className="w-auto mt-4 m-auto">
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
               <Button 
                 type="button" 
                 disabled={loading} 
                 variant='muted' 
                 className="w-auto mt-4 m-auto"
                 onClick={() => navigate('/login')}
               >
                    Cancel
                </Button>
            </Form>
            {/*  */}
            </div>
          </div>
  );
};

export default ResetPassword;
