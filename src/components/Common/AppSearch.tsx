// components/Common/SearchInput.tsx
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AppSearch({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  // Local state to keep the input responsive and snappy
  const [localValue, setLocalValue] = useState(value);

  // Sync local state if the parent value changes externally (e.g., clearing filters)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce effect: Wait 300ms after the user stops typing to update the URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <div className="mb-6 max-w-md relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={localValue} // Bind to snappy local state
        onChange={(e) => setLocalValue(e.target.value)}
        className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
}
