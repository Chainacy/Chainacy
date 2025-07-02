import { cn } from '@/lib/utils';
import type { TabType } from '@/types';

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'encrypt' as const, label: 'Encrypt Message', mobileLabel: 'Encrypt' },
  { id: 'decrypt' as const, label: 'Decrypt Tasks', mobileLabel: 'Decrypt' },
  { id: 'published' as const, label: 'Published Messages', mobileLabel: 'Published' },
  { id: 'how' as const, label: 'How it works', mobileLabel: 'FAQ' },
];

export const Tabs = ({ activeTab, onTabChange }: TabsProps) => {
  return (
    <div className="flex border-b border-gray-200 w-full">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 px-1 sm:px-2 py-2 sm:py-3 text-xs sm:text-sm font-sans transition-colors duration-200',
            'border-b-2 border-transparent whitespace-nowrap text-center',
            activeTab === tab.id
              ? 'border-blue-500 text-blue-500 font-bold'
              : 'text-gray-600 hover:text-gray-800'
          )}
        >
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="inline sm:hidden">{tab.mobileLabel}</span>
        </button>
      ))}
    </div>
  );
};
