import React from "react";
import { ResponsiveCalendar } from "@nivo/calendar";

export default function AttendanceHeatmap({ data }) {
  const startDate = "2025-01-01";
  const endDate = "2025-12-31";

  return (
    <ResponsiveCalendar
      data={data}
      from={startDate}
      to={endDate}
      emptyColor="#f3f4f6"
      colors={["#d1fae5", "#86efac", "#4ade80", "#22c55e", "#15803d"]}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      yearSpacing={40}
      monthBorderColor="#e5e7eb"
      dayBorderWidth={1}
      dayBorderColor="#e5e7eb"
      legends={[
        {
          anchor: "bottom-right",
          direction: "row",
          translateY: 30,
          itemCount: 4,
          itemWidth: 42,
          itemHeight: 12,
          itemsSpacing: 4,
          itemDirection: "right-to-left",
        },
      ]}
    />
  );
}
