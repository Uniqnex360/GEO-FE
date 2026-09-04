import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wand2,
  X,
  Loader2,
  Check,
  Pencil,
  Save,
  Lightbulb,
} from "lucide-react";
import { productService } from "../../api/product";

const QUICK_TAGS = [
  "Make it short",
  "Make it long",
  "Make it brief",
  "Make it punchy",
  "Add keywords",
  "More technical",
];

const MAX_REWRITE_LIMIT = 3;

const COLORS = {
  page: "#f4f5f0",
  card: "#ffffff",
  border: "#e4e6df",
  chipBg: "#eef1e6",
  chipText: "#4b5442",
  finalBorder: "#cfe0d2",
  applyBg: "#1b4d3e",
  applyBgHover: "#143a2f",
  generateBg: "#b8720f",
  generateBgHover: "#9c6009",
  muted: "#8a8f80",
  tabActive: "#1b4d3e",
};

export interface ProductInfo {
  id: number;
  icon?: string;
  title?: string;
  name?: string;
  long_description?: string;
  short_description?: string;
  current_ai_features?: string[];

  product_name_ai?: Record<string, string>;
  features_ai?: Record<string, string[]>;
  description_ai?: Record<string, string>;

  ai_title_rewrite_count?: number;
  ai_features_rewrite_count?: number;
  ai_description_rewrite_count?: number;

  brand?: string;
  category?: string;
}

interface SelectedFeatureBullet {
  text: string;
  versionTag: string; // e.g. "V1"
}

type FieldKey = "title" | "features" | "description";

const FIELD_META: Record<
  FieldKey,
  { label: string; singular: string; tabLabel: string }
> = {
  title: {
    label: "Product Title",
    singular: "title",
    tabLabel: "Product title",
  },
  features: {
    label: "Features",
    singular: "feature set",
    tabLabel: "Features",
  },
  description: {
    label: "Description",
    singular: "description",
    tabLabel: "Description",
  },
};

const FIELD_KEYS: FieldKey[] = ["title", "features", "description"];

export default function ProductGenerateContent({
  productInfo,
}: {
  productInfo: ProductInfo;
}) {
  const queryClient = useQueryClient();

  const currentTitle = productInfo.title || productInfo.name || "";
  const currentDescription =
    productInfo.long_description || productInfo.short_description || "";
  const currentFeatures = productInfo.current_ai_features || [];

  const titleCount = productInfo.ai_title_rewrite_count ?? 0;
  const featuresCount = productInfo.ai_features_rewrite_count ?? 0;
  const descriptionCount = productInfo.ai_description_rewrite_count ?? 0;

  const [tabIndex, setTabIndex] = useState(0);
  const field = FIELD_KEYS[tabIndex];

  // Title & Description State
  const [selectedTitleKey, setSelectedTitleKey] = useState<string>("v1");
  const [selectedDescKey, setSelectedDescKey] = useState<string>("v1");
  const [finalTitle, setFinalTitle] = useState<string>("");
  const [finalDescription, setFinalDescription] = useState<string>("");

  const [titleVersions, setTitleVersions] = useState<Record<string, string>>(
    {},
  );
  const [descVersions, setDescVersions] = useState<Record<string, string>>({});

  // Features Mix & Match State
  const [featureVersions, setFeatureVersions] = useState<
    Record<string, string[]>
  >({});
  const [selectedBullets, setSelectedBullets] = useState<
    SelectedFeatureBullet[]
  >([]);

  // Inline edit state (per field, keyed by version key e.g. "v1")
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Generate panel state (per-field custom prompt + quick tag)
  const [customPrompt, setCustomPrompt] = useState<Record<FieldKey, string>>({
    title: "",
    features: "",
    description: "",
  });

  const rewriteCounts: Record<FieldKey, number> = {
    title: titleCount,
    features: featuresCount,
    description: descriptionCount,
  };

  const versionCount: Record<FieldKey, number> = {
    title: Object.keys(titleVersions).length,
    features: Object.keys(featureVersions).length,
    description: Object.keys(descVersions).length,
  };

  const generationsLeft = Math.max(0, MAX_REWRITE_LIMIT - versionCount[field]);
  const isLimitReached = versionCount[field] >= MAX_REWRITE_LIMIT;
  const isPromptEmpty =
    !customPrompt[field] || customPrompt[field].trim() === "";

  // Load backend versions into state
  useEffect(() => {
    const titles = productInfo.product_name_ai || {};
    const features = productInfo.features_ai || {};
    const descs = productInfo.description_ai || {};

    setTitleVersions(titles);
    setFeatureVersions(features);
    setDescVersions(descs);

    if (titles[selectedTitleKey]) setFinalTitle(titles[selectedTitleKey]);
    if (descs[selectedDescKey]) setFinalDescription(descs[selectedDescKey]);

    // Pre-select features from v1 on load if present
    if (features.v1 && features.v1.length > 0) {
      setSelectedBullets(
        features.v1.map((bullet) => ({ text: bullet, versionTag: "V1" })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productInfo]);

  useEffect(() => {
    setEditingKey(null);
  }, [field]);

  // Checkbox toggle logic for individual bullets in Key Features
  const handleToggleBullet = (bullet: string, versionKey: string) => {
    const versionTag = versionKey.toUpperCase();
    const exists = selectedBullets.some(
      (b) => b.text === bullet && b.versionTag === versionTag,
    );

    if (exists) {
      setSelectedBullets((prev) =>
        prev.filter((b) => !(b.text === bullet && b.versionTag === versionTag)),
      );
    } else {
      setSelectedBullets((prev) => [...prev, { text: bullet, versionTag }]);
    }
  };

  // API Mutations
  const generateMutation = useMutation({
    mutationFn: (payload: any) => productService.regenerateAiContent(payload),
    onSuccess: (data) => {
      //@ts-ignore
      if (data.title) {
        setTitleVersions((prev) => ({
          ...prev,
          //@ts-ignore
          [data.title.version]: data.title.value,
        }));
        //@ts-ignore
        setSelectedTitleKey(data.title.version);
        //@ts-ignore
        setFinalTitle(data.title.value);
      }
      //@ts-ignore
      if (data.description) {
        setDescVersions((prev) => ({
          ...prev,
          //@ts-ignore
          [data.description.version]: data.description.value,
        }));
        //@ts-ignore
        setSelectedDescKey(data.description.version);
        //@ts-ignore
        setFinalDescription(data.description.value);
      }
      //@ts-ignore
      if (data.features) {
        setFeatureVersions((prev) => ({
          ...prev,
          //@ts-ignore
          [data.features.version]: data.features.value,
        }));
        //@ts-ignore
        const newTag = data.features.version.toUpperCase();
        //@ts-ignore
        const newBullets = (data.features.value as string[]).map((f) => ({
          text: f,
          versionTag: newTag,
        }));
        setSelectedBullets(newBullets);
      }

      setCustomPrompt((prev) => ({ ...prev, [field]: "" }));

      queryClient.invalidateQueries({
        queryKey: ["productDetails", productInfo.id],
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      productService.updateProductAiContent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["productDetails", productInfo.id],
      });
    },
  });

  // Generate for the currently active tab only, using the same payload
  // shape/contract as before (current + all existing versions per field).
  const handleGenerate = () => {
    if (isLimitReached || isPromptEmpty) return;

    const option = customPrompt[field].trim();
    const payload: any = { product_id: productInfo.id, option };

    if (field === "title")
      payload.title = { current: currentTitle, ...titleVersions };
    if (field === "features")
      payload.features = { current: currentFeatures, ...featureVersions };
    if (field === "description")
      payload.description = { current: currentDescription, ...descVersions };

    generateMutation.mutate(payload);
  };

  const setQuickTag = (tag: string) => {
    setCustomPrompt((prev) => ({ ...prev, [field]: tag }));
  };

  const handleApplyField = (targetField: FieldKey) => {
    const payload: any = { product_id: productInfo.id };
    if (targetField === "title") payload.title = finalTitle;
    if (targetField === "features")
      payload.features = selectedBullets.map((b) => b.text);
    if (targetField === "description") payload.description = finalDescription;

    saveMutation.mutate(payload);
  };

  // Inline editing of a specific AI version
  const startEdit = (vKey: string, value: string | string[]) => {
    setEditingKey(vKey);
    setEditValue(Array.isArray(value) ? value.join("\n") : value);
  };

  const saveEdit = (vKey: string) => {
    if (field === "title") {
      const newVal = editValue;
      setTitleVersions((prev) => ({ ...prev, [vKey]: newVal }));
      if (selectedTitleKey === vKey) setFinalTitle(newVal);
    } else if (field === "description") {
      const newVal = editValue;
      setDescVersions((prev) => ({ ...prev, [vKey]: newVal }));
      if (selectedDescKey === vKey) setFinalDescription(newVal);
    } else if (field === "features") {
      const newList = editValue
        .split("\n")
        .map((item) => item.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);
      const vTag = vKey.toUpperCase();
      const oldList = featureVersions[vKey] || [];

      setFeatureVersions((prev) => ({ ...prev, [vKey]: newList }));

      // Keep selection in sync: drop bullets that no longer exist for this
      // version, keep the ones that still do (matched by text).
      setSelectedBullets((prev) =>
        prev
          .filter((b) => b.versionTag !== vTag || newList.includes(b.text))
          .concat(
            newList
              .filter(
                (text) =>
                  oldList.includes(text) &&
                  !prev.some((b) => b.versionTag === vTag && b.text === text),
              )
              .map((text) => ({ text, versionTag: vTag })),
          ),
      );
    }

    setEditingKey(null);
  };

  // Total character counts in features
  const totalFeatureChars = selectedBullets.reduce(
    (acc, curr) => acc + curr.text.length,
    0,
  );

  const currentValue = useMemo(() => {
    if (field === "title") return currentTitle;
    if (field === "description") return currentDescription;
    return currentFeatures;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, currentTitle, currentDescription, currentFeatures]);

  return (
    <div
      className="rounded-xl p-4 sm:p-6"
      style={{ backgroundColor: COLORS.page }}
    >
      <div
        className="font-mono text-[11px] font-semibold tracking-[0.08em]"
        style={{ color: "#6b7280" }}
      >
        CONTENT STUDIO
      </div>

      <div className="mt-0.5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-thin" style={{ color: "#111827" }}>
            {productInfo.icon} Product content
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: "#6b7280" }}>
            {productInfo.brand}{" "}
            {productInfo.brand && productInfo.category ? "|" : ""}{" "}
            {productInfo.category}
          </p>
        </div>
      </div>

      <p className="mb-2.5 mt-2 text-sm" style={{ color: "#6b7280" }}>
        Compare your existing content with AI-generated versions, then choose or
        assemble your final version.
      </p>

      {/* Tabs */}
      <div
        className="mb-4 flex min-h-9 border-b"
        style={{ borderColor: COLORS.border }}
        role="tablist"
      >
        {FIELD_KEYS.map((key, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tabIndex === index}
            onClick={() => setTabIndex(index)}
            className="relative min-h-9 px-4 text-sm font-normal transition-colors"
            style={{
              color: tabIndex === index ? COLORS.tabActive : COLORS.muted,
            }}
          >
            {FIELD_META[key].tabLabel}
            {tabIndex === index && (
              <span
                className="absolute bottom-[-1px] left-0 right-0 h-0.5"
                style={{ backgroundColor: COLORS.tabActive }}
              />
            )}
          </button>
        ))}

        <span
          className="ml-auto self-center font-mono text-xs"
          style={{ color: "#6b7280" }}
        >
          Rewrites: {rewriteCounts[field]}/{MAX_REWRITE_LIMIT}
        </span>
      </div>

      <div className="flex flex-col items-start gap-4 md:flex-row">
        {/* LEFT COLUMN */}
        <div className="w-full flex-1">
          {/* Current */}
          <div
            className="mb-4 rounded-lg border p-4"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div
                className="font-mono text-[11px] font-semibold tracking-[0.08em]"
                style={{ color: "#6b7280" }}
              >
                CURRENT {FIELD_META[field].label.toUpperCase()}
              </div>

              <span
                className="rounded-[5px] px-2 py-0.5 font-mono text-[11px] font-semibold"
                style={{
                  backgroundColor: COLORS.chipBg,
                  color: COLORS.chipText,
                }}
              >
                Existing
              </span>
            </div>

            {field === "features" ? (
              <ul className="m-0 pl-5">
                {(currentFeatures || []).length > 0 ? (
                  currentFeatures.map((feature, index) => (
                    <li
                      key={index}
                      className="mb-1.5 text-sm leading-[1.5]"
                      style={{ color: "#374151" }}
                    >
                      {feature}
                    </li>
                  ))
                ) : (
                  <li
                    className="list-none text-sm italic"
                    style={{ color: "#9ca3af" }}
                  >
                    No current features available.
                  </li>
                )}
              </ul>
            ) : (
              <div
                className="whitespace-pre-line text-sm leading-[1.5]"
                style={{ color: "#374151" }}
              >
                {(currentValue as string) || (
                  <span className="italic" style={{ color: "#9ca3af" }}>
                    Not set.
                  </span>
                )}
              </div>
            )}

            <div
              className="mt-1.5 text-right font-mono text-[11px]"
              style={{ color: "#6b7280" }}
            >
              {field === "features"
                ? `${(currentFeatures || []).length} bullets`
                : `${((currentValue as string) || "").length} characters`}
            </div>
          </div>

          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-[15px] font-bold">AI Generated Versions</h3>
            <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
              {versionCount[field]}/{MAX_REWRITE_LIMIT} generated
            </span>
          </div>

          {field === "title" &&
            Object.entries(titleVersions).map(([vKey, value]) => {
              const isEditing = editingKey === vKey;
              return (
                <div
                  key={vKey}
                  className="mb-3 rounded-lg border p-4"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="text-sm font-bold"
                      style={{ color: COLORS.applyBg }}
                    >
                      {vKey.replace("v", "Version ")}
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        aria-label={`Edit ${vKey}`}
                        onClick={() => startEdit(vKey, value)}
                        className="rounded-md p-1.5 transition hover:bg-gray-100"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={3}
                        className="min-w-0 flex-1 resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                      />
                      <button
                        type="button"
                        aria-label="Save"
                        onClick={() => saveEdit(vKey)}
                        className="rounded-md p-1.5 hover:bg-gray-100"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel"
                        onClick={() => setEditingKey(null)}
                        className="rounded-md p-1.5 hover:bg-gray-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name="version-title"
                        checked={selectedTitleKey === vKey}
                        onChange={() => {
                          setSelectedTitleKey(vKey);
                          setFinalTitle(value);
                        }}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#1b4d3e]"
                      />
                      <span className="whitespace-pre-line text-[15px]">
                        {value}
                      </span>
                    </label>
                  )}

                  <div
                    className="mt-2 text-right font-mono text-[11px]"
                    style={{ color: "#6b7280" }}
                  >
                    {(value || "").length} characters
                  </div>
                </div>
              );
            })}

          {field === "description" &&
            Object.entries(descVersions).map(([vKey, value]) => {
              const isEditing = editingKey === vKey;
              return (
                <div
                  key={vKey}
                  className="mb-3 rounded-lg border p-4"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="text-sm font-bold"
                      style={{ color: COLORS.applyBg }}
                    >
                      {vKey.replace("v", "Version ")}
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        aria-label={`Edit ${vKey}`}
                        onClick={() => startEdit(vKey, value)}
                        className="rounded-md p-1.5 transition hover:bg-gray-100"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={4}
                        className="min-w-0 flex-1 resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                      />
                      <button
                        type="button"
                        aria-label="Save"
                        onClick={() => saveEdit(vKey)}
                        className="rounded-md p-1.5 hover:bg-gray-100"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel"
                        onClick={() => setEditingKey(null)}
                        className="rounded-md p-1.5 hover:bg-gray-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name="version-description"
                        checked={selectedDescKey === vKey}
                        onChange={() => {
                          setSelectedDescKey(vKey);
                          setFinalDescription(value);
                        }}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#1b4d3e]"
                      />
                      <span className="whitespace-pre-line text-[15px]">
                        {value}
                      </span>
                    </label>
                  )}

                  <div
                    className="mt-2 text-right font-mono text-[11px]"
                    style={{ color: "#6b7280" }}
                  >
                    {(value || "").length} characters
                  </div>
                </div>
              );
            })}

          {field === "features" &&
            Object.entries(featureVersions).map(([vKey, list]) => {
              const vTag = vKey.toUpperCase();
              const isEditing = editingKey === vKey;
              const totalChars = list.reduce(
                (acc, curr) => acc + curr.length,
                0,
              );

              return (
                <div
                  key={vKey}
                  className="mb-3 rounded-lg border p-4"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: COLORS.border,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="text-sm font-bold"
                      style={{ color: COLORS.applyBg }}
                    >
                      {vKey.replace("v", "Version ")}
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        aria-label={`Edit ${vKey}`}
                        onClick={() => startEdit(vKey, list)}
                        className="rounded-md p-1.5 transition hover:bg-gray-100"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={4}
                        className="min-w-0 flex-1 resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                      />
                      <button
                        type="button"
                        aria-label="Save"
                        onClick={() => saveEdit(vKey)}
                        className="rounded-md p-1.5 hover:bg-gray-100"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel"
                        onClick={() => setEditingKey(null)}
                        className="rounded-md p-1.5 hover:bg-gray-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      {list.map((item, idx) => {
                        const isChecked = selectedBullets.some(
                          (b) => b.text === item && b.versionTag === vTag,
                        );
                        return (
                          <label
                            key={idx}
                            className="mb-1.5 flex cursor-pointer items-center gap-1.5"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBullet(item, vKey)}
                              className="h-4 w-4 shrink-0 accent-[#1b4d3e]"
                            />
                            <span className="text-[15px]">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className="mt-2 text-right font-mono text-[11px]"
                    style={{ color: "#6b7280" }}
                  >
                    {list.length} bullets • {totalChars} characters
                  </div>
                </div>
              );
            })}

          {versionCount[field] === 0 && (
            <p className="mb-3 text-sm italic" style={{ color: COLORS.muted }}>
              No AI versions yet — generate one below.
            </p>
          )}

          {/* Generate */}
          <div
            className="rounded-lg border-[1.5px] border-dashed p-4"
            style={{ borderColor: COLORS.border, backgroundColor: "#fafbf6" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-bold">
                🪄&nbsp;{" "}
                {isLimitReached
                  ? "Rewrite limit reached"
                  : `Generate version ${versionCount[field] + 1}`}
              </h3>

              <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
                {generationsLeft} generation{generationsLeft === 1 ? "" : "s"}{" "}
                left
              </span>
            </div>

            <input
              type="text"
              placeholder="Enter a custom prompt (e.g. emphasize energy efficiency)…"
              value={customPrompt[field]}
              onChange={(e) =>
                setCustomPrompt((prev) => ({
                  ...prev,
                  [field]: e.target.value,
                }))
              }
              className="mb-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200"
            />

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Lightbulb size={17} style={{ color: "#c9a227" }} />
              <span
                className="mr-0.5 text-[13px]"
                style={{ color: COLORS.muted }}
              >
                Quick tags:
              </span>

              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuickTag(tag)}
                  className="rounded-[5px] border bg-white px-3 py-1 text-xs text-gray-600 shadow-none transition hover:bg-gray-50 hover:border-gray-400"
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                generateMutation.isPending || isLimitReached || isPromptEmpty
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  generateMutation.isPending || isLimitReached || isPromptEmpty
                    ? "#e0decf"
                    : COLORS.generateBg,
                color:
                  generateMutation.isPending || isLimitReached || isPromptEmpty
                    ? "#a3a396"
                    : "white",
              }}
              onMouseEnter={(e) => {
                if (
                  !generateMutation.isPending &&
                  !isLimitReached &&
                  !isPromptEmpty
                ) {
                  e.currentTarget.style.backgroundColor =
                    COLORS.generateBgHover;
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !generateMutation.isPending &&
                  !isLimitReached &&
                  !isPromptEmpty
                ) {
                  e.currentTarget.style.backgroundColor = COLORS.generateBg;
                }
              }}
            >
              {generateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Wand2 size={16} />
              )}
              {generateMutation.isPending
                ? "Generating…"
                : isLimitReached
                  ? `Rewrite limit reached (${MAX_REWRITE_LIMIT}/${MAX_REWRITE_LIMIT})`
                  : `Generate version ${versionCount[field] + 1}`}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full flex-1 md:sticky md:top-4">
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.finalBorder,
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div
                className="font-mono text-[11px] font-semibold tracking-[0.08em]"
                style={{ color: "#6b7280" }}
              >
                FINAL {FIELD_META[field].label.toUpperCase()}
              </div>

              <span
                className="flex h-[22px] items-center gap-1 rounded-[5px] px-2 font-mono text-[11px] font-bold tracking-[0.05em]"
                style={{ backgroundColor: "#e2f0e7", color: "#1b4d3e" }}
              >
                <Check size={13} />
                PREVIEW
              </span>
            </div>

            {field === "features" ? (
              <div>
                <div
                  className="mb-3 flex gap-2 text-[13px]"
                  style={{ color: "#8a6d1f" }}
                >
                  <Lightbulb size={17} className="shrink-0" />
                  <span>
                    Checkboxes in each version let you mix bullets from
                    different versions.
                  </span>
                </div>

                {selectedBullets.length > 0 ? (
                  selectedBullets.map((bullet, index) => (
                    <div
                      key={index}
                      className="mb-1.5 flex items-start justify-between"
                    >
                      <span className="text-[15px]">• {bullet.text}</span>
                      <span
                        className="ml-1 whitespace-nowrap text-[11px]"
                        style={{ color: COLORS.muted }}
                      >
                        {bullet.versionTag}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm italic" style={{ color: COLORS.muted }}>
                    Check bullets from a version to build your final feature
                    list.
                  </p>
                )}

                <div
                  className="mt-4 text-[11px]"
                  style={{ color: COLORS.muted }}
                >
                  {selectedBullets.length} bullets • {totalFeatureChars}{" "}
                  characters
                </div>
              </div>
            ) : field === "title" ? (
              <>
                <textarea
                  rows={4}
                  value={finalTitle}
                  onChange={(e) => setFinalTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-[15px] text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200"
                />
                <div
                  className="mt-1.5 text-right font-mono text-[11px]"
                  style={{ color: COLORS.muted }}
                >
                  {finalTitle.length} characters
                </div>
              </>
            ) : (
              <>
                <textarea
                  rows={6}
                  value={finalDescription}
                  onChange={(e) => setFinalDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-[15px] text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200"
                />
                <div
                  className="mt-1.5 text-right font-mono text-[11px]"
                  style={{ color: COLORS.muted }}
                >
                  {finalDescription.length} characters
                </div>
              </>
            )}

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleApplyField(field)}
                disabled={
                  saveMutation.isPending ||
                  (field === "title" && !finalTitle) ||
                  (field === "description" && !finalDescription) ||
                  (field === "features" && selectedBullets.length === 0)
                }
                className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: COLORS.applyBg }}
                onMouseEnter={(e) => {
                  if (!saveMutation.isPending) {
                    e.currentTarget.style.backgroundColor = COLORS.applyBgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.applyBg;
                }}
              >
                {saveMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
