'use client';

import { useState } from 'react';

interface DataPoint {
  date: string;
  count: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  viewMode: 'daily' | 'weekly' | 'monthly';
}

export default function AnalyticsChart({ data, viewMode }: AnalyticsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        데이터가 없습니다
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 800;
  const chartHeight = 256;
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (viewMode === 'monthly') {
      return `${date.getMonth() + 1}월`;
    } else if (viewMode === 'weekly') {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Calculate points for the line
  const points = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * graphWidth;
    const y = padding.top + graphHeight - (point.count / maxCount) * graphHeight;
    return { x, y, ...point };
  });

  // Create path for the line
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create path for the area under the line
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || padding.left} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`;

  // Generate Y-axis labels
  const yAxisLabels = [0, Math.round(maxCount / 4), Math.round(maxCount / 2), Math.round((maxCount * 3) / 4), maxCount];

  // Generate X-axis labels (show every few labels to avoid crowding)
  const xLabelStep = Math.ceil(data.length / 8);

  return (
    <div className="h-64 w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yAxisLabels.map((label, index) => {
          const y = padding.top + graphHeight - (label / maxCount) * graphHeight;
          return (
            <g key={index}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500 dark:fill-gray-400"
                style={{ fontSize: '10px' }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Area under the line */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 6 : 4}
              fill="#8b5cf6"
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {/* Tooltip */}
            {hoveredIndex === index && (
              <g>
                <rect
                  x={point.x - 30}
                  y={point.y - 35}
                  width="60"
                  height="24"
                  rx="4"
                  fill="#1f2937"
                />
                <text
                  x={point.x}
                  y={point.y - 18}
                  textAnchor="middle"
                  className="fill-white"
                  style={{ fontSize: '12px' }}
                >
                  {point.count}회
                </text>
              </g>
            )}
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((point, index) => {
          if (index % xLabelStep !== 0 && index !== data.length - 1) return null;
          const x = padding.left + (index / (data.length - 1 || 1)) * graphWidth;
          return (
            <text
              key={index}
              x={x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="text-xs fill-gray-500 dark:fill-gray-400"
              style={{ fontSize: '10px' }}
            >
              {formatDate(point.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
