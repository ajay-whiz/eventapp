import React, { useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodSafeResolver } from '../../../../lib/zodSafeResolver';
import { loginSchema } from '../../../../features/auth/schemas/login.schema';
import type { LoginSchemaType } from '../../../../features/auth/schemas/login.schema';
import { Form } from '../../../../components/common/Form';
import { InputGroup } from '../../../../components/molecules/InputGroup';
import { Button } from '../../../../components/atoms/Button';
import { FormError } from '../../../../components/atoms/FormError';
import { useAuth } from '../../../../features/auth/hooks/useAuth';
import { useAuthActions } from '../../../../features/auth/hooks/useAuthActions';
import { useNavigate } from 'react-router-dom';
import { CheckboxWithLabel } from '../../../../components/molecules/CheckboxWithLabel';
import AuthLayout from '../Layout/AuthLayout';
import DemoAccountsSection from './DemoAccountsSection';
import { SHOW_DEMO_ACCOUNTS, type DemoAccount } from '../../config/demoAccounts.config';

type LoginFormValues = LoginSchemaType;

const LoginForm: React.FC = () => {
  const { loading, error, isAuthenticated } = useAuth();
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  const rememberedPassword = localStorage.getItem('rememberedPassword');
  const methods = useForm<LoginFormValues>({
    resolver: zodSafeResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      email: rememberedEmail ?? '',
      password: rememberedPassword ?? '',
      rememberMe: !!rememberedEmail,
    },
  });

  const handleDemoSelect = (account: DemoAccount) => {
    methods.setValue('email', account.email, { shouldValidate: true });
    methods.setValue('password', account.password, { shouldValidate: true });
  };

  const onSubmit = (data: LoginFormValues) => {
    if (data.rememberMe) {
      localStorage.setItem('rememberedEmail', data.email);
      localStorage.setItem('rememberedPassword', data.password);
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
    }
    login(data.email, data.password);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-slate-900">Sign in to Admin Portal</h1>
        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
          Manage venues, vendors, and bookings for your event marketplace.
        </p>
      </div>

      <FormProvider {...methods}>
        <Form<LoginFormValues>
          onSubmit={onSubmit}
          schema={loginSchema}
          className="flex flex-col w-full gap-0"
        >
          <InputGroup
            label="Email"
            name="email"
            id="login-username"
            placeholder="Enter your Email"
            autoComplete="username"
            className="w-full h-9 text-sm"
          />
          <InputGroup
            label="Password"
            name="password"
            id="login-password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            className="w-full h-9 text-sm mt-3.5"
          />
          <div className="flex items-center justify-between text-xs mt-3 mb-4">
            <Controller
              name="rememberMe"
              control={methods.control}
              render={({ field }) => (
                <CheckboxWithLabel
                  name="rememberMe"
                  label="Remember me"
                  id="rememberMe"
                  checked={field.value || false}
                  onChange={field.onChange}
                />
              )}
            />
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-blue-600 hover:underline cursor-pointer text-xs"
            >
              Forgot password?
            </button>
          </div>
          <FormError message={error ?? undefined} />
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-9 text-sm rounded-md"
            size="md"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Form>
      </FormProvider>

      {SHOW_DEMO_ACCOUNTS && <DemoAccountsSection onSelect={handleDemoSelect} />}
    </AuthLayout>
  );
};

export default LoginForm;
