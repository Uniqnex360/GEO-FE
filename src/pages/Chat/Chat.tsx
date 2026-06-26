import { useState, useRef, useEffect } from "react";
import { streamApi } from "../../api/streamAPI";

type Log = {
  color: string;
  message: string;
};

type ModelOption = {
  id: string;
  name: string;
  badge: string;
};

const AVAILABLE_MODELS: ModelOption[] = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", badge: "Fast & Token-Optimized" },
  { id: "gpt-4o", name: "GPT-4o", badge: "Deep Analytical Insight" },
  { id: "o1-mini", name: "o1 Mini", badge: "Advanced Reasoning" },
];

export default function Chat() {
  // Config & Inputs States
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [extraContext, setExtraContext] = useState("");

  // Pipeline execution state
  const [logs, setLogs] = useState<Log[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-scroll anchor for streaming response text
  const resultEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productUrl.trim() || loading) return;

    setLogs([]);
    setResult("");
    setLoading(true);

    try {
      await streamApi(
        "api/v1/chat/init_llm_analyzes/",
        {
          product_name: productName,
          product_url: productUrl,
          extra_context: extraContext,
          model: selectedModel,
        },

        (event: any) => {
          if (event.type === "status") {
            setLogs((prev) => [...prev, event]);
          }

          if (event.type === "result") {
            setResult(event.content);
          }
        },
      );
    } catch (error) {
      console.error("Pipeline failure:", error);

      setLogs((prev) => [
        ...prev,
        {
          color: "#ef4444",

          message: "Network error occurred during pipeline run.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30">
      {/* --- TOP HEADER NAVIGATION LAYER --- */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          {/* Model Selector Placement (Top Left) */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Engine Model Target
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} — {model.badge}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-right">
          <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            GEO Optimization Lab
          </h1>
          <p className="text-xs text-slate-400">
            Generative Engine Footprint Sandbox
          </p>
        </div>
      </header>

      {/* --- MAIN CONTENT CONTAINER (Scrollable Stream Canvas) --- */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-6 pb-96 space-y-8">
        {/* Dynamic State Placeholder */}
        {!loading && logs.length === 0 && !result && (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl max-w-xl mx-auto mt-12 space-y-3">
            <div className="text-3xl">🌐</div>
            <h3 className="text-slate-300 font-semibold">
              No Active Audit Plan
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Configure your product targets inside the core dashboard below to
              start scanning LLM indexes and generating optimization
              recommendations.
            </p>
          </div>
        )}

        {/* Status Activity Stepper Layer */}
        {logs.length > 0 && (
          <section className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-5 space-y-3 shadow-xl backdrop-blur-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Graph Engine Execution Steps
            </h4>
            <div className="grid gap-2 text-sm">
              {logs.map((log, index) => {
                const isLatest = index === logs.length - 1;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 transition-all duration-300 animate-fadeIn"
                    style={{ color: log.color }}
                  >
                    {loading && isLatest ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <span className="text-emerald-400 font-bold text-md">
                        ✓
                      </span>
                    )}
                    <span className="font-mono text-xs tracking-tight brightness-110">
                      {log.message}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Main Strategic Output Document Text Window */}
        {result && (
          <article className="bg-slate-800/20 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                AI Strategy Playbook Response
              </span>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[11px] font-mono border border-indigo-500/20">
                Markdown Render
              </span>
            </div>

            <pre className="text-slate-300 font-sans text-sm leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/40">
              {result}
            </pre>
            <div ref={resultEndRef} />
          </article>
        )}
      </main>

      {/* --- FLOATING CONTROLS CONSOLE LAYER (Bottom Center) --- */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none z-40">
        <div className="max-w-2xl mx-auto w-full pointer-events-auto">
          {/* Active Graph Loader UI (Placed directly above input box) */}
          {loading && (
            <div className="flex items-center justify-center gap-3 bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 text-xs font-medium px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md mb-4 w-fit mx-auto animate-bounce">
              <div className="h-3 w-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
              <span>
                LangGraph Strategy State-Machine actively evaluating web
                indexes...
              </span>
            </div>
          )}

          {/* Core Chat Console / Form Parameters Setup */}
          <form
            onSubmit={handleGenerate}
            className="bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl p-4 space-y-3 transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent group"
          >
            {/* Top Grid Field Parameters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Product/Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Linear"
                  disabled={loading}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Root Application URL
                </label>
                <input
                  type="url"
                  required
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="e.g. https://linear.app"
                  disabled={loading}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Prompt Extension / Context Box Area */}
            <div className="relative flex items-end bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Extra Context / Research Goals
                </label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Add targeting instructions, focus keywords, or competitor specifications..."
                  disabled={loading}
                  rows={2}
                  className="w-full bg-transparent border-0 p-0 text-sm text-slate-100 placeholder-slate-500 focus:ring-0 focus:outline-none resize-none disabled:opacity-50"
                />
              </div>

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={loading || !productName.trim() || !productUrl.trim()}
                className="ml-3 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:scale-100"
              >
                {loading ? "Processing" : "Execute Run"}
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}
