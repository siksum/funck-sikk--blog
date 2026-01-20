'use client';

import { useState, useEffect, use } from 'react';
import DailyEntryForm from '@/components/my-world/DailyEntryForm';

interface Props {
  params: Promise<{ date: string }>;
}

export default function DailyEntryPage({ params }: Props) {
  const { date } = use(params);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const res = await fetch(`/api/my-world/daily/${date}`);
        if (res.ok) {
          const data = await res.json();
          setInitialData(data);
        }
      } catch (error) {
        console.error('Failed to fetch entry:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [date]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return <DailyEntryForm date={date} initialData={initialData} />;
}
