import { useState, useEffect, useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { createPortal } from "react-dom";
import { Plus, LayoutDashboard, SquarePen, Trash2 } from "lucide-react";

import { projectService } from "../../api/project";
import {
  selectGlobalProjectId,
  setGlobalProjectId,
} from "../../store/projectSlice";
import { formatSnakeToTitleCase } from "../../helpers/common";
import AppModal from "../../components/Common/AppModel";
import AppTable from "../../components/Common/AppTable";
import ProjectForm, { type ProjectCU } from "./ProjectForm";
import ProjectDeleteModal from "./ProjectDelete";

// Reusable inputs imports
import { AppSearch } from "../../components/Common/AppSearch";
import { AppPagination } from "../../components/Common/AppPagination";

export interface Project {
  id: number;
  name: string;
  website_url?: string;
  status: "Active" | "Crawling" | "Paused";
  is_active: boolean;
  industry: string;
  countries?: string[];
  updatedAt: string;
  productsCount: number;
  visibilityScore: number;
  platforms: string[];
  description: string;
}

export interface BackendResponse {
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

type ApiError = { message?: string; detail?: string };

const AI_PLATFORMS = [
  { key: "ChatGPT", label: "CHATGPT" },
  { key: "Claude", label: "CLAUDE" },
  { key: "Gemini", label: "GEMINI" },
];

export default function ProjectDashboard() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reduxProjectId = useSelector(selectGlobalProjectId);

  // --- URL State Initialization via React Router ---
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract page, search, and sorting values from URL, falling back to defaults
  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort_by") || "";
  const sortOrder =
    (searchParams.get("sort_order") as "asc" | "desc") || "desc";
  const limit = 24;

  // --- Local Search State for Debouncing ---
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // --- Sync State Helpers ---
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
    params.set("page", "1"); // Reset page context during dynamic filtering
    setSearchParams(params);
  };

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
  };

  // --- Sorting Handler ---
  const handleSort = (key: string) => {
    // Map table column keys to backend sort parameter names
    const backendSortKeyMap: Record<string, string> = {
      name: "name",
      industry: "industry",
      productsCount: "products_count",
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

    params.set("page", "1"); // Reset to page 1 when sort order changes
    setSearchParams(params);
  };

  // Debounce effect: Updates URL params 300ms after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync local search value if the URL search param changes from elsewhere
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // React Query links directly to values extracted from the URL
  const {
    data: projectsData,
    isPending,
    isError,
  } = useQuery<BackendResponse, AxiosError<ApiError>>({
    queryKey: ["projects", page, searchTerm, sortBy, sortOrder],
    queryFn: () =>
      projectService.getList({
        page,
        limit,
        search: searchTerm || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const rawProjects = projectsData?.data || [];
  const paginationData = projectsData?.pagination;

  // Client-side strict prefix search filter (matches only if name starts with query)
  const projects = useMemo(() => {
    if (!localSearch.trim()) return rawProjects;
    const query = localSearch.toLowerCase().trim();
    return rawProjects.filter((project) =>
      project.name?.toLowerCase().startsWith(query),
    );
  }, [rawProjects, localSearch]);

  // Reverse mapping from backend query key to column key in AppTable
  const activeSortKeyMap: Record<string, string> = {
    name: "name",
    industry: "industry",
    products_count: "productsCount",
  };
  const activeTableSortKey = activeSortKeyMap[sortBy] || sortBy;

  // Dialog & Selection States
  const [drawer, setDrawer] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectCU | null>(
    null,
  );
  const [isUpdate, setIsUpdate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidateProjects = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleMutationError = (error: AxiosError<ApiError>) => {
    const fallbackMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message;
    toast.error(fallbackMessage || "Something went wrong");
  };

  const handleMutationSuccess = (message: string, close?: () => void) => {
    toast.success(message);
    invalidateProjects();
    close?.();
  };

  // Mutations
  const createMutation = useMutation<Project, AxiosError<ApiError>, ProjectCU>({
    mutationFn: projectService.createProject,
    onSuccess: () =>
      handleMutationSuccess("Project created successfully", () =>
        setDrawer(false),
      ),
    onError: handleMutationError,
  });

  const updateMutation = useMutation<Project, AxiosError<ApiError>, ProjectCU>({
    mutationFn: (payload) =>
      projectService.updateProject(Number(payload.id!), payload),
    onSuccess: () =>
      handleMutationSuccess("Project updated successfully", () =>
        setDrawer(false),
      ),
    onError: handleMutationError,
  });

  const deleteMutation = useMutation<void, AxiosError<ApiError>, number>({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      handleMutationSuccess("Project removed successfully", () =>
        setDeleteModal(false),
      );
      if (reduxProjectId === deleteId) {
        dispatch(setGlobalProjectId(null));
      }
    },
    onError: handleMutationError,
  });

  const handleFormSubmit = (data: ProjectCU) => {
    if (isUpdate && selectedProject?.id) {
      updateMutation.mutate({ ...data, id: selectedProject.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (project: Project, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProject({
      //@ts-ignore
      id: project.id,
      name: project.name,
      industry: project.industry,
      description: project.description,
      website_url: project.website_url,
      countries: project.countries,
    });
    setIsUpdate(true);
    setDrawer(true);
  };

  const handleDeleteTrigger = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteId(id);
    setDeleteModal(true);
  };

  // =========================
  // Table Columns Definition
  // =========================
  const columns = [
    {
      key: "name",
      label: "PROJECT",
      sortable: true,
      render: (value: string, row: Project) => {
        const projectName = value || "Unnamed Project";
        const url = row?.website_url || "";
        const isSelected = reduxProjectId === row.id;

        return (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => dispatch(setGlobalProjectId(row.id))}
          >
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                {projectName}
                {isSelected && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </span>
              {url && <span className="text-xs text-slate-400">{url}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: "industry",
      label: "INDUSTRY",
      sortable: true,
      render: (value: string) => (
        <span className="text-slate-900 font-medium">
          {formatSnakeToTitleCase(value) || "-"}
        </span>
      ),
    },
    {
      key: "productsCount",
      label: "PRODUCTS",
      sortable: true,
      render: (value: number) => (
        <span className="text-slate-900 font-semibold">
          {(value ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "countries",
      label: "COUNTRY",
      render: (value: string[] | string) => {
        const displayValue = Array.isArray(value) ? value.join(", ") : value;
        return <span className="text-slate-900">{displayValue || "-"}</span>;
      },
    },
    // Dynamic AI Platform Checkmark Columns
    ...AI_PLATFORMS.map((platform) => ({
      key: platform.key,
      label: platform.label,
      render: (_: unknown, row: Project) => {
        const supportedPlatforms = row?.platforms || ["ChatGPT", "Claude"];
        const isSupported = supportedPlatforms.some(
          (p) => p.toLowerCase() === platform.key.toLowerCase(),
        );

        return (
          <div className="text-center">
            {isSupported ? (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                ✓
              </span>
            ) : (
              <span className="text-slate-300">-</span>
            )}
          </div>
        );
      },
    })),

    {
      key: "actions",
      label: "ACTIONS",
      render: (_: unknown, row: Project) => (
        <div className="flex items-center  gap-3">
          <button
            onClick={() => {
              dispatch(setGlobalProjectId(row.id));

              navigate(`/admin`);
            }}
            className="text-emerald-600 hover:text-emerald-700 text-xs  cursor-pointer"
          >
            <LayoutDashboard size={16} />
          </button>
          <button
            onClick={(e) => handleEdit(row, e)}
            className="text-amber-600 hover:text-amber-700 text-sm font-semibold cursor-pointer"
          >
            <SquarePen size={16} />
          </button>
          <button
            onClick={(e) => handleDeleteTrigger(row.id, e)}
            className="text-red-600 hover:text-red-700 text-sm font-semibold cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const headerActionsContainer = document.getElementById(
    "layout-actions-portal",
  );

  if (isPending)
    return <div className="p-6 text-slate-500">Loading projects...</div>;
  if (isError)
    return <div className="p-6 text-red-500">Failed to load projects.</div>;

  return (
    <>
      {headerActionsContainer &&
        createPortal(
          <button
            onClick={() => {
              setSelectedProject(null);
              setIsUpdate(false);
              setDrawer(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> New project
          </button>,
          headerActionsContainer,
        )}

      {/* REUSABLE SEARCH INPUT */}
      <div className="mb-6 flex">
        <div className="w-1/2 ml-auto">
          <AppSearch
            value={localSearch}
            onChange={(val) => handleSearchChange(val)}
            placeholder="Search projects..."
          />
        </div>
      </div>

      {/* MAIN TABLE VIEW */}
      <AppTable
        columns={columns}
        data={projects}
        isLoading={isPending}
        sortKey={activeTableSortKey}
        sortDirection={sortOrder}
        onSort={handleSort}
      />

      {/* REUSABLE PAGINATION FOOTER */}
      {paginationData && (
        <div className="mt-6">
          <AppPagination
            currentPage={page}
            totalPages={paginationData.total_pages}
            totalEntries={paginationData.total}
            onPageChange={setPage}
          />
        </div>
      )}

      <AppModal
        isOpen={drawer}
        title={isUpdate ? "Update Project" : "Create New Project"}
        onClose={() => setDrawer(false)}
      >
        <ProjectForm
          key={
            selectedProject?.id ? `edit-${selectedProject.id}` : "create-new"
          }
          initialData={selectedProject}
          isUpdate={isUpdate}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleFormSubmit}
        />
      </AppModal>

      <ProjectDeleteModal
        open={deleteModal}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteModal(false)}
        onDelete={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </>
  );
}
