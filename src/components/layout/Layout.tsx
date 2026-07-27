import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown } from "lucide-react";
import {
  FiMenu,
  FiHome,
  FiBriefcase,
  FiPackage,
  FiActivity,
  FiBarChart2,
  FiFileText,
  FiTarget,
  FiSettings,
  FiLayers,
} from "react-icons/fi";

import { projectService } from "../../api/project";
import {
  setGlobalProjectId,
  selectGlobalProjectId,
} from "../../store/projectSlice";

// Shared interface used for pipeline context
export interface Project {
  id: number;
  name: string;
  website: string;
  status: "Active" | "Crawling" | "Paused";
  country: string;
  updatedAt: string;
  productsCount: number;
  visibilityScore: number;
  platforms: string[];
}

const navItems = [
  { to: "/admin", label: "Dashboard", icon: FiHome },
  { to: "/admin/project", label: "Projects", icon: FiPackage },
  { to: "/admin/category", label: "Category", icon: FiLayers },
  { to: "/admin/brand", label: "Brands", icon: FiBriefcase },
  { to: "/admin/product", label: "Products", icon: FiPackage },
  { to: "/admin/chat", label: "Chat", icon: FiFileText },
  { to: "/admin/ai-engine", label: "AI Engine", icon: FiActivity },
  { to: "/admin/citation", label: "Citation", icon: FiBarChart2 },
  { to: "/admin/competitor", label: "Competitor Intelligence", icon: FiTarget },
  { to: "/admin/settings", label: "Settings", icon: FiSettings },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();

  // Get persisted global project ID from Redux
  const reduxProjectId = useSelector(selectGlobalProjectId);

  // ==========================================
  // Global Project Fetching for Dynamic Header
  // ==========================================
  const { data } = useQuery({
    queryKey: ["projects"],
    //@ts-ignore
    queryFn: projectService.getList,
    staleTime: 1000 * 60 * 5, // Cache stays completely fresh for 5 mins
  });
  //@ts-ignore
  const projects: Project[] = Array.isArray(data) ? data : (data?.data ?? []);

  // ==========================================
  // Persistent Redux Sync Effect
  // ==========================================
  useEffect(() => {
    if (projects.length > 0) {
      if (reduxProjectId) {
        // Confirm the saved selection ID still exists in the database list
        const exists = projects.some((p) => p.id === reduxProjectId);
        if (!exists) {
          dispatch(setGlobalProjectId(projects[0].id));
        }
      } else {
        // Fallback default back into Redux on clean setups
        dispatch(setGlobalProjectId(projects[0].id));
      }
    }
  }, [projects, reduxProjectId, dispatch]);

  const handleScopeChange = (id: number) => {
    dispatch(setGlobalProjectId(id));
  };

  // Find the exact metadata object matching our global context
  const activeProject = projects.find((p) => p.id === reduxProjectId);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`bg-white text-slate-900 flex flex-col transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 flex-shrink-0">
          <h1 className="font-bold text-lg text-slate-900">
            {collapsed ? "G" : "GEO"}
          </h1>
        </div>

        {/* Navigation with vertical scrolling */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;

            return (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center 
                  ${collapsed ? "justify-center" : "justify-start"}
                  gap-3 px-4 py-3 rounded-lg transition-all font-medium
                  ${
                    active
                      ? "bg-gray-100 text-blue-600"
                      : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />
                )}

                <Icon
                  className={`text-xl min-w-[20px] ${active ? "text-blue-600" : "text-slate-500"}`}
                />

                {!collapsed && (
                  <span className="text-sm whitespace-nowrap">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* TOGGLE RAIL */}
      <div className="w-10 bg-white flex items-start justify-center pt-4 border-r border-gray-200">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="text-slate-600 hover:bg-gray-100 p-2 rounded-lg transition"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* CONTENT REGION CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        {/* REUSABLE WORKSPACE HEADER */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex-shrink-0">
          <div className="mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeProject ? activeProject.name : "Loading Workspace..."}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Currently tracking diagnostics for{" "}
                {activeProject?.website || "your core domain"}
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              <div className="relative">
                <select
                  value={reduxProjectId || ""}
                  onChange={(e) => handleScopeChange(parseInt(e.target.value))}
                  className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-3.5 pr-9 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all shadow-sm"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-3 pointer-events-none text-slate-500" />
              </div>

              {/* Dynamic Action Button target container */}
              <div id="layout-actions-portal" />
            </div>
          </div>
        </header>

        {/* DYNAMIC SCROLLABLE SUB-PAGE BODY */}
        <main className="flex-1 overflow-auto p-8 bg-slate-50/50">
          <Outlet context={{ projects, activeProject }} />
        </main>
      </div>
    </div>
  );
}
