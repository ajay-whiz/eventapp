import React from 'react';
import { Form } from '../../../components/common/Form';
import { InputGroup } from '../../../components/molecules/InputGroup';
import { FormError } from '../../../components/atoms/FormError';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPasswordSchema, type ResetPasswordSchemaType } from '../schemas/enterprise.schema';
import { useEnterprise } from '../hooks/useEnterprise';
import { useEnterpriseActions } from '../hooks/useEnterpriseActions';
import type { SubmitHandler } from 'react-hook-form';
import AuthCardLayout from '../../../components/layouts/AuthCardLayout';
import FormActionRow from '../../../components/auth/FormActionRow';

type ResetFormValues = ResetPasswordSchemaType;

const ResetPassword: React.FC = () => {
  const { loading, error } = useEnterprise();
  const { resetPassword } = useEnterpriseActions();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<ResetFormValues> = async (data: ResetFormValues) => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    await resetPassword(data.newPassword, token);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Password reset successfully');
      navigate('/login');
    }
  };

  return (
    <AuthCardLayout title="Reset Password">
      <Form<ResetFormValues>
        mode="all"
        schema={resetPasswordSchema}
        onSubmit={onSubmit}
        className="flex flex-col gap-4 w-full"
      >
        <InputGroup
          label="New Password"
          name="newPassword"
          type="password"
          id="newPassword"
          placeholder="Enter your new password"
          autoComplete="newPassword"
          className="w-full"
        />
        <InputGroup
          label="Confirm New Password"
          name="confirmNewPassword"
          type="password"
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
