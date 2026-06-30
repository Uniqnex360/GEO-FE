import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiHome,
  FiBriefcase,
  FiPackage,
  FiActivity,
  FiBarChart2,
  FiFileText,
  FiTarget,
  // FiTrendingUp,
  // FiPieChart,
  // FiSettings,
  // FiSearch,
} from "react-icons/fi";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: FiHome },
  { to: "/admin/brand", label: "Brand", icon: FiBriefcase },
  {
    to: "/admin/product",
    label: "Product",
    icon: FiPackage,
  },
  { to: "/admin/chat", label: "Chat", icon: FiFileText },
  {
    to: "/admin/ai-engine",
    label: "AI Engine",
    icon: FiActivity,
  },
  {
    to: "/admin/citation",
    label: "Citation",
    icon: FiBarChart2,
  },
  // {
  //   to: "/admin/citation-intelligence",
  //   label: "Citation Intelligence",
  //   icon: FiFileText,
  // },
  {
    to: "/admin/competitor",
    label: "Competitor Intelligence",
    icon: FiTarget,
  },
  // {
  //   to: "/admin/product-visibility",
  //   label: "Product Visibility",
  //   icon: FiPackage,
  // },
  // {
  //   to: "/admin/optimization-recommendations",
  //   label: "Optimization Recommendations",
  //   icon: FiTrendingUp,
  // },
  // {
  //   to: "/admin/reports",
  //   label: "Reports",
  //   icon: FiPieChart,
  // },
  // {
  //   to: "/admin/settings",
  //   label: "Admin Settings",
  //   icon: FiSettings,
  // },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`bg-white text-slate-900 flex flex-col transition-all duration-300  ${
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
                {/* Active left border */}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
}
