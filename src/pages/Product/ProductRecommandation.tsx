import { useState } from "react";

// Clean text-free loading circle
function TabSpinnerFallback() {
  return (
    <div className="w-full min-h-[350px] bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

interface RecommendationItem {
  why?: string;
  action?: string;
  effort?: string;
  impact?: number;
  recommendation?: string;
}

interface RecommendationSection {
  score?: number;
  recommendations?: RecommendationItem[];
}

interface RecommendationModel {
  model: string;
  title?: RecommendationSection;
  assets?: RecommendationSection;
  pricing?: RecommendationSection;
  features?: RecommendationSection;
  attributes?: RecommendationSection;
  description?: RecommendationSection;
}

interface RecommendationCriteria {
  score?: number;
  avg_impact?: number;
  recommendation_count?: number;
}

interface RecommendationsActions {
  models?: RecommendationModel[];
  criteria?: {
    title?: RecommendationCriteria;
    description?: RecommendationCriteria;
    features?: RecommendationCriteria;
    attributes?: RecommendationCriteria;
    assets?: RecommendationCriteria;
    pricing?: RecommendationCriteria;
  };
}

interface RecommendationsProps {
  data: {
    actions?: RecommendationsActions;
  };
  isLoading: boolean;
}

export default function RecommendationsTabContent({ data, isLoading }: RecommendationsProps) {
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(
    null,
  );

  if (isLoading) return <TabSpinnerFallback />;

  const actions = data?.actions;

  if (!actions?.models?.length) return null;

  const models = actions.models;
  const criteria = actions.criteria || {};

  const criterionKeys = [
    "title",
    "description",
    "features",
    "attributes",
    "assets",
    "pricing",
  ] as const;

  type CriterionKey = (typeof criterionKeys)[number];

  const criterionLabels: Record<CriterionKey, string> = {
    title: "Title",
    description: "Description",
    features: "Features",
    attributes: "Attributes",
    assets: "Assets",
    pricing: "Pricing",
  };

  const criterionDescriptions: Record<CriterionKey, string> = {
    title: "Title tag & headings",
    description: "Product description copy",
    features: "Feature lists & bullets",
    attributes: "Specs & identifiers",
    assets: "Images, video & media",
    pricing: "Price display & schema",
  };

  const criterionIcons: Record<CriterionKey, string> = {
    title: "T",
    description: "D",
    features: "F",
    attributes: "A",
    assets: "As",
    pricing: "$",
  };

  const getModelName = (model: string) => {
    const value = model?.replace("LLMModels.", "").toUpperCase();

    if (value === "GPT" || value === "CHATGPT") return "GPT";
    if (value === "GEMINI") return "GEMINI";
    if (value === "CLAUDE") return "CLAUDE";

    return value;
  };

  const getModelLabel = (model: string) => {
    const value = getModelName(model);

    if (value === "GPT") return "ChatGPT";
    if (value === "GEMINI") return "Gemini";
    if (value === "CLAUDE") return "Claude";

    return value;
  };

  const getModelColors = (model: string) => {
    const value = getModelName(model);

    if (value === "GPT") {
      return {
        text: "text-emerald-500",
        bar: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
      };
    }

    if (value === "GEMINI") {
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

  const getModelIcon = (model: string) => {
    const value = getModelName(model);

    if (value === "GPT") {
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

    if (value === "GEMINI") {
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

  const getModel = (modelName: string) => {
    return models.find((model) => getModelName(model.model) === modelName);
  };

  const getSection = (
    modelName: string,
    criterion: CriterionKey,
  ): RecommendationSection | undefined => {
    const model = getModel(modelName);

    if (!model) return undefined;

    return model[criterion];
  };

  const getRecommendationCount = (
    modelName: string,
    criterion: CriterionKey,
  ) => {
    return getSection(modelName, criterion)?.recommendations?.length || 0;
  };

  const getCriterionScore = (modelName: string, criterion: CriterionKey) => {
    return getSection(modelName, criterion)?.score || 0;
  };

  const getAverageImpact = (modelName: string, criterion: CriterionKey) => {
    const section = getSection(modelName, criterion);

    if (!section?.recommendations?.length) return 0;

    const impacts = section.recommendations
      .map((item) => Number(item.impact || 0))
      .filter((impact) => impact > 0);

    if (!impacts.length) return 0;

    return impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
  };

  const getOverallCriterionScore = (criterion: CriterionKey) => {
    const configuredScore = criteria[criterion]?.score;

    if (configuredScore !== undefined) {
      return Number(configuredScore);
    }

    const scores = ["GPT", "GEMINI", "CLAUDE"]
      .map((model) => getCriterionScore(model, criterion))
      .filter((score) => score > 0);

    if (!scores.length) return 0;

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  };

  const getTotalRecommendationCount = (criterion: CriterionKey) => {
    const configuredCount = criteria[criterion]?.recommendation_count;

    if (configuredCount !== undefined) {
      return Number(configuredCount);
    }

    return ["GPT", "GEMINI", "CLAUDE"].reduce(
      (total, model) => total + getRecommendationCount(model, criterion),
      0,
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    return "text-orange-500";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return "bg-emerald-500";
    return "bg-orange-500";
  };

  const formatImpact = (impact: number) => {
    if (!impact) return "0";

    return Number.isInteger(impact) ? String(impact) : impact.toFixed(1);
  };

  const renderRecommendation = (item: RecommendationItem, index: number) => {
    return (
      <div key={index} className="border-l-2 border-orange-200 pl-4">
        {/* Impact + Effort */}
        <div className="flex items-center gap-2 mb-3">
          {item.impact !== undefined && (
            <>
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                {item.impact}
              </span>

              <span className="text-xs text-slate-400">impact</span>
            </>
          )}

          {item.effort && (
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full">
              {item.effort}
            </span>
          )}
        </div>

        {/* Recommendation */}
        {item.recommendation && (
          <h4 className="text-base font-bold text-slate-900 leading-snug">
            {item.recommendation}
          </h4>
        )}

        {/* Why */}
        {item.why && (
          <div className="flex items-start gap-2 mt-3">
            <svg
              className="w-4 h-4 text-orange-400 mt-0.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18h6M10 22h4M8 14a6 6 0 1110-4c0 2-1 3-2 4-1 1-2 2-2 3H9c0-1-1-2-1-3-1-1-2-2-2-4" />
            </svg>

            <p className="text-sm text-slate-500 leading-relaxed">{item.why}</p>
          </div>
        )}

        {/* Action */}
        {item.action && (
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
              {item.action}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderModelExpandedColumn = (
    modelName: string,
    criterion: CriterionKey,
  ) => {
    const section = getSection(modelName, criterion);
    const recommendations = section?.recommendations || [];
    const colors = getModelColors(modelName);
    const score = getCriterionScore(modelName, criterion);
    const averageImpact = getAverageImpact(modelName, criterion);

    return (
      <div
        key={modelName}
        className="bg-white border border-slate-200 rounded-2xl p-6"
      >
        {/* Model Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className={colors.text}>{getModelIcon(modelName)}</div>

          <span className="text-lg font-semibold text-slate-700">
            {getModelLabel(modelName)}
          </span>

          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${colors.badge}`}
          >
            {recommendations.length}
          </span>
        </div>

        {/* Score */}
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
            avg impact {formatImpact(averageImpact)}
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-6 mt-6">
          {recommendations.map((item, index) =>
            renderRecommendation(item, index),
          )}
        </div>
      </div>
    );
  };

  const renderModelSummary = (modelName: string, criterion: CriterionKey) => {
    const count = getRecommendationCount(modelName, criterion);

    const score = getCriterionScore(modelName, criterion);

    const averageImpact = getAverageImpact(modelName, criterion);

    const colors = getModelColors(modelName);

    return (
      <div
        key={modelName}
        className="flex flex-col items-center justify-center"
      >
        {/* Recommendation count */}
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-slate-900">{count}</span>

          <span className="text-xs text-slate-400">
            rec{count === 1 ? "" : "s"}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colors.bar}`}
              style={{
                width: `${Math.min(score, 100)}%`,
              }}
            />
          </div>

          <span className={`text-sm font-semibold ${colors.text}`}>
            {score}
          </span>
        </div>

        {/* Average impact */}
        <span className="text-xs text-slate-400 mt-2">
          avg impact {formatImpact(averageImpact)}
        </span>
      </div>
    );
  };

  const handleCriterionClick = (criterion: CriterionKey) => {
    setExpandedCriterion((current) =>
      current === criterion ? null : criterion,
    );
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-sm text-slate-500 px-1">
        Recommendation statistics by content criteria. Click any row to see the
        detailed recommendations for each LLM engine.
      </p>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Table Header */}
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

        {/* Criteria Rows */}
        {criterionKeys.map((criterion) => {
          const totalCount = getTotalRecommendationCount(criterion);

          const overallScore = getOverallCriterionScore(criterion);

          const isExpanded = expandedCriterion === criterion;

          return (
            <div key={criterion}>
              {/* Row */}
              <div
                onClick={() => handleCriterionClick(criterion)}
                className={`
                  grid grid-cols-[minmax(280px,1.8fr)_1fr_1fr_1fr_120px]
                  items-center px-6 py-6 cursor-pointer
                  transition-colors
                  ${isExpanded ? "bg-slate-50/60" : "hover:bg-slate-50/60"}
                  ${criterion !== "pricing" ? "border-b border-slate-100" : ""}
                `}
              >
                {/* Criterion */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <span className="text-orange-500 font-bold text-sm">
                      {criterionIcons[criterion]}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900">
                      {criterionLabels[criterion]}
                    </h3>

                    <p className="text-sm text-slate-400 mt-0.5">
                      {totalCount}{" "}
                      {totalCount === 1 ? "recommendation" : "recommendations"}{" "}
                      · {criterionDescriptions[criterion]}
                    </p>
                  </div>
                </div>

                {/* GPT */}
                {renderModelSummary("GPT", criterion)}

                {/* Gemini */}
                {renderModelSummary("GEMINI", criterion)}

                {/* Claude */}
                {renderModelSummary("CLAUDE", criterion)}

                {/* Overall Score */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-bold ${getScoreColor(
                        overallScore,
                      )}`}
                    >
                      {overallScore}
                    </span>

                    <svg
                      className={`w-5 h-5 text-slate-300 transition-transform ${
                        isExpanded ? "rotate-90" : ""
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

              {/* Expanded Criterion */}
              {isExpanded && (
                <div className="bg-slate-50/70 border-b border-slate-200 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {renderModelExpandedColumn("GPT", criterion)}

                    {renderModelExpandedColumn("GEMINI", criterion)}

                    {renderModelExpandedColumn("CLAUDE", criterion)}
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
