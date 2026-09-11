import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { productService } from "../../api/product";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SimpleMarkdownRenderer } from "../Chat/Chat";
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
  Cell,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProdoctGenerateContent from "./ProductGenerateContent";

export default function ProductDashboard() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "visibility";

  const navigate = useNavigate();

  // --- Product Queue Navigation Logic ---
  const productIds: number[] = location.state?.productIds ?? [];
  const currentIdNum = Number(id);
  const currentIndex = productIds.indexOf(currentIdNum);

  const prevProductId = currentIndex > 0 ? productIds[currentIndex - 1] : null;
  const nextProductId =
    currentIndex !== -1 && currentIndex < productIds.length - 1
      ? productIds[currentIndex + 1]
      : null;

  const handleNavigateProduct = (targetId: number) => {
    navigate(`/admin/product/${targetId}?tab=${activeTab}`, {
      state: { productIds },
    });
  };

  // React Query fetch
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productDetails", id, activeTab],
    queryFn: () => productService.productDetail(Number(id), activeTab),
    // @ts-ignore
    keepPreviousData: true,
    staleTime: 5000,
  });

  // Keep a local copy of productInfo so the header NEVER flashes or unmounts during transitions
  const [cachedProductInfo, setCachedProductInfo] = useState<any>(null);

  // Safely extract our dynamic backend payload structures
  // @ts-ignore
  const { productInfo, tabData } = dashboardData || {};

  console.log("product info", productInfo);

  useEffect(() => {
    if (productInfo) {
      setCachedProductInfo(productInfo);
    }
  }, [productInfo]);

  const tabs = [
    { id: "visibility", label: "Visibility" },
    { id: "competitor", label: "Competitor Analysis" },
    { id: "citation", label: "Citation Intelligence" },
    { id: "recommendations", label: "Recommendations" },
    { id: "generate_content", label: "Generate Content" },
    // { id: "tips", label: "Suggestions" },
  ];

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { state: location.state });
  };

  // Initial full-page load loader (Only shows if we have absolutely nothing loaded yet)
  if (isLoading && !cachedProductInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
          ⚠️ <strong>System Error:</strong>{" "}
          {error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data"}
        </div>
      </div>
    );
  }

  // Use the cached product info if the current one is resolving in the background
  const displayProductInfo = cachedProductInfo || productInfo;

  // Helper to safely format the raw score from 0-100 down to 0-10 scale
  const rawVisibilityScore = displayProductInfo?.globalScores?.visibilityScore;
  const formattedVisibilityScore =
    rawVisibilityScore !== undefined && rawVisibilityScore !== null
      ? typeof rawVisibilityScore === "number"
        ? rawVisibilityScore > 10
          ? (rawVisibilityScore / 10).toFixed(1)
          : rawVisibilityScore.toFixed(1)
        : !isNaN(Number(rawVisibilityScore))
          ? Number(rawVisibilityScore) > 10
            ? (Number(rawVisibilityScore) / 10).toFixed(1)
            : Number(rawVisibilityScore).toFixed(1)
          : rawVisibilityScore
      : "N/A";

  return (
    <>
      <div className="w-full cursor-pointer flex justify-between">
        <button
          onClick={() => navigate(-1)}
          title="Back"
          className="p-2 bg-white hover:bg-slate-100 border cursor-pointer border-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-800 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* 👈 PREVIOUS / NEXT BUTTONS ADDED RIGHT HERE */}
        {productIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-1 font-medium">
              {currentIndex + 1} of {productIds.length}
            </span>

            <button
              onClick={() =>
                prevProductId && handleNavigateProduct(prevProductId)
              }
              disabled={!prevProductId}
              title="Previous Product"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                nextProductId && handleNavigateProduct(nextProductId)
              }
              disabled={!nextProductId}
              title="Next Product"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-3">
        {/* 1. STATIC HEADER BANNER (Perfect state locking) */}
        <header className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {displayProductInfo?.title}
                </h1>
                <p className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                  <span>
                    <strong>SKU:</strong> {displayProductInfo?.sku}
                  </span>
                  <span>
                    <strong>MPN:</strong> {displayProductInfo?.mpn}
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
                    {formattedVisibilityScore}
                  </span>
                  <span className="text-sm opacity-80">out of 10</span>
                </div>
              </div>

              <div className="flex gap-8 border-t md:border-t-0 md:border-l border-blue-500 pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-around">
                <div>
                  <span className="text-xs text-blue-200 block">
                    Mention Rate
                  </span>
                  <span className="text-2xl font-bold">
                    {displayProductInfo?.globalScores?.mentionRate}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-blue-200 block">
                    Reviews Count
                  </span>
                  <span className="text-2xl font-bold">
                    {displayProductInfo?.globalScores?.reviewsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Model Breakdown Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* @ts-ignore */}
              {displayProductInfo?.engineBreakdown?.map((engine) => (
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
          {activeTab === "visibility" && (
            <VisibilityTabContent data={tabData} isLoading={isLoading} />
          )}
          {activeTab === "competitor" && (
            <CompetitorTabContent data={tabData} isLoading={isLoading} />
          )}
          {activeTab === "citation" && (
            <CitationTabContent data={tabData} isLoading={isLoading} />
          )}
          {activeTab === "recommendations" && (
            <RecommendationsTabContent data={tabData} isLoading={isLoading} />
          )}
          {activeTab === "tips" && (
            <TipsTabContent data={tabData} isLoading={isLoading} />
          )}
          {activeTab === "generate_content" && (
            <ProdoctGenerateContent productInfo={displayProductInfo} />
          )}
        </main>
      </div>
    </>
  );
}

// Clean text-free loading circle
function TabSpinnerFallback() {
  return (
    <div className="w-full min-h-[350px] bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

/* ==========================================
   TAB PANEL: VISIBILITY (PAGE 1)
   ========================================== */
interface VisibilityProps {
  data: any;
  isLoading: boolean;
}
function VisibilityTabContent({ data, isLoading }: VisibilityProps) {
  if (isLoading) return <TabSpinnerFallback />;
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
              <XAxis type="number" domain={[0, 10]} stroke="#94a3b8" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                width={80}
              />
              <Tooltip cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                {data.chartData?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "#3b82f6"} />
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

interface CompetitorProps {
  data: any;
  isLoading: boolean;
}

function CompetitorTabContent({ data, isLoading }: CompetitorProps) {
  if (isLoading) return <TabSpinnerFallback />;
  if (!data) return null;

  //@ts-ignore
  const getScoreColor = (score: number, engine: string) => {
    if (engine === "chatGPT") return "text-emerald-600";
    if (engine === "gemini") return "text-blue-600";
    if (engine === "claude") return "text-amber-600";
    return "text-slate-900";
  };

  const getBarColor = (engine: string) => {
    if (engine === "chatGPT") return "bg-emerald-500";
    if (engine === "gemini") return "bg-blue-500";
    if (engine === "claude") return "bg-amber-500";
    return "bg-slate-500";
  };

  const getProductUrl = (row: any) => {
    return row?.product_url || row?.url || row?.website || "";
  };

  const getMentionedBy = (row: any) => {
    return row?.mentionedBy || row?.mentioned_by || [];
  };

  const getEngineBadgeStyle = (engine: string) => {
    const value = engine.toLowerCase();

    if (value.includes("gpt") || value.includes("chatgpt")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (value.includes("gemini")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6">
      {/* ==========================================
          DESCRIPTION
      ========================================== */}

      <div className="text-[16px] text-slate-500">
        Products that compete with{" "}
        <span className="font-semibold text-slate-900">
          {data.productName || data.product_name || "your product"}
        </span>{" "}
        in LLM-generated recommendations.
      </div>

      {/* ==========================================
          COMPETITOR CARDS
      ========================================== */}

      <div className="space-y-4">
        {data.competitors?.map((row: any, idx: number) => {
          const chatGPT = Number(row?.chatGPT ?? 0);

          const gemini = Number(row?.gemini ?? 0);

          const claude = Number(row?.claude ?? 0);

          const avg = Number(row?.avg ?? 0);

          const productUrl = getProductUrl(row);

          const mentionedBy = getMentionedBy(row);

          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl px-6 py-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* ==================================
                    HEADER
                ================================== */}

              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-slate-900 truncate">
                    {row.name}
                  </h3>

                  {productUrl ? (
                    <a
                      href={productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-[15px] text-slate-400 hover:text-cyan-600 transition-colors"
                    >
                      <span className="text-sm">↗</span>
                      Visit product
                    </a>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5 text-[15px] text-slate-400">
                      <span className="text-sm">↗</span>
                    </div>
                  )}
                </div>

                {/* OVERALL */}

                <div className="flex-shrink-0 text-right">
                  <div className="text-[28px] leading-none font-bold text-slate-900">
                    {avg}
                  </div>

                  <div className="text-sm text-slate-400 mt-2">overall</div>
                </div>
              </div>

              {/* ==================================
                    ENGINE SCORES
                ================================== */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                {/* GPT */}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-400">
                      GPT
                    </span>

                    <span
                      className={`text-sm font-bold ${getScoreColor(chatGPT, "chatGPT")}`}
                    >
                      {chatGPT}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor("chatGPT")}`}
                      style={{
                        width: `${Math.min(Math.max(chatGPT, 0), 10) * 10}%`,
                      }}
                    />
                  </div>
                </div>

                {/* GEMINI */}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-400">
                      Gemini
                    </span>

                    <span
                      className={`text-sm font-bold ${getScoreColor(gemini, "gemini")}`}
                    >
                      {gemini}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor("gemini")}`}
                      style={{
                        width: `${Math.min(Math.max(gemini, 0), 10) * 10}%`,
                      }}
                    />
                  </div>
                </div>

                {/* CLAUDE */}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-400">
                      Claude
                    </span>

                    <span
                      className={`text-sm font-bold ${getScoreColor(claude, "claude")}`}
                    >
                      {claude}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor("claude")}`}
                      style={{
                        width: `${Math.min(Math.max(claude, 0), 10) * 10}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ==================================
                    MENTIONED BY
                ================================== */}

              {mentionedBy.length > 0 && (
                <div className="flex items-center gap-3 mt-5 flex-wrap">
                  <span className="text-[15px] text-slate-400">
                    Mentioned by:
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {mentionedBy.map((engine: string, engineIndex: number) => (
                      <span
                        key={engineIndex}
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getEngineBadgeStyle(engine)}`}
                      >
                        {engine}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ==========================================
          COMPETITIVE POSTURE + CONTENT GAPS
      ========================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ========================================
            COMPETITIVE POSTURE
        ======================================== */}

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
                  tick={{
                    fontSize: 10,
                    fill: "#475569",
                  }}
                />

                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
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

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between text-xs gap-3">
            <span className="font-medium text-slate-700">
              Reviews Metric Analysis:
            </span>

            <span className="text-amber-600 font-semibold text-right">
              {data.radarSummaryText}
            </span>
          </div>
        </div>

        {/* ========================================
            CONTENT & SCHEMA GAPS
        ======================================== */}

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

              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                ⚠️ {data.priorityCountText || "Gaps Found"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {data.gaps?.map((item: any, index: number) => (
                <div
                  key={index}
                  className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200"
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-800">
                      {item.title}
                    </span>

                    <span className="text-amber-600 font-semibold">
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
                        style={{
                          width: `${
                            Math.min(Math.max(Number(item.you ?? 0), 0), 10) *
                            10
                          }%`,
                        }}
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
interface CitationProps {
  data: any;
  isLoading: boolean;
}

function CitationTabContent({ data, isLoading }: CitationProps) {
  if (isLoading) return <TabSpinnerFallback />;
  if (!data) return null;

  const citations = data.citations || [];

  const chatGPTCitations = citations.filter((item: any) =>
    item.model?.toUpperCase().includes("GPT"),
  );

  const geminiCitations = citations.filter((item: any) =>
    item.model?.toUpperCase().includes("GEMINI"),
  );

  const claudeCitations = citations.filter((item: any) =>
    item.model?.toUpperCase().includes("CLAUDE"),
  );

  const renderCitationSection = (
    title: string,
    items: any[],
    icon: string,
    badgeClass: string,
  ) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{icon}</span>

        <h3 className="text-lg font-bold text-slate-900">{title}</h3>

        <span
          className={`min-w-[38px] h-7 px-2 rounded-full flex items-center justify-center text-sm font-semibold ${badgeClass}`}
        >
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item: any, idx: number) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl px-6 py-5"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <a
                href={item.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[17px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
              >
                {item.source}
                <span className="text-sm">↗</span>
              </a>

              <div className="text-sm text-slate-400 whitespace-nowrap">
                Trust:{" "}
                <span className="text-orange-600 font-semibold">
                  {item.trust}/10
                </span>
              </div>
            </div>

            <p className="text-[16px] leading-7 text-slate-600 italic">
              "{item.quote}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <p className="text-[16px] text-slate-500 mb-8">
        Sources that the LLMs cite when referencing this product.
      </p>

      {renderCitationSection(
        "ChatGPT",
        chatGPTCitations,
        "🤖",
        "bg-emerald-100 text-emerald-700 border border-emerald-200",
      )}

      {renderCitationSection(
        "Gemini",
        geminiCitations,
        "✧",
        "bg-blue-100 text-blue-700 border border-blue-200",
      )}

      {renderCitationSection(
        "Claude",
        claudeCitations,
        "▢",
        "bg-amber-100 text-amber-700 border border-amber-200",
      )}
    </div>
  );
}
/* ==========================================
   TAB PANEL: PRIORITIZED RECOMMENDATIONS
   ========================================== */

interface CompetitorProduct {
  competitor_name: string;
  product_name?: string;
  product_url: string;
  price?: string | null;
}

// Retained legacy interface as optional fallback
interface Competitor {
  competitor_name: string;
  no_of_faq?: number;
  word_count?: number;
  keywords_used?: string[];
  no_of_reviews?: number;
  product_title?: string;
  assets_present?: {
    images: boolean;
    videos: boolean;
  };
  no_of_features?: number;
  no_of_attributes?: number;
}


interface ActionItem {
  type: string;
  effort: string;
  title: string;
  solution: string;
  model: string;
  competitor_products?: CompetitorProduct[];
  competitors?: Competitor[];
  impact: number;
  query_optimization_tag: string;
}

interface RecommendationsProps {
  data: {
    actions?: ActionItem[];
  };
  isLoading: boolean;
}

function RecommendationsTabContent({ data, isLoading }: RecommendationsProps) {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) return <TabSpinnerFallback />;

  if (!data || !data.actions) return null;

  const actions = data.actions;

  const getModelName = (model: string) => {
    const value = model?.replace("LLMModels.", "").toUpperCase();

    if (value === "GPT" || value === "CHATGPT") {
      return "GPT";
    }

    if (value === "GEMINI") {
      return "GEMINI";
    }

    if (value === "CLAUDE") {
      return "CLAUDE";
    }

    return value;
  };

  const chatGPTActions = actions.filter(
    (item) => getModelName(item.model) === "GPT",
  );

  const geminiActions = actions.filter(
    (item) => getModelName(item.model) === "GEMINI",
  );

  const claudeActions = actions.filter(
    (item) => getModelName(item.model) === "CLAUDE",
  );

  const getAverageImpact = (items: ActionItem[]) => {
    if (!items.length) return 0;

    const total = items.reduce(
      (sum, item) => sum + Number(item.impact || 0),
      0,
    );

    return total / items.length;
  };

  const getScore = (items: ActionItem[]) => {
    return Math.round(getAverageImpact(items) * 10);
  };

  const chatGPTScore = getScore(chatGPTActions);
  const geminiScore = getScore(geminiActions);
  const claudeScore = getScore(claudeActions);

  const availableScores = [chatGPTScore, geminiScore, claudeScore].filter(
    (score) => score > 0,
  );

  const overallScore = availableScores.length
    ? Math.round(
        availableScores.reduce((sum, score) => sum + score, 0) /
          availableScores.length,
      )
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    return "text-orange-500";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return "bg-emerald-500";
    return "bg-orange-500";
  };

  const getModelColors = (model: string) => {
    if (model === "GPT") {
      return {
        text: "text-emerald-500",
        bar: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
      };
    }

    if (model === "GEMINI") {
      return {
        text: "text-blue-500",
        bar: "bg-blue-500",
        badge: "bg-blue-50 text-blue-600 border-blue-200",
      };
    }

    return {
      text: "text-orange-500",
      bar: "bg-orange-500",
      badge: "bg-orange-50 text-orange-600 border-orange-200",
    };
  };

  const getModelLabel = (model: string) => {
    if (model === "GPT") return "ChatGPT";
    if (model === "GEMINI") return "Gemini";
    if (model === "CLAUDE") return "Claude";

    return model;
  };

  const getModelIcon = (model: string) => {
    if (model === "GPT") {
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="6" y="7" width="12" height="10" rx="2" />
          <path d="M9 11h.01M15 11h.01M9 15h6" />
          <path d="M12 3v4M4 11h2M18 11h2" />
        </svg>
      );
    }

    if (model === "GEMINI") {
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z" />
        </svg>
      );
    }

    return (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 5h16v11H8l-4 4V5z" />
      </svg>
    );
  };

  const renderRecommendation = (item: ActionItem, index: number) => {
    const hasCompetitorProducts =
      Array.isArray(item.competitor_products) &&
      item.competitor_products.length > 0;

    const hasLegacyCompetitors =
      Array.isArray(item.competitors) && item.competitors.length > 0;

    return (
      <div key={index} className="border-l-2 border-orange-200 pl-4">
        {/* Impact + Effort */}
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            {item.impact}
          </span>

          <span className="text-xs text-slate-400">impact</span>

          {item.effort && (
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full capitalize">
              {item.effort} effort
            </span>
          )}

          {item.type && (
            <span className="bg-orange-50 text-orange-600 border border-orange-100 text-xs font-semibold px-3 py-1 rounded-full capitalize">
              {item.type}
            </span>
          )}
        </div>

        {/* Recommendation Title */}
        {item.title && (
          <h4 className="text-base font-bold text-slate-900 leading-snug">
            {item.title}
          </h4>
        )}

        {/* Recommendation Explanation */}
        {item.query_optimization_tag && (
          <div className="flex items-start gap-2 mt-3">
            <svg
              className="w-4 h-4 text-orange-400 mt-0.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18h6M10 22h4M8 14a6 6 0 1110-4c0 2-1 3-2 4-1 1-1 2-1 3H9c0-1 0-2-1-3-1-1-2-2-2-4" />
            </svg>

            <p className="text-sm text-slate-500 leading-relaxed">
              {item.query_optimization_tag}
            </p>
          </div>
        )}

        {/* Solution */}
        {item.solution && (
          <div className="flex items-start gap-2 mt-3">
            <svg
              className="w-4 h-4 text-orange-500 mt-0.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3a1 1 0 00-1.4-1.4l-2.3 2.3-1.6-1.6a1 1 0 00-1.4 0z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 21l4-4m0 0l5.5-5.5M9 17l-2-2"
              />
            </svg>

            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {item.solution}
            </p>
          </div>
        )}

        {/* Competitor Products */}
        {hasCompetitorProducts && (
          <div className="mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Competitor Benchmarks
            </span>

            <div className="flex flex-wrap gap-2">
              {item.competitor_products!.map((product, pIdx) => {
                const hasUrl = Boolean(
                  product.product_url && product.product_url.trim() !== "",
                );

                const badgeContent = (
                  <>
                    <span className="truncate max-w-[220px]">
                      {product.product_name || product.competitor_name}
                    </span>

                    {product.price && (
                      <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                        {product.price}
                      </span>
                    )}

                    {hasUrl && (
                      <svg
                        className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    )}
                  </>
                );

                if (hasUrl) {
                  return (
                    <a
                      key={pIdx}
                      href={product.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-600 hover:text-blue-800 text-xs font-medium px-2.5 py-1.5 rounded-md transition group"
                    >
                      {badgeContent}
                    </a>
                  );
                }

                return (
                  <div
                    key={pIdx}
                    className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-md"
                  >
                    {badgeContent}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legacy Competitors */}
        {!hasCompetitorProducts && hasLegacyCompetitors && (
          <div className="mt-4 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Competitors: </span>

            <span className="text-slate-700 font-medium">
              {item.competitors!.map((c) => c.competitor_name).join(", ")}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderModelColumn = (model: string, modelActions: ActionItem[]) => {
    const colors = getModelColors(model);
    const score = getScore(modelActions);
    const averageImpact = getAverageImpact(modelActions);

    return (
      <div
        key={model}
        className="bg-white border border-slate-200 rounded-2xl p-6"
      >
        {/* Model Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className={colors.text}>{getModelIcon(model)}</div>

          <span className="text-lg font-semibold text-slate-700">
            {getModelLabel(model)}
          </span>

          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${colors.badge}`}
          >
            {modelActions.length}
          </span>
        </div>

        {/* Model Score */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Score</span>

            <span className={`text-sm font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getScoreBarColor(score)}`}
              style={{
                width: `${Math.min(score, 100)}%`,
              }}
            />
          </div>

          <div className="text-xs text-slate-400 mt-2">
            avg impact{" "}
            {Number.isInteger(averageImpact)
              ? averageImpact
              : averageImpact.toFixed(1)}
          </div>
        </div>

        {/* All Recommendations */}
        <div className="space-y-6 mt-6">
          {modelActions.map((item, index) => renderRecommendation(item, index))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-sm text-slate-500 px-1">
        Recommendation statistics by content criteria. Click the row to see all
        detailed recommendations for each LLM engine.
      </p>

      {/* Main Recommendation Box */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[minmax(280px,1.8fr)_1fr_1fr_1fr_120px] bg-slate-50/70 border-b border-slate-200 px-6 py-4">
          <div className="text-xs font-bold text-slate-400 uppercase">
            Criteria
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase">
            {getModelIcon("GPT")}
            ChatGPT
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase">
            {getModelIcon("GEMINI")}
            Gemini
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase">
            {getModelIcon("CLAUDE")}
            Claude
          </div>

          <div className="text-xs font-bold text-slate-400 uppercase text-right">
            Score
          </div>
        </div>

        {/* Single Overall Row */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="grid grid-cols-[minmax(280px,1.8fr)_1fr_1fr_1fr_120px] items-center px-6 py-6 cursor-pointer hover:bg-slate-50/60 transition-colors"
        >
          {/* Criteria */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span className="text-orange-500 font-bold text-sm">R</span>
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900">
                Recommendations
              </h3>

              <p className="text-sm text-slate-400 mt-0.5">
                {actions.length}{" "}
                {actions.length === 1 ? "recommendation" : "recommendations"} ·
                All content optimization recommendations
              </p>
            </div>
          </div>

          {/* ChatGPT */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-slate-900">
                {chatGPTActions.length}
              </span>

              <span className="text-xs text-slate-400">
                rec
                {chatGPTActions.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(chatGPTScore, 100)}%`,
                  }}
                />
              </div>

              <span className="text-sm font-semibold text-emerald-500">
                {chatGPTScore}
              </span>
            </div>

            <span className="text-xs text-slate-400 mt-2">
              avg impact{" "}
              {Number.isInteger(getAverageImpact(chatGPTActions))
                ? getAverageImpact(chatGPTActions)
                : getAverageImpact(chatGPTActions).toFixed(1)}
            </span>
          </div>

          {/* Gemini */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-slate-900">
                {geminiActions.length}
              </span>

              <span className="text-xs text-slate-400">
                rec
                {geminiActions.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${Math.min(geminiScore, 100)}%`,
                  }}
                />
              </div>

              <span className="text-sm font-semibold text-blue-500">
                {geminiScore}
              </span>
            </div>

            <span className="text-xs text-slate-400 mt-2">
              avg impact{" "}
              {Number.isInteger(getAverageImpact(geminiActions))
                ? getAverageImpact(geminiActions)
                : getAverageImpact(geminiActions).toFixed(1)}
            </span>
          </div>

          {/* Claude */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-slate-900">
                {claudeActions.length}
              </span>

              <span className="text-xs text-slate-400">
                rec
                {claudeActions.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: `${Math.min(claudeScore, 100)}%`,
                  }}
                />
              </div>

              <span className="text-sm font-semibold text-orange-500">
                {claudeScore}
              </span>
            </div>

            <span className="text-xs text-slate-400 mt-2">
              avg impact{" "}
              {Number.isInteger(getAverageImpact(claudeActions))
                ? getAverageImpact(claudeActions)
                : getAverageImpact(claudeActions).toFixed(1)}
            </span>
          </div>

          {/* Overall Score */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold ${getScoreColor(overallScore)}`}
              >
                {overallScore}
              </span>

              <svg
                className={`w-5 h-5 text-slate-300 transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${getScoreBarColor(
                  overallScore,
                )}`}
                style={{
                  width: `${Math.min(overallScore, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Expanded Recommendations */}
        {expanded && (
          <div className="bg-slate-50/70 border-t border-slate-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {renderModelColumn("GPT", chatGPTActions)}

              {renderModelColumn("GEMINI", geminiActions)}

              {renderModelColumn("CLAUDE", claudeActions)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export interface ChatSession {
  chat_id: number;
  tenant_id: number;
  product_id: number;
  model_choice: string;
  created_at: string;
  updated_at: string;
  final_optimization_report: string;
}

export interface TabData {
  total_chats: number;
  chats: ChatSession[];
}

export interface TipsTabProps {
  data?: TabData;
  isLoading?: boolean;
}

export function TipsTabContent({ data, isLoading = false }: TipsTabProps) {
  // Explicitly type the accordion state map
  console.log("data", data);
  const [openChats, setOpenChats] = useState<Record<number, boolean>>({});

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Safely extract chat list and total count
  const chatList: ChatSession[] = data?.chats ?? [];

  if (chatList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
        No optimization reports available for this product.
      </div>
    );
  }

  const toggleChat = (chatId: number): void => {
    setOpenChats((prev) => ({
      ...prev,
      [chatId]: !prev[chatId],
    }));
  };

  const getModelBadge = (model: string): string => {
    const formatted = model.replace("LLMModels.", "").toUpperCase();
    switch (formatted) {
      case "GPT":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "GEMINI":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CLAUDE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Chat Sessions */}
      <div className="space-y-4">
        {chatList.map((chat: ChatSession) => {
          const isOpen: boolean = openChats[chat.chat_id] ?? true;
          const modelName: string = chat.model_choice.replace("LLMModels.", "");

          return (
            <div
              key={chat.chat_id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
              {/* Session Header */}
              <div
                onClick={() => toggleChat(chat.chat_id)}
                className="p-4 bg-slate-50/50 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-100 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[12px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getModelBadge(
                      chat.model_choice,
                    )}`}
                  >
                    {modelName}
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    Session{" "}
                    <span className="font-mono text-slate-900">
                      #{chat.chat_id}
                    </span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-400">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-[12px] text-slate-400 font-bold uppercase">
                  {isOpen ? "Hide Report" : "Show Report"}
                </div>
              </div>

              {/* Optimization Report Area */}
              {isOpen && (
                <div className="p-5 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-1 bg-indigo-500 rounded-full"></div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Final Optimization Report
                    </h4>
                  </div>

                  {/* <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                    {chat.final_optimization_report}
                  </div> */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 font-sans prose prose-slate max-w-none">
                    <SimpleMarkdownRenderer
                      text={chat.final_optimization_report}
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                    <span>
                      Last Updated: {new Date(chat.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
