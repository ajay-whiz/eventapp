import React from 'react';
import { Bell, Building2, Lock } from 'lucide-react';
import { TRUST_SIGNALS, type TrustSignalIcon } from '../../config/demoAccounts.config';

const iconMap: Record<TrustSignalIcon, React.ReactNode> = {
  lock: <Lock className="h-3.5 w-3.5 text-[#0d7377]" aria-hidden />,
  building: <Building2 className="h-3.5 w-3.5 text-[#0d7377]" aria-hidden />,
  bell: <Bell className="h-3.5 w-3.5 text-[#0d7377]" aria-hidden />,
};

type TrustSignalsProps = {
  variant?: 'hero' | 'compact';
  surface?: 'dark' | 'light';
};

const TrustSignals: React.FC<TrustSignalsProps> = ({
  variant = 'hero',
  surface = 'dark',
}) => {
  const isHero = variant === 'hero';
  const isLight = surface === 'light';

  return (
    <div
      className={`flex flex-wrap gap-4 ${isHero ? 'mt-7' : 'mt-5'} ${
        isHero ? '' : `pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`
      }`}
    >
      {TRUST_SIGNALS.map((signal) => (
        <div
          key={signal.label}
          className={`flex items-center gap-1.5 text-[11px] ${
            isLight ? 'text-slate-600' : 'text-slate-500'
          }`}
        >
          {iconMap[signal.icon]}
          <span>{signal.label}</span>
        </div>
      ))}
    </div>
  );
};

export default TrustSignals;
