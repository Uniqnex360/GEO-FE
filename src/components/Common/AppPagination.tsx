// components/Common/Pagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  onPageChange: (page: number) => void; // Fixed signature: expects a clean number now
}

export function AppPagination({
  currentPage,
  totalPages,
  totalEntries,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
      <p>
        Showing Page{" "}
        <span className="font-semibold text-slate-800">{currentPage}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span> (
        {totalEntries} entries)
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))} // Explicit state calculation passed down
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} // Explicit state calculation passed down
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
