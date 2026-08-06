export interface BrandInfo {
  id: number;
  name: string;
  domain: string | null;
  industry: string | null;
  country: string | null;
  is_competitor: boolean | null;
}

export interface MetricScores {
  overall_score: number;
  mention_score: number;
  citation_score: number;
  share_of_voice_score: number;
  product_coverage_score: number;
  category_coverage_score: number;
  knowledge_graph_score: number;
  authority_score: number;
  sentiment_score: number;
}

export interface ModelDetail {
  total_runs: number;
  sentiments: string[];
  averages: MetricScores;
}

export interface DiagnosticFactor {
  dimension: string;
  finding: string;
  root_cause: string;
}

export interface RecommendationItem {
  dimension: string;
  what_to_do: string;
  why_it_helps: string;
  suggested_content: string;
}

export interface DimensionBreakdown {
  name: string;
  raw_value: number;
  weight: number;
  weighted_score: number;
}

export interface LatestInsights {
  run_at: string;
  diagnosis: {
    summary: string;
    factors: DiagnosticFactor[];
  };
  recommendations: RecommendationItem[];
  dimensions: DimensionBreakdown[];
  categories: string[];
  competitors: string[];
}

export interface RunHistoryItem {
  analytic_id: number;
  model_choice: string;
  created_at: string;
  prompts_tested_count: number;
  overall_score: number;
  sentiment: string;
  scores: MetricScores;
  raw_values: Record<string, number>;
}

export interface BrandAnalyticsDetailData {
  brand: BrandInfo;
  total_analytic_runs: number;
  overall_averages: MetricScores;
  model_breakdown: Record<string, ModelDetail>;
  latest_insights: LatestInsights;
  run_history: RunHistoryItem[];
}

export interface BrandAnalyticsDetailResponse {
  status: string;
  data: BrandAnalyticsDetailData;
}
