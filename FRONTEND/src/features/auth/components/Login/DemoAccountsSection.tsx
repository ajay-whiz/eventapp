import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import DemoAccountCard from './DemoAccountCard';
import { DEMO_ACCOUNTS, type DemoAccount } from '../../config/demoAccounts.config';

type DemoAccountsSectionProps = {
  onSelect: (account: DemoAccount) => void;
  selectedId?: string | null;
};

const DemoAccountsSection: React.FC<DemoAccountsSectionProps> = ({ onSelect, selectedId }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(selectedId ?? null);

  const handleSelect = (account: DemoAccount) => {
    setSelectedAccountId(account.id);
    onSelect(account);
  };

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] uppercase tracking-widest text-slate-400">Demo accounts</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <p className="text-[11px] text-slate-400 mb-3">
        Select a role to pre-fill credentials, then sign in.
      </p>
      <div className="flex flex-col gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <DemoAccountCard
            key={account.id}
            account={account}
            onSelect={handleSelect}
            isSelected={selectedAccountId === account.id}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-200 leading-relaxed">
        <Smartphone className="inline h-3.5 w-3.5 -mt-0.5 mr-1 align-middle" aria-hidden />
        Event organizers use the mobile app, not this portal. Download it from the panel on the
        right.
      </p>
    </div>
  );
};

export default DemoAccountsSection;
