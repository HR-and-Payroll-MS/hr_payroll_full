import React, { useMemo } from "react";
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "../Context/ThemeContext";
import { Bar } from "react-chartjs-2";
import { ResponsivePie } from "@nivo/pie";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

/* ===========================
   BAR CHART (UNCHANGED)
=========================== */

function BarChartz({
  data,
  keys,
  indexBy,
  height = 300,
  margin = { top: 50, right: 130, bottom: 50, left: 60 },
  padding = 0.3,
  legendX = 120,
}) {
  const { theme } = useTheme();
  const safeData = data?.length ? data : [];

  const colors =
    theme === "dark"
      ? ["#ffb347", "#ffcc33", "#ff6699", "#66ccff"]
      : ["#66c2a5", "#fc8d62", "#8da0cb", "#ffd92f"];

  const nivoTheme = {
    textColor: theme === "dark" ? "#f3f4f6" : "#111827",
    axis: {
      domain: { line: { stroke: theme === "dark" ? "#9ca3af" : "#d1d5db" } },
      ticks: {
        line: { stroke: theme === "dark" ? "#9ca3af" : "#d1d5db" },
        text: { fill: theme === "dark" ? "#f3f4f6" : "#111827" },
      },
      legend: {
        text: { fill: theme === "dark" ? "#f9fafb" : "#1f2937" },
      },
    },
    grid: {
      line: { stroke: theme === "dark" ? "#4b5563" : "#e5e7eb" },
    },
    legends: {
      text: { fill: theme === "dark" ? "#f3f4f6" : "#111827" },
    },
    tooltip: {
      container: {
        background: theme === "dark" ? "#1f2937" : "#ffffff",
        color: theme === "dark" ? "#f9fafb" : "#111827",
      },
    },
  };

  return (
    <div style={{ height }}>
      <ResponsiveBar
        data={safeData}
        keys={keys}
        indexBy={indexBy}
        margin={margin}
        padding={padding}
        colors={colors}
        groupMode="grouped"
        borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          legend: indexBy,
          legendPosition: "middle",
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          legend: "Values",
          legendPosition: "middle",
          legendOffset: -40,
        }}
        legends={[
          {
            dataFrom: "keys",
            anchor: "bottom-right",
            direction: "column",
            translateX: legendX,
            itemWidth: 100,
            itemHeight: 20,
            symbolSize: 14,
          },
        ]}
        theme={nivoTheme}
      />
    </div>
  );
}

/* ===========================
   HEATMAP (PRO UI UPGRADE)
   ❗ NAME & PROPS UNCHANGED
=========================== */

function Heatmapz({
  data = [],
  startDate,
  endDate,
  lightColors = ["#ef4444", "#22c55e", "#f97316", "#3b82f6"],
  darkColors = ["#7f1d1d", "#065f46", "#92400e", "#1e3a8a"],
  showLegend = true,
  theme = "light",
  legendLabels = ["Absent", "Present", "Late", "Permission"],
}) {
  const colors = theme === "dark" ? darkColors : lightColors;

  const from = startDate || `${new Date().getFullYear()}-01-01`;
  const to = endDate || `${new Date().getFullYear()}-12-31`;

  const legends = useMemo(() => {
    if (!showLegend) return [];
    return [
      {
        anchor: "top-right",
        direction: "row",
        translateY: -10,
        itemWidth: 90,
        itemHeight: 14,
        itemsSpacing: 12,
        symbolSize: 12,
        data: legendLabels.map((label, i) => ({
          label,
          color: colors[i],
        })),
      },
    ];
  }, [colors, showLegend, legendLabels]);

  return (
    <div
      style={{
        height: 260,
        padding: 12,
        borderRadius: 16,
        background: theme === "dark" ? "#111827" : "#ffffff",
      }}
    >
      <ResponsiveCalendar
        data={data}
        from={from}
        to={to}
        colors={colors}
        emptyColor={theme === "dark" ? "#1f2937" : "#f3f4f6"}

        margin={{ top: 40, right: 20, bottom: 20, left: 20 }}
        yearSpacing={30}
        monthBorderWidth={0}

        daySpacing={3}
        dayBorderWidth={0}
        dayRadius={4}

        legends={legends}

        theme={{
          textColor: theme === "dark" ? "#e5e7eb" : "#374151",
          tooltip: {
            container: {
              background: theme === "dark" ? "#1f2937" : "#ffffff",
              color: theme === "dark" ? "#f9fafb" : "#111827",
              borderRadius: 8,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              padding: "8px 12px",
            },
          },
        }}
      />
    </div>
  );
}

// function Heatmap({
//   data = [],
//   startDate,
//   endDate,
//   theme = "light",
// }) {
//   const [currentMonth, setCurrentMonth] = React.useState(
//     startDate ? new Date(startDate) : new Date()
//   );

//   // Map backend data: { "2025-12-01": status }
//   const statusMap = useMemo(() => {
//     const map = {};
//     data.forEach((d) => {
//       map[d.day] = d.value;
//     });
//     return map;
//   }, [data]);

//   // Status → UI style (match your picture)
//   const STATUS_STYLES = {
//     0: theme === "dark" ? "bg-red-900 text-red-300" : "bg-red-200 text-red-700",     // Absent
//     1: theme === "dark" ? "bg-green-900 text-green-300" : "bg-green-200 text-green-700", // Present
//     2: theme === "dark" ? "bg-yellow-900 text-yellow-300" : "bg-yellow-200 text-yellow-700", // Late
//     3: theme === "dark" ? "bg-blue-900 text-blue-300" : "bg-blue-200 text-blue-700", // Permission
//   };

//   const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
//   const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

//   // Start from Monday
//   const calendarStart = new Date(monthStart);
//   calendarStart.setDate(calendarStart.getDate() - ((calendarStart.getDay() + 6) % 7));

//   const days = [];
//   for (let d = new Date(calendarStart); d <= monthEnd || d.getDay() !== 1; d.setDate(d.getDate() + 1)) {
//     days.push(new Date(d));
//   }

//   return (
//     <div
//       className={`rounded-2xl shadow p-5 ${
//         theme === "dark" ? "bg-gray-900  text-gray-100" : " bg-slate-50 text-gray-800"
//       }`}
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between mb-5">
//         <button
//           onClick={() =>
//             setCurrentMonth(
//               new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
//             )
//           }
//         >
//           ◀
//         </button>

//         <h3 className="text-lg font-semibold">
//           {currentMonth.toLocaleString("default", {
//             month: "long",
//             year: "numeric",
//           })}
//         </h3>

//         <button
//           onClick={() =>
//             setCurrentMonth(
//               new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
//             )
//           }
//         >
//           ▶
//         </button>
//       </div>

//       {/* Weekdays */}
//       <div className="grid grid-cols-7 text-center text-xs opacity-70 mb-2">
//         {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
//           <div key={d}>{d}</div>
//         ))}
//       </div>

//       {/* Calendar Grid */}
//       <div className="grid grid-cols-7 gap-2">
//         {days.map((date, i) => {
//           const key = [
//             date.getFullYear(),
//             String(date.getMonth() + 1).padStart(2, "0"),
//             String(date.getDate()).padStart(2, "0"),
//           ].join("-");

//           const status = statusMap[key];
//           const inMonth = date.getMonth() === currentMonth.getMonth();

//           return (
//             <div
//               key={i}
//               className={`h-8 rounded-xl shadow flex items-center justify-center text-shadow-black font-medium
//                 ${inMonth ? "" : "opacity-30"}
//                 ${
//                   status !== undefined
//                     ? STATUS_STYLES[status]
//                     : theme === "dark"
//                     ? "bg-gray-800"
//                     : "bg-gray-100"
//                 }`}
//             >
//               {date.getDate()}
//             </div>
//           );
//         })}
//       </div>

//       {/* Legend */}
//       <div className="flex flex-wrap gap-4 mt-5 text-xs">
//         <span className="flex items-center gap-1">
//           <span className="w-3 h-3 rounded bg-green-400" /> Present
//         </span>
//         <span className="flex items-center gap-1">
//           <span className="w-3 h-3 rounded bg-red-400" /> Absent
//         </span>
//         <span className="flex items-center gap-1">
//           <span className="w-3 h-3 rounded bg-yellow-400" /> Late
//         </span>
//         <span className="flex items-center gap-1">
//           <span className="w-3 h-3 rounded bg-blue-400" /> Permission
//         </span>
//       </div>
//     </div>
//   );
// }

function Heatmap({
  data = [],
  startDate,
  endDate,
  theme = "light", // kept for backward compatibility, but we'll use Tailwind dark: classes
}) {
  const [currentMonth, setCurrentMonth] = React.useState(
    startDate ? new Date(startDate) : new Date()
  );

  // Map backend data: { "2025-12-01": status }
  const statusMap = useMemo(() => {
    const map = {};
    data.forEach((d) => {
      map[d.day] = d.value;
    });
    return map;
  }, [data]);

  // Status → Tailwind classes (optimized for both light & dark)
  const STATUS_STYLES = {
    0: "bg-red-200 text-red-800  dark:bg-red-900 dark:text-red-300 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600",     // Absent
    1: "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600", // Present
    2: "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600", // Late
    3: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600",   // Permission
  };

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // Start calendar from Monday
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - ((calendarStart.getDay() + 6) % 7));

  const days = [];
  for (let d = new Date(calendarStart); d <= monthEnd || d.getDay() !== 1; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return (
    <div className="rounded-2xl shadow p-6 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 bg-slate-50 dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
            )
          }
          className="w-10 h-10 rounded-full dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 transition"
        >
          ◀
        </button>

        <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
            )
          }
          className="w-10 h-10 rounded-full dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 transition"
        >
          ▶
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((date, i) => {
          const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
          ].join("-");

          const status = statusMap[key];
          const inMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <div
              key={i}
              className={`
                aspect-square rounded-xl dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 h-8 flex items-center justify-center text-sm font-semibold
                transition-all duration-200 shadow-sm
                ${inMonth ? "opacity-100" : "opacity-40"}
                ${
                  status !== undefined
                    ? STATUS_STYLES[status]
                    : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500"
                }
              `}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
        <span className="flex items-center  gap-2">
          <span className="w-4 h-4 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded  bg-green-500" />
          <span className="text-gray-700 dark:text-slate-300">Present</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 bg-red-500" />
          <span className="text-gray-700 dark:text-slate-300">Absent</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 bg-amber-500" />
          <span className="text-gray-700 dark:text-slate-300">Late</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 bg-blue-500" />
          <span className="text-gray-700 dark:text-slate-300">Permission</span>
        </span>
      </div>
    </div>
  );
}

export default Heatmap;
function BarCharty({
  data = [],
  keys = [],
  indexBy = "month",
  height = 300,
}) {
  if (data.length === 0) return <div>No data available</div>;

  const maxValue = Math.max(
    1,
    ...data.flatMap((row) => keys.map((k) => row[k] || 0))
  );

  const COLORS = {
    present: "bg-green-500 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600",
    absent: "bg-red-500 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600",
    Permission: "bg-blue-500 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600",
  };

  return (
    <div
      className="w-full rounded-2xl p-5 bg-white dark:bg-zinc-900 shadow"
      style={{ height }}
    >
      {/* Chart Area */}
      <div className="flex items-end justify-around h-full pb-8"> {/* ← Key fix: justify-around */}
        {data.map((row, i) => (
          <div key={i} className="flex flex-col items-center flex-1 max-w-xs">
            {/* Grouped bars for this month */}
            <div className="flex items-end justify-center gap-3 h-full w-full">
              {keys.map((key) => {
                const value = row[key] || 0;
                const barHeight = value === 0 ? 2 : (value / maxValue) * 100; // min height for visibility

                return (
                  <div
                    key={key}
                    className={`rounded-t-lg transition-all ${COLORS[key] || "bg-gray-400"}`}
                    style={{
                      height: `${barHeight}%`,
                      width: "32px", // fixed wider width
                    }}
                    title={`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}
                  >
                    {/* Optional: show value on top if tall enough */}
                    {barHeight > 20 && (
                      <span className="text-xs text-white font-medium block mt-1 text-center">
                        {value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Month Label */}
            <span className="mt-4 text-sm font-medium text-zinc-700">
              {row[indexBy]}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 text-sm">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${COLORS[key] || "bg-gray-400"}`} />
            <span className="capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BarChart({ data = [], keys = [], indexBy = "month" }) {
  // Prepare chart data
  const chartData = {
    labels: data.map((d) => d[indexBy]),
    datasets: keys.map((key, i) => ({
      label: key,
      data: data.map((d) => d[key] || 0),
      backgroundColor: ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b"][i % 4],
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}


// export function AttendanceNivoPie({ data }) {
//   if (!data) return <div>Loading chart...</div>;

//   const chartData = data
//     .filter((item) => item.Title !== "Total Days")
//     .map((item) => ({
//       id: item.Title,
//       label: item.Title,
//       value: item.data,
//       color:
//         item.Title === "Present"
//           ? "#22c55e"
//           : item.Title === "Absent"
//           ? "#ef4444"
//           : item.Title === "Late"
//           ? "#f59e0b"
//           : "#3b82f6",
//     }));

//   return (
//     <div className="w-full h-96 bg-slate-50 dark:bg-zinc-900 rounded-2xl shadow p-4">
//       <ResponsivePie
//         data={chartData}
//         margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
//         innerRadius={0.5} // donut
//         padAngle={1}
//         cornerRadius={5}
//         colors={{ datum: "data.color" }}
//         borderWidth={1}
//         borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
//         radialLabelsSkipAngle={10}
//         radialLabelsTextColor="#333"
//         radialLabelsLinkColor={{ from: "color" }}
//         sliceLabelsSkipAngle={10}
//         sliceLabelsTextColor="#fff"
//         animate={true}
//         motionConfig="gentle"

//         // ADD SVG FILTERS FOR SHADOW
//         defs={[
//           {
//             id: "slice-shadow",
//             type: "filter",
//             filter: `
//               <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
//                 <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.25)" />
//               </filter>
//             `,
//           },
//         ]}
//         fill={chartData.map(() => ({ match: "*", id: "slice-shadow" }))}
//       />
//     </div>
//   );
// }

export function AttendanceNivoPie({ data }) {
  if (!data) {
    return (
      <div className="w-full h-96 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow p-4 flex items-center justify-center text-gray-500 dark:text-slate-400">
        Loading chart...
      </div>
    );
  }

  const chartData = data
    .filter((item) => item.Title !== "Total Days")
    .map((item) => ({
      id: item.Title,
      label: item.Title,
      value: item.data,
      color:
        item.Title === "Present"
          ? "#22c55e"   // green-500
          : item.Title === "Absent"
            ? "#ef4444"   // red-500
            : item.Title === "Late"
              ? "#f59e0b"   // amber-500
              : "#3b82f6",  // blue-500
    }));

  return (
    <div className="w-full h-96 bg-slate-50  rounded-2xl shadow dark:bg-slate-800 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 p-6">
      <ResponsivePie
        data={chartData}
        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
        innerRadius={0.55} // Slightly larger hole for donut look
        padAngle={2}
        cornerRadius={8}
        activeOuterRadiusOffset={10}
        colors={{ datum: "data.color" }}
        borderWidth={2}
        borderColor={{ from: "color", modifiers: [["darker", 0.4]] }}

        // Radial labels (outside spokes)
        radialLabelsSkipAngle={10}
        radialLabelsTextColor={{ theme: "labels.textColor" }}
        radialLabelsLinkColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        radialLabelsLinkStrokeWidth={2}

        // Slice labels (inside)
        sliceLabelsSkipAngle={12}
        sliceLabelsTextColor="#ffffff"
        sliceLabelsRadiusOffset={0.65}

        animate={true}
        motionConfig="gentle"

        // Theme for text/grid/tooltip
        theme={{
          labels: {
            text: {
              fill: "#374151", // light mode text
              fontSize: 12,
              fontWeight: 600,
            },
          },
          tooltip: {
            container: {
              background: "#ffffff",
              color: "#111827",
              fontSize: 13,
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
          },
          // Dark mode overrides
          dark: {
            labels: {
              text: {
                fill: "#e2e8f0", // slate-200
              },
            },
            tooltip: {
              container: {
                background: "#1e293b",
                color: "#f1f5f9",
              },
            },
          },
        }}

        // Enhanced drop shadow for slices
        defs={[
          {
            id: "slice-shadow",
            type: "dropShadow",
            color: "rgba(0, 0, 0, 0.3)",
            blur: 6,
            offsetX: 2,
            offsetY: 4,
          },
        ]}
        fill={[
          {
            match: "*",
            id: "slice-shadow",
          },
        ]}

        // Optional: Add legends at bottom
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            justify: false,
            translateY: 60,
            itemsSpacing: 20,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: "left-to-right",
            symbolSize: 14,
            symbolShape: "circle",
            effects: [
              {
                on: "hover",
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
      />
    </div>
  );
}



export { BarChart, Heatmap };
