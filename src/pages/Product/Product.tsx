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
import { Plus } from "lucide-react";

import AppTable from "../../components/Common/AppTable";
import { AppSearch } from "../../components/Common/AppSearch";
import { AppPagination } from "../../components/Common/AppPagination";
import AppModal from "../../components/Common/AppModel";

import ProductForm from "./ProductForm";
import ProductDelete from "./ProductDelete";
import { brandService, type AppMetaList } from "../../api/brand";
import { selectGlobalProjectId } from "../../store/projectSlice"; // Adjust path if necessary

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
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- URL Param Synchronization ---
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const limit = 24;

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

  // ==========================================
  // React Query Fetch (Listens to Tenant Redux Changes)
  // ==========================================
  const { data, isPending, isError } = useQuery({
    // Adding reduxProjectId here forces an immediate query auto-refresh whenever it mutates
    queryKey: ["products", reduxProjectId, page, searchTerm],
    queryFn: () =>
      productService.getProducts({
        page,
        limit,
        search: searchTerm || undefined,
        tenant_id: reduxProjectId ? Number(reduxProjectId) : undefined, // Passing Tenant ID cleanly
      }),
    enabled: !!reduxProjectId, // Safely avoids executing queries if no tenant context is active
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
  const columns = [
    {
      key: "name",
      label: "PRODUCT",
      render: (value: string) => (
        <span className="font-semibold text-slate-900">
          {value ?? "Unknown Product"}
        </span>
      ),
    },
    {
      key: "sku",
      label: "SKU / MPN",
      render: (_: string, row: ProductType) => {
        const sku = row.sku ?? "-";
        const mpn = row.mpn ?? "";
        const combinedSub = [mpn].filter(Boolean).join(" · ");

        return (
          <div className="flex flex-col text-xs text-slate-900 font-mono">
            <span className="text-slate-900 font-sans font-medium">{sku}</span>
            {combinedSub && <span>{combinedSub}</span>}
          </div>
        );
      },
    },
    {
      key: "brand_name",
      label: "BRAND",
      render: (value: string) => (
        <span className="text-slate-900 font-medium">
          {value ?? "Unknown Brand"}
        </span>
      ),
    },

    // {
    //   key: "analytics.avg_share_of_voice",
    //   label: "Share of Voice",
    // },
    {
      key: "analytics.visibility_rate",
      label: "Visibility",
    },
    {
      key: "no_of_faqs",
      label: "FAQ",
    },
    {
      key: "no_of_reviews",
      label: "Reviews",
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_: unknown, row: ProductType) => (
        <div className="flex items-center justify-end gap-3">
          <Link
            to={`/admin/product/${row.id}`}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
          >
            Open
          </Link>
          <button
            onClick={() => handleEdit(row)}
            className="text-yellow-400 hover:text-yellow-300 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setDeleteId(row.id);
              setDeleteModal(true);
            }}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Delete
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

  return (
    <>
      <div className="px-6 py-6 flex justify-between items-center bg-white gap-4">
        <div className="w-full max-w-md">
          <AppSearch
            value={localSearch}
            onChange={(val) => handleSearchChange(val)}
            placeholder="Search products..."
          />
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
