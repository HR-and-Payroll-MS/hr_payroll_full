import { useEffect, useState } from "react";
import Dropdown from "./Dropdown";
import Icon from "./Icon";

export default function SearchDate({
  onSubmit,
  isSingle = false,
  style = "border border-slate-200 bg-slate-50 shadow",
  applyButton = true, // ← New prop
}) {
  const [mode, setMode] = useState("single");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [clicked, setClicked] = useState(false);

  // Auto-submit logic when applyButton is false
  useEffect(() => {
    if (!applyButton) {
      // Auto-submit as soon as valid data is present
      if (isSingle && singleDate) {
        onSubmit?.(singleDate);
      } else if (!isSingle) {
        if (mode === "single" && singleDate) {
          onSubmit?.({ type: "single", date: singleDate });
        } else if (mode === "range" && startDate && endDate) {
          onSubmit?.({ type: "range", from: startDate, to: endDate });
        }
      }
    }
  }, [
    applyButton,
    isSingle,
    mode,
    singleDate,
    startDate,
    endDate,
    onSubmit,
  ]);

  // Manual submit (only used when applyButton is true)
  const handleSubmit = () => {
    let valid = false;

    if (isSingle) {
      if (singleDate) {
        valid = true;
        onSubmit?.(singleDate);
      }
    } else {
      if (mode === "single" && singleDate) {
        valid = true;
        onSubmit?.({ type: "single", date: singleDate });
      } else if (mode === "range" && startDate && endDate) {
        valid = true;
        onSubmit?.({ type: "range", from: startDate, to: endDate });
      }
    }

    if (valid) {
      setClicked(true);
      // Optional: reset clicked state after a delay for visual feedback
      setTimeout(() => setClicked(false), 2000);
    }
  };

  const choice = ["single", "range"];

  return (
    <div
      className={`px-3 text-xs rounded-xl w-fit flex gap-3 ${style} items-center`}
    >
      {/* Mode Switch */}
      {!isSingle && (
        <Dropdown
          placeholder="Choose Type"
          border=""
          options={choice}
          onChange={setMode}
        />
      )}

      {/* Force single mode if isSingle is true */}
      {(isSingle || mode === "single") && (
        <input
          type="date"
          value={singleDate}
          onChange={(e) => setSingleDate(e.target.value)}
          className="border px-2 py-1 rounded-md"
        />
      )}

      {/* Range */}
      {mode === "range" && !isSingle && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-2 py-1 rounded-md"
          />
          <span className="font-semibold">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-2 py-1 rounded-md"
          />
        </div>
      )}

      {/* Apply Button - only shown when applyButton is true */}
      {applyButton && (
        <button
          onClick={handleSubmit}
          className="bg-slate-800 text-xs cursor-pointer text-white px-3 py-1 rounded-md hover:bg-slate-950 transition flex items-center gap-1"
        >
          {clicked ? (
            <>
              <Icon name="Check" className="w-4 h-4" />
              Applied
            </>
          ) : (
            "Apply"
          )}
        </button>
      )}
    </div>
  );
}