import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { DemoAccount, DemoAccountAccent } from '../../config/demoAccounts.config';

const roleNameColors: Record<DemoAccountAccent, string> = {
  violet: 'text-violet-600',
  cyan: 'text-cyan-600',
  emerald: 'text-emerald-600',
};

type DemoAccountCardProps = {
  account: DemoAccount;
  onSelect: (account: DemoAccount) => void;
  isSelected?: boolean;
};

const CopyField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — ignore silently
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
      <span className="shrink-0">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <code className="font-mono text-[10px] text-slate-800 truncate">{value}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
};

const DemoAccountCard: React.FC<DemoAccountCardProps> = ({ account, onSelect, isSelected }) => {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3.5 cursor-pointer transition-colors hover:border-slate-300 ${
        isSelected ? 'ring-2 ring-blue-600 ring-offset-1 border-slate-300' : ''
      }`}
      onClick={() => onSelect(account)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(account);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className={`text-xs font-medium mb-0.5 ${roleNameColors[account.accent]}`}>
        {account.role}
      </div>
      <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{account.description}</p>
      <ul className="flex flex-wrap gap-1 mb-2.5">
        {account.highlights.map((item) => (
          <li
            key={item}
            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200"
          >
            {item}
          </li>
        ))}
      </ul>
      <div className="space-y-0.5 mb-2.5">
        <CopyField label="Email" value={account.email} />
        <CopyField label="Password" value={account.password} />
      </div>
      <button
        type="button"
        className="w-full h-7 text-[11px] border border-slate-200 rounded-md bg-transparent text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(account);
        }}
      >
        Use these credentials
      </button>
    </div>
  );
};

export default DemoAccountCard;
