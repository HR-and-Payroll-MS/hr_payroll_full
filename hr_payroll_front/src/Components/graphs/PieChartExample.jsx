// PieChartExample.jsx
import { ResponsivePie } from '@nivo/pie';

export default function PieChartExample({ 
  theme = 'light', 
  data = null,
  title = null
}) {
  // Default demo data if none provided
  const defaultData = [
    { id: "Present", label: "Present", value: 75 },
    { id: "Absent", label: "Absent", value: 15 },
    { id: "Late", label: "Late", value: 10 },
  ];
  
  const chartData = data && data.length > 0 ? data : defaultData;
  
  const colors = theme === 'dark'
    ? ['#60a5fa', '#f87171', '#fbbf24', '#34d399', '#a78bfa']
    : ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  const nivoTheme = {
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
        <ResponsivePie
          data={chartData}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={2}
          cornerRadius={4}
          activeOuterRadiusOffset={8}
          colors={colors}
          borderWidth={0}
          borderColor={{ from: 'color', modifiers: [[theme === "dark" ? 'brighter' : 'darker', 100]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor={theme === 'dark' ? '#e5e7eb' : '#374151'}
          arcLinkLabelsThickness={1}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [[theme === "dark" ? 'brighter' : 'darker', 2]] }}
          theme={nivoTheme}
          animate={true}
          motionConfig="gentle"
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              translateY: 56,
              itemWidth: 80,
              itemHeight: 18,
              itemTextColor: theme === 'dark' ? '#e5e7eb' : '#374151',
              symbolSize: 12,
              symbolShape: 'circle',
            },
          ]}
        />
      </div>
    </div>
  );
}

