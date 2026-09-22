import React, { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

import { API_V1, api } from "../../api/base";

/* =========================================================
   TYPES
========================================================= */

interface Recommendation {
  recommendation?: string;
  action?: string;
  why?: string;
  impact?: number;
  score?: number;
  priority?: string;
  [key: string]: any;
}

interface CriterionData {
  score?: number;
  avg_impact?: number;
  recommendations?: Recommendation[];
  [key: string]: any;
}

interface RecommendationModel {
  title?: CriterionData;
  assets?: CriterionData;
  pricing?: CriterionData;
  features?: CriterionData;
  attributes?: CriterionData;
  description?: CriterionData;
  [key: string]: any;
}

interface RecommendationV2 {
  criteria?: Record<string, CriterionData>;
  models?: RecommendationModel[];
  [key: string]: any;
}

interface ProductData {
  tenant_id?: number;
  brand_id?: number;
  created_by?: number | null;

  id?: number;
  name?: string;
  title?: string;
  description?: string;

  attributes?: any;
  features?: any;
  images?: any;
  assets?: any;
  pricing?: any;

  recommandation_v2?: RecommendationV2;

  [key: string]: any;
}

interface ReportResponse {
  tenant_id?: number;
  product?: ProductData;

  [key: string]: any;
}

interface ProductReportProps {
  reportId: number | string;
}

/* =========================================================
   API
========================================================= */

const getProductReport = async (
  reportId: number | string,
): Promise<ReportResponse> => {
  const response = await api.get<ReportResponse>(
    `${API_V1}temp-user/report/${reportId}/`,
  );

  return response.data;
};

/* =========================================================
   HELPERS
========================================================= */

/**
 * Mirrors the Python clean_pdf_text behavior where relevant.
 *
 * This is useful for PDF export because jsPDF/html2canvas can
 * otherwise encounter problematic unicode characters.
 */
const cleanPdfText = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/✓/g, "[OK]")
    .replace(/→/g, "->");
};

/* =========================================================
   STATUS
   EXACT PYTHON LOGIC
========================================================= */

const getStatus = (score: number): string => {
  if (score >= 70) {
    return "Strong";
  }

  return "Needs Improvement";
};

/* =========================================================
   PRIORITY
   EXACT PYTHON LOGIC
========================================================= */

const getPriority = (score: number): string => {
  if (score < 45) {
    return "HIGH";
  }

  if (score < 70) {
    return "MEDIUM";
  }

  return "LOW";
};

/* =========================================================
   SCORE HELPERS
========================================================= */

const numericScore = (value: any): number => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 0;
  }

  return number;
};

/* =========================================================
   GET SCORES
   EXACT PYTHON CALCULATION LOGIC
========================================================= */

const getScores = (product: ProductData) => {
  const recommandationV2 = product.recommandation_v2 || {};

  const criteria = recommandationV2.criteria || {};

  const models = recommandationV2.models || [];

  /* -------------------------------------------------------
     Criterion scores
  ------------------------------------------------------- */

  const title = numericScore(criteria.title?.score ?? 0);

  const assets = numericScore(criteria.assets?.score ?? 0);

  const pricing = numericScore(criteria.pricing?.score ?? 0);

  const features = numericScore(criteria.features?.score ?? 0);

  const attributes = numericScore(criteria.attributes?.score ?? 0);

  const description = numericScore(criteria.description?.score ?? 0);

  /* -------------------------------------------------------
     Product Readiness

     EXACT PYTHON:

     (title + description + attributes +
      features + assets + pricing) / 6
  ------------------------------------------------------- */

  const productReadiness = Math.round(
    (title + description + attributes + features + assets + pricing) / 6,
  );

  /* -------------------------------------------------------
     AI Visibility

     EXACT PYTHON:

     Each model gets an average of the criterion scores.

     Then:
       average(model averages)
  ------------------------------------------------------- */

  const modelScores: number[] = [];

  const modelCriteria = [
    "title",
    "assets",
    "pricing",
    "features",
    "attributes",
    "description",
  ];

  for (const model of models) {
    let modelTotal = 0;
    let modelCount = 0;

    for (const criterion of modelCriteria) {
      const criterionData = model?.[criterion];

      const score = criterionData?.score;

      if (score !== null && score !== undefined) {
        modelTotal += numericScore(score);
        modelCount += 1;
      }
    }

    if (modelCount) {
      modelScores.push(modelTotal / modelCount);
    }
  }

  let aiVisibility = 0;

  if (modelScores.length) {
    aiVisibility = Math.round(
      modelScores.reduce((sum, value) => sum + value, 0) / modelScores.length,
    );
  }

  /* -------------------------------------------------------
     Recommendation Readiness

     EXACT PYTHON:

     avg_impact is 0-10.

     percentage = average(avg_impact) * 10
  ------------------------------------------------------- */

  const impactScores: number[] = [];

  for (const criterion of modelCriteria) {
    const criterionData = criteria?.[criterion];

    const avgImpact = criterionData?.avg_impact;

    if (avgImpact !== null && avgImpact !== undefined) {
      impactScores.push(numericScore(avgImpact));
    }
  }

  let recommendationReadiness = 0;

  if (impactScores.length) {
    recommendationReadiness = Math.round(
      (impactScores.reduce((sum, value) => sum + value, 0) /
        impactScores.length) *
        10,
    );
  }

  /* -------------------------------------------------------
     Overall

     EXACT PYTHON:

     (ai_visibility +
      product_readiness +
      recommendation_readiness) / 3
  ------------------------------------------------------- */

  const overall = Math.round(
    (aiVisibility + productReadiness + recommendationReadiness) / 3,
  );

  return {
    title,
    description,
    attributes,
    features,
    assets,
    pricing,

    ai_visibility: aiVisibility,
    product_readiness: productReadiness,
    recommendation_readiness: recommendationReadiness,

    overall,
  };
};

/* =========================================================
   GET BEST RECOMMENDATION
   EXACT PYTHON LOGIC
========================================================= */

const getBestRecommendation = (
  product: ProductData,
  criterion: string,
): Recommendation | null => {
  const models = product.recommandation_v2?.models || [];

  const recommendations: Recommendation[] = [];

  for (const model of models) {
    const data = model?.[criterion];

    const modelRecommendations = data?.recommendations || [];

    for (const recommendation of modelRecommendations) {
      recommendations.push(recommendation);
    }
  }

  if (!recommendations.length) {
    return null;
  }

  recommendations.sort(
    (a, b) => numericScore(b.impact) - numericScore(a.impact),
  );

  return recommendations[0];
};

/* =========================================================
   RECOMMENDATION TEXT
========================================================= */

const getRecommendationText = (
  recommendation: Recommendation | null,
): string => {
  if (!recommendation) {
    return "No recommendation available.";
  }

  const recommendationName = recommendation.recommendation || "";

  const action = recommendation.action || "";

  const why = recommendation.why || "";

  if (recommendationName && action) {
    return `${recommendationName}: ${action}`;
  }

  if (action) {
    return action;
  }

  if (recommendationName) {
    return recommendationName;
  }

  if (why) {
    return why;
  }

  return "See recommendation details.";
};

/* =========================================================
   SCORE CARD
========================================================= */

interface ScoreCardProps {
  label: string;
  score: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ label, score }) => {
  return (
    <div className="border border-gray-300 bg-white">
      <div className="flex min-h-[42px] items-center justify-center border-b border-gray-300 px-3 text-center text-[11px] font-bold uppercase tracking-wide text-gray-700">
        {label}
      </div>

      <div className="flex h-[60px] items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{score}%</span>
      </div>
    </div>
  );
};

/* =========================================================
   SECTION TITLE
========================================================= */

interface SectionTitleProps {
  number: string;
  title: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ number, title }) => {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="text-sm font-bold text-gray-400">{number}</span>

      <h2 className="text-xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>
    </div>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge: React.FC<{
  score: number;
}> = ({ score }) => {
  const status = getStatus(score);

  let classes = "bg-gray-100 text-gray-700 border-gray-300";

  if (score >= 70) {
    classes = "bg-green-50 text-green-700 border-green-200";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${classes}`}
    >
      {status}
    </span>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ProductReport({ reportId }: ProductReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["product-report", reportId],

    queryFn: () => getProductReport(reportId),

    enabled: Boolean(reportId),

    staleTime: 5 * 60 * 1000,
  });

  /* =======================================================
     PRODUCT
  ======================================================= */

  const product = useMemo<ProductData>(() => {
    return data?.product || {};
  }, [data]);

  console.log("product", product);

  /* =======================================================
     SCORES
  ======================================================= */

  const scores = useMemo(() => {
    return getScores(product);
  }, [product]);

  /* =======================================================
     CRITERIA
  ======================================================= */

  const criteriaRows = useMemo(() => {
    return [
      {
        label: "Title",
        criterion: "title",
        score: scores.title,
        observation: "Title clarity and product identity.",
      },

      {
        label: "Description",
        criterion: "description",
        score: scores.description,
        observation: "Product description depth and relevance.",
      },

      {
        label: "Attributes",
        criterion: "attributes",
        score: scores.attributes,
        observation: "Completeness of product attributes.",
      },

      {
        label: "Features",
        criterion: "features",
        score: scores.features,
        observation: "Coverage of important product features.",
      },

      {
        label: "Images",
        criterion: "assets",
        score: scores.assets,
        observation: "Asset/image readiness.",
      },

      {
        label: "Pricing",
        criterion: "pricing",
        score: scores.pricing,
        observation: "Pricing information readiness.",
      },
    ];
  }, [scores]);

  /* =======================================================
     AI SEARCH ROWS
  ======================================================= */

  const aiRows = useMemo(() => {
    return [
      {
        signal: "Product discovery",
        score: scores.title,
      },

      {
        signal: "Product understanding",
        score: scores.product_readiness,
      },

      {
        signal: "Brand association",
        score: scores.attributes,
      },

      {
        signal: "Content relevance",
        score: scores.description,
      },
    ];
  }, [scores]);

  /* =======================================================
     ACTION PLAN & PRIORITY
     Combined to avoid repeating the same recommendations.
  ======================================================= */

  const actionPlan = useMemo(() => {
    return criteriaRows.map((row) => {
      const recommendation = getBestRecommendation(product, row.criterion);

      const action =
        recommendation?.action ||
        recommendation?.recommendation ||
        getRecommendationText(recommendation);

      return {
        ...row,
        priority: getPriority(row.score),
        impact: recommendation?.impact,
        action,
      };
    });
  }, [criteriaRows, product]);

  /* =======================================================
     PDF EXPORT
  ======================================================= */

  const handleExportPDF = async () => {
    if (!reportRef.current) {
      return;
    }

    try {
      const element = reportRef.current;

      /*
       * Temporarily remove shadow during
       * screenshot generation.
       */
      const originalShadow = element.style.boxShadow;

      element.style.boxShadow = "none";

      const canvas = await html2canvas(element, {
        scale: 2,

        useCORS: true,

        allowTaint: false,

        backgroundColor: "#ffffff",

        imageTimeout: 15000,

        logging: false,
      });

      element.style.boxShadow = originalShadow;

      const imageData = canvas.toDataURL("image/png", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",

        unit: "mm",

        format: "a4",

        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      const imageWidth = pdfWidth;

      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      let heightLeft = imageHeight;

      let position = 0;

      /*
       * First page
       */
      pdf.addImage(
        imageData,
        "PNG",
        0,
        position,
        imageWidth,
        imageHeight,
        undefined,
        "FAST",
      );

      heightLeft -= pdfHeight;

      /*
       * Remaining pages
       */
      while (heightLeft > 0) {
        position = heightLeft - imageHeight;

        pdf.addPage();

        pdf.addImage(
          imageData,
          "PNG",
          0,
          position,
          imageWidth,
          imageHeight,
          undefined,
          "FAST",
        );

        heightLeft -= pdfHeight;
      }

      const safeName = cleanPdfText(
        product.name || product.title || "product-report",
      )
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

      pdf.save(`${safeName || "product-report"}-ai-visibility-report.pdf`);
    } catch (exportError) {
      console.error("Failed to export PDF:", exportError);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

          <p className="text-sm text-gray-600">Loading product report...</p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (isError) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-gray-900">
            Unable to load report
          </h2>

          <p className="mb-5 text-sm text-gray-500">
            {(error as any)?.message ||
              "Something went wrong while loading the product report."}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-100">
      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Product Report
            </p>

            <h1 className="text-base font-bold text-gray-900">
              AI Visibility Snapshot
            </h1>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.98]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* =================================================
          REPORT
      ================================================= */}

      <main className="px-4 py-8">
        <div
          ref={reportRef}
          className="mx-auto w-full max-w-[1000px] bg-white px-8 py-10 shadow-sm md:px-12"
        >
          {/* =================================================
              PAGE 1
          ================================================= */}

          <section>
            {/* LOGO */}

            <div className="mb-6 flex justify-center">
              <img
                src="https://res.cloudinary.com/dh75n51on/image/upload/v1789735442/logo_xtodvn.png"
                alt="ContentLynxe"
                crossOrigin="anonymous"
                className="h-16 w-auto object-contain"
              />
            </div>

            {/* HEADER */}

            <div className="text-center">
              <h2 className="mt-7 text-2xl font-bold text-gray-900">
                AI Visibility Snapshot
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
                How the product appears across AI-powered search and
                recommendations
              </p>
            </div>

            {/* =================================================
                01 EXECUTIVE SUMMARY
            ================================================= */}

            <div className="mt-12">
              <SectionTitle number="01" title="Executive Summary" />

              <p className="max-w-3xl text-sm leading-6 text-gray-600">
                We analyzed{" "}
                <span className="font-semibold text-gray-900">
                  {product.name || product.title || "Your Product"}
                </span>{" "}
                to understand how well its product information is positioned for
                AI-powered search and recommendations.
              </p>
            </div>

            {/* SUMMARY SCORES */}

            <div className="mt-7 grid grid-cols-2 gap-0 md:grid-cols-4">
              <ScoreCard label="AI Visibility" score={scores.ai_visibility} />

              <ScoreCard
                label="Product Readiness"
                score={scores.product_readiness}
              />

              <ScoreCard
                label="Recommendation Readiness"
                score={scores.recommendation_readiness}
              />

              <ScoreCard label="Overall AI Readiness" score={scores.overall} />
            </div>

            {/* =================================================
                02 PRODUCT UNDERSTANDING
            ================================================= */}

            <div className="mt-12">
              <SectionTitle number="02" title="Product Understanding Scores" />

              <p className="mb-5 text-sm leading-6 text-gray-600">
                Scores below are calculated directly from the aggregate
                criterion scores returned by the ContentLynxe recommendation
                engine.
              </p>

              <div className="overflow-hidden border border-gray-300">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-b border-gray-300 px-3 py-3 text-xs font-bold text-gray-700">
                        Criteria
                      </th>

                      <th className="w-[80px] border-b border-gray-300 px-3 py-3 text-center text-xs font-bold text-gray-700">
                        Score
                      </th>

                      <th className="w-[150px] border-b border-gray-300 px-3 py-3 text-center text-xs font-bold text-gray-700">
                        Status
                      </th>

                      <th className="border-b border-gray-300 px-3 py-3 text-xs font-bold text-gray-700">
                        Key observation
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {criteriaRows.map((row) => (
                      <tr key={row.criterion}>
                        <td className="border-b border-gray-200 px-3 py-3 text-xs font-semibold text-gray-900">
                          {row.label}
                        </td>

                        <td className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-900">
                          {row.score}%
                        </td>

                        <td className="border-b border-gray-200 px-3 py-3 text-center">
                          <StatusBadge score={row.score} />
                        </td>

                        <td className="border-b border-gray-200 px-3 py-3 text-xs leading-5 text-gray-600">
                          {row.observation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                03 AI SEARCH VISIBILITY
            ================================================= */}

            <div className="mt-12">
              <SectionTitle number="03" title="AI Search Visibility" />

              <p className="mb-5 text-sm leading-6 text-gray-600">
                Overall AI Visibility Score:{" "}
                <span className="font-bold text-gray-900">
                  {scores.ai_visibility}%
                </span>
              </p>

              <div className="overflow-hidden border border-gray-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-b border-gray-300 px-3 py-3 text-left text-xs font-bold text-gray-700">
                        Signal
                      </th>

                      <th className="w-[100px] border-b border-gray-300 px-3 py-3 text-center text-xs font-bold text-gray-700">
                        Score
                      </th>

                      <th className="w-[150px] border-b border-gray-300 px-3 py-3 text-left text-xs font-bold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {aiRows.map((row) => (
                      <tr key={row.signal}>
                        <td className="border-b border-gray-200 px-3 py-3 text-xs font-medium text-gray-900">
                          {row.signal}
                        </td>

                        <td className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-900">
                          {row.score}%
                        </td>

                        <td className="border-b border-gray-200 px-3 py-3">
                          <StatusBadge score={row.score} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* PAGE BREAK */}

          <div className="my-12 border-t border-gray-200" />

          {/* =================================================
              PAGE 2
          ================================================= */}

          <section className="pt-2">
            {/* =================================================
                04 ACTION PLAN & PRIORITY
            ================================================= */}

            <div className="mt-12">
              <SectionTitle number="04" title="Action Plan & Priority" />

              <p className="mb-5 text-sm leading-6 text-gray-600">
                Recommended actions are consolidated below with their
                corresponding priority so the same recommendation is not
                repeated across separate sections.
              </p>

              <div className="overflow-hidden rounded-lg border border-gray-300">
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="w-[16%] border-b border-gray-300 px-3 py-3 text-left text-xs font-bold text-gray-700">
                        Criteria
                      </th>

                      <th className="w-[10%] border-b border-gray-300 px-3 py-3 text-center text-xs font-bold text-gray-700">
                        Score
                      </th>

                      <th className="w-[14%] border-b border-gray-300 px-3 py-3 text-center text-xs font-bold text-gray-700">
                        Priority
                      </th>

                      <th className="w-[60%] border-b border-gray-300 px-3 py-3 text-left text-xs font-bold text-gray-700">
                        Action / Finding
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {actionPlan.map((row) => {
                      const rowHighlight =
                        row.priority === "HIGH"
                          ? "bg-red-50"
                          : row.priority === "MEDIUM"
                            ? "bg-yellow-50"
                            : "bg-green-50";

                      const priorityClasses =
                        row.priority === "HIGH"
                          ? "border-red-200 bg-red-100 text-red-700"
                          : row.priority === "MEDIUM"
                            ? "border-yellow-200 bg-yellow-100 text-yellow-700"
                            : "border-green-200 bg-green-100 text-green-700";

                      return (
                        <tr
                          key={row.criterion}
                          className={`${rowHighlight} transition-colors`}
                        >
                          <td className="border-b border-gray-200 px-3 py-3 align-top text-xs font-semibold text-gray-900">
                            {row.label}
                          </td>

                          <td className="border-b border-gray-200 px-3 py-3 text-center align-top text-xs font-semibold text-gray-900">
                            {row.score}%
                          </td>

                          <td className="border-b border-gray-200 px-3 py-3 text-center align-top">
                            <span
                              className={`inline-flex min-w-[70px] justify-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${priorityClasses}`}
                            >
                              {row.priority}
                            </span>
                          </td>

                          <td className="border-b border-gray-200 px-3 py-3 align-top text-xs leading-5 text-gray-700">
                            {row.action}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                FOOTER / CTA
            ================================================= */}

            <div className="mt-16 border-t border-gray-200 pt-8 text-center">
              <h3 className="text-sm font-bold text-gray-900">
                Want to see the full picture?
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-gray-600">
                Ask us for the complete ContentLynxe AI Visibility Report with
                detailed findings, gaps, and prioritized recommendations.
              </p>

              <p className="mt-4 text-xs font-medium text-gray-700">
                growth@contentlynxe.com | contentlynxe.com
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
