import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { AxiosError } from "axios";

// Reusable components
import AppTable from "../../components/Common/AppTable";
import { AppSearch } from "../../components/Common/AppSearch";
import { AppPagination } from "../../components/Common/AppPagination";

// Replace with your actual service import
import { metaService } from "../../api/meta";

export interface TaxonomyItem {
  id: number;
  category_name: string;
  industry_name: string;
  taxonomy: string;
  end_category: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaxonomyBackendResponse {
  items: TaxonomyItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

type ApiError = { message?: string; detail?: string };

export default function Taxonomy() {
  // --- URL State Management ---
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort_by") || "";
  const sortOrder =
    (searchParams.get("sort_order") as "asc" | "desc") || "desc";
  const limit = 24;

  // --- Local Search State for Debouncing ---
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // --- Helpers for Syncing URL Params ---
  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
  };

  const setSearchTerm = (newSearch: string) => {
    const params = new URLSearchParams(searchParams);
    if (newSearch) {
      params.set("search", newSearch);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
  };

  // --- Sorting Handler ---
  const handleSort = (key: string) => {
    const params = new URLSearchParams(searchParams);

    if (sortBy === key) {
      if (sortOrder === "asc") {
        params.set("sort_order", "desc");
      } else {
        params.delete("sort_by");
        params.delete("sort_order");
      }
    } else {
      params.set("sort_by", key);
      params.set("sort_order", "asc");
    }

    params.set("page", "1");
    setSearchParams(params);
  };

  // Debounce search updates (300ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync state if URL search param changes externally
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // --- Fetching Data ---
  const {
    data: taxonomyData,
    isPending,
    isError,
  } = useQuery<TaxonomyBackendResponse, AxiosError<ApiError>>({
    queryKey: ["taxonomies", page, searchTerm, sortBy, sortOrder],
    queryFn: () =>
      metaService.get_taxonomy(
        searchTerm,
        page,
        limit,
        sortBy || undefined,
        sortOrder || undefined,
      ),
    placeholderData: keepPreviousData,
  });

  console.log("adlkfafd", taxonomyData)

  const taxonomies = taxonomyData?.items || [];
  const paginationData = taxonomyData?.pagination;
  const totalPages = paginationData
    ? Math.ceil(paginationData.total / paginationData.limit)
    : 1;

  // --- Table Columns Definition ---
  const columns = [
    {
      key: "end_category",
      label: "END CATEGORY",
      sortable: true,
      render: (value: string, row: TaxonomyItem) => (
        <span
          className="font-semibold text-slate-900 cursor-help border-b border-dashed border-slate-300 pb-0.5"
          title={row.taxonomy}
        >
          {value || row.category_name || "-"}
        </span>
      ),
    },
    {
      key: "taxonomy",
      label: "Taxonomy"
    },
    {
      key: "category_name",
      label: "CATEGORY NAME",
      sortable: true,
      render: (value: string, row: TaxonomyItem) => (
        <span className="text-slate-700 cursor-help" title={row.taxonomy}>
          {value || "-"}
        </span>
      ),
    },
    {
      key: "industry_name",
      label: "INDUSTRY",
      sortable: true,
      render: (value: string) => (
        <span className="text-slate-900 font-medium">{value || "-"}</span>
      ),
    },

  ];

  if (isPending)
    return <div className="p-6 text-slate-500">Loading taxonomies...</div>;
  if (isError)
    return <div className="p-6 text-red-500">Failed to load taxonomies.</div>;

  return (
    <div className="p-6">
      {/* SEARCH HEADER */}
      <div className="mb-6 flex">
        <div className="w-1/2 ml-auto">
          <AppSearch
            value={localSearch}
            onChange={(val) => handleSearchChange(val)}
            placeholder="Search category, industry, or taxonomy..."
          />
        </div>
      </div>

      {/* TAXONOMY TABLE */}
      <AppTable
        columns={columns}
        data={taxonomies}
        isLoading={isPending}
        sortKey={sortBy}
        sortDirection={sortOrder}
        onSort={handleSort}
      />

      {/* PAGINATION FOOTER */}
      {paginationData && (
        <div className="mt-6">
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            totalEntries={paginationData.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
