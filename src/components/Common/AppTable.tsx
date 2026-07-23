import { useRef, useState, useEffect } from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  customTruncate?: boolean;
  truncateLength?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  isLoading?: boolean;
}

export default function AppTable({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  isLoading = false,
}: DataTableProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  const updateHeight = () => {
    if (divRef.current) {
      const top = divRef.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      setHeight(Math.floor(windowHeight - top));
    }
  };

  useEffect(() => {
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [data]);

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "-";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((acc, key) => {
      if (typeof acc === "string") {
        try {
          acc = JSON.parse(acc);
        } catch {
          return undefined;
        }
      }
      return acc?.[key];
    }, obj);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-900">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* horizontal scroll */}
      {/* <div className="overflow-x-auto"> */}
      <div
        className="
            overflow-x-auto
            scrollbar-thin
            scrollbar-thumb-gray-700
            scrollbar-track-gray-900
            hover:scrollbar-thumb-gray-600
          "
      >
        {/* vertical scroll */}
        {/* <div ref={divRef} style={{ maxHeight: height, overflowY: "auto" }}> */}
        <div
          ref={divRef}
          style={{ maxHeight: height }}
          className="
            overflow-y-auto
            scrollbar-thin
            scrollbar-thumb-gray-200
           
            hover:scrollbar-thumb-gray-400
          "
        >
          <table className="w-full min-w-max border-collapse">
            <thead className="bg-white border-b border-gray-300 sticky top-0 z-0">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width || "auto" }}
                    className="px-6 py-3 text-left text-xs font-medium bg-white tracking-wider"
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => onSort?.(column.key)}
                        className="flex items-center gap-3 text-slate-900 hover:text-slate-700 transition-colors w-full"
                      >
                        <span className="truncate">{column.label}</span>
                        <span className="shrink-0 cursor-pointer">
                          {sortKey === column.key ? (
                            sortDirection === "asc" ? (
                              <FiChevronUp
                                size={14}
                                className="text-blue-600"
                              />
                            ) : (
                              <FiChevronDown
                                size={14}
                                className="text-blue-600"
                              />
                            )
                          ) : (
                            <FiChevronDown
                              size={14}
                              className="text-slate-800"
                            />
                          )}
                        </span>
                      </button>
                    ) : (
                      <span className="truncate">{column.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-slate-900"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column) => {
                      // ✅ FIX: compute once
                      const value = getNestedValue(row, column.key);

                      return (
                        <td
                          key={column.key}
                          className="px-6 py-4 text-sm text-slate-900"
                        >
                          <div
                            title={String(value || "")}
                            className="truncate max-w-37.5 md:max-w-50 lg:max-w-75"
                          >
                            {column.customTruncate === true
                              ? truncateText(
                                  String(value),
                                  column.truncateLength ?? 15,
                                )
                              : column.render
                                ? column.render(value, row)
                                : (value ?? "-")}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
