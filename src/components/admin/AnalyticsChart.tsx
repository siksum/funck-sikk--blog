'use client';

interface DataPoint {
  date: string;
  count: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  viewMode: 'daily' | 'weekly' | 'monthly';
}

export default function AnalyticsChart({ data, viewMode }: AnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        데이터가 없습니다
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (viewMode === 'monthly') {
      return `${date.getMonth() + 1}월`;
    } else if (viewMode === 'weekly') {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-full gap-1">
        {data.map((point, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col items-center justify-end h-full"
          >
            <div
              className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-sm transition-all hover:from-violet-600 hover:to-violet-500 cursor-pointer group relative"
              style={{
                height: `${(point.count / maxCount) * 100}%`,
                minHeight: point.count > 0 ? '4px' : '0',
              }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {point.count}
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
              {formatDate(point.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
