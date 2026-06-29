import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Layers,
  HelpCircle,
  CheckCircle2,
  Users,
  Globe,
  Calendar,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { productService } from "../../api/product";

// ------------------------------------------------------------------
// TypeScript Interfaces matching your API Response structure
// ------------------------------------------------------------------
interface Brand {
  id: number;
  name: string;
  domain: string;
  industry: string;
  country: string;
}

interface Feature {
  id: number;
  value: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  mpn: string;
  upc: string;
  ean: string;
  gtin: string;
  model_number: string;
  category: string;
  product_type: string;
  short_description: string;
  long_description: string;
  regular_price: number;
  sale_price: number;
  currency: string;
  rating: number;
  rating_count: number;
  product_url: string;
  tenant_id: number;
  brand: Brand;
  features: Feature[];
  faqs: FAQ[];
}

interface Analytics {
  total_sessions: number;
  total_queries: number;
  avg_share_of_voice: number;
  avg_citation_rank: number;
  visibility_rate: number;
  last_analysis: string | null;
}

interface BestQuery {
  query: string;
  share_of_voice: number;
  citation_rank: number;
}

interface ChatQuery {
  id: number;
  query: string;
  share_of_voice: number;
  citation_rank: number;
  product_found: boolean;
  competitors: string[];
  sources: string[];
  optimization_tips: string;
}

interface ChatSession {
  chat_id: number;
  model_used: string;
  created_at: string;
  final_report: string;
  queries: ChatQuery[];
}

interface ProductDetailData {
  product: Product;
  analytics: Analytics;
  best_query: BestQuery;
  competitors: string[];
  citation_sources: string[];
  latest_sessions: ChatSession[];
}


export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "sessions"
  >("overview");

  // ==========================================
  // TanStack Query Core Fetch Binding Hook
  // ==========================================
  const { data, isLoading, error } = useQuery<ProductDetailData, Error>({
    queryKey: ["productDetail", id],
    queryFn: () => productService.productDetail(Number(id!)),
    enabled: !!id, // Prevent request execution if component mounts without ID parameter
    retry: 1, // Prevents endless failure loops on clear 404/403 states
  });

  // Loading Screen Layout Template
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">
          Loading system telemetry records...
        </span>
      </div>
    );
  }

  // Error Boundary Layout Template
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4 text-center p-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md">
          <h3 className="text-red-600 font-bold text-lg mb-2">
            Registry Look-up Failed
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            {error?.message || "No dynamic parameter metrics found."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    product,
    analytics,
    best_query,
    competitors,
    citation_sources,
    latest_sessions,
  } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-12">
      {/* Sticky Header Actions */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {product.sku || `PRODUCT_ID: ${product.id}`}
            </span>
            <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT TWO COLUMNS: Primary Details & Tabs Dynamic Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tab Bindings */}
          <div className="flex border-b border-slate-200 gap-6">
            {(["overview", "analytics", "sessions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab === "sessions" ? "Chat Sessions" : tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Description
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {product.long_description || product.short_description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">
                      Regular Price
                    </span>
                    <span className="font-semibold text-slate-700">
                      {product.currency} {product.regular_price}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">
                      Sale Price
                    </span>
                    <span className="font-bold text-emerald-600">
                      {product.currency} {product.sale_price}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">
                      Category
                    </span>
                    <span className="font-medium text-slate-700">
                      {product.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Features */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" /> Key Features
                </h3>
                {product.features?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature) => (
                      <span
                        key={feature.id}
                        className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        {feature.value}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">
                    No distinctive custom features recorded.
                  </p>
                )}
              </div>

              {/* Product FAQs */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-500" /> Technical
                  FAQs
                </h3>
                {product.faqs?.length ? (
                  <div className="space-y-4">
                    {product.faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm"
                      >
                        <p className="font-semibold text-slate-800">
                          Q: {faq.question}
                        </p>
                        <p className="mt-1 text-slate-600 pl-4 border-l-2 border-slate-200">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">
                    No customer support FAQs defined for this entry.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: ANALYTICS DETAIL */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Best Query Performance Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md">
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider block mb-1">
                  Top Performing Search Query
                </span>
                <h4 className="text-lg font-bold">
                  "{best_query.query || "No metrics tracking found"}"
                </h4>

                <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 text-sm">
                  <div>
                    <span className="text-blue-200 text-xs block">
                      Share of Voice
                    </span>
                    <span className="text-lg font-bold">
                      {best_query.share_of_voice}%
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-200 text-xs block">
                      Avg Citation Rank
                    </span>
                    <span className="text-lg font-bold">
                      #{best_query.citation_rank}
                    </span>
                  </div>
                </div>
              </div>

              {/* Competitors & Sources Split View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" /> Tracked
                    Competitors
                  </h3>
                  {competitors?.length ? (
                    <ul className="space-y-2 text-xs">
                      {competitors.map((comp, idx) => (
                        <li
                          key={idx}
                          className="bg-amber-50 text-amber-800 p-2 rounded border border-amber-100 font-medium"
                        >
                          {comp}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-xs">
                      No alternative competitor entities cataloged.
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" /> Citing Market
                    Sources
                  </h3>
                  {citation_sources?.length ? (
                    <div className="space-y-1.5">
                      {citation_sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline block truncate font-mono bg-slate-50 p-1.5 rounded border border-slate-100"
                        >
                          {src}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs">
                      No reference URL back-citations found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: CHAT SESSIONS */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {latest_sessions?.length ? (
                latest_sessions.map((session) => (
                  <div
                    key={session.chat_id}
                    className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
                          SESSION ID: #{session.chat_id}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{" "}
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-100">
                        {session.model_used}
                      </span>
                    </div>

                    {/* Inner Queries Nested Loop */}
                    <div className="space-y-3">
                      {session.queries?.map((q) => (
                        <div
                          key={q.id}
                          className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className="font-semibold text-slate-800 text-sm">
                              "{q.query}"
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                                q.product_found
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {q.product_found ? "Found" : "Missing"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-medium text-slate-600">
                            <div>
                              Share of Voice:{" "}
                              <span className="font-bold text-slate-900">
                                {q.share_of_voice}%
                              </span>
                            </div>
                            <div>
                              Citation Position:{" "}
                              <span className="font-bold text-slate-900">
                                #{q.citation_rank}
                              </span>
                            </div>
                          </div>

                          {q.optimization_tips && (
                            <div className="pt-2 border-t border-slate-200/60 text-slate-500">
                              <span className="font-bold text-slate-700 block mb-0.5 text-[11px]">
                                Optimization Tip Summary:
                              </span>
                              {q.optimization_tips}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                  No target query data maps directly to this asset file segment.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Summary Metrics Box Dashboard */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <BarChart3 className="w-4 h-4 text-blue-600" /> Executive
              Analytics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs block mb-1">
                  Total Sessions
                </span>
                <span className="text-xl font-bold text-slate-800">
                  {analytics.total_sessions}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs block mb-1">
                  Total Queries
                </span>
                <span className="text-xl font-bold text-slate-800">
                  {analytics.total_queries}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-500">Avg Share of Voice</span>
                  <span className="text-slate-900 font-bold">
                    {analytics.avg_share_of_voice}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(analytics.avg_share_of_voice, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-500">Visibility Rate</span>
                  <span className="text-slate-900 font-bold">
                    {analytics.visibility_rate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(analytics.visibility_rate, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Avg Citation Position:</span>
              <span className="font-bold text-slate-700">
                #{analytics.avg_citation_rank}
              </span>
            </div>
          </div>

          {/* Brand/Registry Context Info Box */}
          {product.brand && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-sm space-y-3">
              <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Registry
                Parameters
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-400">Brand Name:</span>{" "}
                <span className="font-medium text-slate-700">
                  {product.brand.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Industry:</span>{" "}
                <span className="font-medium text-slate-700">
                  {product.brand.industry}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>{" "}
                <span className="font-mono text-xs text-slate-700">
                  {product.model_number || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GTIN Code:</span>{" "}
                <span className="font-mono text-xs text-slate-700">
                  {product.gtin || "N/A"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
