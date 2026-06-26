import { Bell, ChevronDown, Search } from "lucide-react";

interface AppHeaderProps {
  currentWorkspace?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function AppHeader({
  currentWorkspace = "Northwave Audio",
  searchValue,
  onSearchChange,
}: AppHeaderProps) {
  return (
    <div className="border-b border-gray-800 px-6 py-3 bg-white">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Workspace</span>

          <span>/</span>

          <button className="flex items-center gap-1 text-gray-200">
            {currentWorkspace}
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="flex-1 max-w-lg relative hidden sm:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search brands..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-800 text-slate-900"
          />
        </div>

        <button className="relative p-2 text-gray-400 hover:text-slate-900">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
        </button>
      </div>
    </div>
  );
}
