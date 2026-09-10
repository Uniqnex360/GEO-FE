import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import { useSelector } from "react-redux";

import type { AxiosError } from "axios";

import { toast } from "react-toastify";

import {
  Plus,
  SquarePen,
  Package,
  Tag,
  Globe,
  Target,
  Trash2,
  ChevronRight,
  CircleAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { createPortal } from "react-dom";

import { AppSearch } from "../../components/Common/AppSearch";
import { AppPagination } from "../../components/Common/AppPagination";
import AppModal from "../../components/Common/AppModel";

import ProductForm from "./ProductForm";
import ProductDelete from "./ProductDelete";

import { brandService, type AppMetaList } from "../../api/brand";

import { selectGlobalProjectId } from "../../store/projectSlice";

import { AppMultiSelect } from "../../components/Common/AppMultiSelect";

import { ExcelDownloadButton } from "../../components/Common/ExcelDownload";
import { ExcelUploadButton } from "../../components/Common/ExcelUpload";

import {
  productService,
  type Product as ProductType,
  type ProductCU,
} from "../../api/product";

import { useProductAnalysisQueue } from "./useProductAnalysisQuery";

type ApiError = {
  message?: string;
  detail?: string;
};

export default function Product() {
  const queryClient = useQueryClient();

  // ==========================================
  // Redux State
  // ==========================================

  const reduxProjectId = useSelector(selectGlobalProjectId);

  // ==========================================
  // UI State
  // ==========================================

  const [drawer, setDrawer] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductCU | null>(
    null,
  );

  const [isUpdate, setIsUpdate] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ==========================================
  // URL Params
  // ==========================================

  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = Number(searchParams.get("page"));

  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;

  const searchTerm = searchParams.get("search") || "";

  const limit = 24;

  const brandParam = searchParams.get("brand") || "";

  const selectedBrands = brandParam
    ? brandParam.split(",").filter(Boolean)
    : [];

  const sortBy = searchParams.get("sort_by") || "";

  const sortOrder =
    (searchParams.get("sort_order") as "asc" | "desc") || "desc";

  const activeSortKeyMap: Record<string, string> = {
    name: "name",
    sku: "sku",
    brand_name: "brand",
    "analytics.visibility_rate": "visibility",
  };

  const activeTableSortKey = activeSortKeyMap[sortBy] || sortBy;

  void activeTableSortKey;

  // ==========================================
  // Header Actions
  // ==========================================

  const headerActionsContainer = document.getElementById(
    "layout-actions-portal",
  );

  // ==========================================
  // Brand Filter
  // ==========================================

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

  // ==========================================
  // Search
  // ==========================================

  const [localSearch, setLocalSearch] = useState(searchTerm);

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

    params.set("page", "1");

    setSearchParams(params);
  };

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch]);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // ==========================================
  // Query Helpers
  // ==========================================

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
  // Products Query
  // ==========================================

  const { data, isPending, isError } = useQuery({
    queryKey: [
      "products",
      reduxProjectId,
      page,
      searchTerm,
      selectedBrands,
      sortBy,
      sortOrder,
    ],

    queryFn: () =>
      productService.getProducts({
        page,
        limit,
        search: searchTerm || undefined,
        tenant_id: reduxProjectId ? Number(reduxProjectId) : undefined,
        brand: selectedBrands.length ? selectedBrands.join(",") : undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined,
      }),

    enabled: !!reduxProjectId,

    placeholderData: keepPreviousData,
  });

  const products: ProductType[] = data?.data ?? [];

  const productIds: number[] = [...(data?.product_ids ?? [])].reverse();

  const paginationData = data?.pagination;

  // ==========================================
  // Analysis Queue
  // ==========================================

  const { analysisStatus, handleAnalyze } = useProductAnalysisQueue(
    Number(reduxProjectId),
    invalidateProducts,
    (message) => toast.error(message),
  );

  // ==========================================
  // Brand Meta
  // ==========================================

  const { data: brandChoiceData } = useQuery({
    queryKey: ["brandChoice", reduxProjectId],

    queryFn: () => brandService.getMetaBrandList(reduxProjectId),

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

  // ==========================================
  // Product Actions
  // ==========================================

  const handleSubmit = (formData: ProductCU) => {
    const mutation = isUpdate ? updateMutation : createMutation;

    mutation.mutate(formData);
  };

  const handleEdit = (product: ProductType) => {
    setSelectedProduct(product);
    setIsUpdate(true);
    setDrawer(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteModal(true);
  };

  // ==========================================
  // Sorting
  // ==========================================

  const handleSort = (key: string) => {
    const backendSortKeyMap: Record<string, string> = {
      name: "name",
      sku: "sku",
      brand_name: "brand",
      visibility_rate: "visibility",
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

  void handleSort;

  // ==========================================
  // Early Return States
  // ==========================================

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

  const stats = data?.tenant_states;

  // ==========================================
  // Render
  // ==========================================

  return (
    <>
      {/* ==========================================
          HEADER ACTIONS
      ========================================== */}

      {headerActionsContainer &&
        createPortal(
          <div className="flex items-center gap-5">
            <button
              onClick={() => {
                setSelectedProduct(null);

                setIsUpdate(false);

                setDrawer(true);
              }}
              className="
                bg-emerald-600
                hover:bg-emerald-700
                text-white
                px-4
                py-2
                rounded-xl
                text-sm
                font-semibold
                flex
                items-center
                gap-2
                shadow-sm
                transition-all
                cursor-pointer
              "
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Product
            </button>

            <ExcelDownloadButton
              apiUrl="api/v1/product/bulk-upload-template/"
              filename="product_template.xlsx"
              iconSize={22}
              className="
                text-slate-600
                hover:text-green-600
                transition-colors
              "
              onSuccess={() =>
                toast.success("Your download has completed successfully!")
              }
              onError={(err) => {
                console.log("err", err);

                toast.error("Something went wrong spinning up your file.");
              }}
            />

            <ExcelUploadButton
              apiUrl="api/v1/product/bulk-upload/"
              payloadKey="file"
              onSuccess={() => {
                toast.success("Import is running on Background");
              }}
              onError={() => {
                toast.error("Import failed");
              }}
              iconSize={22}
              className="
                text-slate-600
                hover:text-indigo-600
                transition-colors
              "
            />
          </div>,
          headerActionsContainer,
        )}

      {/* ==========================================
          FILTERS
      ========================================== */}

      <div className="px-1 py-1 flex justify-between items-center gap-4">
        <div className="flex w-full mb-2">
          <div className="w-64">
            <AppMultiSelect
              options={brandOptions}
              value={selectedBrands}
              onChange={setBrandFilter}
              placeholder="Brands"
            />
          </div>

          <div className="w-1/2 ml-auto">
            <AppSearch
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="Search products..."
            />
          </div>
        </div>
      </div>

      {/* ==========================================
          STATS
      ========================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-2 bg-slate-50">
        {/* Total Products */}

        <div
          className="
            bg-white
            border
            border-slate-100
            rounded-xl
            p-5
            shadow-sm
            flex
            flex-col
            justify-between
            min-h-[110px]
          "
        >
          <span className="text-sm font-medium text-slate-500 tracking-tight">
            Total Products
          </span>

          <span className="text-3xl font-bold text-slate-900 mt-2">
            {stats?.total_products ?? 0}
          </span>
        </div>

        {/* Avg Visibility */}

        <div
          className="
            bg-white
            border
            border-slate-100
            rounded-xl
            p-5
            shadow-sm
            flex
            flex-col
            justify-between
            min-h-[110px]
          "
        >
          <span className="text-sm font-medium text-slate-500 tracking-tight">
            Avg. Visibility
          </span>

          <span className="text-3xl font-bold text-blue-600 mt-2">
            {stats?.avg_visibility_score?.toFixed(1) ?? "0.0"}
          </span>
        </div>

        {/* Avg Mention Rate */}

        <div
          className="
            bg-white
            border
            border-slate-100
            rounded-xl
            p-5
            shadow-sm
            flex
            flex-col
            justify-between
            min-h-[110px]
          "
        >
          <span className="text-sm font-medium text-slate-500 tracking-tight">
            Avg. Mention Rate
          </span>

          <span className="text-3xl font-bold text-emerald-600 mt-2">
            {stats?.avg_mention_rate?.toFixed(1) ?? "0.0"}
          </span>
        </div>

        {/* Brands Tracked */}

        <div
          className="
            bg-white
            border
            border-slate-100
            rounded-xl
            p-5
            shadow-sm
            flex
            flex-col
            justify-between
            min-h-[110px]
          "
        >
          <span className="text-sm font-medium text-slate-500 tracking-tight">
            Brands Tracked
          </span>

          <span className="text-3xl font-bold text-slate-900 mt-2">
            {stats?.brands_tracked ?? 0}
          </span>
        </div>
      </div>

      {/* ==========================================
          PRODUCT LIST
      ========================================== */}

      <div className="p-2 space-y-3">
        {isPending ? (
          <>
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    p-5
                    animate-pulse
                  "
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100" />

                  <div className="flex-1">
                    <div className="h-5 bg-slate-100 rounded w-1/3" />

                    <div className="h-4 bg-slate-100 rounded w-1/4 mt-4" />
                  </div>

                  <div className="w-28 h-10 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </>
        ) : products.length === 0 ? (
          <div
            className="
              bg-white
              border
              border-slate-200
              rounded-2xl
              p-12
              text-center
            "
          >
            <Package className="w-10 h-10 mx-auto text-slate-300" />

            <h3 className="text-lg font-semibold text-slate-800 mt-4">
              No products found
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Try changing your search or brand filter.
            </p>
          </div>
        ) : (
          products.map((product) => {
            const analytics = (product as any)?.analytics;

            /*
             * TEMPORARY FALLBACKS
             *
             * Keep these inline so
             * "HARD CODE" can still
             * be searched easily.
             */

            const productUrl =
              (product as any)?.product_url ||
              (product as any)?.url ||
              "HARD CODE";

            const image =
              (product as any)?.image || (product as any)?.image_url || "";

            const gpt = analytics?.by_engine?.chatgpt?.visibility_rate ?? 0;

            const gemini = analytics?.by_engine?.gemini?.visibility_rate ?? 0;

            const claude =
              analytics?.by_engine?.anthropic?.visibility_rate ?? 0;

            const overall = analytics?.visibility_rate ?? 0;

            const hasAnalysis = (analytics?.total_queries ?? 0) > 0;

            /*
             * Persistent analysis state.
             *
             * This comes from the module-level
             * queue, so it survives Product
             * unmounting/remounting.
             */
            const currentAnalysis = analysisStatus[product.id];

            const isAnalyzing = currentAnalysis?.loading ?? false;

            const isQueued = currentAnalysis?.message === "Queued for analysis";

            return (
              <div
                key={product.id}
                className="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    overflow-hidden
                    shadow-sm
                    hover:shadow-md
                    transition-shadow
                  "
              >
                <div
                  className="
                      flex
                      items-center
                      gap-6
                      px-6
                      py-6
                    "
                >
                  {/* ==================================
                        PRODUCT IMAGE / ICON
                    ================================== */}

                  <div
                    className="
                        flex-shrink-0
                        w-20
                        h-20
                        rounded-2xl
                        bg-slate-50
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                      "
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={product.name || "Product"}
                        className="
                            w-full
                            h-full
                            object-contain
                          "
                      />
                    ) : (
                      <Package
                        className="
                            w-9
                            h-9
                            text-slate-400
                          "
                      />
                    )}
                  </div>

                  {/* ==================================
                        PRODUCT DETAILS
                    ================================== */}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/admin/product/${product.id}`}
                        state={{
                          productIds,
                        }}
                        className="
                            text-xl
                            font-semibold
                            text-slate-900
                            hover:text-cyan-600
                            transition-colors
                            truncate
                          "
                      >
                        {product.name || "HARD CODE"}
                      </Link>

                      {/* STATUS */}

                      {isAnalyzing ? (
                        <span
                          className="
                              flex-shrink-0
                              inline-flex
                              items-center
                              gap-1.5
                              px-3
                              py-1
                              rounded-full
                              bg-blue-50
                              border
                              border-blue-200
                              text-blue-700
                              text-sm
                              font-medium
                            "
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />

                          {currentAnalysis?.message || "Analyzing..."}
                        </span>
                      ) : currentAnalysis?.message === "Analysis completed" ? (
                        <span
                          className="
                              flex-shrink-0
                              inline-flex
                              items-center
                              gap-1.5
                              px-3
                              py-1
                              rounded-full
                              bg-emerald-50
                              border
                              border-emerald-200
                              text-emerald-700
                              text-sm
                              font-medium
                            "
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Analysis completed
                        </span>
                      ) : hasAnalysis ? (
                        <span
                          className="
                              flex-shrink-0
                              inline-flex
                              items-center
                              gap-1.5
                              px-3
                              py-1
                              rounded-full
                              bg-emerald-50
                              border
                              border-emerald-200
                              text-emerald-700
                              text-sm
                              font-medium
                            "
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Analyzed
                        </span>
                      ) : (
                        <span
                          className="
                              flex-shrink-0
                              inline-flex
                              items-center
                              gap-1.5
                              px-3
                              py-1
                              rounded-full
                              bg-slate-50
                              border
                              border-slate-200
                              text-slate-600
                              text-sm
                              font-medium
                            "
                        >
                          <CircleAlert className="w-4 h-4" />
                          Needs analysis
                        </span>
                      )}
                    </div>

                    {/* SKU + PRODUCT PAGE */}

                    <div
                      className="
                          flex
                          items-center
                          gap-5
                          mt-3
                          text-[15px]
                          text-slate-400
                        "
                    >
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4" />
                        SKU: {product.sku || "HARD CODE"}
                      </span>

                      {productUrl !== "HARD CODE" ? (
                        <a
                          href={productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                              flex
                              items-center
                              gap-1.5
                              hover:text-cyan-600
                              transition-colors
                            "
                        >
                          <Globe className="w-4 h-4" />
                          Product page
                          <span className="text-xs">↗</span>
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-4 h-4" />
                          Product page
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ==================================
                        AI SCORES
                    ================================== */}

                  {hasAnalysis && (
                    <div className="flex items-center flex-shrink-0">
                      {/* GPT */}

                      <div className="w-24 text-center">
                        <div className="text-[30px] leading-none font-bold text-emerald-600">
                          {gpt}
                        </div>

                        <div className="text-sm text-slate-400 mt-2">GPT</div>
                      </div>

                      {/* GEMINI */}

                      <div className="w-24 text-center">
                        <div className="text-[30px] leading-none font-bold text-blue-600">
                          {gemini}
                        </div>

                        <div className="text-sm text-slate-400 mt-2">
                          Gemini
                        </div>
                      </div>

                      {/* CLAUDE */}

                      <div className="w-24 text-center">
                        <div className="text-[30px] leading-none font-bold text-amber-600">
                          {claude}
                        </div>

                        <div className="text-sm text-slate-400 mt-2">
                          Claude
                        </div>
                      </div>

                      {/* DIVIDER */}

                      <div className="w-px h-14 bg-slate-200 mx-3" />

                      {/* OVERALL */}

                      <div className="w-24 text-center">
                        <div className="text-[30px] leading-none font-bold text-slate-900">
                          {overall}
                        </div>

                        <div className="text-sm text-slate-400 mt-2">
                          Overall
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================================
                        ACTIONS
                    ================================== */}

                  <div
                    className="
                        flex
                        items-center
                        gap-3
                        flex-shrink-0
                      "
                  >
                    {/* ANALYZE / RE-SCAN */}

                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => handleAnalyze(product)}
                      className="
                          flex
                          items-center
                          gap-2
                          px-5
                          py-3
                          rounded-xl
                          bg-slate-100
                          hover:bg-slate-200
                          disabled:bg-slate-100
                          disabled:text-slate-400
                          text-slate-700
                          font-semibold
                          transition-colors
                          cursor-pointer
                          disabled:cursor-not-allowed
                          whitespace-nowrap
                        "
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Target className="w-5 h-5" />
                      )}

                      {isQueued
                        ? "Queued"
                        : isAnalyzing
                          ? "Analyzing..."
                          : hasAnalysis
                            ? "Re-scan"
                            : "Analyze"}
                    </button>

                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="
                          p-2
                          text-slate-400
                          hover:text-slate-700
                          transition-colors
                          cursor-pointer
                        "
                      title="Edit"
                    >
                      <SquarePen className="w-5 h-5" />
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="
                          p-2
                          text-slate-400
                          hover:text-red-500
                          transition-colors
                          cursor-pointer
                        "
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {/* VIEW */}

                    <Link
                      to={`/admin/product/${product.id}`}
                      state={{
                        productIds,
                      }}
                      className="
                          p-2
                          text-slate-300
                          hover:text-slate-600
                          transition-colors
                        "
                      title="View"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* ==========================================
            PAGINATION
        ========================================== */}

        {paginationData && (
          <AppPagination
            currentPage={page}
            totalPages={Math.ceil(paginationData.total / limit)}
            totalEntries={paginationData.total}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* ==========================================
          PRODUCT CREATE / UPDATE MODAL
      ========================================== */}

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

      {/* ==========================================
          DELETE MODAL
      ========================================== */}

      <ProductDelete
        open={deleteModal}
        loading={deleteMutation.isPending}
        onClose={() => {
          setDeleteModal(false);
          setDeleteId(null);
        }}
        onDelete={() => {
          if (deleteId !== null) {
            deleteMutation.mutate(deleteId);
          }
        }}
      />
    </>
  );
}
