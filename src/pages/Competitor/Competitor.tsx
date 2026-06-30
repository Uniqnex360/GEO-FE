import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RechartsBar,
  Bar,
  LineChart as RechartsLine,
  Line,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Importing your custom AppTable reusable layout
import AppTable from "../../components/Common/AppTable";

// Assuming your service runner layer is mapped here
import { competitorService } from "../../api/competitor";

// ------------------------------------------------------------------
// TypeScript Interfaces Matching your API Payload Contract
// ------------------------------------------------------------------
interface MetricSummary {
  share_of_voice: number;
  query_wins: number;
  query_losses: number;
  gap_queries: number;
}

interface BrandSovBarData {
  brand: string;
  share_of_voice: number;
}

interface TrendPoint {
  month: string;
  visibility: number;
}

interface LeaderboardRow {
  brand_name: string;
  sov_visibility: number;
  avg_position: number;
  wins: number;
  losses: number;
  products: number;
  citations: number;
}

interface CompetitorIntelligenceResponse {
  summary: MetricSummary;
  brand_sov_bar_chart: BrandSovBarData[];
  visibility_trend: Record<string, TrendPoint[]>;
  competitor_leaderboard: LeaderboardRow[];
}

export default function CompetitorIntelligence() {

  // State states for managing AppTable sorting parameters locally
  const [sortKey, setSortKey] = useState<string>("sov_visibility");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // ------------------------------------------------------------------
  // Core API Binding via TanStack Query
  // ------------------------------------------------------------------
  const { data, isLoading, error, refetch } = useQuery<
    CompetitorIntelligenceResponse,
    Error
  >({
    queryKey: ["competitorIntelligence"],
    queryFn: () => competitorService.getDetail(),
    retry: 1,
  });

  // 1. Loading Telemetry Fallback Interceptor
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium tracking-wide">
          Streaming competitor telemetry engine metrics...
        </span>
      </div>
    );
  }

  // 2. Defensive Error Boundary Breakpoint
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
          <button
            onClick={() => refetch()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Destructure verified dynamic API payload data nodes
  const {
    summary,
    brand_sov_bar_chart,
    visibility_trend,
    competitor_leaderboard,
  } = data;

  // Sorting handler injected into AppTable onSort trigger callback
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // ------------------------------------------------------------------
  // AppTable Column Definition Configuration Matrix
  // ------------------------------------------------------------------
  const columns = [
    {
      key: "brand_name",
      label: "BRAND",
      sortable: true,
      render: (value: string) => (
        <span
          className={`font-semibold ${value.toLowerCase().includes("marine") ? "text-blue-600 font-bold" : "text-slate-800"}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "sov_visibility",
      label: "SOV VISIBILITY",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-3 min-w-[120px]">
          <span className="w-10 font-medium text-slate-700">{value}%</span>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-600 h-2 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ),
    },
    { key: "avg_position", label: "AVG. POSITION", sortable: true },
    {
      key: "wins",
      label: "WINS",
      sortable: true,
      render: (value: number) => (
        <span className="text-emerald-600 font-semibold">{value}</span>
      ),
    },
    {
      key: "losses",
      label: "LOSSES",
      sortable: true,
      render: (value: number) => (
        <span className="text-rose-600 font-semibold">{value}</span>
      ),
    },
    { key: "products", label: "PRODUCTS", sortable: true },
    { key: "citations", label: "CITATIONS", sortable: true },
  ];

  // Apply sorting safely prior to pipeline ingestion inside AppTable
  const sortedLeaderboard = [...competitor_leaderboard].sort(
    (a: any, b: any) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    },
  );

  // Transform dynamic backend key configurations safely to map complex multi-line tracking components
  const brandsInTrend = Object.keys(visibility_trend);
  const baselineMonths =
    visibility_trend[brandsInTrend[0]]?.map((d) => d.month) || [];

  const lineChartData = baselineMonths.map((month, idx) => {
    const dataPoint: Record<string, any> = { month };
    brandsInTrend.forEach((brand) => {
      dataPoint[brand] = visibility_trend[brand]?.[idx]?.visibility || 0;
    });
    return dataPoint;
  });

  // Theme palettes assigned to lines dynamically
  const LINE_COLORS = ["#0891b2", "#ef4444", "#10b981", "#7c3aed", "#f59e0b"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-6 space-y-6">
      {/* HEADER SECTION */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Competitor Intelligence
        </h1>
        <p className="text-sm text-slate-500">
          Track where rivals show up across AI engines — and where you don't.
        </p>
      </header>

      {/* 1. EXECUTIVE SUMMARY METRIC CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Share of Voice */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Share of Voice
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {summary.share_of_voice}%
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +1.6%
            </span>
          </div>
          <span className="text-xs text-slate-400 block mt-1">
            rank #3 of 6
          </span>
        </div>

        {/* Query Wins */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Query Wins
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {summary.query_wins}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +8.2%
            </span>
          </div>
        </div>

        {/* Query Losses */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Query Losses
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {summary.query_losses}
            </span>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> -2.1%
            </span>
          </div>
        </div>

        {/* Gap Queries */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Gap Queries
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            {summary.gap_queries}
          </div>
          <span className="text-xs text-slate-400 block mt-1">
            competitors appear, you don't
          </span>
        </div>
      </section>

      {/* 2. ADVANCED RECHARTS GEOMETRY INTEGRATION MATRIX */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Share of Voice Horizontal Bar Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide">
              Share of Voice
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              % of total brand mentions across tracked queries
            </p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar
                layout="vertical"
                data={brand_sov_bar_chart}
                margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  dataKey="brand"
                  type="category"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Share of Voice"]}
                />
                <Bar
                  dataKey="share_of_voice"
                  fill="#cbd5e1"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                >
                  {brand_sov_bar_chart.map((entry, index) => (
                    <span
                      key={`cell-${index}`}
                      style={{
                        fill: entry.brand.toLowerCase().includes("marine")
                          ? "#0891b2"
                          : "#cbd5e1",
                      }}
                    />
                  ))}
                </Bar>
              </RechartsBar>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Visibility Trend Line Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wide mb-6">
              Visibility Trend
            </h3>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine
                data={lineChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} domain={[0, "auto"]} />
                <Tooltip />
                {brandsInTrend.map((brand, i) => (
                  <Line
                    key={brand}
                    type="monotone"
                    dataKey={brand}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={
                      brand.toLowerCase().includes("marine") ? 2.5 : 1.5
                    }
                    dot={false}
                    name={
                      brand.toLowerCase().includes("marine") ? "You" : brand
                    }
                  />
                ))}
              </RechartsLine>
            </ResponsiveContainer>
          </div>
          {/* Legend Display Indicators */}
          <div className="flex justify-center flex-wrap gap-4 text-xs font-medium text-slate-600 mt-2">
            {brandsInTrend.map((brand, i) => (
              <div key={brand} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: LINE_COLORS[i % LINE_COLORS.length],
                  }}
                />
                {brand.toLowerCase().includes("marine") ? "You" : brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BUSINESS RULES LEADERBOARD ARCHITECTURE MAP USING APPTABLE */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-700" />
          <h2 className="text-md font-bold text-slate-900 tracking-wide">
            Competitor Leaderboard
          </h2>
        </div>

        <AppTable
          columns={columns}
          data={sortedLeaderboard}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          isLoading={false}
        />
      </section>
    </div>
  );
}
