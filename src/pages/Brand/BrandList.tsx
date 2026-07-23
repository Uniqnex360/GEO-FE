import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import { selectGlobalProjectId } from "../../store/projectSlice";

import AppTable from "../../components/Common/AppTable";
import AppModal from "../../components/Common/AppModel";
import { AppSearch } from "../../components/Common/AppSearch";
import { AppPagination } from "../../components/Common/AppPagination";

import BrandForm from "./BrandForm";
import BrandDelete from "./BrandDelete";

import { brandService, type Brand } from "../../api/brand";
import type { BrandCU } from "./BrandForm";

type ApiError = {
  message?: string;
};

export default function Brand() {
  const queryClient = useQueryClient();

  // --- Redux Project State ---
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
    params.set("page", "1"); // Reset pagination context on search change
    setSearchParams(params);
  };

  // Debounce search effect (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync local search if external URL changes
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // --- Sorting Handler ---
  const handleSort = (key: string) => {
    // Map Frontend Column Keys -> Backend API Parameter Keys
    const backendSortKeyMap: Record<string, string> = {
      name: "name",
      country: "country",
      visibilityScore: "visibility",
      mentionRate: "mention_rate",
    };

    const targetKey = backendSortKeyMap[key] || key;
    const params = new URLSearchParams(searchParams);

    if (sortBy === targetKey) {
      if (sortOrder === "asc") {
        params.set("sort_order", "desc");
      } else {
        // Clear sorting when toggled past descending
        params.delete("sort_by");
        params.delete("sort_order");
      }
    } else {
      params.set("sort_by", targetKey);
      params.set("sort_order", "asc");
    }

    params.set("page", "1"); // Reset to page 1 on sort change
    setSearchParams(params);
  };

  // Reverse mapping from backend query key to frontend table column key
  const activeSortKeyMap: Record<string, string> = {
    name: "name",
    country: "country",
    visibility: "visibilityScore",
    mention_rate: "mentionRate",
  };
  const activeTableSortKey = activeSortKeyMap[sortBy] || sortBy;

  // Local Component Modal States
  const [drawer, setDrawer] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandCU | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  const invalidateBrands = () =>
    queryClient.invalidateQueries({
      queryKey: ["brands", reduxProjectId],
    });

  const getErrorMessage = (error: AxiosError<ApiError>) => {
    return (
      error.response?.data?.message || error.message || "Something went wrong"
    );
  };

  const handleMutationError = (error: AxiosError<ApiError>) => {
    console.log(error);
    toast.error(getErrorMessage(error));
  };

  const handleMutationSuccess = (message: string, close?: () => void) => {
    toast.success(message);
    invalidateBrands();
    close?.();
  };

  // =========================
  // Query (List View)
  // =========================
  const { data, isLoading, isPending } = useQuery({
    queryKey: ["brands", reduxProjectId, page, searchTerm, sortBy, sortOrder],
    queryFn: () =>
      brandService.getBrands({
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
  const rawBrands: Brand[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  const paginationData = data?.pagination;

  // Safe unwrapping for nested backend response {"pagination": {"total": {"total": 8, "total_pages": 1}}}
  const totalEntries = useMemo(() => {
    if (!paginationData) return 0;
    if (
      typeof paginationData.total === "object" &&
      paginationData.total !== null
    ) {
      return Number((paginationData.total as any).total ?? 0);
    }
    return Number(paginationData.total ?? 0);
  }, [paginationData]);

  const totalPages = useMemo(() => {
    if (!paginationData) return 1;
    if (
      typeof paginationData.total === "object" &&
      paginationData.total !== null
    ) {
      return Number((paginationData.total as any).total_pages ?? 1);
    }
    return Number(paginationData.total ?? 1);
  }, [paginationData]);

  // Prefix matching search fallback for immediate UI filtering
  const brands = useMemo(() => {
    if (!localSearch.trim()) return rawBrands;
    const query = localSearch.toLowerCase().trim();
    return rawBrands.filter((brand) =>
      brand.name?.toLowerCase().startsWith(query),
    );
  }, [rawBrands, localSearch]);

  // =========================
  // Create
  // =========================
  const createMutation = useMutation<Brand, AxiosError<ApiError>, BrandCU>({
    mutationFn: (formData) =>
      brandService.createBrand({
        ...formData,
        tenant_id: Number(reduxProjectId),
      }),

    onSuccess: () =>
      handleMutationSuccess("Brand created", () => setDrawer(false)),

    onError: (error) => {
      //@ts-ignore
      toast.error(error?.response?.data?.detail || "Something went Wrong");
    },
  });

  // =========================
  // Update
  // =========================
  const updateMutation = useMutation<Brand, AxiosError<ApiError>, BrandCU>({
    mutationFn: (formData) =>
      brandService.updateBrand(formData.id!, {
        ...formData,
        tenant_id: Number(reduxProjectId),
      }),

    onSuccess: () =>
      handleMutationSuccess("Brand updated", () => setDrawer(false)),

    onError: (error) => {
      //@ts-ignore
      toast.error(error?.response?.data?.detail || "Something went Wrong");
    },
  });

  // =========================
  // Delete
  // =========================
  const deleteMutation = useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: brandService.deleteBrand,

    onSuccess: () =>
      handleMutationSuccess("Deleted", () => setDeleteModal(false)),

    onError: handleMutationError,
  });

  const handleSubmit = (data: BrandCU) => {
    if (!reduxProjectId) {
      toast.error("Active project context missing.");
      return;
    }

    const mutation = isUpdate ? updateMutation : createMutation;
    mutation.mutate(data);
  };

  const handleEdit = (brand: BrandCU) => {
    setSelectedBrand(brand);
    setIsUpdate(true);
    setDrawer(true);
  };

  // =========================
  // Table Columns Definition
  // =========================
  const columns = [
    {
      key: "name",
      label: "BRAND",
      sortable: true,
      render: (value: string, row: Brand) => {
        const brandName = value ?? "Unknown Brand";
        const domain = row?.domain ?? "";

        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">{brandName}</span>
              {domain && (
                <span className="text-xs text-gray-400">{domain}</span>
              )}
            </div>
          </div>
        );
      },
    },

    {
      key: "visibilityScore",
      label: "VISIBILITY",
      sortable: true,
      render: (value: any) => {
        const score =
          typeof value === "number" ? Math.min(Math.max(value, 0), 100) : 0;

        const getBarColor = (val: number) => {
          if (val >= 50) return "bg-emerald-500";
          if (val >= 15) return "bg-sky-500";
          return "bg-amber-500";
        };

        return (
          <div className="flex items-center gap-3 min-w-[140px] max-w-[180px]">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getBarColor(
                  score,
                )}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-slate-800 font-semibold text-xs min-w-[32px] text-right">
              {score.toFixed(1)}
            </span>
          </div>
        );
      },
    },
    {
      key: "mentionRate",
      label: "MENTION RATE",
      sortable: true,
      render: (value: any) => {
        if (typeof value !== "number") {
          return <span className="text-slate-400 font-medium text-xs">-</span>;
        }

        const rate = Math.min(Math.max(value, 0), 100);

        const getBadgeStyle = (val: number) => {
          if (val >= 80)
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
          if (val >= 40) return "bg-blue-50 text-blue-700 border-blue-200";
          return "bg-slate-50 text-slate-600 border-slate-200";
        };

        return (
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
                rate,
              )}`}
            >
              {rate.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_: unknown, row: Brand) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleEdit(row)}
            className="text-yellow-500 hover:text-yellow-600 font-medium text-sm cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setDeleteId(row.id);
              setDeleteModal(true);
            }}
            className="text-red-500 hover:text-red-600 font-medium text-sm cursor-pointer"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // --- Unselected Context Fallback ---
  if (!reduxProjectId) {
    return (
      <div className="p-8 text-slate-500 font-medium text-center">
        Please select a project to view corresponding brand analytics.
      </div>
    );
  }

  return (
    <>
      {/* <BrandHeader
        onCreate={() => {
          setSelectedBrand(null);
          setIsUpdate(false);
          setDrawer(true);
        }}
      /> */}

      <div className="p-8 space-y-6">
        <div className="flex justify-between mb-8">
          <AppSearch
            value={localSearch}
            onChange={(val) => setLocalSearch(val)}
            placeholder="Search brands..."
          />

          <button
            onClick={() => {
              setSelectedBrand(null);
              setIsUpdate(false);
              setDrawer(true);
            }}
            className="bg-cyan-400 text-black px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            New Brand
          </button>
        </div>

        {/* MAIN DATA TABLE */}
        <AppTable
          columns={columns}
          data={brands}
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

      <AppModal
        title={isUpdate ? "Update Brand" : "Create Brand"}
        isOpen={drawer}
        onClose={() => setDrawer(false)}
      >
        <BrandForm
          initialData={selectedBrand}
          isUpdate={isUpdate}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
        />
      </AppModal>

      <BrandDelete
        open={deleteModal}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteModal(false)}
        onDelete={() => deleteMutation.mutate(deleteId)}
      />
    </>
  );
}
