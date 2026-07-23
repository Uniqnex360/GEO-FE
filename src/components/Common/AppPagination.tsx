// components/Common/AppPagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
}

export function AppPagination({
  currentPage = 1,
  totalPages = 1,
  totalEntries = 0,
  onPageChange,
}: PaginationProps) {
  // Ensure valid numeric values even if parent passes NaN or undefined
  const validPage = isNaN(currentPage) || currentPage < 1 ? 1 : currentPage;
  const validTotalPages = isNaN(totalPages) || totalPages < 1 ? 1 : totalPages;

  if (validTotalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
      <p>
        Showing Page{" "}
        <span className="font-semibold text-slate-800">{validPage}</span> of{" "}
        <span className="font-semibold text-slate-800">{validTotalPages}</span>{" "}
        ({totalEntries} entries)
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={validPage <= 1}
          onClick={() => onPageChange(Math.max(validPage - 1, 1))}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled={validPage >= validTotalPages}
          onClick={() => onPageChange(Math.min(validPage + 1, validTotalPages))}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
