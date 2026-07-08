import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface SelectOption {
  id: string | number;
  value: string;
}

export interface SelectResponse {
  items: SelectOption[];
  has_more: boolean;
  next_offset: number | null;
}

interface AppRemoteSelectProps {
  value: SelectOption | null;
  onChange: (value: SelectOption | null) => void;

  /**
   * Local Options
   */
  options?: SelectOption[];

  /**
   * Remote API (Optional)
   */
  fetchFn?: (
    search: string,
    offset: number,
    limit: number,
  ) => Promise<SelectResponse>;

  /**
   * React Query Cache Key
   */
  queryKey?: string[];

  placeholder?: string;

  searchable?: boolean;

  limit?: number;

  disabled?: boolean;
}

export default function AppRemoteSelect({
  value,
  onChange,
  options = [],
  fetchFn,
  queryKey = [],
  placeholder = "Select...",
  searchable = true,
  limit = 20,
  disabled = false,
}: AppRemoteSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isRemote = !!fetchFn;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [...queryKey, search],
      enabled: isRemote && open,

      queryFn: ({ pageParam = 0 }) =>
        fetchFn!(search, pageParam as number, limit),

      initialPageParam: 0,

      getNextPageParam: (lastPage) =>
        lastPage.has_more ? lastPage.next_offset : undefined,
    });

    
  const remoteOptions = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  console.log("data use query inf",data )
  const filteredLocalOptions = useMemo(() => {
    if (!searchable || !search) return options;

    return options.filter((item) =>
      item.value.toLowerCase().includes(search.toLowerCase()),
    );
  }, [options, search, searchable]);

  const finalOptions = isRemote ? remoteOptions : filteredLocalOptions;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleScroll = () => {
    if (!isRemote) return;

    const el = listRef.current;

    if (!el) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Trigger */}

      <div
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`flex items-center justify-between border border-gray-200 rounded-md px-3 py-2 bg-white cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span
          className={`truncate ${value ? "text-slate-900" : "text-gray-400"}`}
        >
          {value?.value ?? placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown */}

      {open && (
        <div className="absolute z-[9999] mt-1 w-full bg-white  border border-gray-200 rounded-md shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-b-gray-200">
              <input
                className="w-full border border-gray-200 rounded px-2 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-64 overflow-y-auto"
          >
            {isLoading && (
              <div className="flex justify-center py-5">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}

            {!isLoading &&
              finalOptions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50"
                >
                  <span>{item.value}</span>

                  {value?.id === item.id && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </div>
              ))}

            {!isLoading && finalOptions.length === 0 && (
              <div className="py-5 text-center text-gray-500 text-sm">
                No results found
              </div>
            )}

            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <Loader2 size={18} className="animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
