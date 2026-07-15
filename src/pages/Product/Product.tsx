import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSearchParams, Link } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { AxiosError } from "axios";
import { Plus, Box, Eye, MoreVertical } from "lucide-react";

import AppTable from "../../components/Common/AppTable";
import { AppSearch } from "../../components/Common/AppSearch";
import { AppPagination } from "../../components/Common/AppPagination";
import AppModal from "../../components/Common/AppModel";

import ProductForm from "./ProductForm";
import ProductDelete from "./ProductDelete";
import { brandService, type AppMetaList } from "../../api/brand";
import { selectGlobalProjectId } from "../../store/projectSlice";
import { AppMultiSelect } from "../../components/Common/AppMultiSelect";

// Import your newly refactored schema and client layer
import {
  productService,
  type Product as ProductType,
  type ProductCU,
} from "../../api/product";

type ApiError = {
  message?: string;
  detail?: string;
};

export default function Product() {
  const queryClient = useQueryClient();

  // --- Redux State (Tenant ID Alignment) ---
  const reduxProjectId = useSelector(selectGlobalProjectId);

  // --- UI Component States ---
  const [drawer, setDrawer] = useState(false); // Keeps naming but maps to <AppModal>
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCU | null>(
    null,
  );
  const [isUpdate, setIsUpdate] = useState(false);
  //@ts-ignore
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- URL Param Synchronization ---
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const limit = 24;
  const brandParam = searchParams.get("brand") || "";
  const selectedBrands = brandParam
    ? brandParam.split(",").filter(Boolean)
    : [];

  const setBrandFilter = (brands: string[]) => {
    const params = new URLSearchParams(searchParams);

    if (brands.length) {
      params.set("brand", brands.join(","));
    } else {
      params.delete("brand");
    }

    params.set("page", "1");
    setSearchParams(params);
  };

  // --- Local Search Input Debouncing State ---
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // --- Synced State Modifiers ---
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
    params.set("page", "1"); // Force page reset on search filters
    setSearchParams(params);
  };

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
  };

  // Debounce loop execution
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Handle browser history navigation changes
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  const invalidateProducts = () =>
    queryClient.invalidateQueries({
      queryKey: ["products"],
    });

  const getErrorMessage = (error: AxiosError<ApiError>) => {
    return (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong"
    );
  };

  const handleMutationError = (error: AxiosError<ApiError>) => {
    console.error(error);
    toast.error(getErrorMessage(error));
  };

  const handleMutationSuccess = (message: string, close?: () => void) => {
    toast.success(message);
    invalidateProducts();
    close?.();
  };

  const { data, isPending, isError } = useQuery({
    queryKey: ["products", reduxProjectId, page, searchTerm, selectedBrands],
    queryFn: () =>
      productService.getProducts({
        page,
        limit,
        search: searchTerm || undefined,
        tenant_id: reduxProjectId ? Number(reduxProjectId) : undefined,
        brand: selectedBrands.length ? selectedBrands.join(",") : undefined,
      }),
    enabled: !!reduxProjectId,
    placeholderData: keepPreviousData,
  });

  // Supporting backend responses matching paginated structures
  const products: ProductType[] = data?.data ?? [];
  const paginationData = data?.pagination;

  // ==========================================
  // Meta API for Brands
  // ==========================================
  const { data: brandChoiceData } = useQuery({
    queryKey: ["brandChoice", reduxProjectId],
    queryFn: () => brandService.getMetaBrandList(reduxProjectId), // 👈 Wrapped cleanly to block context leaking
    enabled: !!reduxProjectId,
  });

  const brandChoice: AppMetaList[] = brandChoiceData ?? [];
  const brandOptions = brandChoice.map((b) => b.value);

  // ==========================================
  // Mutations
  // ==========================================
  const createMutation = useMutation<
    ProductType,
    AxiosError<ApiError>,
    ProductCU
  >({
    mutationFn: (formData) =>
      productService.createProduct({
        ...formData,
        tenant_id: Number(reduxProjectId),
      }),
    onSuccess: () =>
      handleMutationSuccess("Product created", () => setDrawer(false)),
    onError: handleMutationError,
  });

  const updateMutation = useMutation<
    ProductType,
    AxiosError<ApiError>,
    ProductCU
  >({
    mutationFn: (formData) =>
      productService.updateProduct(formData.id!, {
        ...formData,
        tenant_id: Number(reduxProjectId),
      }),
    onSuccess: () =>
      handleMutationSuccess("Product updated", () => setDrawer(false)),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation<void, AxiosError<ApiError>, number>({
    mutationFn: productService.deleteProduct,
    onSuccess: () =>
      handleMutationSuccess("Product deleted", () => setDeleteModal(false)),
    onError: handleMutationError,
  });

  const handleSubmit = (formData: ProductCU) => {
    const mutation = isUpdate ? updateMutation : createMutation;
    mutation.mutate(formData);
  };

  const handleEdit = (product: ProductType) => {
    setSelectedProduct(product);
    setIsUpdate(true);
    setDrawer(true);
  };

  // ==========================================
  // Table Columns Definition
  // ==========================================

  // Helper function to dynamically determine the progress bar color based on value
  const getVisibilityColor = (value: number) => {
    if (value >= 70) return "bg-emerald-500";
    if (value >= 55) return "bg-blue-500";
    return "bg-amber-500";
  };

  const columns = [
    {
      key: "name",
      label: "PRODUCT",
      render: (value: string, row: ProductType) => (
        <div className="flex items-center gap-3">
          {/* Green Box Icon Container */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
            <Box className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <Link
              to={`/admin/product/${row.id}`}
              className="text-sm font-semibold text-slate-900 hover:text-cyan-600 transition-colors line-clamp-1"
            >
              {value ?? "Unknown Product"}
            </Link>
            <span className="text-xs text-slate-400 capitalize">
              {row.category ?? ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "sku",
      label: "SKU / MPN",
      render: (_: string, row: ProductType) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="font-sans font-medium text-slate-700">
            {row.sku ?? "-"}
          </span>
          {row.mpn && <span className="text-slate-400">MPN: {row.mpn}</span>}
        </div>
      ),
    },
    {
      key: "brand_name",
      label: "BRAND",
      render: (value: string) => (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
          {value ?? "Unknown"}
        </span>
      ),
    },
    {
      key: "analytics.visibility_rate",
      label: "VISIBILITY",
      render: (value: number) => {
        const numValue = value ?? 0;
        return (
          <div className="flex items-center gap-3 w-28">
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${getVisibilityColor(numValue)}`}
                style={{ width: `${numValue}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {numValue}
            </span>
          </div>
        );
      },
    },
    // {
    //   key: "no_of_faqs",
    //   label: "FAQS",
    //   render: (value: number) => (
    //     <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
    //       <HelpCircle className="h-4 w-4 text-amber-500" />
    //       <span>{value ?? 0}</span>
    //     </div>
    //   ),
    // },
    // {
    //   key: "no_of_reviews",
    //   label: "REVIEWS",
    //   render: (value: number) => (
    //     <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
    //       <MessageSquare className="h-4 w-4 text-violet-500" />
    //       <span>{value ?? 0}</span>
    //     </div>
    //   ),
    // },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_: unknown, row: ProductType) => (
        <div className="flex items-center justify-end gap-2 text-slate-400">
          <button
            onClick={() => {
              /* View logic */
            }}
            className="p-1 hover:text-cyan-600 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:text-slate-600 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // --- Early Return States ---
  if (!reduxProjectId) {
    return (
      <div className="p-8 text-slate-500">
        Please select a project to view products.
      </div>
    );
  }
  if (isError) {
    return <div className="p-8 text-red-500">Failed to load products.</div>;
  }

  const stats = data?.tenant_states

  return (
    <>
      <div className="px-6 py-6 flex justify-between items-center  gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-full max-w-md">
            <AppSearch
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="Search products..."
            />
          </div>

          <div className="w-64">
            <AppMultiSelect
              options={brandOptions}
              value={selectedBrands}
              onChange={setBrandFilter}
              placeholder="Brands"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsUpdate(false);
            setDrawer(true);
          }}
          className="bg-cyan-400 hover:bg-cyan-500 text-black px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 shrink-0"
        >
          <Plus size={16} />
          <span className="whitespace-nowrap">New Product</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50">
        {/* Total Products */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
          <span className="text-sm font-medium text-slate-500 tracking-tight">
            Total Products
          </span>
          <span className="text-3xl font-bold text-slate-900 mt-2">
            {stats?.total_products}
          </span>
        </div>

        {/* Avg. Visibility */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
          <span className="text-sm font-medium text-slate-500 tracking-tight">
            Avg. Visibility
          </span>
          <span className="text-3xl font-bold text-blue-600 mt-2">
            {stats?.avg_visibility_score.toFixed(1)}
          </span>
        </div>

        {/* Avg. Mention Rate */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
          <span className="text-sm font-medium text-slate-500 tracking-tight">
            Avg. Mention Rate
          </span>
          <span className="text-3xl font-bold text-emerald-600 mt-2">
            {stats?.avg_mention_rate.toFixed(1)}%
          </span>
        </div>

        {/* Brands Tracked */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
          <span className="text-sm font-medium text-slate-500 tracking-tight">
            Brands Tracked
          </span>
          <span className="text-3xl font-bold text-slate-900 mt-2">
            {stats?.brands_tracked}
          </span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* REUSABLE SEARCH INPUT */}

        {/* DATA TABLE VIEW */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <AppTable columns={columns} data={products} isLoading={isPending} />
        </div>

        {/* REUSABLE PAGINATION FOOTER */}
        {paginationData && (
          <AppPagination
            currentPage={page}
            totalPages={paginationData.total_pages}
            totalEntries={paginationData.total}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* USING MODAL CONTAINER INSTEAD OF DRAWER AS REQUESTED */}
      <AppModal
        title={isUpdate ? "Update Product" : "Create Product"}
        isOpen={drawer}
        onClose={() => setDrawer(false)}
      >
        <ProductForm
          initialData={selectedProduct}
          isUpdate={isUpdate}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
          brandOption={brandChoice}
        />
      </AppModal>

      <ProductDelete
        open={deleteModal}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteModal(false)}
        onDelete={() => {
          if (deleteId !== null) {
            deleteMutation.mutate(deleteId);
          }
        }}
      />
    </>
  );
}
