import React, { useEffect, useState } from "react";
import { useTables } from "./TableProvider";
import Table from "../Components/Table";

const TABLE_KEY = "employees";

export default function ExampleTable() {
  const { fetchTableData, getTable } = useTables();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchTableData(TABLE_KEY, "/api/employees/"); // your backend API
      setLoading(false);
    };
    load();
  }, [fetchTableData]);

  const table = getTable(TABLE_KEY);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Employee Directory</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table
          Data={table.Data}
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
