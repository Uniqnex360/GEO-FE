import { useQuery } from "@tanstack/react-query";
import { Globe, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useSelector } from "react-redux";

import { citationService } from "../../api/citation";
import { selectGlobalProjectId } from "../../store/projectSlice";

interface UniqueCitationsResponse {
  citations: string[];
}

export default function UniqueCitationsTable() {
  const tenantId = useSelector(selectGlobalProjectId);

  const { data, isLoading, error } = useQuery<UniqueCitationsResponse, Error>({
    queryKey: ["uniqueCitations", tenantId],
    queryFn: () =>
      citationService.getUniqueCitations({
        tenant_id: tenantId ? Number(tenantId) : undefined,
      }),
    enabled: !!tenantId,
    retry: 1,
  });
  const citations = data?.citations || [];

  const getDomain = (url: string) => {
    try {
      const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
      return new URL(formattedUrl).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm">Loading citations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-3 text-rose-600">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">
          {error.message || "Failed to load citations."}
        </span>
      </div>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-600" />
          Unique Citations
        </h3>

        <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          {citations.length} Sources
        </span>
      </div>

      {citations.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          No citations found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 w-12">#</th>
                <th className="pb-3">Domain</th>
                <th className="pb-3">Citation URL</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {citations.map((url, index) => (
                <tr
                  key={`${url}-${index}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 text-slate-400 font-mono">
                    {index + 1}
                  </td>

                  <td className="py-3">
                    <span className="font-semibold text-slate-800">
                      {getDomain(url)}
                    </span>
                  </td>

                  <td className="py-3 max-w-[420px]">
                    <a
                      href={
                        url.startsWith("http") ? url : `https://${url}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      title={url}
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                    >
                      <span className="truncate max-w-[380px] font-mono">
                        {url}
                      </span>

                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
