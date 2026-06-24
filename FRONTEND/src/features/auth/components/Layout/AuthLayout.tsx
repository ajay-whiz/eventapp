import React from 'react';
import ProductTourPanel from '../Login/ProductTourPanel';
import MobileAppDownload from '../Login/MobileAppDownload';
import TrustSignals from '../Login/TrustSignals';

type AuthLayoutProps = {
  children: React.ReactNode;
};

const HeroPanel: React.FC<{ variant: 'hero' | 'compact' }> = ({ variant }) => {
  const isHero = variant === 'hero';

  if (isHero) {
    return (
      <div
        className="relative flex flex-col justify-between min-h-full bg-slate-900"
        style={{ backgroundImage: "url('/assets/images/event-management1.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-slate-900/80" />
        <div className="relative z-10 flex flex-col justify-between h-full p-9 md:p-10 min-h-[32rem]">
          <div>
            <ProductTourPanel variant="hero" />
            <div className="h-px bg-white/10 my-6" />
            <MobileAppDownload variant="hero" />
          </div>
          <TrustSignals variant="hero" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-6">
      <ProductTourPanel variant="compact" />
      <div className="h-px bg-white/10 my-4" />
      <MobileAppDownload variant="compact" />
      <TrustSignals variant="compact" />
    </div>
  );
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen font-jakarta bg-slate-100 flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-6xl">
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white grid md:grid-cols-2 md:items-stretch min-h-[600px]">
          {/* Left: form + demo accounts */}
          <div className="flex flex-col px-9 py-10 sm:px-10">
            <div className="mb-8">
              <img
                src="/assets/images/logo.svg"
                alt="Logo"
                className="block logoDashborad"
              />
            </div>
            {children}
          </div>

          {/* Right: product tour + mobile download (desktop) */}
          <div className="hidden md:block">
            <HeroPanel variant="hero" />
          </div>

          {/* Mobile: tour + download below form */}
          <div className="md:hidden border-t border-slate-200">
            <HeroPanel variant="compact" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
