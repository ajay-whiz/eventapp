import React, { useEffect, useState } from 'react';
import { resetPasswordSchema, type ResetPasswordSchemaType } from '../../schemas/login.schema';
import { Form } from '../../../../components/common/Form';
import { InputGroup } from '../../../../components/molecules/InputGroup';
import { FormError } from '../../../../components/atoms/FormError';
import { useAuth } from '../../hooks/useAuth';
import { useAuthActions } from '../../hooks/useAuthActions';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthCardLayout from '../../../../components/layouts/AuthCardLayout';
import FormActionRow from '../../../../components/auth/FormActionRow';

type ResetFormValues = ResetPasswordSchemaType;

const ResetPassword: React.FC = () => {
  const { loading, error, isAuthenticated } = useAuth();
  const { resetPassword } = useAuthActions();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token. Please request a new password reset link.');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (isAuthenticated && !loading && !error) {
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [isAuthenticated, loading, error, navigate]);

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

      if (result?.success) {
        setResetSuccess(true);
        toast.success(result.message || 'Password reset successfully! Please log in with your new password.');
      }
    } catch {
      setResetSuccess(false);
    }
  };

  return (
    <AuthCardLayout
      title="Reset Password"
      subtitle={
        <>
          {email && (
            <p className="text-sm text-center text-gray-600">
              Resetting password for: <span className="font-medium">{email}</span>
            </p>
          )}
          {!token && (
            <p className="text-red-600 text-sm text-center">
              Invalid or missing reset token. Please request a new password reset link.
            </p>
          )}
        </>
      }
    >
      <Form<ResetFormValues>
        mode="all"
        schema={resetPasswordSchema}
        onSubmit={onSubmit}
        className="flex flex-col gap-4 w-full"
      >
        <InputGroup
          label="New Password"
          name="newPassword"
          id="newPassword"
          placeholder="Enter your new password"
          autoComplete="newPassword"
          className="w-full"
        />
        <InputGroup
          label="Confirm New Password"
          name="confirmNewPassword"
          id="confirmNewPassword"
          placeholder="Enter your confirm new password"
          autoComplete="confirmNewPassword"
          className="w-full"
        />
        <FormError message={error ?? undefined} />
        <FormActionRow
          submitLabel="Reset Password"
          loadingLabel="Resetting..."
          loading={loading}
          submitDisabled={!token}
          onCancel={() => navigate('/login')}
        />
      </Form>
    </AuthCardLayout>
  );
};

export default ResetPassword;
