'use client';

import { cn } from '@/lib/utils';

export interface AdminTab {
  id: string;
  label: string;
}

export interface AdminTabsProps {
  tabs: AdminTab[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}

export function AdminTabs({ tabs, activeTab, onChange, ariaLabel }: AdminTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-1 rounded-lg border border-zinc-700 bg-[#12121a] p-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'min-h-11 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c]',
              isActive
                ? 'bg-[#5b21b6] text-white shadow-sm'
                : 'text-zinc-200 hover:bg-zinc-800 hover:text-white',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
