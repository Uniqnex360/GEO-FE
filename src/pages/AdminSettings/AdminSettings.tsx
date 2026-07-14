import { useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Key, User, Eye, EyeOff, Copy, Loader2 } from "lucide-react";

import { selectGlobalProjectId } from "../../store/projectSlice";
import { settingsService } from "../../api/appSettings";

type ActiveTab = "profile" | "api_keys";

export default function AdminSettings() {
  const reduxProjectId = useSelector(selectGlobalProjectId);
  const tenantId = reduxProjectId ? Number(reduxProjectId) : undefined;

  // UI Local State
  const [activeTab, setActiveTab] = useState<ActiveTab>("api_keys");
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // ==========================================
  // 1. Data Fetching (React Query Only)
  // ==========================================
  const { data, isLoading } = useQuery({
    queryKey: ["settings", tenantId],
    queryFn: () => settingsService.getDetail(),
    enabled: !!tenantId,
  });

  console.log("data", data)

  const settingsData = data?.data;

  // ==========================================
  // 2. Helper Utility Handlers
  // ==========================================
  const toggleKeyVisibility = (keyName: string) => {
    setRevealedKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleCopyClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info("Copied key value to clipboard");
  };

  // Redux Safety Guard Context
  if (!tenantId) {
    return (
      <div className="p-8 text-slate-500 font-medium text-center">
        Please select an active project tenant workspace context to configure
        settings.
      </div>
    );
  }

  // Define structured configuration schema map
  const targetProviderKeys = [
    { id: "openai_api_key", label: "OpenAI API Key" },
    { id: "anthropic_api_key", label: "Anthropic API Key" },
    { id: "google_api_key", label: "Google Gemini API Key" },
    { id: "groq_api_key", label: "Groq API Key" },
    { id: "deepseek_api_key", label: "DeepSeek API Key" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Block Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your account and organization configurations
          </p>
        </div>

        {/* Outer Split Interface Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Sidebar Drawer Tab Control */}
          <div className="md:col-span-1 bg-white border border-slate-200 rounded-lg p-2 h-fit space-y-1 shadow-sm">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <User size={18} />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("api_keys")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "api_keys"
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Key size={18} />
              API Keys
            </button>
          </div>

          {/* Active Worksite Segment Area */}
          <div className="md:col-span-3 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-sm">Fetching organization keys...</span>
              </div>
            ) : activeTab === "profile" ? (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Profile Configurations
                </h2>
                <p className="text-sm text-slate-500">
                  Tenant identifier workspace context:{" "}
                  <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                    {tenantId}
                  </span>
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  API Keys
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Use these keys to authenticate proxy requests with integrated
                  LLM providers.
                </p>

                <div className="space-y-6">
                  {targetProviderKeys.map((provider) => {
                    // Extract the live server string directly from React Query data cache
                    const apiKeyValue = settingsData?.[provider.id] || "";
                    const isRevealed = !!revealedKeys[provider.id];

                    return (
                      <div
                        key={provider.id}
                        className="border-b border-slate-100 pb-6 last:border-none last:pb-0"
                      >
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                          {provider.label}
                        </label>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={isRevealed ? "text" : "password"}
                              readOnly // 🔒 Changes input structure to read-only presentation tier
                              className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-md pl-3 pr-10 py-2 font-mono text-sm select-all outline-none"
                              placeholder="Not configured (null)"
                              value={apiKeyValue}
                            />
                            {apiKeyValue && (
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(provider.id)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {isRevealed ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={!apiKeyValue}
                              onClick={() => handleCopyClipboard(apiKeyValue)}
                              className="p-2 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-md disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                              title="Copy Key"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
