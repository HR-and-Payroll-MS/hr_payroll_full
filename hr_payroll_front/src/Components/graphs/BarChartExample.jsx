// BarChartExample.jsx
import { ResponsiveBar } from '@nivo/bar';

export default function BarChartExample({ 
  theme = 'light', 
  data = null,
  keys = null,
  indexBy = 'department',
  axisBottomLegend = 'Category',
  axisLeftLegend = 'Value',
  title = null
}) {
  // Default demo data if none provided
  const defaultData = [
    { department: 'HR', present: 12, absent: 3 },
    { department: 'Finance', present: 8, absent: 2 },
    { department: 'IT', present: 15, absent: 4 },
    { department: 'Marketing', present: 6, absent: 1 },
    { department: 'Sales', present: 10, absent: 3 },
  ];
  
  const chartData = data && data.length > 0 ? data : defaultData;
  
  // Auto-detect keys from data if not provided
  const chartKeys = keys || (chartData[0] 
    ? Object.keys(chartData[0]).filter(k => k !== indexBy && typeof chartData[0][k] === 'number')
    : ['present', 'absent']);

  // Colors for bars
  const colors =
    theme === 'dark'
      ? ['#60a5fa', '#f87171', '#fbbf24', '#34d399']
      : ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

  // Define Nivo theme (controls text, ticks, grid, legend)
  const nivoTheme = {
    textColor: theme === 'dark' ? '#f3f4f6' : '#111827',
    axis: {
      domain: {
        line: {
          stroke: theme === 'dark' ? '#9ca3af' : '#d1d5db',
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: theme === 'dark' ? '#9ca3af' : '#d1d5db',
          strokeWidth: 1,
        },
        text: {
          fill: theme === 'dark' ? '#f3f4f6' : '#111827',
          fontSize: 11,
        },
      },
      legend: {
        text: {
          fill: theme === 'dark' ? '#f9fafb' : '#1f2937',
          fontSize: 12,
        },
      },
    },
    grid: {
      line: {
        stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        strokeWidth: 1,
      },
    },
    legends: {
      text: {
        fill: theme === 'dark' ? '#f3f4f6' : '#111827',
      },
    },
    tooltip: {
      container: {
        background: theme === 'dark' ? '#1f2937' : '#ffffff',
        color: theme === 'dark' ? '#f9fafb' : '#111827',
        fontSize: 12,
        borderRadius: 8,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      {title && (
        <h3 className={`text-sm font-medium px-4 pt-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {title}
        </h3>
      )}
      <div style={{ height: title ? 360 : 400 }}>
        <ResponsiveBar
          data={chartData}
          keys={chartKeys}
          indexBy={indexBy}
          margin={{ top: 30, right: 100, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={colors}
          borderRadius={4}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            legend: axisBottomLegend,
            legendPosition: 'middle',
            legendOffset: 36,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            legend: axisLeftLegend,
            legendPosition: 'middle',
            legendOffset: -45,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{
            from: 'color',
            modifiers: [[theme === 'dark' ? 'brighter' : 'darker', 2]],
          }}
          legends={[
            {
              dataFrom: 'keys',
              anchor: 'bottom-right',
              direction: 'column',
              translateX: 90,
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.85,
              symbolSize: 12,
              symbolShape: 'circle',
            },
          ]}
          theme={nivoTheme}
          animate={true}
          motionConfig="gentle"
        />
      </div>
    </div>
  );
}

