'use client';

import { useState, ReactNode, Children, isValidElement } from 'react';

interface TabProps {
  label: string;
  children: ReactNode;
}

interface CodeTabsProps {
  children: ReactNode;
}

export function Tab({ children }: TabProps) {
  return <div>{children}</div>;
}

export function CodeTabs({ children }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> =>
      isValidElement(child) && (child.type === Tab || (child.props as TabProps).label !== undefined)
  );

  if (tabs.length === 0) {
    return <div>{children}</div>;
  }

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Tab Headers */}
      <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'bg-white dark:bg-gray-900 text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 -mb-px'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900">
        {tabs[activeTab]}
      </div>
    </div>
  );
}

export default CodeTabs;
