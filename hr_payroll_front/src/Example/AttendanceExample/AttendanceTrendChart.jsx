import React from "react";
import { ResponsiveBar } from "@nivo/bar";

export default function AttendanceTrendChart({ data }) {
  return (
    <ResponsiveBar
      data={data}
      keys={["present", "absent", "leave"]}
      indexBy="month"
      margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
      padding={0.3}
      valueScale={{ type: "linear" }}
      indexScale={{ type: "band", round: true }}
      colors={{ scheme: "nivo" }}
      borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Month",
        legendPosition: "middle",
        legendOffset: 32,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Days",
        legendPosition: "middle",
        legendOffset: -32,
      }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      legends={[
        {
          dataFrom: "keys",
          anchor: "bottom-right",
          direction: "row",
          translateY: 40,
          itemsSpacing: 2,
          itemWidth: 80,
          itemHeight: 20,
          itemDirection: "left-to-right",
        },
      ]}
      role="application"
      ariaLabel="Attendance Trend"
    />
  );
}
