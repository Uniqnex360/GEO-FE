import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  Sliders,
  Play,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Lightbulb,
  Target,
  FileText,
} from "lucide-react";
import { useSelector } from "react-redux";
import { AppMultiSelect } from "../../components/Common/AppMultiSelect";

import { selectGlobalProjectId } from "../../store/projectSlice";

//@ts-ignore
import wcc from "world-countries-capitals";

import { streamApi, SimpleMarkdownRenderer, type Log } from "./common";

export interface Recommendation {
  dimension: string;
  what_to_do: string;
  why_it_helps: string;
  suggested_content: string;
}

export default function Brand_Chat() {
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

  const reduxProjectId = useSelector(selectGlobalProjectId);
  const countryOptions = getCountryList();

  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    "United States of America",
  ]);
  const [extraContext, setExtraContext] = useState("");

  const [logs, setLogs] = useState<Log[]>([]);
  const [result, setResult] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultEndRef = useRef<HTMLDivElement>(null);
  const country = selectedCountries[0] || "";

  const canSubmit =
    !!brandName.trim() &&
    !!website.trim() &&
    !!country.trim() &&
    !!reduxProjectId;

  useEffect(() => {
    if (result || recommendations.length > 0) {
      resultEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [result, recommendations]);

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy content: ", err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLogs([]);
    setResult("");
    setRecommendations([]);
    setLoading(true);

    try {
      await streamApi<any>(
        "api/v1/brand/init_brand_analyzes/",
        {
          brand_name: brandName.trim(),
          country: country.trim(),
          website: website.trim(),
          extra_context: extraContext,
          tenant_id: Number(reduxProjectId),
        },
        (event: any) => {
          if (event.type === "status") {
            setLogs((prev) => [...prev, event]);
          }
          if (event.type === "result") {
            setResult(event.report);
          }
          if (event.type === "recommendation") {
            setRecommendations((prev) => [...prev, event.recommendation]);
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
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md shrink-0">
          <div className="text-left">
            <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Brand Optimization Lab
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Generative Engine Brand Analytics
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 pb-40">
          {!loading &&
            logs.length === 0 &&
            !result &&
            recommendations.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-2xl max-w-lg mx-auto mt-12 space-y-4 bg-white p-6 shadow-sm">
                <div className="text-4xl text-indigo-500 flex justify-center">
                  <Sparkles size={40} />
                </div>
                <h3 className="text-slate-700 font-semibold">
                  No Active Brand Audit
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                  Configure brand name, website, and target country in the
                  sidebar, then add optional research context below to run the
                  brand analytics pipeline.
                </p>
              </div>
            )}

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

          {result && (
            <article className="bg-white border border-slate-200 rounded-xl p-6 shadow-md animate-fadeIn border-t-2 border-t-indigo-600">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  AI Strategy Playbook Response
                </span>

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

              <div className="selection:bg-indigo-200">
                <SimpleMarkdownRenderer text={result} />
              </div>
            </article>
          )}

          {recommendations.length > 0 && (
            <section className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Lightbulb className="text-amber-500" size={18} />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Strategic Recommendations ({recommendations.length})
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Target size={11} />
                          {item.dimension}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          #0{idx + 1}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.what_to_do}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.why_it_helps}
                        </p>
                      </div>
                    </div>

                    {item.suggested_content && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <FileText size={12} />
                          Suggested Content
                        </div>
                        <div className="text-slate-700 max-h-48 overflow-y-auto leading-relaxed pr-1">
                          <SimpleMarkdownRenderer
                            text={item.suggested_content}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div ref={resultEndRef} />
        </div>

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
                  {!brandName.trim()
                    ? "⚠️ Brand name is required to proceed."
                    : !website.trim()
                      ? "⚠️ Website address is required to proceed."
                      : !country.trim()
                        ? "⚠️ Target country is required to proceed."
                        : !reduxProjectId
                          ? "⚠️ Select a project to unlock engine run."
                          : "⚡ Ready for brand analytics execution."}
                </p>
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
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

      <aside className="w-[320px] bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-sm z-20">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-slate-700">
          <Sliders size={16} className="text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Brand Config Matrix
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-1">
              Target Directives
            </h3>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                Brand Name <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Linear"
                disabled={loading}
                required
                className="w-full h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>

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

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                Country <span className="text-red-500 font-bold">*</span>
              </label>
              <AppMultiSelect
                options={countryOptions}
                value={selectedCountries}
                onChange={setSelectedCountries}
                placeholder="Filter markets..."
                singleSelect
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[10px] font-mono text-slate-400 font-medium">
            Brand Analytics Engine
          </p>
        </div>
      </aside>
    </div>
  );
}
