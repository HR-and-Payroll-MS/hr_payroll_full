import React from "react";
import SummaryCard from "../../Components/SummaryCard";

export default function AttendanceSummaryCards({ data }) {
  const cards = [
    { Title: "Total Days", and:"days",color:"bg-indigo-500",logo:"Calendar", data: 1232 },
    { Title: "Present", and:"days",color:"bg-amber-500",logo:"Calendar", data: 1231 },
    { Title: "Absent", and:"days",color:"bg-yellow-500",logo:"Calendar", data: 1 },
    { Title: "Late", and:"days",color:"bg-green-500",logo:"Calendar", data: 4 },
    { Title: "Leave", and:"days",color:"bg-blue-500",logo:"Calendar", data: 6 },
  ];

  return (
    <div className="">
      <SummaryCard data={cards}/>
    </div>

  );
  
}
