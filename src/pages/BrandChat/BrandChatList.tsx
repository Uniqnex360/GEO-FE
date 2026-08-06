import { useState, useEffect, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import {  BarChart3, Globe } from "lucide-react";

import { selectGlobalProjectId } from "../../store/projectSlice";

import AppTable from "../../components/Common/AppTable";
import { AppSearch } from "../../components/Common/AppSearch";
import { AppPagination } from "../../components/Common/AppPagination";

import { brandService } from "../../api/brand";

// --- Type Definitions matching API Payload ---
export type BrandMetricAverages = {
  overall_score: number;
  mention_score: number;
  citation_score: number;
  share_of_voice_score: number;
  product_coverage_score: number;
  category_coverage_score: number;
  knowledge_graph_score: number;
  authority_score: number;
  sentiment_score: number;
};

export type BrandAnalyticsItem = {
  brand_id: number;
  brand_name: string;
  domain: string | null;
  industry: string | null;
  country: string | null;
  is_competitor: boolean | null;
  total_runs: number;
  latest_run_at: string | null;
  averages: BrandMetricAverages;
};

export type BrandAnalyticsResponse = {
  status: string;
  data: BrandAnalyticsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export default function BrandChatList() {
  const navigate = useNavigate();

  // --- Redux Project / Tenant State ---
  const reduxProjectId = useSelector(selectGlobalProjectId);

  // --- URL State Management via React Router ---
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort_by") || "";
  const sortOrder =
    (searchParams.get("sort_order") as "asc" | "desc") || "desc";
  const limit = 24;

  // --- Local Search State for Debouncing ---
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // --- Search & Page State Sync Helpers ---
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
    params.set("page", "1"); // Reset pagination on search change
    setSearchParams(params);
  };

  // Debounce search effect (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync local search if URL updates externally
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // --- Sorting Handler ---
  const handleSort = (key: string) => {
    const backendSortKeyMap: Record<string, string> = {
      brand_name: "brand_name",
      total_runs: "total_runs",
      overall_score: "overall_score",
      mention_score: "mention_score",
      latest_run_at: "latest_run_at",
    };

    const targetKey = backendSortKeyMap[key] || key;
    const params = new URLSearchParams(searchParams);

    if (sortBy === targetKey) {
      if (sortOrder === "asc") {
        params.set("sort_order", "desc");
      } else {
        params.delete("sort_by");
        params.delete("sort_order");
      }
    } else {
      params.set("sort_by", targetKey);
      params.set("sort_order", "asc");
    }

    params.set("page", "1");
    setSearchParams(params);
  };

  const activeSortKeyMap: Record<string, string> = {
    brand_name: "brand_name",
    total_runs: "total_runs",
    overall_score: "overall_score",
    mention_score: "mention_score",
    latest_run_at: "latest_run_at",
  };
  const activeTableSortKey = activeSortKeyMap[sortBy] || sortBy;

  // =========================
  // Query (Analytics List View)
  // =========================
  const { data, isLoading, isPending } = useQuery<BrandAnalyticsResponse>({
    queryKey: [
      "brand-analytics-list",
      reduxProjectId,
      page,
      searchTerm,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      brandService.getBrandAnalyticsList({
        tenant_id: reduxProjectId ? Number(reduxProjectId) : undefined,
        page,
        limit,
        search: searchTerm || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined,
      }),
    enabled: !!reduxProjectId,
    placeholderData: keepPreviousData,
  });

  // Extract raw list
  const rawList: BrandAnalyticsItem[] = Array.isArray(data?.data)
    ? data.data
    : [];

  const paginationData = data?.pagination;
  const totalEntries = paginationData?.total ?? 0;
  const totalPages = paginationData?.total_pages ?? 1;

  // Prefix/contains fallback search filtering for client UI responsiveness
  const brandList = useMemo(() => {
    if (!localSearch.trim()) return rawList;
    const query = localSearch.toLowerCase().trim();
    return rawList.filter((item) =>
      item.brand_name?.toLowerCase().includes(query),
    );
  }, [rawList, localSearch]);

  // =========================
  // Table Columns Definition
  // =========================
  const columns = [
    {
      key: "brand_name",
      label: "BRAND",
      sortable: true,
      render: (_: any, row: BrandAnalyticsItem) => {
        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">
                {row.brand_name}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {row.domain ? (
                  <span className="flex items-center gap-1">
                    <Globe size={12} /> {row.domain}
                  </span>
                ) : (
                  <span>No Domain</span>
                )}
                {row.country && (
                  <>
                    <span>•</span>
                    <span>{row.country}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },

    {
      key: "total_runs",
      label: "ANALYTIC RUNS",
      sortable: true,
      render: (value: number) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
          {value ?? 0} {value === 1 ? "Run" : "Runs"}
        </span>
      ),
    },

    {
      key: "overall_score",
      label: "OVERALL SCORE",
      sortable: true,
      render: (_: any, row: BrandAnalyticsItem) => {
        const score = row.averages?.overall_score ?? 0;

        const getBarColor = (val: number) => {
          if (val >= 50) return "bg-emerald-500";
          if (val >= 20) return "bg-sky-500";
          if (val > 0) return "bg-amber-500";
          return "bg-slate-300";
        };

        return (
          <div className="flex items-center gap-3 min-w-[140px] max-w-[180px]">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getBarColor(
                  score,
                )}`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
            <span className="text-slate-800 font-semibold text-xs min-w-[36px] text-right">
              {score.toFixed(1)}
            </span>
          </div>
        );
      },
    },

    {
      key: "mention_score",
      label: "MENTION SCORE",
      sortable: true,
      render: (_: any, row: BrandAnalyticsItem) => {
        const score = row.averages?.mention_score ?? 0;

        const getBadgeStyle = (val: number) => {
          if (val >= 40)
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
          if (val >= 15) return "bg-blue-50 text-blue-700 border-blue-200";
          if (val > 0) return "bg-amber-50 text-amber-700 border-amber-200";
          return "bg-slate-50 text-slate-400 border-slate-200";
        };

        return (
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
                score,
              )}`}
            >
              {score.toFixed(1)}
            </span>
          </div>
        );
      },
    },

    {
      key: "latest_run_at",
      label: "LAST ANALYZED",
      sortable: true,
      render: (value: string | null) => {
        if (!value) {
          return <span className="text-slate-400 text-xs">-</span>;
        }

        const date = new Date(value);
        return (
          <span className="text-slate-600 text-xs font-medium">
            {date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
    },

    {
      key: "actions",
      label: "ACTIONS",
      render: (_: unknown, row: BrandAnalyticsItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/brand-chat/${row.brand_id}`)}
            title="View Details"
            className="text-slate-600 hover:text-emerald-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <BarChart3 size={16} />
          </button>
          
        </div>
      ),
    },
  ];

  // --- Unselected Context Fallback ---
  if (!reduxProjectId) {
    return (
      <div className="p-8 text-slate-500 font-medium text-center">
        Please select a project/tenant to view brand analytics list.
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex mb-2">
        <div className="w-1/2 ml-auto">
          <AppSearch
            value={localSearch}
            onChange={(val) => setLocalSearch(val)}
            placeholder="Search brand analytics..."
          />
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <AppTable
        columns={columns}
        data={brandList}
        isLoading={isLoading || isPending}
        sortKey={activeTableSortKey}
        sortDirection={sortOrder}
        onSort={handleSort}
      />

      {/* PAGINATION FOOTER */}
      {paginationData && (
        <AppPagination
          currentPage={page}
          totalPages={totalPages}
          totalEntries={totalEntries}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
