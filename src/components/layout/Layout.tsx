import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, ChevronRight } from "lucide-react";
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

// Updated NavItem type to support nested children
type NavItem = {
  label: string;
  icon: React.ElementType;
  to?: string;
  children?: { to: string; label: string }[];
};

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: FiHome },
  { to: "/admin/project", label: "Projects", icon: FiPackage },
  { to: "/admin/category", label: "Category", icon: FiLayers },
  {
    label: "Brand",
    icon: FiBriefcase,
    children: [
      { to: "/admin/brand", label: "List" },
      { to: "/admin/brand-chat", label: "Chat" },
      { to: "/admin/brand-chat/list", label: "Brand Chat List" },
    ],
  },
  { to: "/admin/product", label: "Products", icon: FiPackage },
  { to: "/admin/chat", label: "Chat", icon: FiFileText },
  { to: "/admin/ai-engine", label: "AI Engine", icon: FiActivity },
  { to: "/admin/citation", label: "Citation", icon: FiBarChart2 },
  { to: "/admin/competitor", label: "Competitor Intelligence", icon: FiTarget },
  { to: "/admin/settings", label: "Settings", icon: FiSettings },
  // {
  //   label: "Settings",
  //   icon: FiSettings,
  //   children: [
  //     { to: "/admin/settings/general", label: "General" },
  //     { to: "/admin/settings/team", label: "Team Members" },
  //     { to: "/admin/settings/billing", label: "Billing" },
  //   ],
  // },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
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

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
    // Automatically expand the sidebar if a user clicks a nested menu icon while collapsed
    if (collapsed) setCollapsed(false);
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
          {navItems.map((item) => {
            const hasChildren = !!item.children;
            // A parent is considered active if the current route matches its link OR any of its children's links
            const isActive = item.to
              ? location.pathname === item.to
              : item.children?.some((child) => location.pathname === child.to);

            const isOpen = openMenus[item.label];

            return (
              <div key={item.label} className="flex flex-col">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`relative w-full flex items-center 
                      ${collapsed ? "justify-center" : "justify-between"}
                      px-4 py-3 rounded-lg transition-all font-medium
                      ${
                        isActive
                          ? "bg-gray-100 text-blue-600"
                          : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />
                    )}
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`text-xl min-w-[20px] ${isActive ? "text-blue-600" : "text-slate-500"}`}
                      />
                      {!collapsed && (
                        <span className="text-sm whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {!collapsed &&
                      (isOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      ))}
                  </button>
                ) : (
                  <Link
                    to={item.to!}
                    className={`relative flex items-center 
                      ${collapsed ? "justify-center" : "justify-start"}
                      gap-3 px-4 py-3 rounded-lg transition-all font-medium
                      ${
                        isActive
                          ? "bg-gray-100 text-blue-600"
                          : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />
                    )}

                    <item.icon
                      className={`text-xl min-w-[20px] ${isActive ? "text-blue-600" : "text-slate-500"}`}
                    />

                    {!collapsed && (
                      <span className="text-sm whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </Link>
                )}

                {/* Render nested children if expanded and not collapsed */}
                {hasChildren && isOpen && !collapsed && (
                  <div className="flex flex-col mt-1 ml-10 space-y-1">
                    {item.children!.map((child) => {
                      const isChildActive = location.pathname === child.to;
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={`text-sm px-4 py-2 rounded-lg transition-all ${
                            isChildActive
                              ? "text-blue-600 font-semibold"
                              : "text-slate-500 hover:text-slate-900 hover:bg-gray-50"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
