'use client';

import { useMemo } from 'react';

interface DataPoint {
  date: string | Date;
  count: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  viewMode: 'daily' | 'weekly' | 'monthly';
}

export default function AnalyticsChart({ data, viewMode }: AnalyticsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => ({
      date: new Date(d.date),
      count: d.count,
    }));
  }, [data]);

  const maxCount = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((d) => d.count), 1);
  }, [chartData]);

  const formatDate = (date: Date) => {
    switch (viewMode) {
      case 'daily':
        return `${date.getMonth() + 1}/${date.getDate()}`;
      case 'weekly':
        return `${date.getMonth() + 1}/${date.getDate()}주`;
      case 'monthly':
        return `${date.getFullYear()}.${date.getMonth() + 1}`;
      default:
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        데이터가 없습니다
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 800;
  const height = 300;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xStep = chartWidth / Math.max(chartData.length - 1, 1);
  const yScale = (value: number) => chartHeight - (value / maxCount) * chartHeight;

  // Generate path for the line
  const linePath = chartData
    .map((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + yScale(d.count);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate path for the area fill
  const areaPath = `
    ${linePath}
    L ${padding.left + (chartData.length - 1) * xStep} ${padding.top + chartHeight}
    L ${padding.left} ${padding.top + chartHeight}
    Z
  `;

  // Y-axis labels
  const yLabels = [0, Math.round(maxCount / 2), maxCount];

  // X-axis labels (show every nth label based on data length)
  const labelInterval = Math.ceil(chartData.length / 8);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[600px]"
        style={{ maxHeight: '300px' }}
      >
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + yScale(label)}
            x2={width - padding.right}
            y2={padding.top + yScale(label)}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#gradient)"
          opacity={0.3}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.map((d, i) => (
          <circle
            key={i}
            cx={padding.left + i * xStep}
            cy={padding.top + yScale(d.count)}
            r={4}
            fill="#3B82F6"
            className="hover:r-6 transition-all"
          >
            <title>{`${formatDate(d.date)}: ${d.count}명`}</title>
          </circle>
        ))}

        {/* Y-axis labels */}
        {yLabels.map((label, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={padding.top + yScale(label) + 4}
            textAnchor="end"
            className="fill-gray-500 dark:fill-gray-400 text-xs"
          >
            {label}
          </text>
        ))}

        {/* X-axis labels */}
        {chartData.map((d, i) => {
          if (i % labelInterval !== 0 && i !== chartData.length - 1) return null;
          return (
            <text
              key={i}
              x={padding.left + i * xStep}
              y={height - 10}
              textAnchor="middle"
              className="fill-gray-500 dark:fill-gray-400 text-xs"
            >
              {formatDate(d.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
