function TabSpinnerFallback() {
  return (
    <div className="w-full min-h-[350px] bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

interface ActualContentProps {
  data: any;
  isLoading: boolean;
}

export default function ActualContentTabContent({
  data,
  isLoading,
}: ActualContentProps) {
  if (isLoading) return <TabSpinnerFallback />;
  if (!data) return null;

  const content = data.product_content || {};
  const analytics = data.analytics || {};

  const pageTitle = content.page_title || analytics.page_title || "—";
  const metaDescription =
    content.meta_description || analytics.meta_description || "—";
  const wordCount = analytics.word_count ?? content.word_count ?? 0;
  const h1Count = analytics.h1_count ?? (analytics.h1_tags || []).length ?? 0;
  const h2Count = analytics.h2_count ?? (analytics.h2_tags || []).length ?? 0;
  const schemaTypes = content.schema_types || analytics.schema_types || [];

  const faqPresent = content.faq_present ?? analytics.faq_present ?? false;
  const reviewsPresent = content.reviews_present ?? false;
  const pricingVisible = Boolean(content.price);

  const statusCards = [
    {
      label: "FAQ Section",
      present: faqPresent,
      note: faqPresent ? "Found on page" : "Missing from page",
    },
    {
      label: "Customer Reviews",
      present: reviewsPresent,
      note: reviewsPresent ? "Found on page" : "Missing from page",
    },
    {
      label: "Pricing Visible",
      present: pricingVisible,
      note: pricingVisible ? "Found on page" : "Missing from page",
    },
  ];

  const gaps: any[] = data.content_gaps || content.content_gaps || [];

  const gapMessages: Record<string, string> = {
    faq: "Missing FAQ section — LLMs look for Q&A blocks to extract direct answers",
    word_count:
      "Word count is low (under 500 words) — insufficient content for LLM extraction",
    video:
      "No video content on page — Gemini prioritises products with video assets",
  };

  const resolvedGaps = gaps.length
    ? gaps.map((g: any) => g.message || gapMessages[g.type] || g.type)
    : [];

  const url = data.url || content.url || "";

  const StatCard = ({
    value,
    label,
  }: {
    value: React.ReactNode;
    label: string;
  }) => (
    <div className="bg-white border border-slate-200 rounded-xl px-6 py-6 flex flex-col items-center text-center">
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );

  return (
    <div>
      {url && (
        <p className="text-[16px] text-slate-500 mb-6">
          Snapshot of the actual content found at{" "}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 font-medium hover:text-orange-700"
          >
            {url}
          </a>
          .
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-5">
          <div className="text-sm font-bold text-slate-900 mb-2">
            Page Title
          </div>
          <div className="text-[15px] text-slate-600">{pageTitle}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-6 py-5">
          <div className="text-sm font-bold text-slate-900 mb-2">
            Meta Description
          </div>
          <div className="text-[15px] text-slate-600">{metaDescription}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard value={wordCount} label="Word Count" />
        <StatCard value={h1Count} label="H1 Tags" />
        <StatCard value={h2Count} label="H2 Tags" />
        <StatCard value={schemaTypes.length} label="Schema Types" />
      </div>

      {schemaTypes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 mb-4">
          <div className="text-sm font-bold text-slate-900 mb-3">
            Structured Data (Schema)
          </div>
          <div className="flex flex-wrap gap-2">
            {schemaTypes.map((type: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium flex items-center gap-1"
              >
                {"<>"} {type}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {statusCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl px-6 py-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  card.present
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {card.present ? "✓" : "✕"}
              </span>
              <span className="text-[15px] font-bold text-slate-900">
                {card.label}
              </span>
            </div>
            <div className="text-sm text-slate-400 pl-7">{card.note}</div>
          </div>
        ))}
      </div>

      {resolvedGaps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-600 font-bold">!</span>
            <span className="text-[15px] font-bold text-amber-700">
              Content Gaps Detected
            </span>
          </div>
          <div className="space-y-2">
            {resolvedGaps.map((msg: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-[15px] text-slate-600"
              >
                <span className="w-5 h-5 mt-0.5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">
                  ✕
                </span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
