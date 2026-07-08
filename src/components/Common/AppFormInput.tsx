import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Controller,
  useFormContext,
  type FieldValues,
  type UseFormRegister,
  type RegisterOptions,
  type FieldError,
  type Path,
  type UseFormStateReturn,
  type Control,
} from "react-hook-form";

// Import your existing single-select component from common components
import AppRemoteSelect from "./AppRemoteSelect";

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface SelectOption {
  id: string | number | boolean;
  value: string;
}

interface AppFormInputProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  type?: string;
  placeholder?: string;
  register: UseFormRegister<T>;
  rules?: RegisterOptions<T, Path<T>>;
  error?: FieldError;
  className?: string;
  formState?: UseFormStateReturn<T>;
  options?: SelectOption[];

  // Custom Multi-Select & Remote Configuration Props
  control?: Control<T>;
  searchable?: boolean;
  selectAllLabel?: string;

  // Remote API Props passed through to AppRemoteSelect
  fetchFn?: (
    search: string,
    offset: number,
    limit: number,
  ) => Promise<{ items: any[]; has_more: boolean; next_offset: number | null }>;
  queryKey?: string[];
  limit?: number;
  disabled?: boolean;
}

// ==========================================
// INNER COMPONENT: THE DROPDOWN LAYER (UNTOUCHED)
// ==========================================
interface MultiSelectLayerProps {
  options: SelectOption[];
  value: any[];
  onChange: (value: any[]) => void;
  placeholder?: string;
  searchable?: boolean;
  selectAllLabel?: string;
}

function DropdownMultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select...",
  searchable = true,
  selectAllLabel = "Select All",
}: MultiSelectLayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedValues = Array.isArray(value) ? value : [];

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.value.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const allSelected =
    options.length > 0 &&
    options.every((opt) => selectedValues.includes(opt.id));

  const toggleOption = (optionId: any) => {
    const isRemoving = selectedValues.includes(optionId);
    const updated = isRemoving
      ? selectedValues.filter((v) => v !== optionId)
      : [...selectedValues, optionId];
    onChange(updated);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.id));
    }
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

  const visibleValues = selectedValues.slice(0, 2);
  const remainingCount = selectedValues.length - 2;
  const isAll =
    options.length > 0 &&
    options.every((opt) => selectedValues.includes(opt.id));

  return (
    <div className="relative inline-block w-full" ref={wrapperRef}>
      <div
        className="flex items-center gap-1 w-full px-3 py-2 border border-gray-300 rounded cursor-pointer bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-blue-400"
        onClick={() => setIsOpen((p) => !p)}
      >
        {selectedValues.length === 0 && (
          <span className="text-sm text-gray-400">{placeholder}</span>
        )}

        {isAll && (
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded font-medium">
            All
          </span>
        )}

        {!isAll && (
          <div className="flex items-center gap-1 flex-1 overflow-hidden">
            {visibleValues.map((valId) => {
              const matchedOpt = options.find((o) => o.id === valId);
              if (!matchedOpt) return null;
              return (
                <span
                  key={String(valId)}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-medium"
                >
                  {matchedOpt.value}
                  <X
                    size={12}
                    className="cursor-pointer hover:text-blue-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(selectedValues.filter((v) => v !== valId));
                    }}
                  />
                </span>
              );
            })}

            {remainingCount > 0 && (
              <span className="text-xs text-gray-500 font-medium">
                +{remainingCount} more
              </span>
            )}
          </div>
        )}

        <ChevronDown size={18} className="ml-auto text-gray-400 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-[300px] flex flex-col overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded outline-none focus:border-blue-500"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div
            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-2 border-b border-gray-100 select-none"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelectAll();
            }}
          >
            <input
              type="checkbox"
              readOnly
              checked={allSelected}
              className="cursor-pointer"
            />
            <span className="font-medium text-slate-700">{selectAllLabel}</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 italic text-center">
                No match options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={String(option.id)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-2 select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(option.id);
                  }}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedValues.includes(option.id)}
                    className="cursor-pointer"
                  />
                  <span className="truncate text-slate-700">
                    {option.value}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CORE COMPONENT: APPFORMINPUT
// ==========================================
const AppFormInput = <T extends FieldValues>({
  label,
  name,
  type = "text",
  placeholder,
  register,
  rules,
  error,
  className = "",
  formState,
  options = [],
  control,
  searchable = true,
  selectAllLabel = "Select All",
  fetchFn,
  queryKey,
  limit,
  disabled = false,
}: AppFormInputProps<T>) => {
  const showError = !!error && formState?.isSubmitted;
  const context = useFormContext<T>();

  // Resolve control instance dynamically if available
  const activeControl = control || context?.control;

  const inputClass = `w-full border rounded p-2 focus:outline-none focus:ring-2 ${
    showError
      ? "border-red-500 focus:ring-red-400"
      : "border-gray-300 focus:ring-blue-400"
  }`;

  return (
    <div className={`mb-3 ${className} w-full`}>
      <label className="block mb-1 text-slate-900 font-medium">
        {label} {rules?.required && <span className="text-red-500">*</span>}
      </label>

      {/* TEXTAREA */}
      {type === "textarea" && (
        <textarea
          {...register(name, rules)}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
          className={inputClass}
        />
      )}

      {/* SINGLE SELECT (Uses the imported AppRemoteSelect component directly) */}
      {type === "select" && control && (
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field: { onChange, value } }) => {
            // 💡 1. Convert the plain form string into the object format AppRemoteSelect expects
            const objectValue = value
              ? { id: value, value: String(value) }
              : null;

            return (
              <AppRemoteSelect
                value={objectValue}
                onChange={(selectedOption) => {
                  // 💡 2. Send back just the raw ID string to your React Hook Form state
                  onChange(selectedOption ? selectedOption.id : "");
                }}
                fetchFn={fetchFn}
                queryKey={queryKey}
                limit={limit}
                placeholder={placeholder}
              />
            );
          }}
        />
      )}

      {/* RE-ENGINEERED INSTANT MULTI-SELECT (UNTOUCHED) */}
      {type === "multiselect" && activeControl && (
        <Controller
          name={name}
          control={activeControl}
          rules={rules}
          render={({ field: { onChange, value } }) => (
            <DropdownMultiSelect
              options={options}
              value={value}
              onChange={onChange}
              placeholder={placeholder || `Select ${label}...`}
              searchable={searchable}
              selectAllLabel={selectAllLabel}
            />
          )}
        />
      )}

      {/* CHECKBOX */}
      {type === "checkbox" && (
        <input
          type="checkbox"
          disabled={disabled}
          {...register(name, rules)}
          className="h-4 w-4 cursor-pointer"
        />
      )}

      {/* RADIO */}
      {type === "radio" && (
        <div className="flex gap-4 pt-1">
          {options.map((option) => (
            <label
              key={String(option.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                disabled={disabled}
                value={String(option.id)}
                {...register(name, rules)}
              />
              {option.value}
            </label>
          ))}
        </div>
      )}

      {/* DEFAULT INPUT TYPES */}
      {!["textarea", "select", "multiselect", "checkbox", "radio"].includes(
        type,
      ) && (
        <input
          type={type}
          disabled={disabled}
          {...register(name, rules)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}

      {showError && (
        <p className="text-red-500 text-sm mt-1">{error?.message}</p>
      )}
    </div>
  );
};

export default AppFormInput;
