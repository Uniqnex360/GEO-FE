import { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { createPortal } from "react-dom";
import {
  Plus,
  Globe,
  Layers,
  TrendingUp,
  Trash2,
  Edit2,
  ExternalLink,
} from "lucide-react";

import { projectService } from "../../api/project";
import {
  selectGlobalProjectId,
  setGlobalProjectId,
} from "../../store/projectSlice";
import AppModal from "../../components/Common/AppModel";
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
  countries?: string[];
  updatedAt: string;
  productsCount: number;
  visibilityScore: number;
  platforms: string[];
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

export default function ProjectDashboard() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const reduxProjectId = useSelector(selectGlobalProjectId);

  // --- URL State Initialization via React Router ---
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract page and search values from URL, falling back to defaults
  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const limit = 24;

  // --- Local Search State for Debouncing ---
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // --- Sync State Helpers (Rewritten for explicit URL updates) ---
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

  // --- The Missing Input Handler Function Fixed Here ---
  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
  };

  // Debounce effect: Updates URL params 300ms after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync local search value if the URL search param changes from elsewhere (e.g., browser back button)
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // React Query links directly to values extracted from the URL
  const {
    data: projectsData,
    isPending,
    isError,
  } = useQuery<BackendResponse, AxiosError<ApiError>>({
    queryKey: ["projects", page, searchTerm],
    queryFn: () =>
      projectService.getList({
        page,
        limit,
        search: searchTerm || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const projects = projectsData?.data || [];
  const paginationData = projectsData?.pagination;

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

  const handleEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject({
      //@ts-ignore
      id: project.id,
      name: project.name,
      website_url: project.website_url,
      countries: project.countries,
    });
    setIsUpdate(true);
    setDrawer(true);
  };

  const handleDeleteTrigger = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
    setDeleteModal(true);
  };

  const getStatusStyle = (status: Project["status"]) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Crawling":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Paused":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

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
      <AppSearch
        value={localSearch}
        onChange={(val) => handleSearchChange(val)}
        placeholder="Search projects..."
      />

      {/* Main Responsive Grid List view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const isSelected = reduxProjectId === project.id;
          const initials = (project.name || "PR")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={project.id}
              onClick={() => dispatch(setGlobalProjectId(project.id))}
              className={`bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative group/card cursor-pointer ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/5"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-[11px] font-extrabold text-slate-200 border border-slate-800">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight tracking-tight group-hover/card:text-emerald-600 transition-colors">
                        {project.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-300" />{" "}
                        {project.website_url || "No Website"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-40 group-hover/card:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEdit(project, e)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTrigger(project.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <span
                    className={`text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-full border ${getStatusStyle(
                      project.status,
                    )} flex items-center gap-1.5`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        project.status === "Active"
                          ? "bg-emerald-500"
                          : project.status === "Crawling"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                      }`}
                    />
                    {project.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {project.countries?.join(", ") || "-"} · updated{" "}
                    {project.updatedAt || "just now"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3.5 mb-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                      <Layers className="w-3 h-3 text-slate-300" /> Products
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {(project.productsCount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                      <TrendingUp className="w-3 h-3 text-slate-300" />{" "}
                      Visibility
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {project.visibilityScore ?? 0}
                      <span className="text-xs text-slate-400 font-normal">
                        /100
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Monitored AI Platforms
                </span>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {(project.platforms || ["ChatGPT", "Claude"]).map(
                    (platform, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-50 text-slate-700 border border-slate-200/60 text-xs font-semibold px-2.5 py-0.5 rounded-lg"
                      >
                        {platform}
                      </span>
                    ),
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="w-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                    Dashboard <ExternalLink className="w-3 h-3" />
                  </button>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm transition-colors text-center">
                    Products ({project.productsCount ?? 0})
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
