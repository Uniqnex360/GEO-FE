import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Eye,
  MessageSquare,
  Award,
  Link2,
  Box,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { useSelector } from "react-redux";

import { selectGlobalProjectId } from "../../store/projectSlice";
import { dashboardService } from "../../api/dashboard";

interface KPICardItem {
  label: string;
  value: number;
  suffix: string;
  format: "decimal" | "percentage" | "number";
  trend: string;
  trendType: "positive" | "negative" | "neutral";
}

export default function Dashboard() {
  const reduxProjectId = useSelector(selectGlobalProjectId);

  const { data, isLoading, error } = useQuery({
    // Adding reduxProjectId forces a re-fetch automatically whenever the project is swapped
    queryKey: ["brands", reduxProjectId],
    queryFn: () => dashboardService.getDashboard(Number(reduxProjectId)),
    enabled: !!reduxProjectId, // Safely stalls execution if no project context is active
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500 bg-slate-50 min-h-screen">
        <p>
          Error loading dashboard details:{" "}
          {error?.message || "No data available"}
        </p>
      </div>
    );
  }

  // Helper to dynamically assign icons to KPI Cards
  const getCardIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "visibility score":
        return <Eye className="w-5 h-5 text-slate-500" />;
      case "mention rate":
        return <MessageSquare className="w-5 h-5 text-slate-500" />;
      case "avg. rank":
        return <Search className="w-5 h-5 text-slate-500" />;
      case "share of voice":
        return <Award className="w-5 h-5 text-slate-500" />;
      case "citations added":
        return <Link2 className="w-5 h-5 text-slate-500" />;
      case "tracked products":
        return <Box className="w-5 h-5 text-slate-500" />;
      case "total queries":
        return <Search className="w-5 h-5 text-slate-500" />;
      default:
        return <Box className="w-5 h-5 text-slate-500" />;
    }
  };

  // Format Helper for Card values
  const formatCardValue = (card: KPICardItem) => {
    if (card.format === "percentage") return `${card.value}${card.suffix}`;
    if (card.format === "decimal") return `${card.value}${card.suffix}`;
    return card.value.toLocaleString();
  };

  // Setup Pie Chart colors to match the UI visual style
  const pieColors = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#06b6d4"];

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* --- Top Sub-Header Metadata --- */}


      {/* --- KPI Grid Summary Row --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {
          //@ts-ignore
          data.kpiCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 bg-slate-50 rounded-lg">
                  {getCardIcon(card.label)}
                </div>

                {/* Trend Badge */}
                <div
                  className={`flex items-center text-xs font-semibold ${
                    card.trendType === "positive"
                      ? "text-emerald-600"
                      : card.trendType === "negative"
                        ? "text-rose-600"
                        : "text-slate-500"
                  }`}
                >
                  {card.trendType === "positive" && (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  )}
                  {card.trendType === "negative" && (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {card.trendType === "neutral" && (
                    <Minus className="w-3 h-3 mr-0.5" />
                  )}
                  {card.trend}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  {formatCardValue(card)}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  {card.label}
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* --- Visualizations Section - Row 1 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Visibility Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Visibility Trend (Last 30 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.visualizations.visibilityTrendTimeline}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="trendGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  fill="url(#trendGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visibility by AI Engine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Visibility by AI Engine
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.visualizations.visibilityByAIEngine}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {data.visualizations.visibilityByAIEngine.map(
                    //@ts-ignore
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || "#3b82f6"}
                      />
                    ),
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- Visualizations Section - Row 2 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Citation Sources (Pie Chart Layout) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Citation Sources
          </h3>
          <div className="h-56 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={data.visualizations.citationSourcesPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="percentage"
                  nameKey="source"
                >
                  {data.visualizations.citationSourcesPie.map(
                    //@ts-ignore
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ),
                  )}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend Mapping Custom Matrix Grid matching screenshot */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full px-2 text-xs font-medium text-slate-600 mt-2">
              {data.visualizations.citationSourcesPie.map(
                //@ts-ignore
                (entry, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: pieColors[idx % pieColors.length],
                      }}
                    ></span>
                    <span className="truncate">{entry.source}</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-1">
                    {entry.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competitor Share of Voice */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Competitor Share of Voice
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.visualizations.competitorShareOfVoiceBar}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="brand"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={50}>
                  {data.visualizations.competitorShareOfVoiceBar.map(
                    //@ts-ignore
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isPrimary ? "#3b82f6" : "#94a3b8"}
                      />
                    ),
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
