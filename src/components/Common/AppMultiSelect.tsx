import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  selectAllLabel?: string;
  singleSelect?: boolean;
  triggerType?: "box" | "icon";
  icon?: ReactNode;
  onSearchApply?: (search: string) => void;
}

export function AppMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = true,
  selectAllLabel = "Select All",
  singleSelect = false,
  triggerType = "box",
  icon,
  onSearchApply,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tempValue, setTempValue] = useState<string[]>(value);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      setTempValue(value);
    }
  }, [isOpen]);

  const filteredOptions = searchable
    ? options.filter((opt) => String(opt).toLowerCase().includes(search.toLowerCase()))
    : options;

  const allSelected =
    options.length > 0 && options.every((opt) => tempValue.includes(opt));

  const toggleOption = (option: string) => {
    if (singleSelect) {
      onChange([option]);
      setSearch("");
      setIsOpen(false);
      return;
    }

    setTempValue((prev) => {
      const isRemoving = prev.includes(option);
      const updated = isRemoving
        ? prev.filter((v) => v !== option)
        : [...prev, option];

      // ✅ Search stays while selecting
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setTempValue([]);
    } else {
      setTempValue([...options]);
    }
  };

  const applySelection = () => {
    // 1. Update the actual state with selected items (Apple, Ant)
    onChange(tempValue);

    const typedValue = search.trim();

    // ✅ FIX: Prioritize selected items for the URL/Callback
    if (tempValue.length > 0) {
      // This sends "Apple, Ant" to your URL/Search handler
      onSearchApply?.(tempValue.join(","));
    }
    // 2. Only if NO items are checked, send the raw typed string (the "a")
    else if (typedValue) {
      onSearchApply?.(typedValue);
    }

    // ✅ Clear search ONLY on OK
    setSearch("");
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValues = isOpen ? tempValue : value;
  const visibleValues = displayValues.slice(0, 2);
  const remainingCount = displayValues.length - 2;

  const isAll =
    options.length > 0 && options.every((opt) => displayValues.includes(opt));

  return (
    <div className="relative inline-block w-full" ref={wrapperRef}>
      {/* TRIGGER SECTION */}
      {triggerType === "icon" ? (
        <div
          className="flex items-center justify-center cursor-pointer text-gray-700"
          onClick={() => setIsOpen((p) => !p)}
        >
          {icon ? (
            <div className="flex items-center justify-center">{icon}</div>
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
      ) : (
        <div
          className="flex items-center gap-1 w-full px-3 py-2 border border-gray-200 rounded-lg cursor-pointer bg-white"
          onClick={() => setIsOpen((p) => !p)}
        >
          {displayValues.length === 0 && (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}

          {isAll && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              All
            </span>
          )}

          {!isAll && (
            <div className="flex items-center gap-1 flex-1 overflow-hidden">
              {visibleValues.map((val) => (
                <span
                  key={val}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                >
                  {val}
                  {!singleSelect && (
                    <X
                      size={12}
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = displayValues.filter((v) => v !== val);
                        setTempValue(updated);
                        onChange(updated);
                        setSearch("");
                      }}
                    />
                  )}
                </span>
              ))}

              {remainingCount > 0 && (
                <span className="text-xs text-gray-500">
                  +{remainingCount} more
                </span>
              )}
            </div>
          )}

          <ChevronDown size={18} className="ml-auto text-gray-400" />
        </div>
      )}

      {/* DROPDOWN */}
      {isOpen && (
        <div className="absolute z-[1000] mt-1 w-[260px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[450px] flex flex-col">
          {!singleSelect && (
            <div className="p-2 flex justify-end">
              <button
                onClick={applySelection}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded cursor-pointer font-medium hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          )}

          {searchable && (
            <div className="p-2">
              <input
                type="text"
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded outline-none focus:border-blue-500"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {!singleSelect && (
            <div
              className="px-3 py-2 text-sm cursor-pointer border-t hover:bg-blue-50 flex items-center gap-2 border-b"
              onClick={toggleSelectAll}
            >
              <input type="checkbox" readOnly checked={allSelected} />
              {selectAllLabel}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-2"
                onClick={() => toggleOption(option)}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={tempValue.includes(option)}
                />
                <span className="truncate">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
