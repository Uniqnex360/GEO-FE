import { useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useSelector } from "react-redux";

import { selectGlobalProjectId } from "../../store/projectSlice";

import AppTable from "../../components/Common/AppTable";
import AppDrawer from "../../components/Common/AppDrawer";
import AppHeader from "../../components/Common/AppHeader";

import BrandHeader from "./BrandHeader";
import BrandForm from "./BrandForm";
import BrandDelete from "./BrandDelete";

import { brandService, type Brand } from "../../api/brand";

import type { BrandCU } from "./BrandForm";

type ApiError = {
  message?: string;
};

export default function Brand() {
  const queryClient = useQueryClient();

  const [drawer, setDrawer] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandCU | null>(null);

  const [isUpdate, setIsUpdate] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  // --- Redux Project State ---
  const reduxProjectId = useSelector(selectGlobalProjectId);

  const invalidateBrands = () =>
    queryClient.invalidateQueries({
      queryKey: ["brands", reduxProjectId], // Refreshes only the active tenant cache matrix
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
  const { data, isLoading } = useQuery({
    // Adding reduxProjectId forces a re-fetch automatically whenever the project is swapped
    queryKey: ["brands", reduxProjectId],
    queryFn: () =>
      brandService.getBrands({
        tenant_id: reduxProjectId ? Number(reduxProjectId) : undefined,
      }),
    enabled: !!reduxProjectId, // Safely stalls execution if no project context is active
  });

  const brands: Brand[] = data?.data ?? [];

  // =========================
  // Create
  // =========================
  const createMutation = useMutation<Brand, AxiosError<ApiError>, BrandCU>({
    mutationFn: (formData) =>
      brandService.createBrand({
        ...formData,
        tenant_id: Number(reduxProjectId), // Dynamic injection into body payload
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
        tenant_id: Number(reduxProjectId), // Dynamic injection into body payload
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
      render: (value: string, row: Brand) => {
        const brandName = value ?? "Unknown Brand";
        const domain = row?.domain ?? "";

        const initials = brandName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-800 text-xs font-bold text-gray-300 border border-gray-700">
              {initials || "BR"}
            </div>

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
      key: "industry",
      label: "INDUSTRY",
      render: (value: string) => (
        <span className="text-slate-900">{value ?? "-"}</span>
      ),
    },
    {
      key: "country",
      label: "COUNTRY",
      render: (value: string) => (
        <span className="text-slate-900">{value ?? "-"}</span>
      ),
    },
    {
      key: "visibility",
      label: "VISIBILITY",
      render: (value: any) => {
        const visibilityScore = typeof value === "number" ? value : 0;

        return (
          <div className="flex items-center gap-4 min-w-[120px]">
            <div className="w-full rounded-full h-1.5">
              <div
                className="bg-cyan-400 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                style={{
                  width: `${Math.min(Math.max(visibilityScore, 0), 100)}%`,
                }}
              />
            </div>
            <span className="text-slate-900 font-medium w-6 text-right">
              {visibilityScore}
            </span>
          </div>
        );
      },
    },
    {
      key: "mention_rate",
      label: "MENTION RATE",
      render: (value: any) => (
        <span className="text-gray-300 font-medium">
          {typeof value === "number" ? `${value}%` : "-"}
        </span>
      ),
    },
    {
      key: "delta",
      label: "Δ",
      render: (value: any) => {
        if (value === undefined || value === null) {
          return <span className="text-gray-500">-</span>;
        }

        const numValue = parseFloat(value);
        const isNegative = numValue < 0;
        const formattedValue = numValue > 0 ? `+${numValue}%` : `${numValue}%`;

        return (
          <span
            className={`font-semibold text-sm ${
              isNegative ? "text-red-500" : "text-emerald-400"
            }`}
          >
            {formattedValue}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_: unknown, row: Brand) => (
        <div className="flex items-center justify-end gap-3">
          <a
            href={`/brands/${row.id}`}
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            Open
          </a>
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
      <AppHeader searchValue="" onSearchChange={() => {}} />

      <BrandHeader
        onCreate={() => {
          setSelectedBrand(null);
          setIsUpdate(false);
          setDrawer(true);
        }}
      />

      <div className="p-8">
        <AppTable columns={columns} data={brands} isLoading={isLoading} />
      </div>

      <AppDrawer
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
      </AppDrawer>

      <BrandDelete
        open={deleteModal}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteModal(false)}
        onDelete={() => deleteMutation.mutate(deleteId)}
      />
    </>
  );
}
