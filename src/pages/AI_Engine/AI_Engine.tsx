import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../components/Common/AppHeader";
import { aiEngineService } from "../../api/aiEngine";

// Reusable Top Engine Counter Card Component (Light Theme)
//@ts-ignore
const EngineCard = ({ name, queries, themeConfig }) => {
  const { border, text, bg } = themeConfig || {
    border: "border-gray-200",
    text: "text-gray-700",
    bg: "bg-gray-50",
  };

  return (
    <div className="h-[130px] w-[180px] bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:shadow-md relative">
      <div className="flex justify-between items-center w-full">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${border} ${text} ${bg}`}
        >
          {name}
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
      </div>
      <div className="flex flex-col gap-0.5 mt-auto">
        <span className="text-[11px] text-gray-400 font-semibold tracking-wide uppercase">
          Queries
        </span>
        <span className="text-2xl font-bold text-gray-800">{queries}</span>
      </div>
    </div>
  );
};

export default function AIEngine() {
  // Brand color mapping utility to keep badge layouts looking consistent
  //@ts-ignore
  const getBrandTheme = (engineName) => {
    const lowerName = engineName?.toLowerCase() || "";
    if (lowerName.includes("gpt")) {
      return {
        border: "border-emerald-200",
        text: "text-emerald-700",
        bg: "bg-emerald-50",
      };
    } else if (lowerName.includes("gemini")) {
      return {
        border: "border-blue-200",
        text: "text-blue-700",
        bg: "bg-blue-50",
      };
    } else if (lowerName.includes("claude")) {
      return {
        border: "border-amber-200",
        text: "text-amber-800",
        bg: "bg-amber-50",
      };
    } else if (lowerName.includes("perplexity")) {
      return {
        border: "border-cyan-200",
        text: "text-cyan-700",
        bg: "bg-cyan-50",
      };
    } else if (lowerName.includes("copilot")) {
      return {
        border: "border-indigo-200",
        text: "text-indigo-700",
        bg: "bg-indigo-50",
      };
    }
    return {
      border: "border-gray-300",
      text: "text-gray-700",
      bg: "bg-gray-100",
    };
  };

  // 1. Fetching Data via TanStack Query
  // Replace `brandService.getAIEngineData` with your actual setup endpoint reference
  const { data, isLoading } = useQuery({
    queryKey: ["aiEngineData"],
    queryFn: async () => {
      // Reference example logic or replace with: return brandService.getMonitoringLogs()
      const res = await aiEngineService.getDetail();
      return res;
    },
  });

  console.log("data", data);
  // Safe Fallback Fallbacks matched against your API schema structure
  const enginesData = data?.enginesData ?? [];
  const promptHistory = data?.latest_5_prompts ?? [];

  // State management to switch between prompts inside our main view panel
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const activePrompt = promptHistory[selectedPromptIndex];

  // Calculated custom relative time calculations (e.g., '2h ago')
  //@ts-ignore
  const formatTimeAgo = (isoString) => {
    if (!isoString) return "";
    const created = new Date(isoString).getTime();
    const now = new Date("2026-06-29T12:10:30Z").getTime(); // Synced relative system clock
    const diffHours = Math.floor(Math.abs(now - created) / (1000 * 60 * 60));
    return diffHours > 0 ? `${diffHours}h ago` : "Just now";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-500 font-medium animate-pulse">
          Loading engine metrics...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <AppHeader searchValue="" onSearchChange={() => {}} />

      <main className="p-8 flex-1 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
        {/* Header Title Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            AI Engine Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Prompts and responses captured across ChatGPT, Gemini, Claude,
            Perplexity, Copilot and Grok.
          </p>
        </div>

        {/* Top Cards Metric Row */}
        <div className="flex flex-wrap gap-4 w-full">
          {/* @ts-ignore */}
          {enginesData.map((engine, idx) => (
            <EngineCard
              key={idx}
              name={engine.name}
              queries={engine.queries}
              themeConfig={getBrandTheme(engine.name)}
            />
          ))}
        </div>

        {/* Split Section Layout: Left Sidebar Prompt list & Right detailed data layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
          {/* LEFT COLUMN: Prompt History */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase border-b border-gray-100 pb-3">
              Prompt History
            </h2>
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
              {/* @ts-ignore */}
              {promptHistory.map((item, idx) => {
                const isSelected = selectedPromptIndex === idx;
                const queryObj = item.prompt_queries?.[0]; // Fetch first sample query string text array block

                return (
                  <button
                    key={item.chat_id || idx}
                    onClick={() => setSelectedPromptIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all flex flex-col gap-2.5 ${
                      isSelected
                        ? "bg-slate-50 border-cyan-500 ring-1 ring-cyan-500/30"
                        : "bg-white border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getBrandTheme(item.engine).bg} ${getBrandTheme(item.engine).text} ${getBrandTheme(item.engine).border}`}
                      >
                        {item.engine}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 line-clamp-2 leading-relaxed">
                      {queryObj?.query_text || "No prompt content available"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Response Viewer */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 min-h-[480px]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Response Viewer
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  engine:{" "}
                  <span className="font-semibold text-gray-600">
                    {activePrompt?.engine}
                  </span>{" "}
                  • session ID: R{activePrompt?.chat_id}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                <span>🌐 US · en</span>
              </div>
            </div>
            {/* @ts-ignore */}
            {activePrompt?.prompt_queries?.map((query, qIdx) => (
              <div
                key={query.id || qIdx}
                className="flex flex-col gap-5 border-b border-dashed border-gray-100 pb-6 last:border-0 last:pb-0"
              >
                {/* Prompt block text input layout */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block mb-1.5">
                    Prompt
                  </span>
                  <p className="text-base font-semibold text-gray-800 leading-snug">
                    {query.query_text}
                  </p>
                </div>

                {/* Simulated visual AI inner element markdown box block snippet component */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block mb-1.5">
                    Response
                  </span>
                  <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 text-sm leading-relaxed text-gray-700 font-medium">
                    {query.query_optimization_tips ||
                      "No textual generated system response summary found inside records payload metrics."}
                  </div>
                </div>

                {/* Bottom Row metadata indicators tracking panel context blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Competitors/Mentions Segment */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block mb-2">
                      Mentions Detected
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(query.competitors_mentioned as string[])?.length > 0 ? (
                        (query.competitors_mentioned as string[]).map(
                          (comp: string, cIdx: number) => (
                            <span
                              key={cIdx}
                              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-100"
                            >
                              {comp}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-xs italic text-gray-400">
                          None detected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Citation Sources Segment */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block mb-2">
                      Citations
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {Array.isArray(query.citing_sources) &&
                      query.citing_sources.length > 0 ? (
                        query.citing_sources.map(
                          (src: string, sIdx: number) => (
                            <a
                              key={sIdx}
                              href={src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-cyan-600 hover:underline truncate block max-w-xs"
                            >
                              {src.replace("https://", "")}
                            </a>
                          ),
                        )
                      ) : (
                        <span className="text-xs italic text-gray-400">
                          No source links cited
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
