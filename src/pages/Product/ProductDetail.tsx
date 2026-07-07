// import { useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useQuery } from "@tanstack/react-query";
// import {
//   BarChart3,
//   Layers,
//   HelpCircle,
//   CheckCircle2,
//   Users,
//   Globe,
//   Calendar,
//   ArrowLeft,
//   Loader2,
// } from "lucide-react";
// import { productService } from "../../api/product";

// // ------------------------------------------------------------------
// // TypeScript Interfaces matching your API Response structure
// // ------------------------------------------------------------------
// interface Brand {
//   id: number;
//   name: string;
//   domain: string;
//   industry: string;
//   country: string;
// }

// interface Feature {
//   id: number;
//   value: string;
// }

// interface FAQ {
//   id: number;
//   question: string;
//   answer: string;
// }

// interface Product {
//   id: number;
//   name: string;
//   sku: string;
//   mpn: string;
//   upc: string;
//   ean: string;
//   gtin: string;
//   model_number: string;
//   category: string;
//   product_type: string;
//   short_description: string;
//   long_description: string;
//   regular_price: number;
//   sale_price: number;
//   currency: string;
//   rating: number;
//   rating_count: number;
//   product_url: string;
//   tenant_id: number;
//   brand: Brand;
//   features: Feature[];
//   faqs: FAQ[];
// }

// interface Analytics {
//   total_sessions: number;
//   total_queries: number;
//   avg_share_of_voice: number;
//   avg_citation_rank: number;
//   visibility_rate: number;
//   last_analysis: string | null;
// }

// interface BestQuery {
//   query: string;
//   share_of_voice: number;
//   citation_rank: number;
// }

// interface ChatQuery {
//   id: number;
//   query: string;
//   share_of_voice: number;
//   citation_rank: number;
//   product_found: boolean;
//   competitors: string[];
//   sources: string[];
//   optimization_tips: string;
// }

// interface ChatSession {
//   chat_id: number;
//   model_used: string;
//   created_at: string;
//   final_report: string;
//   queries: ChatQuery[];
// }

// interface ProductDetailData {
//   product: Product;
//   analytics: Analytics;
//   best_query: BestQuery;
//   competitors: string[];
//   citation_sources: string[];
//   latest_sessions: ChatSession[];
// }

// export default function ProductDetail() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   const [activeTab, setActiveTab] = useState<
//     "overview" | "analytics" | "sessions"
//   >("overview");

//   // ==========================================
//   // TanStack Query Core Fetch Binding Hook
//   // ==========================================
//   const { data, isLoading, error } = useQuery<ProductDetailData, Error>({
//     queryKey: ["productDetail", id],
//     queryFn: () => productService.productDetail(Number(id!)),
//     enabled: !!id, // Prevent request execution if component mounts without ID parameter
//     retry: 1, // Prevents endless failure loops on clear 404/403 states
//   });

//   // Loading Screen Layout Template
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3 text-slate-500">
//         <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
//         <span className="text-sm font-medium">
//           Loading system telemetry records...
//         </span>
//       </div>
//     );
//   }

//   // Error Boundary Layout Template
//   if (error || !data) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4 text-center p-6">
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md">
//           <h3 className="text-red-600 font-bold text-lg mb-2">
//             Registry Look-up Failed
//           </h3>
//           <p className="text-slate-600 text-sm mb-4">
//             {error?.message || "No dynamic parameter metrics found."}
//           </p>
//           <button
//             onClick={() => navigate(-1)}
//             className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium text-sm transition-colors"
//           >
//             Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const {
//     product,
//     analytics,
//     best_query,
//     competitors,
//     citation_sources,
//     latest_sessions,
//   } = data;

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-12">
//       {/* Sticky Header Actions */}
//       <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => navigate(-1)}
//             className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
//           >
//             <ArrowLeft className="w-5 h-5" />
//           </button>
//           <div>
//             <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
//               {product.sku || `PRODUCT_ID: ${product.id}`}
//             </span>
//             <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
//           </div>
//         </div>
//       </header>

//       <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* LEFT TWO COLUMNS: Primary Details & Tabs Dynamic Context */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Navigation Tab Bindings */}
//           <div className="flex border-b border-slate-200 gap-6">
//             {(["overview", "analytics", "sessions"] as const).map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`pb-3 text-sm font-medium capitalize border-b-2 transition-all ${
//                   activeTab === tab
//                     ? "border-blue-600 text-blue-600 font-semibold"
//                     : "border-transparent text-slate-500 hover:text-slate-800"
//                 }`}
//               >
//                 {tab === "sessions" ? "Chat Sessions" : tab}
//               </button>
//             ))}
//           </div>

//           {/* TAB CONTENT: OVERVIEW */}
//           {activeTab === "overview" && (
//             <div className="space-y-6">
//               <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
//                 <h3 className="text-base font-bold text-slate-900 mb-2">
//                   Description
//                 </h3>
//                 <p className="text-slate-600 text-sm leading-relaxed">
//                   {product.long_description || product.short_description}
//                 </p>

//                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
//                   <div>
//                     <span className="text-slate-400 block text-xs">
//                       Regular Price
//                     </span>
//                     <span className="font-semibold text-slate-700">
//                       {product.currency} {product.regular_price}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="text-slate-400 block text-xs">
//                       Sale Price
//                     </span>
//                     <span className="font-bold text-emerald-600">
//                       {product.currency} {product.sale_price}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="text-slate-400 block text-xs">
//                       Category
//                     </span>
//                     <span className="font-medium text-slate-700">
//                       {product.category}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Product Features */}
//               <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
//                 <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
//                   <Layers className="w-4 h-4 text-blue-500" /> Key Features
//                 </h3>
//                 {product.features?.length ? (
//                   <div className="flex flex-wrap gap-2">
//                     {product.features.map((feature) => (
//                       <span
//                         key={feature.id}
//                         className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-medium"
//                       >
//                         {feature.value}
//                       </span>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-slate-400 text-xs">
//                     No distinctive custom features recorded.
//                   </p>
//                 )}
//               </div>

//               {/* Product FAQs */}
//               <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
//                 <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
//                   <HelpCircle className="w-4 h-4 text-purple-500" /> Technical
//                   FAQs
//                 </h3>
//                 {product.faqs?.length ? (
//                   <div className="space-y-4">
//                     {product.faqs.map((faq) => (
//                       <div
//                         key={faq.id}
//                         className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm"
//                       >
//                         <p className="font-semibold text-slate-800">
//                           Q: {faq.question}
//                         </p>
//                         <p className="mt-1 text-slate-600 pl-4 border-l-2 border-slate-200">
//                           {faq.answer}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-slate-400 text-xs">
//                     No customer support FAQs defined for this entry.
//                   </p>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* TAB CONTENT: ANALYTICS DETAIL */}
//           {activeTab === "analytics" && (
//             <div className="space-y-6">
//               {/* Best Query Performance Banner */}
//               <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md">
//                 <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider block mb-1">
//                   Top Performing Search Query
//                 </span>
//                 <h4 className="text-lg font-bold">
//                   "{best_query.query || "No metrics tracking found"}"
//                 </h4>

//                 <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 text-sm">
//                   <div>
//                     <span className="text-blue-200 text-xs block">
//                       Share of Voice
//                     </span>
//                     <span className="text-lg font-bold">
//                       {best_query.share_of_voice}%
//                     </span>
//                   </div>
//                   <div>
//                     <span className="text-blue-200 text-xs block">
//                       Avg Citation Rank
//                     </span>
//                     <span className="text-lg font-bold">
//                       #{best_query.citation_rank}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Competitors & Sources Split View */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
//                   <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
//                     <Users className="w-4 h-4 text-amber-500" /> Tracked
//                     Competitors
//                   </h3>
//                   {competitors?.length ? (
//                     <ul className="space-y-2 text-xs">
//                       {competitors.map((comp, idx) => (
//                         <li
//                           key={idx}
//                           className="bg-amber-50 text-amber-800 p-2 rounded border border-amber-100 font-medium"
//                         >
//                           {comp}
//                         </li>
//                       ))}
//                     </ul>
//                   ) : (
//                     <p className="text-slate-400 text-xs">
//                       No alternative competitor entities cataloged.
//                     </p>
//                   )}
//                 </div>

//                 <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
//                   <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
//                     <Globe className="w-4 h-4 text-emerald-500" /> Citing Market
//                     Sources
//                   </h3>
//                   {citation_sources?.length ? (
//                     <div className="space-y-1.5">
//                       {citation_sources.map((src, idx) => (
//                         <a
//                           key={idx}
//                           href={src}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="text-xs text-blue-600 hover:underline block truncate font-mono bg-slate-50 p-1.5 rounded border border-slate-100"
//                         >
//                           {src}
//                         </a>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-slate-400 text-xs">
//                       No reference URL back-citations found.
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* TAB CONTENT: CHAT SESSIONS */}
//           {activeTab === "sessions" && (
//             <div className="space-y-4">
//               {latest_sessions?.length ? (
//                 latest_sessions.map((session) => (
//                   <div
//                     key={session.chat_id}
//                     className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
//                   >
//                     <div className="flex items-center justify-between border-b border-slate-100 pb-3">
//                       <div className="flex items-center gap-2">
//                         <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
//                           SESSION ID: #{session.chat_id}
//                         </span>
//                         <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
//                           <Calendar className="w-3 h-3" />{" "}
//                           {new Date(session.created_at).toLocaleDateString()}
//                         </span>
//                       </div>
//                       <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-100">
//                         {session.model_used}
//                       </span>
//                     </div>

//                     {/* Inner Queries Nested Loop */}
//                     <div className="space-y-3">
//                       {session.queries?.map((q) => (
//                         <div
//                           key={q.id}
//                           className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-xs space-y-3"
//                         >
//                           <div className="flex items-start justify-between gap-4">
//                             <p className="font-semibold text-slate-800 text-sm">
//                               "{q.query}"
//                             </p>
//                             <span
//                               className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${
//                                 q.product_found
//                                   ? "bg-emerald-100 text-emerald-800"
//                                   : "bg-rose-100 text-rose-800"
//                               }`}
//                             >
//                               {q.product_found ? "Found" : "Missing"}
//                             </span>
//                           </div>

//                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-medium text-slate-600">
//                             <div>
//                               Share of Voice:{" "}
//                               <span className="font-bold text-slate-900">
//                                 {q.share_of_voice}%
//                               </span>
//                             </div>
//                             <div>
//                               Citation Position:{" "}
//                               <span className="font-bold text-slate-900">
//                                 #{q.citation_rank}
//                               </span>
//                             </div>
//                           </div>

//                           {q.optimization_tips && (
//                             <div className="pt-2 border-t border-slate-200/60 text-slate-500">
//                               <span className="font-bold text-slate-700 block mb-0.5 text-[11px]">
//                                 Optimization Tip Summary:
//                               </span>
//                               {q.optimization_tips}
//                             </div>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
//                   No target query data maps directly to this asset file segment.
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* RIGHT COLUMN: Summary Metrics Box Dashboard */}
//         <div className="space-y-6">
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
//             <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
//               <BarChart3 className="w-4 h-4 text-blue-600" /> Executive
//               Analytics
//             </h3>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
//                 <span className="text-slate-400 text-xs block mb-1">
//                   Total Sessions
//                 </span>
//                 <span className="text-xl font-bold text-slate-800">
//                   {analytics.total_sessions}
//                 </span>
//               </div>
//               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
//                 <span className="text-slate-400 text-xs block mb-1">
//                   Total Queries
//                 </span>
//                 <span className="text-xl font-bold text-slate-800">
//                   {analytics.total_queries}
//                 </span>
//               </div>
//             </div>

//             <div className="space-y-3">
//               <div>
//                 <div className="flex justify-between text-xs mb-1 font-medium">
//                   <span className="text-slate-500">Avg Share of Voice</span>
//                   <span className="text-slate-900 font-bold">
//                     {analytics.avg_share_of_voice}%
//                   </span>
//                 </div>
//                 <div className="w-full bg-slate-100 rounded-full h-2">
//                   <div
//                     className="bg-blue-600 h-2 rounded-full"
//                     style={{
//                       width: `${Math.min(analytics.avg_share_of_voice, 100)}%`,
//                     }}
//                   ></div>
//                 </div>
//               </div>

//               <div>
//                 <div className="flex justify-between text-xs mb-1 font-medium">
//                   <span className="text-slate-500">Visibility Rate</span>
//                   <span className="text-slate-900 font-bold">
//                     {analytics.visibility_rate}%
//                   </span>
//                 </div>
//                 <div className="w-full bg-slate-100 rounded-full h-2">
//                   <div
//                     className="bg-emerald-500 h-2 rounded-full"
//                     style={{
//                       width: `${Math.min(analytics.visibility_rate, 100)}%`,
//                     }}
//                   ></div>
//                 </div>
//               </div>
//             </div>

//             <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
//               <span>Avg Citation Position:</span>
//               <span className="font-bold text-slate-700">
//                 #{analytics.avg_citation_rank}
//               </span>
//             </div>
//           </div>

//           {/* Brand/Registry Context Info Box */}
//           {product.brand && (
//             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-sm space-y-3">
//               <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
//                 <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Registry
//                 Parameters
//               </h4>
//               <div className="flex justify-between">
//                 <span className="text-slate-400">Brand Name:</span>{" "}
//                 <span className="font-medium text-slate-700">
//                   {product.brand.name}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-400">Industry:</span>{" "}
//                 <span className="font-medium text-slate-700">
//                   {product.brand.industry}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-400">Model:</span>{" "}
//                 <span className="font-mono text-xs text-slate-700">
//                   {product.model_number || "N/A"}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-400">GTIN Code:</span>{" "}
//                 <span className="font-mono text-xs text-slate-700">
//                   {product.gtin || "N/A"}
//                 </span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

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
      {/* 1. DYNAMIC HEADER BANNER (Perfectly matches Page 1 Layout) */}
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
          {/* Full Width Blue Banner */}
          {/* <div className="bg-blue-600 rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm"> */}
          <div className="bg-gradient-to-r from-blue-700  to-cyan-500 rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg">
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
          <div className="flex items-center justify-center py-20 text-slate-400 font-medium bg-white rounded-xl border border-slate-200 shadow-sm">
            🔄 Fetching updated tab insights...
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
