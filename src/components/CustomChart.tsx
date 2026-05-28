import React, { useState } from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number; // optionally used for multiple series
}

interface CustomChartProps {
  type: 'bar' | 'line' | 'area';
  data: ChartDataPoint[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}

export default function CustomChart({ 
  type, 
  data, 
  height = 200, 
  valuePrefix = 'R$ ', 
  valueSuffix = '' 
}: CustomChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-xs">
        Sem dados para exibir
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const paddingX = 45;
  const paddingY = 25;
  const chartWidth = 500;
  const chartHeight = height;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (val / maxValue) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  // Create points for Line / Area
  const points = data.map((d, i) => getCoordinates(i, d.value));
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

  // Create SVG path for Area (closes the loop at the bottom)
  const initialPoint = points[0] || { x: paddingX, y: chartHeight - paddingY };
  const lastPoint = points[points.length - 1] || { x: chartWidth - paddingX, y: chartHeight - paddingY };
  const areaPathStr = data.length > 0
    ? `M ${initialPoint.x},${chartHeight - paddingY} L ${pointsStr} L ${lastPoint.x},${chartHeight - paddingY} Z`
    : '';

  // Generate grid values (4 lines)
  const gridLines = [0, 0.33, 0.66, 1].map(ratio => {
    const val = ratio * maxValue;
    const y = chartHeight - paddingY - (val / maxValue) * (chartHeight - paddingY * 2);
    return { y, label: val };
  });

  return (
    <div className="relative w-full">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full overflow-visible"
        style={{ height: `${chartHeight}px` }}
      >
        {/* Horizontal grid lines */}
        {gridLines.map((line, i) => (
          <g key={i} className="opacity-40">
            <line 
              x1={paddingX} 
              y1={line.y} 
              x2={chartWidth - paddingX} 
              y2={line.y} 
              stroke="#cbd5e1" 
              strokeWidth="0.75" 
              strokeDasharray="4 4"
            />
            <text 
              x={paddingX - 8} 
              y={line.y + 3} 
              textAnchor="end" 
              className="fill-slate-400 font-mono text-[9px]"
            >
              {valuePrefix}
              {line.label >= 1000 
                ? `${(line.label / 1000).toFixed(1)}k` 
                : line.label.toFixed(0)}
              {valueSuffix}
            </text>
          </g>
        ))}

        {/* Bar Chart rendering */}
        {type === 'bar' && (
          <g>
            {data.map((d, i) => {
              const xRatio = (chartWidth - paddingX * 2) / data.length;
              const barWidth = Math.max(xRatio * 0.55, 12);
              const barX = paddingX + i * xRatio + (xRatio - barWidth) / 2;
              const barHeight = (d.value / maxValue) * (chartHeight - paddingY * 2);
              const barY = chartHeight - paddingY - barHeight;
              const isHovered = hoveredIndex === i;

              // Use custom color or default theme
              const barColor = d.color || '#3b82f6'; // Blue-500

              return (
                <rect
                  key={i}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barHeight, 2)} // minimal pixel height so we see zero-ish values
                  rx={3}
                  className="transition-all duration-200 cursor-pointer"
                  fill={isHovered ? `${barColor}cc` : barColor}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </g>
        )}

        {/* Area rendering */}
        {type === 'area' && data.length > 0 && (
          <path 
            d={areaPathStr} 
            fill="url(#area-gradient)" 
            className="transition-all duration-300 pointer-events-none"
          />
        )}

        {/* Line rendering */}
        {(type === 'line' || type === 'area') && data.length > 0 && (
          <path 
            d={`M ${pointsStr}`} 
            fill="none" 
            stroke="#10b981" // Emerald-500
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300 pointer-events-none"
          />
        )}

        {/* Dots on line chart with hover state */}
        {(type === 'line' || type === 'area') && points.map((p, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isHovered ? 6 : 4}
              className="cursor-pointer transition-all duration-150"
              fill={isHovered ? '#059669' : '#10b981'}
              stroke="#ffffff"
              strokeWidth="2"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}

        {/* X Axis labels */}
        {data.map((d, i) => {
          let x = 0;
          if (type === 'bar') {
            const xRatio = (chartWidth - paddingX * 2) / data.length;
            x = paddingX + i * xRatio + xRatio / 2;
          } else {
            x = paddingX + (indexToCalculateX(i, data.length)) * (chartWidth - paddingX * 2);
          }
          return (
            <text
              key={i}
              x={x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="fill-slate-500 text-[9px] font-sans font-medium"
            >
              {d.label.length > 10 ? `${d.label.slice(0, 8)}...` : d.label}
            </text>
          );
        })}

        {/* Gradients definition */}
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.30"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.01"/>
          </linearGradient>
        </defs>
      </svg>

      {/* Tooltip Popup */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div 
          className="absolute z-10 p-2 bg-slate-900 border border-slate-800 text-white rounded shadow-md pointer-events-none text-xs flex flex-col font-sans mb-2"
          style={{
            bottom: `${paddingY + 12}px`,
            left: `${Math.max(10, Math.min(90, (hoveredIndex / (data.length - 1 || 1)) * 100))}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="font-semibold text-slate-300">{data[hoveredIndex].label}</span>
          <span className="font-mono text-emerald-400 mt-1">
            {valuePrefix}
            {data[hoveredIndex].value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {valueSuffix}
          </span>
        </div>
      )}
    </div>
  );

  function indexToCalculateX(i: number, length: number) {
    return i / (length - 1 || 1);
  }
}
