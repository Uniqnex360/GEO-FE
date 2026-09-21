import { useMutation } from "@tanstack/react-query";

import type { GenerateRecommendationPayload } from "../api/generateContent";
import { recommendationService } from "../api/generateContent";

export const generateRecommendationMutationKey = [
  "generate-single-recommendation",
];

export function useGenerateRecommendation() {
  return useMutation({
    mutationKey: generateRecommendationMutationKey,

    mutationFn: (payload: GenerateRecommendationPayload) =>
      recommendationService.generateSingleRecommendation(payload),
  });
}
