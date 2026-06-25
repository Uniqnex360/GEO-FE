import { X } from "lucide-react";
import { useEffect } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function AppDrawer({
  isOpen,
  onClose,
  title,
  children,
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/70 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-950 shadow-xl z-50 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 cursor-pointer" />
          </button>
        </div>
        <div
          className="
            flex-1
            overflow-y-auto
            p-2
            pt-3
            scrollbar-thin
            scrollbar-thumb-gray-700
            scrollbar-track-gray-900
            hover:scrollbar-thumb-gray-600
          "
        >
          {children}
        </div>
      </div>
    </>
  );
}
