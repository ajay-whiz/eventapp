import React from 'react';
import { APP_BRANDING } from '../../config/branding';

type AuthCardLayoutProps = {
  title: string;
  subtitle?: React.ReactNode;
  logoSrc?: string;
  logoAlt?: string;
  children: React.ReactNode;
};

const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({
  title,
  subtitle,
  logoSrc = APP_BRANDING.logoSrc,
  logoAlt = APP_BRANDING.logoAlt,
  children,
}) => {
  return (
    <div
      className="min-h-screen flex justify-center items-center bg-no-repeat font-sans px-4 py-10"
      style={{ backgroundImage: "url('/assets/images/bg.png')" }}
    >
      <div className="w-full max-w-md flex flex-col bg-white shadow-lg rounded-lg px-6 py-8">
        <div className="flex justify-center mb-6">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="block logoDashborad object-contain"
          />
        </div>

        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">{title}</h2>

        {subtitle ? <div className="mb-6">{subtitle}</div> : <div className="mb-4" />}

        {children}
      </div>
    </div>
  );
};

export default AuthCardLayout;
