import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Assuming your service class is imported from your services folder
import { productService } from "../../api/product";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

export default function ProductDashboard() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  // Sync state with URL search params (defaults to 'visibility')
  const activeTab = searchParams.get("tab") || "visibility";

  // React Query fetch using your Service Class pattern
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productDetails", id, activeTab],
    queryFn: () => productService.productDetail(Number(id), activeTab),
    //@ts-ignore
    keepPreviousData: true,
    staleTime: 5000,
  });

  const tabs = [
    { id: "visibility", label: "Visibility" },
    { id: "competitor", label: "Competitor Analysis" },
    { id: "citation", label: "Citation Intelligence" },
    { id: "recommendations", label: "Recommendations" },
  ];

  //@ts-ignore
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        <span className="animate-spin mr-2">🔄</span> Initializing Dashboard
        Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
          ⚠️ <strong>System Error:</strong>{" "}
          {error.message || "Failed to fetch dashboard data"}
        </div>
      </div>
    );
  }

  // Safely extract our dynamic backend payload structures
  //@ts-ignore
  const { productInfo, tabData } = dashboardData || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
      {/* 1. DYNAMIC HEADER BANNER (Remains visible during tab changes) */}
      <header className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl">
              {productInfo?.icon || "📦"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {productInfo?.title}
              </h1>
              <p className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                <span>
                  🏢 <strong>{productInfo?.brand}</strong> (
                  {productInfo?.retailer}, {productInfo?.category})
                </span>
                <span>
                  <strong>SKU:</strong> {productInfo?.sku}
                </span>
                <span>
                  <strong>MPN:</strong> {productInfo?.mpn}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Scores Banner Block */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-700 to-cyan-500 rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                AI Visibility Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-black">
                  {productInfo?.globalScores?.visibilityScore}
                </span>
                <span className="text-sm opacity-80">out of 100</span>
              </div>
            </div>

            <div className="flex gap-8 border-t md:border-t-0 md:border-l border-blue-500 pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-around">
              <div>
                <span className="text-xs text-blue-200 block">
                  Mention Rate
                </span>
                <span className="text-2xl font-bold">
                  {productInfo?.globalScores?.mentionRate}%
                </span>
              </div>

              <div>
                <span className="text-xs text-blue-200 block">
                  Reviews Count
                </span>
                <span className="text-2xl font-bold">
                  {productInfo?.globalScores?.reviewsCount}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Model Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* @ts-ignore */}
            {productInfo?.engineBreakdown?.map((engine) => (
              <div
                key={engine.name}
                className="bg-slate-100/70 border border-slate-200/60 rounded-xl p-3 text-center flex flex-col justify-center"
              >
                <span className="text-xs text-slate-500 font-medium">
                  {engine.name}
                </span>
                <span className="text-lg font-bold text-slate-800 mt-0.5">
                  {engine.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* 2. ROUTER-DRIVEN TAB NAVIGATION */}
      <nav className="flex border-b border-slate-200 mb-6 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 3. DYNAMIC WORKSPACE COMPONENT PANEL */}
      <main className="min-h-[350px]">
        {isLoading ? (
          /* CSS-based circular loader inside the tab space */
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 shadow-sm gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <span className="text-sm font-medium text-slate-400">
              Fetching insights...
            </span>
          </div>
        ) : (
          <div>
            {activeTab === "visibility" && (
              <VisibilityTabContent data={tabData} />
            )}
            {activeTab === "competitor" && (
              <CompetitorTabContent data={tabData} />
            )}
            {activeTab === "citation" && <CitationTabContent data={tabData} />}
            {activeTab === "recommendations" && (
              <RecommendationsTabContent data={tabData} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ==========================================
   TAB PANEL: VISIBILITY (PAGE 1)
   ========================================== */
//@ts-ignore
function VisibilityTabContent({ data }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Visibility by AI Engine
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.chartData}
              layout="vertical"
              margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#f1f5f9"
              />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                width={80}
              />
              <Tooltip cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                {//@ts-ignore
                data.chartData?.map((entry, index) => (
                  <circle
                    key={`cell-${index}`}
                    fill={entry.color || "#3b82f6"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-4">
            FAQs & Reviews
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-100/60 border border-amber-200 rounded-xl p-4 text-center">
              <span className="text-xl block mb-1">❓</span>
              <span className="text-3xl font-black text-slate-800">
                {data.faqCount}
              </span>
              <span className="text-xs text-slate-500 block font-medium mt-1">
                FAQs
              </span>
            </div>
            <div className="bg-purple-100/60 border border-purple-200 rounded-xl p-4 text-center">
              <span className="text-xl block mb-1">💬</span>
              <span className="text-3xl font-black text-slate-800">
                {data.reviewCount}
              </span>
              <span className="text-xs text-slate-500 block font-medium mt-1">
                Reviews
              </span>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 block font-medium mb-1">
            Product URL
          </span>
          <a
            href={data.productUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline truncate block font-medium"
          >
            {data.productUrl}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   TAB PANEL: COMPETITOR ASSESSMENT MATRIX
   ========================================== */
//@ts-ignore
function CompetitorTabContent({ data }) {
  if (!data) return null;

  //@ts-ignore
  const getBadgeStyle = (score) => {
    if (score >= 75) return "bg-emerald-500 text-white";
    if (score >= 60) return "bg-amber-500 text-white";
    return "bg-rose-500 text-white";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Competitor Visibility Comparison
        </h3>
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
              <th className="py-3 px-4">Competitor</th>
              <th className="py-3 px-4">ChatGPT</th>
              <th className="py-3 px-4">Gemini</th>
              <th className="py-3 px-4">Claude</th>
              <th className="py-3 px-4">Perplexity</th>
              <th className="py-3 px-4 text-right">Avg Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {//@ts-ignore
            data.competitors?.map((row, idx) => (
              <tr
                key={idx}
                className={
                  row.active
                    ? "bg-blue-50/40 font-semibold"
                    : "hover:bg-slate-50/60"
                }
              >
                <td className="py-3.5 px-4 text-slate-900">{row.name}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${getBadgeStyle(row.chatGPT)}`}
                  >
                    {row.chatGPT}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${getBadgeStyle(row.gemini)}`}
                  >
                    {row.gemini}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${getBadgeStyle(row.claude)}`}
                  >
                    {row.claude}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${getBadgeStyle(row.perplexity)}`}
                  >
                    {row.perplexity}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right text-blue-600 font-bold">
                  {row.avg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Competitive Posture
            </h3>
            <span className="text-xs text-slate-500">
              You vs top competitor
            </span>
          </div>

          <div className="h-56 my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={data.radarData}
              >
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis
                  dataKey="subject"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: "#475569" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#cbd5e1"
                  tick={false}
                />
                <Radar
                  name="You"
                  dataKey="You"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.25}
                />
                <Radar
                  name="Top Competitor"
                  dataKey="Competitor"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                    paddingTop: "10px",
                    color: "#334155",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between text-xs">
            <span className="font-medium text-slate-700">
              Reviews Metric Analysis:
            </span>

            <span className="text-amber-600 font-semibold">
              {data.radarSummaryText}
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Content & Schema Gaps
                </h3>
                <span className="text-xs text-slate-500">
                  Optimization elements breakdown
                </span>
              </div>

              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">
                ⚠️ {data.priorityCountText || "Gaps Found"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {//@ts-ignore
              data.gaps?.map((item, index) => (
                <div
                  key={index}
                  className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200"
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-800">
                      {item.title}
                    </span>

                    <span
                      className={
                        item.status === "High"
                          ? "text-rose-600 font-bold"
                          : "text-amber-600 font-semibold"
                      }
                    >
                      {item.gain}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 w-12">
                      You: {item.you}
                    </span>

                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${item.you}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-slate-500 w-12 text-right">
                      Top: {item.top}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   TAB PANEL: CITATION INTEL
   ========================================== */
//@ts-ignore
function CitationTabContent({ data }) {
  if (!data) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
      <h3 className="text-base font-bold text-slate-900 mb-4">
        Citation Comparison
      </h3>
      <table className="w-full text-left border-collapse min-w-[550px]">
        <thead>
          <tr className="text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
            <th className="py-3 px-4">Source</th>
            <th className="py-3 px-4">Authority</th>
            <th className="py-3 px-4">Your Mentions</th>
            <th className="py-3 px-4">Competitor Mentions</th>
            {/* <th className="py-3 px-4 text-right">Gap</th> */}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {//@ts-ignore
          data.citations?.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50">
              <td className="py-3.5 px-4 font-semibold text-slate-800">
                {item.source}
              </td>
              <td className="py-3.5 px-4 text-slate-500">{item.authority}</td>
              <td className="py-3.5 px-4 text-blue-600 font-medium">
                {item.you}
              </td>
              <td className="py-3.5 px-4 text-slate-600">{item.competitor}</td>
              {/* <td className="py-3.5 px-4 text-right">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.gap >= 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {item.gap >= 0 ? `+${item.gap}` : item.gap}
                </span>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ==========================================
   TAB PANEL: PRIORITIZED RECOMMENDATIONS
   ========================================== */
//@ts-ignore
function RecommendationsTabContent({ data }) {
  if (!data) return null;

  //@ts-ignore
  const getActionColor = (type) => {
    switch (type) {
      case "gap":
        return "bg-orange-500";
      case "content":
        return "bg-blue-500";
      case "citation":
        return "bg-emerald-500";
      default:
        return "bg-sky-500";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 mb-4">
        Improvement Recommendations
      </h3>
      <div className="space-y-4">
        {//@ts-ignore
        data.actions?.map((item, index) => (
          <div
            key={index}
            className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-bold text-white uppercase px-2 py-0.5 rounded tracking-wide ${getActionColor(item.type)}`}
                >
                  {item.type}
                </span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded capitalize">
                  {item.effort}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-400">
                Competitors:{" "}
                <strong className="text-slate-600">{item.competitors}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">
                  Impact
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${item.impact}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-black text-slate-700">
                    {item.impact}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
