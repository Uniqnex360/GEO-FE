import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ChevronDown,
  X,
  Globe,
  Sliders,
  Play,
  Loader2,
  Sparkles,
  Copy, // Added for Copy Button
  Check, // Added for Copy Success State
} from "lucide-react";
import type { ReactNode } from "react";

// Import the package as a default object
//@ts-ignore
import wcc from "world-countries-capitals";

import { ExcelDownloadButton } from "../../components/Common/ExcelDownload";
import { ExcelUploadButton } from "../../components/Common/ExcelUpload";

// Token storage helper
const tokenStorage = {
  getAccess: () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },
  clear: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/";

type Log = {
  color: string;
  message: string;
};

let isRefreshing = false;
let queue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  queue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  queue = [];
};

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await axios.post(`${API_BASE_URL}api/v1/auth/refresh_token/`, {
    refresh_token: refreshToken,
  });

  const access = res.data.access_token;
  const refresh = res.data.refresh_token;
  tokenStorage.setTokens(access, refresh);
  return access;
}

export async function streamApi<T>(
  endpoint: string,
  body: any,
  onMessage: (data: T) => void,
) {
  let token = tokenStorage.getAccess();
  //@ts-ignore
  async function executeRequest(accessToken?: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((newToken) => executeRequest(newToken));
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        return executeRequest(newToken);
      } catch (err) {
        processQueue(err, null);
        tokenStorage.clear();
        window.location.href = "/login";
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          onMessage(parsed);
        } catch (err) {
          console.error("Stream parse error", err);
        }
      }
    }
  }

  return executeRequest(token || undefined);
}

// ==========================================
// A SIMPLE MARKDOWN PARSER COMPONENT
// ==========================================
function SimpleMarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2 text-slate-800 text-sm font-sans leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h4
              key={i}
              className="text-base font-bold text-slate-900 pt-3 pb-1"
            >
              {line.replace("### ", "")}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3
              key={i}
              className="text-lg font-bold text-slate-900 pt-4 pb-1 border-b border-slate-100"
            >
              {line.replace("## ", "")}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2
              key={i}
              className="text-xl font-extrabold text-slate-900 pt-4 pb-2"
            >
              {line.replace("# ", "")}
            </h2>
          );
        }
        if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
          const cleanLine = line.trim().replace(/^[\*\-]\s+/, "");
          return (
            <ul key={i} className="list-disc pl-5 my-1">
              <li>{parseInlineMarkdown(cleanLine)}</li>
            </ul>
          );
        }
        return line.trim() === "" ? (
          <div key={i} className="h-2" />
        ) : (
          <p key={i}>{parseInlineMarkdown(line)}</p>
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// ==========================================
// 1. MULTI-SELECT COMPONENT
// ==========================================
interface MultiSelectProps {
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
}: MultiSelectProps) {
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
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const allSelected =
    options.length > 0 && options.every((opt) => tempValue.includes(opt));

  const toggleOption = (option: string) => {
    if (singleSelect) {
      onChange([option]);
      setSearch("");
      isOpen && setIsOpen(false);
      return;
    }

    setTempValue((prev) => {
      const isRemoving = prev.includes(option);
      return isRemoving ? prev.filter((v) => v !== option) : [...prev, option];
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
    onChange(tempValue);
    const typedValue = search.trim();

    if (tempValue.length > 0) {
      onSearchApply?.(tempValue.join(","));
    } else if (typedValue) {
      onSearchApply?.(typedValue);
    }

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
  const visibleValues = displayValues.slice(0, 1);
  const remainingCount = displayValues.length - 1;
  const isAll =
    options.length > 0 && options.every((opt) => displayValues.includes(opt));

  return (
    <div className="relative inline-block w-full" ref={wrapperRef}>
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
          className="flex items-center gap-1 w-full px-3 py-2 border border-slate-200 rounded-xl cursor-pointer bg-slate-50 text-sm h-[38px]"
          onClick={() => setIsOpen((p) => !p)}
        >
          {displayValues.length === 0 && (
            <span className="text-slate-400">{placeholder}</span>
          )}
          {isAll && (
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded font-medium">
              All
            </span>
          )}
          {!isAll && (
            <div className="flex items-center gap-1 flex-1 overflow-hidden">
              {visibleValues.map((val) => (
                <span
                  key={val}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-medium whitespace-nowrap"
                >
                  {val}
                  {!singleSelect && (
                    <X
                      size={12}
                      className="hover:text-indigo-900"
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
                <span className="text-xs text-slate-500 font-medium">
                  +{remainingCount} more
                </span>
              )}
            </div>
          )}
          <ChevronDown size={16} className="ml-auto text-slate-400" />
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full z-[1000] mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-[260px] flex flex-col overflow-hidden animate-fadeIn">
          {!singleSelect && (
            <div className="p-2 flex justify-between items-center bg-slate-50 border-b border-slate-100 shrink-0">
              <span className="text-xs font-semibold text-slate-500 px-1">
                Target Filters
              </span>
              <button
                type="button"
                onClick={applySelection}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg cursor-pointer font-semibold hover:bg-indigo-700 transition-colors"
              >
                OK
              </button>
            </div>
          )}

          {searchable && (
            <div className="p-2 border-b border-slate-100 shrink-0">
              <input
                type="text"
                className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 text-slate-800"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {!singleSelect && (
            <div
              className="px-3 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 text-slate-600 shrink-0"
              onClick={toggleSelectAll}
            >
              <input
                type="checkbox"
                readOnly
                checked={allSelected}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              {selectAllLabel}
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50/50 flex items-center gap-2 text-slate-700 transition-colors"
                onClick={() => toggleOption(option)}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={tempValue.includes(option)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
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

// ==========================================
// 2. MAIN CHAT CONTAINER & SIDEBAR LAYOUT
// ==========================================
export default function Chat() {
  const getCountryList = (): string[] => {
    try {
      if (wcc && typeof wcc.getAllCountries === "function") {
        return wcc.getAllCountries().map((c: string) =>
          c
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        );
      }
    } catch (e) {
      console.error("Failed to parse package metadata:", e);
    }
    return [
      "United States",
      "United Kingdom",
      "Canada",
      "Germany",
      "France",
      "India",
      "Australia",
    ];
  };

  const countryOptions = getCountryList();

  // Core Sidebar Fields
  const [productName, setProductName] = useState("");
  const [website, setWebsite] = useState(""); // Mandatory Website field
  const [productUrl, setProductUrl] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    "United States of America",
  ]);

  // Optional Product Identifiers
  const [sku, setSku] = useState("");
  const [mpn, setMpn] = useState("");
  const [ean, setEan] = useState("");
  const [upc, setUpc] = useState("");

  // Main Workspace Input
  const [extraContext, setExtraContext] = useState("");

  // Pipeline execution state
  const [logs, setLogs] = useState<Log[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false); // Copy state tracker

  const resultEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  // Copy functionality function
  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // revert icon after 2s
    } catch (err) {
      console.error("Failed to copy content: ", err);
    }
  };

  // ==========================================
  // BULK EXCEL UPLOAD HANDLING FUNCTIONS
  // ==========================================
  //@ts-ignore
  const handleUploadSuccess = (response: any) => {
    toast.success("Bulk workspace items imported successfully!");

    // Optional trace logging inside your dynamic feed to confirm action completion
    setLogs((prev) => [
      ...prev,
      {
        color: "#4f46e5",
        message: "Spreadsheet context verified. Optimization matrix updated.",
      },
    ]);
  };

  const handleUploadError = (error: any) => {
    console.error("Excel import failed:", error);
    toast.error(
      "Failed to process Excel import. Please check spreadsheet columns.",
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate mandatory fields: website must exist, and either productName or productUrl must be provided
    if (
      !website.trim() ||
      (!productName.trim() && !productUrl.trim()) ||
      loading
    )
      return;

    setLogs([]);
    setResult("");
    setLoading(true);

    try {
      await streamApi<any>(
        "api/v1/chat/init_llm_analyzes/",
        {
          product_name: productName.trim() || null,
          website: website.trim() || null,
          product_url: productUrl.trim() || null,
          sku: sku.trim() || null,
          mpn: mpn.trim() || null,
          ean: ean.trim() || null,
          upc: upc.trim() || null,
          extra_context: extraContext,
          countries: selectedCountries,
        },
        (event: any) => {
          if (event.type === "status") {
            setLogs((prev) => [...prev, event]);
          }
          if (event.type === "result") {
            setResult(event.content);
          }
          if (event.type === "error") {
            setLogs((prev) => [
              ...prev,
              {
                color: event.color || "#ef4444",
                message: event.message,
              },
            ]);
            setLoading(false);
          }
        },
      );
    } catch (error: any) {
      console.error("Pipeline failure:", error);
      setLogs((prev) => [
        ...prev,
        {
          color: "#ef4444",
          message:
            error?.message || "Network error occurred during pipeline run.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex overflow-hidden antialiased font-sans selection:bg-indigo-500/20">
      {/* LEFT AREA: MAIN WORKSPACE INTERACTION TERMINAL */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full">
        {/* Header bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md shrink-0">
          <div className="text-left">
            <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              GEO Optimization Lab
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Generative Engine Footprint Sandbox
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ExcelDownloadButton
              apiUrl={`api/v1/chat/bulk-upload-template/`}
              filename="chat_template.xlsx"
              iconSize={22}
              className="text-slate-600 hover:text-green-600 transition-colors"
              onSuccess={() =>
                toast.success("Your download has completed successfully!")
              }
              onError={(err) => {
                console.log("err", err);
                toast.error("Something went wrong spinning up your file.");
              }}
            />

            <ExcelUploadButton
              apiUrl="api/v1/chat/bulk-upload/"
              payloadKey="file"
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
              iconSize={22}
              className="text-slate-600 hover:text-indigo-600 transition-colors"
            />
          </div>
        </header>

        {/* Dynamic Trace Logs & Render Output Container */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 pb-40">
          {/* Default Blank Screen */}
          {!loading && logs.length === 0 && !result && (
            <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-2xl max-w-lg mx-auto mt-12 space-y-4 bg-white p-6 shadow-sm">
              <div className="text-4xl text-indigo-500 flex justify-center">
                <Sparkles size={40} />
              </div>
              <h3 className="text-slate-700 font-semibold">
                No Active Audit Plan
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                Configure your tracking variables in the options manager sidebar
                on the right. You can target by explicit catalog name, parse raw
                parameters from a product URL asset, and specify localization
                markers.
              </p>
            </div>
          )}

          {/* Running Status Logs Layer */}
          {logs.length > 0 && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3 backdrop-blur-sm">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-ping" />
                Graph Engine Execution Steps
              </h4>
              <div className="space-y-2 font-mono text-xs">
                {logs.map((log, index) => {
                  const isLatest = index === logs.length - 1;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 text-slate-700 transition-all duration-300 animate-fadeIn"
                    >
                      {loading && isLatest ? (
                        <Loader2 className="h-3.5 w-3.5 text-indigo-600 animate-spin shrink-0 mt-0.5" />
                      ) : (
                        <span className="text-emerald-600 font-bold shrink-0">
                          ✓
                        </span>
                      )}
                      <span
                        style={{ color: log.color }}
                        className="brightness-90 tracking-tight"
                      >
                        {log.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Final Strategy Engine Response Block */}
          {result && (
            <article className="bg-white border border-slate-200 rounded-xl p-6 shadow-md animate-fadeIn border-t-2 border-t-indigo-600">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  AI Strategy Playbook Response
                </span>

                {/* Updated Action Controls with Copy Button Container */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
                    title="Copy response payload"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 text-[11px]">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span className="text-[11px]">Copy Option</span>
                      </>
                    )}
                  </button>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-mono border border-indigo-100">
                    Live Engine Stream
                  </span>
                </div>
              </div>

              {/* Clean Markdown rendering block */}
              <div className="selection:bg-indigo-200">
                <SimpleMarkdownRenderer text={result} />
              </div>
              <div ref={resultEndRef} />
            </article>
          )}
        </div>

        {/* Persistent Bottom Console Form Interaction */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent z-10 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <form
              onSubmit={handleGenerate}
              className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all group"
            >
              <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Extra Context / Research Goals
                </label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Add targeting instructions, focus keywords, or competitor specifications..."
                  disabled={loading}
                  rows={2}
                  className="w-full bg-transparent border-0 p-0 text-sm text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none resize-none disabled:opacity-50 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400 font-mono font-medium">
                  {!website.trim()
                    ? "⚠️ Website address is required to proceed."
                    : !productName.trim() && !productUrl.trim()
                      ? "⚠️ Enter product identifier or URL to unlock engine run."
                      : "⚡ Ready for strategy execution."}
                </p>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !website.trim() ||
                    (!productName.trim() && !productUrl.trim())
                  }
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:scale-100 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Evaluating Indexes...</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="fill-current" />
                      <span>Execute Run</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT AREA: FIXED CONFIGURATION SIDEBAR OPTIONS BAR */}
      <aside className="w-[320px] bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-sm z-20">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-slate-700">
          <Sliders size={16} className="text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Audit Config Matrix
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Target Identifier Configuration Area */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-1">
              Target Directives
            </h3>

            {/* Input 1: Product Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Product / Brand Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Linear"
                disabled={loading}
                className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>

            {/* Mandatory Input: Website */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                Website <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <Globe size={13} className="absolute left-3 text-slate-400" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  required
                  className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Split Divider Line */}
            <div className="relative flex py-1 items-center text-xs text-slate-400 font-mono">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                OR Optional Fallback
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Input 2: Optional Product URL Extract Target */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Product URL Asset
                </label>
                <span className="text-[9px] bg-indigo-50 text-indigo-600 font-mono px-1.5 py-0.5 rounded border border-indigo-100 uppercase font-bold">
                  LLM Scan
                </span>
              </div>
              <div className="relative flex items-center">
                <Globe size={13} className="absolute left-3 text-slate-400" />
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://example.com/product"
                  disabled={loading}
                  className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal pt-0.5">
                If the product catalog name is missing, the backend pipeline
                crawls and parses structural profile properties via this asset
                address.
              </p>
            </div>
          </div>

          {/* Optional Product Identifiers Grid Section */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-1">
              Identifiers (Optional)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. SKU-123"
                  disabled={loading}
                  className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  MPN
                </label>
                <input
                  type="text"
                  value={mpn}
                  onChange={(e) => setMpn(e.target.value)}
                  placeholder="e.g. MPN-456"
                  disabled={loading}
                  className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  EAN
                </label>
                <input
                  type="text"
                  value={ean}
                  onChange={(e) => setEan(e.target.value)}
                  placeholder="e.g. EAN-789"
                  disabled={loading}
                  className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  UPC
                </label>
                <input
                  type="text"
                  value={upc}
                  onChange={(e) => setUpc(e.target.value)}
                  placeholder="e.g. UPC-012"
                  disabled={loading}
                  className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Regional Localization Profile Target Selector */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-1">
              Geographic Footprint
            </h3>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Target Markets
              </label>
              <AppMultiSelect
                options={countryOptions}
                value={selectedCountries}
                onChange={setSelectedCountries}
                placeholder="Filter markets..."
              />
            </div>
          </div>
        </div>

        {/* Footer info block */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[10px] font-mono text-slate-400 font-medium">
            LangGraph Strategy Engine v2.4
          </p>
        </div>
      </aside>
    </div>
  );
}
