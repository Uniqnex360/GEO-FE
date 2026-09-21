import { api, API_V1 } from "./base";

const ENDPOINTS = {
  GENERATE_SINGLE_RECOMMENDATION: `${API_V1}generate-single-recommandation/`,
} as const;

export type RecommendationCriterion =
  | "title"
  | "description"
  | "features"
  | "attributes"
  | "assets"
  | "pricing";

export interface GenerateRecommendationPayload {
  criterion: RecommendationCriterion;
  version: number;

  // Existing generated versions.
  previous_versions: string[];

  // Optional context coming from the existing recommendation.
  current_value?: string;

  // You can add any additional context your backend requires.
  recommendation?: string;
  why?: string;
  action?: string;

  // Optional model information.
  model?: string;
}

export interface GenerateRecommendationResponse {
  version?: number;
  value?: string;

  // Support an API that returns `generated`.
  generated?: string;

  // Support an API that returns `recommendation`.
  recommendation?: string;

  message?: string;
}

class RecommendationService {
  async generateSingleRecommendation(
    payload: GenerateRecommendationPayload,
  ): Promise<GenerateRecommendationResponse> {
    const res = await api.post<GenerateRecommendationResponse>(
      ENDPOINTS.GENERATE_SINGLE_RECOMMENDATION,
      payload,
    );

    return res.data;
  }
}

export const recommendationService = new RecommendationService();
