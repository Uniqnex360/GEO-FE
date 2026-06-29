import { useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Link } from "react-router-dom";

import AppHeader from "../../components/Common/AppHeader";
import ProductHeader from "./ProductHeader";
import AppTable from "../../components/Common/AppTable";
import AppDrawer from "../../components/Common/AppDrawer";

import ProductForm from "./ProductForm";
import ProductDelete from "./ProductDelete";
import { brandService, type AppMetaList } from "../../api/brand";

// Import your newly refactored schema and client layer
import {
  productService,
  type Product,
  type ProductCU,
} from "../../api/product";

type ApiError = {
  message?: string;
};

export default function Product() {
  const queryClient = useQueryClient();

  const [drawer, setDrawer] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCU | null>(
    null,
  );
  const [isUpdate, setIsUpdate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidateProducts = () =>
    queryClient.invalidateQueries({
      queryKey: ["products"],
    });

  const getErrorMessage = (error: AxiosError<ApiError>) => {
    return (
      //@ts-ignore
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

  // =========================
  // React Query Fetch
  // =========================
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productService.getProducts,
  });

  const products: Product[] = data?.data ?? [];

  // =========================
  // Meta API for Brands
  // =========================
  const { data: brandChoiceData } = useQuery({
    queryKey: ["brandChoice"],
    queryFn: brandService.getMetaBrandList,
  });

  const brandChoice: AppMetaList[] = brandChoiceData ?? [];
  console.log("brandChoice", brandChoice);

  // =========================
  // Mutations
  // =========================
  const createMutation = useMutation<Product, AxiosError<ApiError>, ProductCU>({
    mutationFn: productService.createProduct,
    onSuccess: () =>
      handleMutationSuccess("Product created", () => setDrawer(false)),
    onError: handleMutationError,
  });

  const updateMutation = useMutation<Product, AxiosError<ApiError>, ProductCU>({
    mutationFn: (formData) =>
      productService.updateProduct(formData.id!, formData),
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

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsUpdate(true);
    setDrawer(true);
  };

  // =========================
  // Table Columns Definition
  // =========================
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
      key: "brand_name",
      label: "BRAND",
      render: (value: string) => (
        <span className="text-slate-900 font-medium">
          {value ?? "Unknown Brand"}
        </span>
      ),
    },
    {
      key: "sku",
      label: "SKU / MPN / UPC",
      render: (_: string, row: Product) => {
        const sku = row.sku ?? "-";
        const mpn = row.mpn ?? "";
        const upc = row.upc ?? "";
        const combinedSub = [mpn, upc].filter(Boolean).join(" · ");

        return (
          <div className="flex flex-col text-xs text-slate-900 font-mono">
            <span className="text-slate-900 font-sans font-medium">{sku}</span>
            {combinedSub && <span>{combinedSub}</span>}
          </div>
        );
      },
    },
    {
      key: "category",
      label: "CATEGORY",
      render: (value: string) => (
        <span className="text-slate-900 font-medium">{value ?? "-"}</span>
      ),
    },
    // {
    //   key: "visibility",
    //   label: "VISIBILITY",
    //   render: (value: any) => {
    //     const score = typeof value === "number" ? value : 0;
    //     return (
    //       <div className="flex items-center gap-4 min-w-[140px]">
    //         <div className="w-full bg-gray-800 rounded-full h-1.5">
    //           <div
    //             className="bg-cyan-400 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)]"
    //             style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
    //           />
    //         </div>
    //         <span className="text-gray-300 font-medium w-6 text-right">
    //           {score}
    //         </span>
    //       </div>
    //     );
    //   },
    // },
    // {
    //   key: "rank",
    //   label: "RANK",
    //   render: (value: any) => (
    //     <span className="text-gray-300 font-semibold">
    //       {value !== undefined && value !== null ? `#${value}` : "-"}
    //     </span>
    //   ),
    // },
    // {
    //   key: "trend",
    //   label: "TREND",
    //   render: (value: any) => {
    //     if (value === undefined || value === null)
    //       return <span className="text-gray-500">-</span>;
    //     const numericTrend = parseFloat(value);
    //     const isNegative = numericTrend < 0;
    //     const formattedTrend =
    //       numericTrend > 0 ? `+${numericTrend}%` : `${numericTrend}%`;

    //     return (
    //       <div className="flex items-center gap-3">
    //         <span
    //           className={`font-semibold text-sm ${isNegative ? "text-red-500" : "text-emerald-400"}`}
    //         >
    //           {formattedTrend}
    //         </span>
    //         <svg className="w-12 h-4 overflow-visible" viewBox="0 0 50 20">
    //           <path
    //             d={isNegative ? "M0,5 Q25,18 50,15" : "M0,15 Q25,12 50,5"}
    //             fill="none"
    //             stroke={isNegative ? "#ef4444" : "#34d399"}
    //             strokeWidth="2"
    //           />
    //         </svg>
    //       </div>
    //     );
    //   },
    // },
    {
      key: "analytics.avg_share_of_voice",
      label: "Share of Voice",
    },
    {
      key: "analytics.visibility_rate",
      label: "Visibility",
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_: unknown, row: Product) => (
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

  return (
    <>
      <AppHeader searchValue="" onSearchChange={() => {}} />

      <ProductHeader
        onCreate={() => {
          setSelectedProduct(null);
          setIsUpdate(false);
          setDrawer(true);
        }}
      />

      <div className="p-8">
        <AppTable columns={columns} data={products} isLoading={isLoading} />
      </div>

      <AppDrawer
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
      </AppDrawer>

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
