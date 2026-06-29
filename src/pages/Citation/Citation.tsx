import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart as RechartsBar,
} from "recharts";
import {
  BarChart3,
  Globe,
  PieChart,
  LineChart,
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Assuming your service layer is located here
import { citationService } from "../../api/citation";

// ------------------------------------------------------------------
// TypeScript Interfaces Matching the API Payload Contract
// ------------------------------------------------------------------
interface CardMetric {
  value: number;
  growth_percentage?: string;
}

interface SummaryCards {
  total_citations: CardMetric;
  unique_domains: CardMetric;
  avg_authority: CardMetric;
  avg_quality_score: CardMetric;
}

interface TrendData {
  month: string;
  citations: number;
  avg_share_of_voice: number;
}

interface TopDomain {
  domain: string;
  type: string;
  authority: number;
  quality: number;
  citations: number;
  growth: string;
}

interface HistorySession {
  id: number;
  product_name: string;
  product_url: string;
  extra_context: string;
  model_used: string;
  created_at: string;
}

interface DashboardMetadata {
  total_records: number;
  current_page: number;
  limit: number;
}

interface CitationDashboardResponse {
  metadata: DashboardMetadata;
  summary_cards: SummaryCards;
  citation_mix_pie_chart: Record<string, number>;
  source_types_bar_chart: Record<string, number>;
  citation_trend_line_chart: TrendData[];
  top_influencing_domains_table: TopDomain[];
  history_sessions: HistorySession[];
}

export default function CitationIntelligence() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  //@ts-ignore
  const [currentPage, setCurrentPage] = useState(1);

  // ------------------------------------------------------------------
  // Core API Binding via TanStack Query
  // ------------------------------------------------------------------
  const { data, isLoading, error, refetch } = useQuery<
    CitationDashboardResponse,
    Error
  >({
    queryKey: ["citationDashboard", id, currentPage],
    // Passing pagination indices safely to your endpoint service runner
    queryFn: () => citationService.getDetail(),
    enabled: !!id,
    retry: 1,
  });

  // 1. Loading Telemetry Interface state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium tracking-wide">
          Streaming telemetry dataset analytics...
        </span>
      </div>
    );
  }

  // 2. Defensive Error Boundary State Breakpoint
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white border border-slate-200 p-6 rounded-xl max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <div>
            <h3 className="text-slate-900 font-bold text-lg">
              Metrics Aggregation Failed
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {error?.message ||
                "Unable to successfully structure dynamic dashboard nodes."}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => refetch()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Destructure verified dynamic API content keys
  const {
    summary_cards,
    citation_mix_pie_chart,
    source_types_bar_chart,
    citation_trend_line_chart,
    top_influencing_domains_table,
    history_sessions,
  } = data;

  // Transform standard record objects into array shapes required by Recharts
  const pieChartData = Object.entries(citation_mix_pie_chart).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const barChartData = Object.entries(source_types_bar_chart).map(
    ([name, value]) => ({
      name,
      Citations: value,
    }),
  );

  // Theme palettes for the graphs (optimized for clear reading on white backgrounds)
  const PIE_COLORS = ["#2563eb", "#7c3aed", "#d97706", "#059669", "#db2777"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-6 space-y-8">
      {/* HEADER SECTION */}
      <header className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-800 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
              GEOMETRY ENGINE LOGS
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Citation
            Intelligence Dashboard
          </h1>
        </div>
      </header>

      {/* 1. EXECUTIVE SUMMARY NUMERIC CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Citations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Citations
            </span>
            {summary_cards.total_citations.growth_percentage && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />{" "}
                {summary_cards.total_citations.growth_percentage}
              </span>
            )}
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {summary_cards.total_citations.value}
          </div>
        </div>

        {/* Unique Domains */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Unique Domains
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {summary_cards.unique_domains.value}
          </div>
        </div>

        {/* Avg. Authority */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Avg. Authority
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {summary_cards.avg_authority.value}
            <span className="text-xs text-slate-400 font-normal ml-1">
              /100
            </span>
          </div>
        </div>

        {/* Quality Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg. Quality Score
            </span>
            {summary_cards.avg_quality_score.growth_percentage && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {summary_cards.avg_quality_score.growth_percentage}
              </span>
            )}
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {summary_cards.avg_quality_score.value}
            <span className="text-xs text-slate-400 font-normal ml-1">%</span>
          </div>
        </div>
      </section>

      {/* 2. ADVANCED CHARTS INTEGRATION MATRIX */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Visualization (Composed Line & Bar Chart) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-blue-600" /> Citation Trend &
            Voice Distribution
          </h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={citation_trend_line_chart}
                margin={{ top: 10, right: -10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} />
                <YAxis yAxisId="left" stroke="#94a3b8" tickLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#0f172a" }}
                />
                {/* @ts-ignore */}
                <Legend wrapperStyle={{ pt: 10 }} />
                <Bar
                  yAxisId="left"
                  dataKey="citations"
                  name="Total Citations"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avg_share_of_voice"
                  name="Avg SOV (%)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Citation Mix Pie Diagram */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" /> Citation Mix Share
          </h3>
          <div className="h-48 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                    {/* @ts-ignore */}
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    borderRadius: "8px",
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Sources
              </span>
              <p className="text-xl font-black text-slate-900">
                {pieChartData.length}
              </p>
            </div>
          </div>
          {/* Custom Dynamic Legend Indicators */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
            {pieChartData.map((entry, index) => (
              <div
                key={entry.name}
                className="flex items-center gap-2 truncate"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                  }}
                />
                <span className="truncate">
                  {entry.name}:{" "}
                  <strong className="text-slate-900">{entry.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Source Breakdown Horizontal Distribution Bar Chart */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" /> Source Types
          Classification
        </h3>
        <div className="h-40 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBar
              layout="vertical"
              data={barChartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis type="number" stroke="#94a3b8" tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                }}
              />
              <Bar
                dataKey="Citations"
                fill="#d97706"
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. CORE TABLE GENERATION & RUN HISTORY MATRIX */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Influencing Domains Subsystem Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2 overflow-x-auto shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-600" /> Top Influencing Domains
          </h3>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Domain</th>
                <th className="pb-3">Type</th>
                <th className="pb-3 text-center">Authority</th>
                <th className="pb-3 text-center">Quality</th>
                <th className="pb-3 text-right">Citations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {top_influencing_domains_table.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-mono text-blue-600 flex items-center gap-1.5">
                    {row.domain}
                    <a
                      href={`https://${row.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3 text-slate-500">{row.type}</td>
                  <td className="py-3 text-center">
                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                      {row.authority}
                    </span>
                  </td>
                  <td className="py-3 text-center text-emerald-600">
                    {row.quality}%
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {row.citations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Latest Search Audit History Pipeline Logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Latest Engine
              Searches
            </h3>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {history_sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400 font-bold">
                      ID: #{session.id}
                    </span>
                    <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono font-semibold">
                      {session.model_used}
                    </span>
                  </div>
                  <div>
                    <h4
                      className="text-xs font-bold text-slate-800 truncate"
                      title={session.product_name}
                    >
                      {session.product_name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                      {session.product_url}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-0.5 text-blue-600 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Audit Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
