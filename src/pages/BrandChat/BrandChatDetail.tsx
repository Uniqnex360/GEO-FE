import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  History,
  LayoutDashboard,
  Layers,
  ExternalLink,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";

import { selectGlobalProjectId } from "../../store/projectSlice";
import { brandService } from "../../api/brand";
import type { BrandAnalyticsDetailResponse, MetricScores } from "./types";

export default function BrandAnalyticsDetail() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const reduxProjectId = useSelector(selectGlobalProjectId);

  const [activeTab, setActiveTab] = useState<
    "overview" | "insights" | "models" | "history"
  >("overview");

  // --- API Query ---
  const { data, isLoading, isError, error } =
    useQuery<BrandAnalyticsDetailResponse>({
      queryKey: ["brand-analytics-detail", reduxProjectId, brandId],
      queryFn: () =>
        brandService.getBrandAnalyticsDetail({
          tenant_id: reduxProjectId ? Number(reduxProjectId) : undefined,
          brand_id: Number(brandId),
        }),
      enabled: !!reduxProjectId && !!brandId,
    });

  const detailData = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">
            Loading analytics data...
          </span>
        </div>
      </div>
    );
  }

  if (isError || !detailData) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-xl text-center my-6">
        <AlertCircle size={32} className="mx-auto text-rose-500 mb-3" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Failed to load analytics
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {(error as Error)?.message || "Brand analytics data not available."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    );
  }

  const {
    brand,
    overall_averages,
    model_breakdown,
    latest_insights,
    run_history,
    total_analytic_runs,
  } = detailData;

  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "insights", label: "Diagnosis & Actions", icon: Lightbulb },
    { key: "models", label: "LLM Breakdown", icon: Cpu },
    { key: "history", label: "Run History", icon: History },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-slate-800 bg-white min-h-screen">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold capitalize text-slate-900 tracking-tight">
                {brand.name}
              </h1>
              {brand.is_competitor && (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded">
                  Competitor
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              {brand.domain && (
                <a
                  href={`https://${brand.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                >
                  <Globe size={13} />
                  {brand.domain}
                  <ExternalLink size={10} />
                </a>
              )}
              {brand.industry && (
                <span className="flex items-center gap-1">
                  <Building2 size={13} /> {brand.industry}
                </span>
              )}
              {brand.country && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {brand.country}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Primary KPI Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Overall Score"
          value={`${overall_averages?.overall_score?.toFixed(1) ?? 0}`}
          subtitle="Aggregated Across Models"
          highlight
        />
        <KpiCard
          label="Mention Score"
          value={`${overall_averages?.mention_score?.toFixed(1) ?? 0}`}
          subtitle="Brand Visibility Rate"
        />
        <KpiCard
          label="Analytic Runs"
          value={total_analytic_runs}
          subtitle="Total Completed Studies"
        />
        <KpiCard
          label="Models Evaluated"
          value={Object.keys(model_breakdown || {}).length}
          subtitle={Object.keys(model_breakdown || {}).join(", ")}
        />
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-100 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-slate-900 text-slate-900 bg-slate-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panes */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <OverviewTab
            averages={overall_averages}
            dimensions={latest_insights?.dimensions}
            categories={latest_insights?.categories}
            competitors={latest_insights?.competitors}
          />
        )}

        {activeTab === "insights" && (
          <InsightsTab latestInsights={latest_insights} />
        )}

        {activeTab === "models" && (
          <ModelsTab modelBreakdown={model_breakdown} />
        )}

        {activeTab === "history" && <HistoryTab runHistory={run_history} />}
      </div>
    </div>
  );
}

// ==========================================
// Sub-Components & Tab Views
// ==========================================

function KpiCard({
  label,
  value,
  subtitle,
  highlight = false,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        highlight
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white border-slate-200/80 text-slate-800"
      }`}
    >
      <span
        className={`text-xs font-medium uppercase tracking-wider ${
          highlight ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </span>
      <div className="text-2xl font-bold mt-1 tracking-tight">{value}</div>
      <span
        className={`text-[11px] block mt-1 ${
          highlight ? "text-slate-400" : "text-slate-400"
        }`}
      >
        {subtitle}
      </span>
    </div>
  );
}

function MetricRow({ label, score }: { label: string; score: number }) {
  const getBarColor = (val: number) => {
    if (val >= 50) return "bg-emerald-500";
    if (val >= 20) return "bg-sky-500";
    if (val > 0) return "bg-amber-500";
    return "bg-slate-300";
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs font-medium text-slate-600 capitalize">
        {label.replace(/_/g, " ")}
      </span>
      <div className="flex items-center gap-3 w-40">
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getBarColor(
              score,
            )}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-800 min-w-[32px] text-right">
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// 1. Overview Tab View
function OverviewTab({
  averages,
  dimensions = [],
  categories = [],
  competitors = [],
}: {
  averages: MetricScores;
  dimensions: Array<{
    name: string;
    raw_value: number;
    weight: number;
    weighted_score: number;
  }>;
  categories: string[];
  competitors: string[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Metric Scores Column */}
      <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-slate-600" /> Metric Averages
        </h3>
        <div className="space-y-1">
          {Object.entries(averages || {}).map(([key, value]) => (
            <MetricRow key={key} label={key} score={value as number} />
          ))}
        </div>
      </div>

      {/* Side Meta Details */}
      <div className="space-y-6">
        {/* Categories */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Layers size={16} className="text-slate-600" /> Monitored Categories
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {categories.length > 0 ? (
              categories.map((cat, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md"
                >
                  {cat}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No categories set</span>
            )}
          </div>
        </div>

        {/* Competitors */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldAlert size={16} className="text-slate-600" /> Benchmarked
            Competitors
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {competitors.length > 0 ? (
              competitors.map((comp, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-medium rounded-md"
                >
                  {comp}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">
                No competitors listed
              </span>
            )}
          </div>
        </div>

        {/* Weighted Dimension Breakdown */}
        {dimensions.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Dimension Weights
            </h3>
            <div className="space-y-2">
              {dimensions.map((dim, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-slate-600"
                >
                  <span className="capitalize">
                    {dim.name.replace(/_/g, " ")}
                  </span>
                  <span className="font-medium text-slate-800">
                    {(dim.weight * 100).toFixed(0)}% weight
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Insights & Actions Tab View
function InsightsTab({
  latestInsights,
}: {
  latestInsights: Record<string, any>;
}) {
  const diagnosis = latestInsights?.diagnosis;
  const recommendations = latestInsights?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Primary Diagnosis Box */}
      {diagnosis && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-slate-700 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Diagnosis Summary
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {diagnosis.summary}
              </p>
            </div>
          </div>

          {/* Root Cause Factors */}
          {diagnosis.factors?.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-200/60">
              {diagnosis.factors.map((factor: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/80 p-3 rounded-lg"
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
                    {factor.dimension.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {factor.finding}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">
                      Root Cause:
                    </span>{" "}
                    {factor.root_cause}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actionable Recommendations List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" /> Actionable
          Recommendations
        </h3>

        {recommendations.map((rec: any, index: number) => (
          <div
            key={index}
            className="bg-white border border-slate-200/80 rounded-xl p-5 hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded">
                {rec.dimension.replace(/_/g, " ")}
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                {rec.what_to_do}
              </h4>
            </div>

            <p className="text-xs text-slate-600 mb-3">{rec.why_it_helps}</p>

            {rec.suggested_content && (
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs text-slate-700 font-mono leading-relaxed">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Suggested Implementation Content:
                </span>
                {rec.suggested_content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. LLM Model Breakdown Tab
function ModelsTab({
  modelBreakdown,
}: {
  modelBreakdown: Record<string, any>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Object.entries(modelBreakdown || {}).map(([modelName, details]) => (
        <div
          key={modelName}
          className="bg-white border border-slate-200/80 rounded-xl p-5"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">{modelName}</h3>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded">
              {details.total_runs} {details.total_runs === 1 ? "Run" : "Runs"}
            </span>
          </div>

          <div className="mb-4">
            <span className="text-[10px] font-medium text-slate-400 uppercase block mb-1">
              Overall Average Score
            </span>
            <div className="text-xl font-bold text-slate-900">
              {details.averages?.overall_score?.toFixed(1) ?? 0}
            </div>
          </div>

          <div className="space-y-1">
            {Object.entries(details.averages || {}).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
              >
                <span className="text-slate-500 capitalize">
                  {k.replace(/_score/g, "").replace(/_/g, " ")}
                </span>
                <span className="font-semibold text-slate-800">
                  {Number(v).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// 4. Run History Tab View
function HistoryTab({ runHistory = [] }: { runHistory: any[] }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Analytic Run Logs</h3>
        <span className="text-xs text-slate-400">
          Showing {runHistory.length} recorded runs
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {runHistory.map((run) => (
          <div
            key={run.analytic_id}
            className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded">
                {run.model_choice}
              </span>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Run #{run.analytic_id} • Score:{" "}
                  {run.overall_score?.toFixed(1)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(run.created_at).toLocaleString()} •{" "}
                  {run.prompts_tested_count} Prompts Evaluated
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-medium text-slate-600">
              <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                Mention: {run.scores?.mention_score?.toFixed(1)}
              </span>
              <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                Citation: {run.scores?.citation_score?.toFixed(1)}
              </span>
              <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                SOV: {run.scores?.share_of_voice_score?.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
