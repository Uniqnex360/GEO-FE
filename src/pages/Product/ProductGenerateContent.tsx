import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  X,
  Loader2,
  Check,
  Edit2,
  Tag,
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

  // Edit states for inline updates
  //@ts-ignore
  const [editingVersion, setEditingVersion] = useState<{
    field: string;
    key: string;
  } | null>(null);

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
  }, [productInfo]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selections, setSelections] = useState({
    title: false,
    description: false,
    features: false,
  });
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");

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

      setIsModalOpen(false);
      setSelections({ title: false, description: false, features: false });
      setSelectedTag("");
      setCustomPrompt("");

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

  const handleGenerate = () => {
    const option = [selectedTag, customPrompt].filter(Boolean).join(" - ");
    const payload: any = { product_id: productInfo.id, option };

    if (selections.title)
      payload.title = { current: currentTitle, ...titleVersions };
    if (selections.features)
      payload.features = { current: currentFeatures, ...featureVersions };
    if (selections.description)
      payload.description = { current: currentDescription, ...descVersions };

    generateMutation.mutate(payload);
  };

  const handleApplyField = (field: "title" | "features" | "description") => {
    const payload: any = { product_id: productInfo.id };
    if (field === "title") payload.title = finalTitle;
    if (field === "features")
      payload.features = selectedBullets.map((b) => b.text);
    if (field === "description") payload.description = finalDescription;

    saveMutation.mutate(payload);
  };

  // Helper calculation for total character counts in features
  const totalFeatureChars = selectedBullets.reduce(
    (acc, curr) => acc + curr.text.length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 bg-[#f8f9fa] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {productInfo.icon} Content Studio
          </h2>
          <p className="text-sm text-gray-500">
            {productInfo.brand} | {productInfo.category}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate AI Content
        </button>
      </div>

      {/* --- Section 1: Product Title --- */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Product Title</h3>
          <span className="text-xs text-gray-400">
            Rewrites: {titleCount}/{MAX_REWRITE_LIMIT}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4 relative">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                CURRENT PRODUCT TITLE
              </span>
              <span className="absolute top-3 right-3 rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                Existing
              </span>
              <p className="mt-2 text-sm text-gray-800">
                {currentTitle || "No current title"}
              </p>
              <div className="mt-3 text-right text-[11px] text-gray-400">
                {currentTitle.length} characters
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-900 uppercase">
                AI Generated Versions
              </span>
              {Object.entries(titleVersions).map(([vKey, value]) => (
                <div
                  key={vKey}
                  onClick={() => {
                    setSelectedTitleKey(vKey);
                    setFinalTitle(value);
                  }}
                  className={`cursor-pointer rounded-lg border p-4 transition-all ${
                    selectedTitleKey === vKey
                      ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={selectedTitleKey === vKey}
                        onChange={() => {}}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-sm capitalize text-gray-800">
                        {vKey.replace("v", "Version ")}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVersion({ field: "title", key: vKey });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-800 pl-7">{value}</p>
                  <span className="mt-2 block text-right text-[11px] text-gray-400">
                    {value.length} characters
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-between rounded-lg border border-emerald-200 bg-emerald-50/10 p-5">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  FINAL PRODUCT TITLE
                </span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  ✓ PREVIEW
                </span>
              </div>
              <textarea
                rows={4}
                value={finalTitle}
                onChange={(e) => setFinalTitle(e.target.value)}
                className="mt-3 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-gray-400">
                {finalTitle.length} characters
              </span>
            </div>

            <button
              onClick={() => handleApplyField("title")}
              disabled={saveMutation.isPending || !finalTitle}
              className="mt-4 flex w-full items-center justify-center rounded-md bg-[#1d4ed8] py-2.5 text-sm font-medium text-white shadow hover:bg-blue-800 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Apply ✓
            </button>
          </div>
        </div>
      </div>

      {/* --- Section 2: Key Features (Checkbox Bullet Selector) --- */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Key Features</h3>
          <span className="text-xs text-gray-400">
            Rewrites: {featuresCount}/{MAX_REWRITE_LIMIT}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Multi-select Bullet List */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4 relative">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                CURRENT FEATURES
              </span>
              <span className="absolute top-3 right-3 rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                Existing
              </span>
              <ul className="mt-2 space-y-1 text-sm text-gray-800">
                {currentFeatures.length > 0 ? (
                  currentFeatures.map((f, i) => <li key={i}>• {f}</li>)
                ) : (
                  <span className="text-gray-400 text-sm">
                    No current features available.
                  </span>
                )}
              </ul>
              <div className="mt-3 text-right text-[11px] text-gray-400">
                {currentFeatures.length} bullets
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900 uppercase">
                  AI Generated Versions
                </span>
                <span className="text-xs text-gray-400">
                  {featuresCount}/{MAX_REWRITE_LIMIT} generated
                </span>
              </div>

              {Object.entries(featureVersions).map(([vKey, list]) => {
                const vTag = vKey.toUpperCase();
                const totalChars = list.reduce(
                  (acc, curr) => acc + curr.length,
                  0,
                );

                return (
                  <div
                    key={vKey}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm text-emerald-900 capitalize">
                        {vKey.replace("v", "Version ")}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {list.map((item, idx) => {
                        const isChecked = selectedBullets.some(
                          (b) => b.text === item && b.versionTag === vTag,
                        );

                        return (
                          <label
                            key={idx}
                            className="flex items-start space-x-3 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBullet(item, vKey)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-800 group-hover:text-black">
                              {item}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-3 border-t pt-2 text-right text-[11px] text-gray-400">
                      {list.length} bullets • {totalChars} characters
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Final Selected Bullets Preview */}
          <div className="flex flex-col justify-between rounded-lg border border-emerald-200 bg-emerald-50/10 p-5">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2 mb-3">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  FINAL FEATURES
                </span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  ✓ PREVIEW
                </span>
              </div>

              {/* Info banner */}
              <div className="flex items-center space-x-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-800 mb-4 border border-amber-200">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Checkboxes in each version let you mix bullets from different
                  versions.
                </span>
              </div>

              {/* Bullets Preview List */}
              <div className="space-y-3">
                {selectedBullets.map((bulletObj, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between text-sm text-gray-800"
                  >
                    <p className="pr-2">• {bulletObj.text}</p>
                    <span className="text-xs font-semibold text-gray-400 shrink-0">
                      {bulletObj.versionTag}
                    </span>
                  </div>
                ))}
                {selectedBullets.length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    No bullets selected. Check items on the left to add them
                    here.
                  </p>
                )}
              </div>

              <div className="mt-4 text-[11px] text-gray-400">
                {selectedBullets.length} bullets • {totalFeatureChars}{" "}
                characters
              </div>
            </div>

            <button
              onClick={() => handleApplyField("features")}
              disabled={saveMutation.isPending || selectedBullets.length === 0}
              className="mt-6 flex w-full items-center justify-center rounded-md bg-[#1e4d3b] py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-900 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Apply ✓
            </button>
          </div>
        </div>
      </div>

      {/* --- Section 3: Product Description --- */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Product Description
          </h3>
          <span className="text-xs text-gray-400">
            Rewrites: {descriptionCount}/{MAX_REWRITE_LIMIT}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4 relative">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                CURRENT DESCRIPTION
              </span>
              <span className="absolute top-3 right-3 rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                Existing
              </span>
              <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                {currentDescription || "No description available."}
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-900 uppercase">
                AI Generated Versions
              </span>
              {Object.entries(descVersions).map(([vKey, value]) => (
                <div
                  key={vKey}
                  onClick={() => {
                    setSelectedDescKey(vKey);
                    setFinalDescription(value);
                  }}
                  className={`cursor-pointer rounded-lg border p-4 transition-all ${
                    selectedDescKey === vKey
                      ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <input
                      type="radio"
                      checked={selectedDescKey === vKey}
                      onChange={() => {}}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-sm capitalize text-gray-800">
                      {vKey.replace("v", "Version ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 pl-7">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-between rounded-lg border border-emerald-200 bg-emerald-50/10 p-5">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  FINAL DESCRIPTION
                </span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  ✓ PREVIEW
                </span>
              </div>
              <textarea
                rows={6}
                value={finalDescription}
                onChange={(e) => setFinalDescription(e.target.value)}
                className="mt-3 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => handleApplyField("description")}
              disabled={saveMutation.isPending || !finalDescription}
              className="mt-4 flex w-full items-center justify-center rounded-md bg-[#1e4d3b] py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-900 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Apply ✓
            </button>
          </div>
        </div>
      </div>

      {/* Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Generate Content with AI
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 space-y-2">
              <label className="block text-xs font-semibold uppercase text-gray-500">
                1. Select Fields to Generate
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["title", "features", "description"].map((field) => (
                  <label
                    key={field}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                      selections[field as keyof typeof selections]
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selections[field as keyof typeof selections]}
                      onChange={() =>
                        setSelections((p) => ({
                          ...p,
                          [field]: !p[field as keyof typeof selections],
                        }))
                      }
                      className="sr-only"
                    />
                    <span className="text-sm font-medium capitalize">
                      {field}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                2. Quick Instructions
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedTag((prev) => (prev === tag ? "" : tag))
                    }
                    className={`flex items-center rounded-full border px-3 py-1 text-xs ${
                      selectedTag === tag
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                3. Custom Prompt
              </label>
              <input
                type="text"
                placeholder="e.g. Highlight durability and features..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={
                  generateMutation.isPending ||
                  (!selections.title &&
                    !selections.features &&
                    !selections.description)
                }
                className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
