import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function DateRangeFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlStartDate = searchParams.get("start_date") || "";
  const urlEndDate = searchParams.get("end_date") || "";

  const [startDate, setStartDate] = useState(urlStartDate);
  const [endDate, setEndDate] = useState(urlEndDate);

  // Keep local state synchronized with URL
  useEffect(() => {
    setStartDate(urlStartDate);
    setEndDate(urlEndDate);
  }, [urlStartDate, urlEndDate]);

  const updateUrl = (newStartDate: string, newEndDate: string) => {
    // Don't update URL until both dates exist
    if (!newStartDate || !newEndDate) {
      return;
    }

    // Don't allow invalid range
    if (newStartDate > newEndDate) {
      return;
    }

    const params = new URLSearchParams(searchParams);

    params.set("start_date", newStartDate);
    params.set("end_date", newEndDate);

    setSearchParams(params);
  };

  const handleStartDateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;

    setStartDate(value);

    updateUrl(value, endDate);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setEndDate(value);

    updateUrl(startDate, value);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Start Date */}
      <div className="flex flex-col">
        <div className="relative">
          {!endDate && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
              Start Date
            </span>
          )}

          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={handleStartDateChange}
            className={`h-10 rounded-lg border cursor-pointer border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              !endDate ? "text-transparent" : ""
            }`}
          />
        </div>
      </div>

      {/* End Date */}
      <div className="flex flex-col">
        <div className="relative">
          {!endDate && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
              End Date
            </span>
          )}

          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={handleEndDateChange}
            className={`h-10 rounded-lg border cursor-pointer border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              !endDate ? "text-transparent" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
}
