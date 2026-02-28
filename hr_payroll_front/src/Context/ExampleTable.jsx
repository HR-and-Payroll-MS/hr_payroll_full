import React from "react";
import { useTable } from "./useTable";
import Table from "../Components/Table";

const TABLE_KEY = "employees";

export default function ExampleTable() {
  const { data, isLoading } = useTable(TABLE_KEY);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Employee Directory</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Table
          Data={data}
          title={["Name", "Email", "Department"]}
          Structure={[1, 1, 1]}
          ke={[["name"], ["email"], ["department"]]}
          clickable={false}
          totPage={10}
        />
      )}
    </div>
  );
}
