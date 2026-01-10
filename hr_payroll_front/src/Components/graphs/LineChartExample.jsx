import { ResponsiveLine } from '@nivo/line';

export default function LineChartExample({ 
  theme = "light", 
  data = null,
  axisBottomLegend = 'Time',
  axisLeftLegend = 'Value',
  title = null
}) {
  // Default demo data if none provided
  const defaultData = [
    {
      id: 'trend',
      data: [
        { x: 'Aug', y: 1200 },
        { x: 'Sep', y: 1500 },
        { x: 'Oct', y: 1800 },
        { x: 'Nov', y: 2200 },
        { x: 'Dec', y: 2000 },
        { x: 'Jan', y: 2500 },
      ],
    },
  ];
  
  const chartData = data && data.length > 0 ? data : defaultData;

  const isDark = theme === "dark";

  const nivoTheme = {
    textColor: isDark ? "#e5e7eb" : "#374151",
    axis: {
      domain: {
        line: { stroke: isDark ? "#9ca3af" : "#d1d5db", strokeWidth: 1 },
      },
      ticks: {
        line: { stroke: isDark ? "#9ca3af" : "#d1d5db", strokeWidth: 1 },
        text: { fill: isDark ? "#e5e7eb" : "#374151", fontSize: 11 },
      },
      legend: {
        text: { fill: isDark ? "#f9fafb" : "#111827", fontSize: 12 },
      },
    },
    grid: {
      line: { stroke: isDark ? "#4b5563" : "#e5e7eb", strokeWidth: 1 },
    },
    tooltip: {
      container: {
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
        fontSize: 12,
        borderRadius: 8,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
    crosshair: {
      line: {
        stroke: isDark ? '#60a5fa' : '#3b82f6',
        strokeWidth: 1,
        strokeOpacity: 0.5,
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      {title && (
        <h3 className={`text-sm font-medium px-4 pt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {title}
        </h3>
      )}
      <div style={{ height: title ? 360 : 400 }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: 30, right: 50, bottom: 50, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            legend: axisBottomLegend,
            legendOffset: 36,
            legendPosition: "middle",
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            legend: axisLeftLegend,
            legendOffset: -45,
            legendPosition: "middle",
          }}
          colors={{ scheme: "category10" }}
          pointSize={8}
          curve="monotoneX"
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          theme={nivoTheme}
          useMesh={true}
          enableArea={true}
          areaOpacity={0.1}
          animate={true}
          motionConfig="gentle"
        />
      </div>
    </div>
  );
}

