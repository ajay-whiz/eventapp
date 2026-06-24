import React from 'react';
import { MOBILE_APP_LINKS } from '../../config/demoAccounts.config';

const PlayStoreBadge: React.FC<{ href?: string; disabled?: boolean }> = ({ href, disabled }) => {
  const content = (
    <>
      <svg
        className="h-[18px] w-[18px] text-slate-200 shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M3.6 1.8l13.2 7.6L3.6 16.9V1.8zm0-1.8C2.4 0 1.2.6.6 1.6c-.4.6-.6 1.3-.6 2v16.8c0 .7.2 1.4.6 2 .6 1 1.8 1.6 3 1.6.6 0 1.2-.2 1.8-.5l13.2-7.6c1.2-.7 1.8-1.9 1.8-3.1s-.6-2.4-1.8-3.1L5.4 1.1C4.8.8 4.2.6 3.6.6z" />
      </svg>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-wider text-slate-500">Get it on</span>
        <span className="text-xs font-medium text-slate-200">Google Play</span>
      </div>
    </>
  );

  const className =
    'flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 shrink-0 transition-opacity';

  if (href && !disabled) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:opacity-80`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      title="Configure VITE_PLAY_STORE_URL to enable"
      className={`${className} opacity-60 cursor-not-allowed`}
    >
      {content}
    </button>
  );
};

const AppStoreBadge: React.FC<{ href: string }> = ({ href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 shrink-0 hover:opacity-80 transition-opacity"
  >
    <svg
      className="h-[18px] w-[18px] text-slate-200 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.7 19.5c-.4.9-1.2 1.9-2.1 1.9-.5 0-1.1-.3-1.8-.3-.7 0-1.4.3-2.2.3-.9 0-1.7-.9-2.2-1.9-1.2-2-1-5.6 1-8.8.7-1.2 1.6-2.5 2.8-2.5.6 0 1.3.4 2.1.4.7 0 1.5-.4 2.4-.4 1 0 1.9.6 2.6 1.5-2.3 1.3-1.9 4.7.4 5.8-.5 1.3-1.1 2.6-1.9 3.7zM15.3 3.5c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.2 1.2-.5.6-.9 1.6-.8 2.4.9.1 1.8-.4 2.2-1.1z" />
    </svg>
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wider text-slate-500">Download on the</span>
      <span className="text-xs font-medium text-slate-200">App Store</span>
    </div>
  </a>
);

const MobileAppDownload: React.FC<{ variant?: 'hero' | 'compact' }> = ({ variant = 'hero' }) => {
  const { appStoreUrl, playStoreUrl } = MOBILE_APP_LINKS;
  const isHero = variant === 'hero';

  return (
    <div className={isHero ? 'pt-6' : 'pt-4'}>
      <div
        className={`flex items-center justify-between gap-4 ${
          isHero ? 'flex-row' : 'flex-col sm:flex-row'
        }`}
      >
        <p
          className={`text-slate-400 leading-relaxed ${
            isHero ? 'text-xs max-w-[200px]' : 'text-[11px]'
          }`}
        >
          Organizers experience the platform on mobile. Share the app to complete the demo journey.
        </p>
        <div className="flex flex-wrap gap-2 shrink-0">
          <PlayStoreBadge href={playStoreUrl || undefined} disabled={!playStoreUrl} />
          {appStoreUrl && <AppStoreBadge href={appStoreUrl} />}
        </div>
      </div>
    </div>
  );
};

export default MobileAppDownload;
