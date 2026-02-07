'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';

export interface GrowthPoint {
  date: string;
  ratings: number;
  comments: number;
  total: number;
}

interface GrowthChartProps {
  data: GrowthPoint[];
  height?: number;
}

const GrowthChart: React.FC<GrowthChartProps> = ({ data, height = 240 }) => {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        No activity yet
      </div>
    );
  }

  const width = 640;
  const padding = 28;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const maxValue = data.reduce((max, point) => {
    return Math.max(max, point.ratings, point.comments);
  }, 0);

  if (maxValue === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        No activity yet
      </div>
    );
  }

  const xStep = data.length > 1 ? innerWidth / (data.length - 1) : 0;
  const getX = (index: number) => padding + index * xStep;
  const getY = (value: number) =>
    padding + innerHeight - (value / maxValue) * innerHeight;

  const ratingsPoints = data.map((point, index) => `${getX(index)},${getY(point.ratings)}`).join(' ');
  const commentsPoints = data.map((point, index) => `${getX(index)},${getY(point.comments)}`).join(' ');

  const labelIndices = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter(
    (value, index, self) => self.indexOf(value) === index
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      role="img"
      aria-label="Platform growth chart"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="0" y="0" width={width} height={height} fill="transparent" />

      {/* Grid */}
      {[0.25, 0.5, 0.75].map((ratio) => {
        const y = padding + innerHeight * ratio;
        return (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.08"
          />
        );
      })}

      {/* Ratings line */}
      <polyline
        points={ratingsPoints}
        fill="none"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Comments line */}
      <polyline
        points={commentsPoints}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* X-axis labels */}
      {labelIndices.map((index) => {
        const label = format(parseISO(data[index].date), 'MMM d');
        return (
          <text
            key={index}
            x={getX(index)}
            y={height - 8}
            textAnchor="middle"
            className="fill-slate-400 text-[11px]"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

export { GrowthChart };
